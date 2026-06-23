import { create } from 'zustand'
import { DatabaseService } from '@/services/database'
import { UserSettings } from '@/types'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface DBCycleRow {
  id: number
  cycleMode: 'monthly' | 'biweekly' | 'free'
  baseSalary: number
  startDate: string
  endDate: string
}

interface SettingsState {
  cycleMode: 'monthly' | 'biweekly' | 'free' | null
  baseSalary: number
  cycleStartDate: string | null
  cycles: DBCycleRow[]
  availableDbs: string[]
  currentDb: string
  isLoaded: boolean

  loadSettings: () => Promise<void>
  saveSettings: (mode: 'monthly' | 'biweekly' | 'free', salary: number, startDate: string, customProfileName?: string) => Promise<void>
  switchDatabase: (dbName: string) => Promise<void>
  refreshDatabaseList: () => Promise<void>
  purgeFullDatabase: () => Promise<void>
  renameDatabase: (newName: string) => Promise<void>
  createNewProfile: (name: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  cycleMode: null,
  baseSalary: 0,
  cycleStartDate: null,
  cycles: [],
  availableDbs: [],
  currentDb: '',
  isLoaded: false,

  loadSettings: async () => {
    try {
      const dbs = await DatabaseService.listAvailableDatabases()

      // Si la app está totalmente vacia y no existen archivos físicos
      if (dbs.length === 0) {
        set({ 
          cycleMode: null, 
          baseSalary: 0, 
          cycleStartDate: null,
          cycles: [],
          availableDbs: [],
          currentDb: '', // Indicador de que no hay base de datos activa todavía
          isLoaded: true 
        })
        return
      }

      // Si ya existen perfiles registrados, buscamos el puntero de persistencia
      const savedDb = await AsyncStorage.getItem('gocoink_active_db')
      const targetDb = (savedDb && dbs.includes(savedDb)) ? savedDb : dbs[0]

      DatabaseService.setDatabaseName(targetDb)
      await AsyncStorage.setItem('gocoink_active_db', targetDb)

      const settings = await DatabaseService.getUserSettings()
      const history = await DatabaseService.getAllCycles()
      
      set({ 
        cycleMode: settings.cycleMode, 
        baseSalary: settings.baseSalary, 
        cycleStartDate: settings.cycleStartDate,
        cycles: history,
        availableDbs: dbs,
        currentDb: targetDb,
        isLoaded: true 
      })
    } catch (error) {
      console.error("Error cargando ajustes:", error)
      set({ isLoaded: true })
    }
  },

  // Ajustado para admitir opcionalmente el nombre personalizado del perfil en su primer inicio
  saveSettings: async (mode: 'monthly' | 'biweekly' | 'free', salary: number, startDate: string, customProfileName?: string) => {
    try {
      // SOLO si la app está en estado 100% virgen (currentDb está vacío), configuramos el nombre del archivo
      if (get().currentDb === '') {
        const cleanName = (customProfileName && customProfileName.trim() !== '') ? customProfileName.trim() : 'Balance_Principal'
        const safeFileName = `${cleanName.replace(/[^a-zA-Z0-9_-]/g, '_')}.db`
        
        await DatabaseService.closeConnection()
        DatabaseService.setDatabaseName(safeFileName)
        await AsyncStorage.setItem('gocoink_active_db', safeFileName)
      }

      // Forzar la creación del archivo SQLite y sus tablas correspondientes
      await DatabaseService.initialize()
      await DatabaseService.saveNewCycle(mode, salary, startDate)
      
      const history = await DatabaseService.getAllCycles()
      const dbs = await DatabaseService.listAvailableDatabases()
      
      set({ 
        cycleMode: mode, 
        baseSalary: salary, 
        cycleStartDate: startDate,
        cycles: history,
        availableDbs: dbs,
        currentDb: DatabaseService.getCurrentDbName()
      })
    } catch (error) {
      console.error("Error guardando ajustes:", error)
    }
  },

  // cambia el puntero del archivo y vuelve a consultar la data limpia de ese archivo
  switchDatabase: async (dbName: string) => {
    try {
      // apago de forma segura la DB anterior
      await DatabaseService.closeConnection() 
      // apuntar al nuevo archivo
      DatabaseService.setDatabaseName(dbName)

      // Persistencia de la elección del usuario en el disco duro del dispositivo
      await AsyncStorage.setItem('gocoink_active_db', dbName)

      // cargar los datos
      const settings = await DatabaseService.getUserSettings()
      const history = await DatabaseService.getAllCycles()
      const dbs = await DatabaseService.listAvailableDatabases()
      
      set({
        cycleMode: settings.cycleMode,
        baseSalary: settings.baseSalary,
        cycleStartDate: settings.cycleStartDate,
        cycles: history,
        availableDbs: dbs,
        currentDb: dbName
      })
    } catch (error) {
      console.error("Error alternando base de datos:", error)
    }
  },

  refreshDatabaseList: async () => {
    const dbs = await DatabaseService.listAvailableDatabases()
    set({ availableDbs: dbs })
  },

  purgeFullDatabase: async () => {
    try {
      const activeDb = get().currentDb
      await DatabaseService.closeConnection() 
      await DatabaseService.deleteDatabaseFile(activeDb)
      // obtener la lista actualizada de archivos físicos .db restantes
      let remainingDbs = await DatabaseService.listAvailableDatabases()

      // FIX CRÍTICO: Forzar la exclusión manual de la base de datos recién borrada 
      // por si el sistema de archivos del celular está lento y aún la devuelve en la lista.
      remainingDbs = remainingDbs.filter(db => db !== activeDb)

      if (remainingDbs.length === 0) {
        await AsyncStorage.removeItem('gocoink_active_db')
        set({
          cycleMode: null,
          baseSalary: 0,
          cycleStartDate: null,
          cycles: [],
          availableDbs: [],
          currentDb: ''
        })
        return
      }

      const fallbackDb = remainingDbs[0]
      DatabaseService.setDatabaseName(fallbackDb)
      // Persistencia del nuevo perfil que la app auto-seleccionó tras el borrado
      await AsyncStorage.setItem('gocoink_active_db', fallbackDb)
      
      await DatabaseService.initialize()
      // Forzamos el refresco completo de las variables del estado global con el nuevo archivo activo
      const settings = await DatabaseService.getUserSettings()
      const history = await DatabaseService.getAllCycles()
      
      set({
        cycleMode: settings.cycleMode,
        baseSalary: settings.baseSalary,
        cycleStartDate: settings.cycleStartDate,
        cycles: history,
        availableDbs: remainingDbs,
        currentDb: fallbackDb
      })
    } catch (error) {
      console.error("Error purgando base de datos:", error)
    }
  },

  renameDatabase: async (newName: string) => {
    try {
      await DatabaseService.renameCurrentDatabase(newName)
      const updatedDbName = DatabaseService.getCurrentDbName()
      await AsyncStorage.setItem('gocoink_active_db', updatedDbName)
      
      const dbs = await DatabaseService.listAvailableDatabases()

      set({ 
        currentDb: updatedDbName,
        availableDbs: dbs
      })
    } catch (error) {
      console.error("Error al renombrar el perfil:", error)
    }
  },

  createNewProfile: async (name: string) => {
    try {
      const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_')
      const newDbName = `${safeName}.db`
      
      await DatabaseService.closeConnection() 
      DatabaseService.setDatabaseName(newDbName)
      await AsyncStorage.setItem('gocoink_active_db', newDbName)

      await DatabaseService.initialize()

      const settings = await DatabaseService.getUserSettings()
      const history = await DatabaseService.getAllCycles()
      const dbs = await DatabaseService.listAvailableDatabases()
      
      set({
        cycleMode: settings.cycleMode,
        baseSalary: settings.baseSalary,
        cycleStartDate: settings.cycleStartDate,
        cycles: history,
        availableDbs: dbs,
        currentDb: newDbName
      })
    } catch (error) {
      console.error("Error creando nuevo perfil:", error)
    }
  }
}))
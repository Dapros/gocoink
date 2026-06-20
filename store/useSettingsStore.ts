import { create } from 'zustand'
import { DatabaseService } from '@/services/database'
import { UserSettings } from '@/types'

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
  saveSettings: (mode: 'monthly' | 'biweekly' | 'free', salary: number, startDate: string) => Promise<void>
  switchDatabase: (dbName: string) => Promise<void>
  refreshDatabaseList: () => Promise<void>
  purgeFullDatabase: () => Promise<void>
  renameDatabase: (newName: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  cycleMode: null,
  baseSalary: 0,
  cycleStartDate: null,
  cycles: [],
  availableDbs: [],
  currentDb: 'gocoink_v1.db',
  isLoaded: false,

  loadSettings: async () => {
    try {
      const activeDb = DatabaseService.getCurrentDbName()
      const settings = await DatabaseService.getUserSettings()
      const history = await DatabaseService.getAllCycles()
      const dbs = await DatabaseService.listAvailableDatabases()
      
      set({ 
        cycleMode: settings.cycleMode, 
        baseSalary: settings.baseSalary, 
        cycleStartDate: settings.cycleStartDate,
        cycles: history,
        availableDbs: dbs,
        currentDb: activeDb,
        isLoaded: true 
      })
    } catch (error) {
      console.error("Error cargando ajustes:", error)
      set({ isLoaded: true })
    }
  },

  saveSettings: async (mode, salary, startDate) => {
    try {
      await DatabaseService.saveNewCycle(mode, salary, startDate)
      const history = await DatabaseService.getAllCycles()
      set({ 
        cycleMode: mode, 
        baseSalary: salary, 
        cycleStartDate: startDate,
        cycles: history
      })
    } catch (error) {
      console.error("Error guardando ajustes:", error)
    }
  },

  // cambia el puntero del archivo y vuelve a consultar la data limpia de ese archivo
  switchDatabase: async (dbName: string) => {
    try {
      DatabaseService.setDatabaseName(dbName)
      const settings = await DatabaseService.getUserSettings()
      const history = await DatabaseService.getAllCycles()
      
      set({
        cycleMode: settings.cycleMode,
        baseSalary: settings.baseSalary,
        cycleStartDate: settings.cycleStartDate,
        cycles: history,
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
      await DatabaseService.deleteDatabaseFile(activeDb)
      DatabaseService.resetInstance()   
      await DatabaseService.initialize()
      await get().loadSettings()
    } catch (error) {
      console.error("Error purgando base de datos:", error)
    }
  },
  renameDatabase: async (newName: string) => {
    try {
      await DatabaseService.renameCurrentDatabase(newName)
      await get().refreshDatabaseList()
      set({ currentDb: DatabaseService.getCurrentDbName() })
    } catch (error) {
      console.error("Error al renombrar el perfil:", error)
    }
  },
}))
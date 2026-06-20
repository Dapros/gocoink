import * as SQLite from 'expo-sqlite'
import { documentDirectory, getInfoAsync, readDirectoryAsync, deleteAsync, moveAsync } from 'expo-file-system/legacy'
import { DBTransactionRow, UserSettings } from '@/types'

// variables momentaneas de memoria para controlar la concurrencia
let dbInstance: SQLite.SQLiteDatabase | null = null
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null
// Nombre de la base de datos por defecto
let currentDbName = 'gocoink_v1.db'

// Helper interno para calcular la fecha de finalización exacta de un ciclo
const calculateEndDate = (startDateIso: string, mode: 'monthly' | 'biweekly' | 'free') => {
  const start = new Date(startDateIso)
  const end = new Date(start)
  if (mode === 'monthly') {
    end.setMonth(end.getMonth() + 1)
  } else if (mode === 'biweekly') {
    end.setDate(end.getDate() + 15)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end.toISOString()
}

export const DatabaseService = {
  // Cambiar el archivo de base de datos activo antes de inicializarlo
  setDatabaseName(name: string) {
    if (currentDbName !== name) {
      currentDbName = name
      dbInstance = null
      dbInitPromise = null
    }
  },

  getCurrentDbName() {
    return currentDbName
  },

  resetInstance() {
    dbInstance = null
    dbInitPromise = null
  },

  // Obtener la ruta del directorio nativo de SQLite de la app
  getSQLiteDirectory() {
    return `${documentDirectory}SQLite/`
  },

  async initialize() {
    // Si la base de datos ya se inicializó, la devolvemos al instante
    if (dbInstance) return dbInstance
    // Si otro componente ya la está inicializando (Promesa en curso), esperamos a que termine
    if (dbInitPromise) return dbInitPromise

    // Si nadie la ha inicializado, creamos el "Bloqueo por Promesa"
    dbInitPromise = (async () => {
      try {
        const db = await SQLite.openDatabaseAsync(currentDbName)

        await db.execAsync(`
          PRAGMA foreign_keys = ON;

          CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            icon TEXT NOT NULL,
            is_custom INTEGER DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS payment_methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            icon TEXT NOT NULL,
            is_custom INTEGER DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
            category_id INTEGER NOT NULL,
            payment_method_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories (id),
            FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id)
          );

          CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            cycle_mode TEXT CHECK(cycle_mode IN ('monthly', 'biweekly', 'free', NULL)),
            base_salary REAL DEFAULT 0,
            cycle_start_date TEXT
          );

          CREATE TABLE IF NOT EXISTS cycles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cycle_mode TEXT CHECK(cycle_mode IN ('monthly', 'biweekly', 'free')) NOT NULL,
            base_salary REAL NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL
          );

          INSERT OR IGNORE INTO user_settings (id, cycle_mode, base_salary, cycle_start_date) 
          VALUES (1, NULL, 0, NULL);
        `)

        // Sincronización inicial: Si la tabla de ciclos está vacía pero el usuario ya tenía configuración
        const cycleCheck = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cycles')
        if (cycleCheck?.count === 0) {
          const currentSettings = await db.getFirstAsync<any>('SELECT * FROM user_settings WHERE id = 1')
          if (currentSettings?.cycle_mode) {
            const calculatedEnd = calculateEndDate(currentSettings.cycle_start_date, currentSettings.cycle_mode)
            await db.runAsync(
              'INSERT INTO cycles (cycle_mode, base_salary, start_date, end_date) VALUES (?, ?, ?, ?)',
              [currentSettings.cycle_mode, currentSettings.base_salary, currentSettings.cycle_start_date, calculatedEnd]
            )
          }
        }

        // Carga de categorías por defecto
        const catCheck = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories;')
        if (catCheck?.count === 0) {
          await db.execAsync(`
            INSERT INTO categories (name, icon) VALUES
            ('Comida', 'fast-food-outline'),
            ('Servicios', 'flash-outline'),
            ('Trabajo' , 'briefcase-outline');
            
            INSERT INTO payment_methods (name, icon) VALUES
            ('Efectivo', 'cash-outline'),
            ('Bancolombia', 'card-outline'),
            ('Nequi', 'phone-portrait-outline');
          `)
        }

        dbInstance = db
        return db
      } catch (error) {
        dbInitPromise = null
        throw error
      }
    })()

    return dbInitPromise
  },

  // Escanear la carpeta interna del sistema para encontrar archivos .db existentes
  async listAvailableDatabases(): Promise<string[]> {
    const dir = this.getSQLiteDirectory()
    try {
      const info = await getInfoAsync(dir)
      if (!info.exists) return [currentDbName]
      const files = await readDirectoryAsync(dir)
      // Filtro únicamente de archivos con extensión .db
      return files.filter(file => file.endsWith('.db'))
    } catch (error) {
      console.error('Error listando bases de datos:', error)
      return [currentDbName]
    }
  },

  // Eliminar físicamente un archivo de base de datos
  async deleteDatabaseFile(name: string): Promise<void> {
    const fileUri = `${this.getSQLiteDirectory()}${name}`
    try {
      const info = await getInfoAsync(fileUri)
      if (info.exists) {
        await deleteAsync(fileUri)
      }
    } catch (error) {
      console.error('Error eliminando archivo db:', error)
      throw error
    }
  },

  // Renombrar el archivo físico de la base de datos activa
  async renameCurrentDatabase(newName: string): Promise<void> {
    // sanar el nombre para evitar errores en el sistema de archivos
    const safeName = newName.replace(/[^a-zA-Z0-9_-]/g, '_')
    const oldUri = `${this.getSQLiteDirectory()}${currentDbName}`
    const newUri = `${this.getSQLiteDirectory()}${safeName}.db`

    try {
      const info = await getInfoAsync(oldUri)
      if (info.exists) {
        // mover/renombrar el archivo físicamente
        await moveAsync({ from: oldUri, to: newUri })
        // actualizar el estado interno
        this.setDatabaseName(`${safeName}.db`)
      }
    } catch (error) {
      console.error('Error renombrando base de datos:', error)
      throw error
    }
  },

  // Obtener volcados crudos de tablas para el exportador de datos
  async getRawTableData<T>(tableName: string): Promise<T[]> {
    const db = await this.initialize()
    return await db.getAllAsync<T>(`SELECT * FROM ${tableName}`)
  },

  // metodos de ajuestes
  async getUserSettings(): Promise<UserSettings> {
    const db = await this.initialize()
    const result = await db.getFirstAsync<any>('SELECT * FROM user_settings WHERE id = 1;')
    return {
      cycleMode: result?.cycle_mode || null,
      baseSalary: result?.base_salary || 0,
      cycleStartDate: result?.cycle_start_date || null
    }
  },

  // Obtener todos los ciclos reales registrados ordenados del más nuevo al más antiguo
  async getAllCycles() {
    const db = await this.initialize()
    return await db.getAllAsync<{ id: number; cycleMode: 'monthly' | 'biweekly' | 'free'; baseSalary: number; startDate: string; endDate: string }>(
      'SELECT id, cycle_mode as cycleMode, base_salary as baseSalary, start_date as startDate, end_date as endDate FROM cycles ORDER BY start_date DESC'
    )
  },

  // inserta un nuevo ciclo en el historial y actualiza el estado de la configuración actual
  async saveNewCycle(mode: 'monthly' | 'biweekly' | 'free', salary: number, startDate: string): Promise<void> {
    const db = await this.initialize()
    const endDate = calculateEndDate(startDate, mode)
    // Guardado en el histórico inmutable
    await db.runAsync(
      'INSERT INTO cycles (cycle_mode, base_salary, start_date, end_date) VALUES (?, ?, ?, ?)',
      [mode, salary, startDate, endDate]
    )
    // Actualizacion en los ajustes generales de la app
    await db.runAsync(
      'UPDATE user_settings SET cycle_mode = ?, base_salary = ?, cycle_start_date = ? WHERE id = 1;',
      [mode, salary, startDate]
    )
  },

  // Obtener todas las transacciones
  async getAllTransactions(): Promise<DBTransactionRow[]> {
    const db = await this.initialize()
    return await db.getAllAsync<DBTransactionRow>(`
      SELECT
        t.id, t.amount, t.type, t.description, t.date,
        t.category_id as categoryId, t.payment_method_id as paymentMethodId,
        c.name as categoryName, c.icon as categoryIcon,
        p.name as paymentMethodName, p.icon as paymentMethodIcon
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      JOIN payment_methods p ON t.payment_method_id = p.id
      ORDER BY t.date DESC;  
    `)
  },
  
  // Insercion de nueva transaccion
  async insertTransaction(
    amount: number,
    type: 'income' | 'expense',
    categoryId: number,
    paymentMethodId: number,
    description: string
  ): Promise<void> {
    const db = await this.initialize();
    
    const now = new Date().toISOString();
    await db.runAsync(
      'INSERT INTO transactions (amount, type, category_id, payment_method_id, description, date) VALUES (?, ?, ?, ?, ?, ?);',
      [amount, type, categoryId, paymentMethodId, description, now]
    );
  },

  async updateTransaction(
    id: number, 
    amount: number, 
    type: 'income' | 'expense', 
    categoryId: number, 
    paymentMethodId: number,  
    description: string
   ): Promise<void> {
    const db = await this.initialize()
    await db.runAsync(
      'UPDATE transactions SET amount = ?, type = ?, category_id = ?, payment_method_id = ?, description = ? WHERE id = ?;',
      [amount, type, categoryId, paymentMethodId, description, id]
    )
   },

  // Obtener todas las categorias para el Select
  async getCategories() {
    const db = await this.initialize()
    return await db.getAllAsync<{ id: number; name: string; icon: string }>('SELECT * FROM categories ORDER BY id ASC;')
  },

  // Obtener todos los metodos de pago para el Select
  async getPaymentMethods() {
    const db = await this.initialize()
    return await db.getAllAsync<{ id: number; name: string; icon: string }>('SELECT * FROM payment_methods ORDER BY id ASC;')
  },

  // Eliminar transacciones
  async deleteTransaction(id: number): Promise<void> {
    const db = await this.initialize();
    await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
  },  
}
import * as SQLite from 'expo-sqlite'
import { DBTransactionRow, UserSettings } from '@/types'

// variables momentaneas de memoria para controlar la concurrencia
let dbInstance: SQLite.SQLiteDatabase | null = null
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null

export const DatabaseService = {
  async initialize() {
    // 1. Si la base de datos ya se inicializó, la devolvemos al instante
    if (dbInstance) return dbInstance

    // 2. Si otro componente ya la está inicializando (Promesa en curso), esperamos a que termine
    if (dbInitPromise) return dbInitPromise

    // 3. Si nadie la ha inicializado, creamos el "Bloqueo por Promesa"
    dbInitPromise = (async () => {
      try {
        const db = await SQLite.openDatabaseAsync('gocoink_v1.db')

        // Ejecutamos la creación de tablas
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

          INSERT OR IGNORE INTO user_settings (id, cycle_mode, base_salary, cycle_start_date) 
          VALUES (1, NULL, 0, NULL);
        `)

        // Insertamos datos por defecto si está vacía
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

          const ahora = new Date().toISOString()
          await db.runAsync(
            'INSERT INTO transactions (amount, type, category_id, payment_method_id, description, date) VALUES (?, ?, ?, ?, ?, ?);',
            [35000, 'expense', 1, 1, 'Transaccion inicial de prueba SQLite', ahora]
          )
        }

        // Guardamos la instancia definitiva y limpiamos la promesa
        dbInstance = db
        return db
      } catch (error) {
        // Si algo falla, limpiamos la promesa para que se pueda volver a intentar
        dbInitPromise = null
        throw error
      }
    })()

    return dbInitPromise
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

  async updateUserSettings(mode: 'monthly' | 'biweekly' | 'free', salary: number, startDate: string): Promise<void> {
    const db = await this.initialize()
    await db.runAsync(
      'UPDATE user_settings SET cycle_mode = ?, base_salary = ?, cycle_start_date = ? WHERE id = 1;',
      [mode, salary, startDate]
    )
  },

  // Obtener todas las transacciones
  async getAllTransactions(): Promise<DBTransactionRow[]> {
    const db = await this.initialize();
    
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
    `);
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
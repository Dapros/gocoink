import { z } from 'zod'

export interface DBCategory {
  id: number
  name: string
  icon: string
  isCustom: number
}

export interface DBPaymentMethod {
  id: number
  name: string
  icon: string
  isCustom: number
}

export interface UserSettings {
  cycleMode: 'monthly' | 'biweekly' | 'free' | null
  baseSalary: number
  cycleStartDate: string | null
}

export interface DBTransactionRow {
  id: number
  amount: number
  type: 'income' | 'expense'
  description: string
  date: string
  categoryId: number
  categoryName: string
  categoryIcon: string
  paymentMethodId: number
  paymentMethodName: string
  paymentMethodIcon: string
}

export const TransactionSchema = z.object({
  id: z.number().optional(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  type: z.enum(['income', 'expense']),
  categoryId: z.number(),
  paymentMethodId: z.number(),
  description: z.string().min(1, 'La descripción es obligatoria'),
  date: z.string().optional(), 
})

export type Transaction = z.infer<typeof TransactionSchema>
export type CycleMode = 'monthly' | 'biweekly' | 'disabled'

export interface SelectOption {
  label: string
  value: string | number
  icon?: string
}

export interface GroupedTransactions {
  dateKey: string;       // Clave única para agrupar (ej. "2026-06-12")
  dateFormatted: string; // Ej. "12 de junio de 2026"
  dayOfWeek: string;     // Ej. "viernes"
  isToday: boolean;      // True si la fecha coincide con el día actual
  data: DBTransactionRow[];
}

// De aqui para abajo tipados Raw crudos para la exportacion de la base de datos, que representan las columnas exactas snake_case como están creadas en SQLite
export interface RawTransaction {
  id: number
  amount: number
  type: 'income' | 'expense'
  description: string
  date: string
  category_id: number
  payment_method_id: number
}

export interface RawCycle {
  id: number
  cycle_mode: 'monthly' | 'biweekly' | 'free'
  base_salary: number
  start_date: string
  end_date: string
}

export interface RawCategory {
  id: number
  name: string
  icon: string
  is_custom: number
}

export interface RawPaymentMethod {
  id: number
  name: string
  icon: string
  is_custom: number
}
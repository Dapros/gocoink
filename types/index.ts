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

export const TransactionSchema = z.object({
  id: z.number().optional(),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  type: z.enum(['income', 'expense']),
  categoryId: z.number(),
  paymentMethod: z.enum(['efectivo', 'banco']),
  description: z.string().min(1, 'La descripción es obligatoria'),
  date: z.string(), 
})

export type Transaction = z.infer<typeof TransactionSchema>
export type CycleMode = 'monthly' | 'biweekly' | 'disabled'

export interface SelectOption {
  label: string
  value: string | number
  icon?: string
}
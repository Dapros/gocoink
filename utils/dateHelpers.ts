import { DBTransactionRow, GroupedTransactions } from "@/types"
import { FilterType, FilterTime, FilterMethod } from "@/store/useFilterStore"

const pad = (n: number) => String(n).padStart(2, '0')

// Fecha ISO en hora local con offset (ej. 2026-10-21T23:50:00-05:00). toISOString() usa UTC y en Colombia corre al día siguiente después de las 7 p. m.
export const toLocalISOString = (date: Date = new Date()): string => {
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

interface ProcessOptions {
  type: FilterType
  time: FilterTime
  method: FilterMethod
}

export const processTransactions = (
  transactions: DBTransactionRow[], 
  filters: ProcessOptions
): GroupedTransactions[] => {
  const groups: Record<string, GroupedTransactions> = {}
  const hoy = new Date()

  // filtrado en memoria
  const filtered = transactions.filter(tx => {
    // Filtro por Tipo
    if (filters.type !== 'all' && tx.type !== filters.type) return false
    
    // Filtro por Método (Basado en la DB: Efectivo=1, Bancos > 1)
    if (filters.method === 'cash' && tx.paymentMethodId !== 1) return false
    if (filters.method === 'bank' && tx.paymentMethodId === 1) return false
    
    return true
  })

  // Agrupacion dinamica
  filtered.forEach((tx) => {
    const txDate = new Date(tx.date)
    let dateKey = ''
    let dateFormatted = ''
    let dayOfWeek = ''
    let isToday = false

    if (filters.time === 'day') {
      dateKey = txDate.toDateString()
      dateFormatted = txDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
      dayOfWeek = txDate.toLocaleDateString('es-CO', { weekday: 'long' })
      isToday = txDate.toDateString() === hoy.toDateString()

    } else if (filters.time === 'month') {
      dateKey = `${txDate.getFullYear()}-${txDate.getMonth()}`
      dateFormatted = txDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
      dayOfWeek = 'Mensual'

    } else if (filters.time === 'year') {
      dateKey = `${txDate.getFullYear()}`
      dateFormatted = `Año ${txDate.getFullYear()}`
      dayOfWeek = 'Anual'
    }

    if(!groups[dateKey]) {
      groups[dateKey] = { dateKey, dateFormatted, dayOfWeek, isToday, data: [] }
    }
    groups[dateKey].data.push(tx)
  })

  // return ordenar por fecha mas reciente primero
  return Object.values(groups).sort((a, b) => {
    return new Date(b.data[0].date).getTime() - new Date(a.data[0].date).getTime()
  })
}
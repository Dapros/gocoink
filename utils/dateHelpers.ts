import { DBTransactionRow, GroupedTransactions } from "@/types"
import { FilterType, FilterTime, FilterMethod } from "@/store/useFilterStore"

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
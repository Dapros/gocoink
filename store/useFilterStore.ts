import { create } from "zustand"

export type FilterType = 'all' | 'income' | 'expense'
export type FilterTime = 'day' | 'month' | 'year'
export type FilterMethod = 'all' | 'cash' | 'bank'

interface FilterState {
  activeType: FilterType
  activeTime: FilterTime
  activeMethod: FilterMethod
  
  setType: (type: FilterType) => void
  setTime: (time: FilterTime) => void
  setMethod: (method: FilterMethod) => void
}

export const useFilterStore = create<FilterState>((set) => ({
  activeType: 'all',
  activeTime: 'month', // Por defecto se muestra el mes
  activeMethod: 'all',
  
  setType: (activeType) => set({ activeType }),
  setTime: (activeTime) => set({ activeTime }),
  setMethod: (activeMethod) => set({ activeMethod }),
}))
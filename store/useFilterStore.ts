import { create } from "zustand"
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      activeType: 'all',
      activeTime: 'day',
      activeMethod: 'all',
      
      setType: (activeType) => set({ activeType }),
      setTime: (activeTime) => set({ activeTime }),
      setMethod: (activeMethod) => set({ activeMethod }),
    }),
    {
      name: 'filter-storage', // Nombre único en el almacenamiento
      storage: createJSONStorage(() => AsyncStorage), // Usamos AsyncStorage
    }
  )
)
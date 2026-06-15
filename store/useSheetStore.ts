import { create } from 'zustand'
import { DBTransactionRow, SelectOption } from '@/types'
import { DatabaseService } from '@/services/database' // Importamos el servicio

export type SheetMode = 'create' | 'details' | 'edit'

interface SheetState {
  // estados
  isOpen: boolean
  mode: SheetMode
  selectedTx: DBTransactionRow | null
  refreshKey: number

  categories: SelectOption[]
  paymentMethods: SelectOption[]

  // Acciones
  openCreate: () => void
  openDetails: (tx: DBTransactionRow) => void
  setEditMode: () => void
  closeSheet: () => void
  triggerRefresh: () => void

  loadCatalogs: () => Promise<void>
}

export const useSheetStore = create<SheetState>((set) => ({
  isOpen: false,
  mode: 'create',
  selectedTx: null,
  refreshKey: 0,
  categories: [],
  paymentMethods: [],
  
  openCreate: () => set({ isOpen: true, mode: 'create', selectedTx: null }),
  openDetails: (tx) => set({ isOpen: true, mode: 'details', selectedTx: tx }),
  setEditMode: () => set({ mode: 'edit' }),
  closeSheet: () => set({ isOpen: false }),
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),

  loadCatalogs: async () => {
    try {
      const dbCategories = await DatabaseService.getCategories()
      const dbMethods = await DatabaseService.getPaymentMethods()

      set({
        categories: dbCategories.map(c => ({ label: c.name, value: c.id, icon: c.icon })),
        paymentMethods: dbMethods.map(m => ({ label: m.name, value: m.id, icon: m.icon }))
      })
    } catch (error) {
      console.log("Error al cargar catelogos en Zustand:", error)
    }
  }
}))
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
  isLoaded: boolean

  loadSettings: () => Promise<void>
  saveSettings: (mode: 'monthly' | 'biweekly' | 'free', salary: number, startDate: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  cycleMode: null,
  baseSalary: 0,
  cycleStartDate: null,
  cycles: [],
  isLoaded: false,

  loadSettings: async () => {
    try {
      const settings = await DatabaseService.getUserSettings()
      const history = await DatabaseService.getAllCycles()
      set({ 
        cycleMode: settings.cycleMode, 
        baseSalary: settings.baseSalary, 
        cycleStartDate: settings.cycleStartDate,
        cycles: history,
        isLoaded: true 
      })
    } catch (error) {
      console.error("Error cargando ajustes:", error)
      set({ isLoaded: true })
    }
  },

  saveSettings: async (mode, salary, startDate) => {
    try {
      // método que escribe tanto en user_settings como en el histórico cycles
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
  }
}))
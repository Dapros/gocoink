import { create } from 'zustand'
import { DatabaseService } from '@/services/database'
import { UserSettings } from '@/types'

interface SettingsState {
  cycleMode: 'monthly' | 'biweekly' | 'free' | null
  baseSalary: number
  cycleStartDate: string | null
  isLoaded: boolean

  loadSettings: () => Promise<void>
  saveSettings: (mode: 'monthly' | 'biweekly' | 'free', salary: number, startDate: string) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  cycleMode: null,
  baseSalary: 0,
  cycleStartDate: null,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const settings = await DatabaseService.getUserSettings()
      set({ 
        cycleMode: settings.cycleMode, 
        baseSalary: settings.baseSalary, 
        cycleStartDate: settings.cycleStartDate,
        isLoaded: true 
      })
    } catch (error) {
      console.error("Error cargando ajustes:", error)
      set({ isLoaded: true })
    }
  },

  saveSettings: async (mode, salary, startDate) => {
    try {
      await DatabaseService.updateUserSettings(mode, salary, startDate)
      set({ cycleMode: mode, baseSalary: salary, cycleStartDate: startDate })
    } catch (error) {
      console.error("Error guardando ajustes:", error)
    }
  }
}))
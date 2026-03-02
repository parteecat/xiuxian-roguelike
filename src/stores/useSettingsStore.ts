import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { LLMConfig, GameSettings } from '@/types/game'

interface SettingsStore extends GameSettings {
  setLlmConfig: (config: Partial<LLMConfig>) => void
  setAutoSave: (autoSave: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  resetSettings: () => void
}

const defaultLlmConfig: LLMConfig = {
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4',
}

const defaultSettings = {
  llmConfig: defaultLlmConfig,
  autoSave: true,
  theme: 'dark' as const,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setLlmConfig: (config) =>
        set((state) => ({
          llmConfig: { ...state.llmConfig, ...config },
        })),

      setAutoSave: (autoSave) => set({ autoSave }),

      setTheme: (theme) => set({ theme }),

      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'xiuxian-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

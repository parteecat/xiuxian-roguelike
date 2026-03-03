import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

interface TokenStore {
  // 单次调用统计
  lastUsage: TokenUsage | null
  // 累计统计
  totalUsage: TokenUsage
  // 本次会话统计
  sessionUsage: TokenUsage

  // 方法
  addUsage: (usage: TokenUsage) => void
  clearLastUsage: () => void
  resetSession: () => void
  resetAll: () => void
}

const initialUsage: TokenUsage = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
}

export const useTokenStore = create<TokenStore>()(
  persist(
    (set) => ({
      lastUsage: null,
      totalUsage: { ...initialUsage },
      sessionUsage: { ...initialUsage },

      addUsage: (usage) =>
        set((state) => ({
          lastUsage: usage,
          totalUsage: {
            promptTokens: state.totalUsage.promptTokens + usage.promptTokens,
            completionTokens: state.totalUsage.completionTokens + usage.completionTokens,
            totalTokens: state.totalUsage.totalTokens + usage.totalTokens,
          },
          sessionUsage: {
            promptTokens: state.sessionUsage.promptTokens + usage.promptTokens,
            completionTokens: state.sessionUsage.completionTokens + usage.completionTokens,
            totalTokens: state.sessionUsage.totalTokens + usage.totalTokens,
          },
        })),

      clearLastUsage: () => set({ lastUsage: null }),

      resetSession: () => set({ sessionUsage: { ...initialUsage } }),

      resetAll: () =>
        set({
          lastUsage: null,
          totalUsage: { ...initialUsage },
          sessionUsage: { ...initialUsage },
        }),
    }),
    {
      name: 'xiuxian-token-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        totalUsage: state.totalUsage,
      }),
    }
  )
)

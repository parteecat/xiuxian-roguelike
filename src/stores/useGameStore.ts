import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Player,
  NPC,
  World,
  GameLog,
  Event,
  Memory,
  Time,
} from '@/types/game'

interface GameStore {
  player: Player | null
  npcs: NPC[]
  world: World | null
  logs: GameLog[]
  events: Event[]
  memories: Memory[]
  memorySummary: string
  turn: number
  isPlaying: boolean
  isLoading: boolean
  error: string | null
  saveId: string | null
  lastSavedAt: number | null

  setPlayer: (player: Player | null) => void
  updatePlayer: (updates: Partial<Player>) => void
  addNpc: (npc: NPC) => void
  updateNpc: (npcId: string, updates: Partial<NPC>) => void
  removeNpc: (npcId: string) => void
  setWorld: (world: World | null) => void
  initWorld: (background: string) => World
  updateTime: (time: Partial<Time>) => void
  addLog: (log: Omit<GameLog, 'id' | 'timestamp'>) => void
  addEvent: (event: Omit<Event, 'id'>) => void
  addMemory: (memory: Omit<Memory, 'id' | 'timestamp'>) => void
  setMemorySummary: (summary: string) => void
  incrementTurn: () => void
  setIsPlaying: (isPlaying: boolean) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setSaveId: (saveId: string | null) => void
  updateLastSavedAt: () => void
  resetGame: () => void
  loadGame: (state: Partial<GameStore>) => void
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9)
}

const initialState = {
  player: null,
  npcs: [],
  world: null,
  logs: [],
  events: [],
  memories: [],
  memorySummary: '',
  turn: 0,
  isPlaying: false,
  isLoading: false,
  error: null,
  saveId: null,
  lastSavedAt: null,
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...initialState,

      setPlayer: (player) => set({ player }),

      updatePlayer: (updates) =>
        set((state) => ({
          player: state.player ? { ...state.player, ...updates } : null,
        })),

      addNpc: (npc) => set((state) => ({ npcs: [...state.npcs, npc] })),

      updateNpc: (npcId, updates) =>
        set((state) => ({
          npcs: state.npcs.map((npc) =>
            npc.id === npcId ? { ...npc, ...updates } : npc
          ),
        })),

      removeNpc: (npcId) =>
        set((state) => ({
          npcs: state.npcs.filter((npc) => npc.id !== npcId),
        })),

      setWorld: (world) => set({ world }),

      initWorld: () => {
        const world: World = {
          id: Math.random().toString(36).substring(2, 9),
          name: '修仙世界',
          description: '一个充满灵气与机遇的修仙世界',
          currentLocation: '青云山麓',
          locations: ['青云山麓', '天剑宗', '万妖谷', '丹鼎阁', '藏经阁'],
          time: {
            year: 1,
            month: 1,
            day: 1,
            shichen: 1,
          },
          factions: ['天剑宗', '万妖谷', '散修联盟', '丹鼎阁'],
        }
        set({ world })
        return world
      },

      updateTime: (time) =>
        set((state) => {
          if (!state.world) return state
          return {
            world: {
              ...state.world,
              time: { ...state.world.time, ...time },
            },
          }
        }),

      addLog: (log) =>
        set((state) => ({
          logs: [
            ...state.logs,
            {
              ...log,
              id: generateId(),
              timestamp: Date.now(),
            },
          ],
        })),

      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, { ...event, id: generateId() }],
        })),

      addMemory: (memory) =>
        set((state) => ({
          memories: [
            ...state.memories,
            {
              ...memory,
              id: generateId(),
              timestamp: Date.now(),
            },
          ],
        })),

      setMemorySummary: (summary) => set({ memorySummary: summary }),

      incrementTurn: () => set((state) => ({ turn: state.turn + 1 })),

      setIsPlaying: (isPlaying) => set({ isPlaying }),

      setIsLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setSaveId: (saveId) => set({ saveId }),

      updateLastSavedAt: () => set({ lastSavedAt: Date.now() }),

      resetGame: () => set(initialState),

      loadGame: (state) => set((prev) => ({ ...prev, ...state })),
    }),
    {
      name: 'xiuxian-game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        player: state.player,
        npcs: state.npcs,
        world: state.world,
        logs: state.logs,
        events: state.events,
        memories: state.memories,
        memorySummary: state.memorySummary,
        turn: state.turn,
        isPlaying: state.isPlaying,
        saveId: state.saveId,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
)

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CharacterCreationScreen } from './components/CharacterCreationScreen'
import { GameScreen } from './components/GameScreen'
import { StartScreen } from './components/StartScreen'
import { Toaster } from '@/components/ui/sonner'
import { createGameService } from '@/services/gameService'
import { createLLMService } from '@/services/llmService'
import { createRunService } from '@/services/runService'
import { db } from '@/services/db'
import { isRunStateCompatible } from '@/services/runEngine'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { Player } from '@/types/game'
import type { RunState } from '@/types/run'

function App() {
  const [gamePhase, setGamePhase] = useState<'start' | 'character_creation' | 'game'>('start')
  const [isLoading, setIsLoading] = useState(false)

  const {
    runState,
    saveId,
    metaProgress,
    setPlayer,
    setRunState,
    updateLastSavedAt,
    mergeMetaProgress,
    resetGame,
  } = useGameStore()
  const { theme, llmConfig } = useSettingsStore()
  const autoSaveInitialized = useRef(false)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    db.init()
      .then(async () => {
        const persistedRun = useGameStore.getState().runState
        if (persistedRun && !isRunStateCompatible(persistedRun)) {
          await db.clearAll()
          resetGame()
          toast.info('v2 重构已生效，旧存档已清理，请重新开始这一世修行。')
        }
      })
      .catch(console.error)
  }, [resetGame])

  const llmService = useMemo(
    () => createLLMService(llmConfig),
    [llmConfig],
  )

  const characterService = useMemo(
    () => createGameService(llmService),
    [llmService],
  )

  const runService = useMemo(
    () => createRunService(llmService),
    [llmService],
  )

  const autoSave = useCallback(async () => {
    if (!saveId) return

    try {
      const gameState = useGameStore.getState()
      await db.saveSaveData({
        saveId,
        data: {
          player: gameState.player,
          runState: gameState.runState,
          metaProgress: gameState.metaProgress,
          saveId: gameState.saveId,
          lastSavedAt: Date.now(),
        },
      })
      updateLastSavedAt()
    } catch (error) {
      console.error('自动存档失败:', error)
    }
  }, [saveId, updateLastSavedAt])

  useEffect(() => {
    if (gamePhase !== 'game' || !runState || autoSaveInitialized.current) return

    autoSaveInitialized.current = true
    const intervalId = setInterval(() => {
      autoSave()
    }, 30000)

    return () => {
      clearInterval(intervalId)
      autoSaveInitialized.current = false
    }
  }, [autoSave, gamePhase, runState])

  const startRun = useCallback(
    async (character: Player, existingRun?: RunState) => {
      setIsLoading(true)

      try {
        const nextSaveId = saveId || `save_${Date.now()}`
        if (!saveId) {
          useGameStore.setState({ saveId: nextSaveId })
        }

        const baseRun = existingRun ?? runService.createRun(character, metaProgress)
        const preparedRun = await runService.prepareTurn(baseRun)

        setPlayer(character)
        setRunState(preparedRun)
        setGamePhase('game')

        if (llmService.isConfigured()) {
          toast.success('修仙之旅开始')
        } else {
          toast.info('进入本地规则模式，未配置模型时也可继续游玩')
        }

        await autoSave()
      } catch (error) {
        console.error('初始化新玩法失败:', error)
        toast.error('初始化玩法失败，请重试')
      } finally {
        setIsLoading(false)
      }
    },
    [autoSave, llmService, metaProgress, runService, saveId, setPlayer, setRunState],
  )

  const handleStartFromHome = useCallback(() => {
    setGamePhase('character_creation')
  }, [])

  const handleContinueGame = useCallback(async () => {
    setIsLoading(true)

    try {
      let loadedRun = useGameStore.getState().runState
      let loadedPlayer = useGameStore.getState().player

      if (saveId) {
        const savedData = await db.getSaveData(saveId)
        const savedPayload = savedData?.data as
          | {
              player?: Player
              runState?: RunState
              metaProgress?: typeof metaProgress
            }
          | undefined

        if (savedPayload?.player) {
          loadedPlayer = savedPayload.player
          setPlayer(savedPayload.player)
        }

        if (savedPayload?.runState) {
          if (!isRunStateCompatible(savedPayload.runState)) {
            await db.clearAll()
            resetGame()
            toast.info('检测到旧版存档，已按 v2 规则清理，请重新开始。')
            return
          }
          loadedRun = savedPayload.runState
          setRunState(savedPayload.runState)
        }

        if (savedPayload?.metaProgress) {
          mergeMetaProgress(savedPayload.metaProgress)
        }
      }

      if (!loadedPlayer) {
        toast.error('没有可继续的角色')
        return
      }

      await startRun(loadedPlayer, loadedRun ?? undefined)
    } finally {
      setIsLoading(false)
    }
  }, [mergeMetaProgress, resetGame, saveId, setPlayer, setRunState, startRun])

  const handleReturnHome = useCallback(() => {
    autoSave().finally(() => {
      setGamePhase('start')
    })
  }, [autoSave])

  const handleSelectCharacter = useCallback(
    async (character: Player) => {
      await startRun(character)
    },
    [startRun],
  )

  const handleAction = useCallback(
    async (actionId: string, rawInput?: string) => {
      if (!runState) return

      setIsLoading(true)

      try {
        const nextRun = await runService.submitAction(runState, actionId, rawInput)
        setRunState(nextRun)

        if (nextRun.phase === 'game_over') {
          mergeMetaProgress(nextRun.meta)
          toast.info('本局修行结束，可重新转世再战')
        }

        await autoSave()
      } catch (error) {
        console.error('行动结算失败:', error)
        const message = error instanceof Error ? error.message : '未知错误'
        toast.error(`行动结算失败：${message}`)
      } finally {
        setIsLoading(false)
      }
    },
    [autoSave, mergeMetaProgress, runService, runState, setRunState],
  )

  const handleSelectAction = useCallback(
    async (actionId: string) => {
      await handleAction(actionId)
    },
    [handleAction],
  )

  const handleCustomAction = useCallback(
    async (rawInput: string) => {
      if (!runState) return

      const customActionId =
        runState.currentOptions.find((option) => option.kind === 'custom')?.id ?? 'custom'

      await handleAction(customActionId, rawInput)
    },
    [handleAction, runState],
  )

  return (
    <div className="min-h-screen bg-background">
      {gamePhase === 'start' && (
        <StartScreen onStart={handleStartFromHome} onContinue={handleContinueGame} />
      )}

      {gamePhase === 'character_creation' && (
        <CharacterCreationScreen
          gameService={characterService}
          onSelectCharacter={handleSelectCharacter}
          onReturnHome={handleReturnHome}
        />
      )}

      {gamePhase === 'game' && runState && (
        <GameScreen
          runState={runState}
          isLoading={isLoading}
          onSelectAction={handleSelectAction}
          onCustomAction={handleCustomAction}
          onReturnHome={handleReturnHome}
        />
      )}

      <Toaster />
    </div>
  )
}

export default App

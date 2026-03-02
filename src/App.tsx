import { useState, useEffect, useCallback, useRef } from 'react'
import { StartScreen } from './components/StartScreen'
import { CharacterCreationScreen } from './components/CharacterCreationScreen'
import { GameScreen } from './components/GameScreen'
import { useGameStore } from './stores/useGameStore'
import { useSettingsStore } from './stores/useSettingsStore'
import { createLLMService } from './services/llmService'
import { createGameService } from './services/gameService'
import { db } from './services/db'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import type { Player } from './types/game'
import type { Relationship } from '@/types/game'

function App() {
  // 游戏阶段：start(主页) -> character_creation(角色创建) -> game(游戏主界面)
  const [gamePhase, setGamePhase] = useState<'start' | 'character_creation' | 'game'>('start')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedCharacters, setGeneratedCharacters] = useState<Player[]>([])
  const [actionSuggestions, setActionSuggestions] = useState<string[]>([])

  // Store
  const {
    player,
    world,
    logs,
    saveId,
    setPlayer,
    updatePlayer,
    addLog,
    initWorld,
    setWorld,
    incrementTurn,
    updateLastSavedAt,
  } = useGameStore()

  const { llmConfig } = useSettingsStore()

  // 用于追踪是否已经初始化过自动存档
  const autoSaveInitialized = useRef(false)

  // 初始化 IndexedDB
  useEffect(() => {
    db.init().catch(console.error)
  }, [])

  // 创建服务
  const llmService = createLLMService(llmConfig)
  const gameServiceWithMemory = createGameService(llmService)

  // 自动存档功能
  const autoSave = useCallback(async () => {
    if (!player || !saveId) return

    try {
      const gameState = useGameStore.getState()
      const saveData = {
        saveId,
        data: {
          player: gameState.player,
          npcs: gameState.npcs,
          world: gameState.world,
          logs: gameState.logs,
          events: gameState.events,
          memories: gameState.memories,
          memorySummary: gameState.memorySummary,
          turn: gameState.turn,
          isPlaying: gameState.isPlaying,
          isLoading: gameState.isLoading,
          error: gameState.error,
        },
      }

      await db.saveSaveData(saveData)
      updateLastSavedAt()
      console.log('自动存档成功')
    } catch (error) {
      console.error('自动存档失败:', error)
    }
  }, [player, saveId, updateLastSavedAt])

  // 设置自动存档（每30秒自动保存一次，以及每次行动后）
  useEffect(() => {
    if (gamePhase !== 'game' || autoSaveInitialized.current) return

    autoSaveInitialized.current = true

    // 每30秒自动保存
    const intervalId = setInterval(() => {
      autoSave()
    }, 30000)

    return () => {
      clearInterval(intervalId)
      autoSaveInitialized.current = false
    }
  }, [gamePhase, autoSave])

  // 从主页开始新游戏
  const handleStartFromHome = useCallback(() => {
    setGamePhase('character_creation')
    setGeneratedCharacters([])
    setActionSuggestions([])
  }, [])

  // 继续游戏
  const handleContinueGame = useCallback(async () => {
    if (!player) return

    setIsLoading(true)
    try {
      // 如果有存档ID，尝试从IndexedDB加载完整数据
      if (saveId) {
        const savedData = await db.getSaveData(saveId)
        if (savedData?.data) {
          // 恢复游戏状态
          const state = useGameStore.getState()
          state.loadGame(savedData.data)
        }
      }

      // 初始化游戏服务
      const currentSaveId = saveId || `save_${Date.now()}`
      if (!saveId) {
        useGameStore.setState({ saveId: currentSaveId })
      }

      gameServiceWithMemory.initialize(currentSaveId)
      setGamePhase('game')
      toast.success('欢迎回来，道友！')
    } catch (error) {
      console.error('加载游戏失败:', error)
      toast.error('加载存档失败')
    } finally {
      setIsLoading(false)
    }
  }, [player, saveId, gameServiceWithMemory])

  // 返回主页
  const handleReturnHome = useCallback(() => {
    // 先自动保存当前进度
    autoSave().then(() => {
      setGamePhase('start')
      toast.info('已返回主页')
    })
  }, [autoSave])

  // 生成角色
  const handleGenerateCharacters = useCallback(async () => {
    setIsLoading(true)
    try {
      const characters = await gameServiceWithMemory.generateCharacters()
      setGeneratedCharacters(characters)
      toast.success('角色生成成功！')
    } catch (error) {
      console.error('生成角色失败:', error)
      toast.error('角色生成失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsLoading(false)
    }
  }, [llmConfig, gameServiceWithMemory])

  // 选择角色开始游戏
  const handleSelectCharacter = useCallback(
    async (character: Player) => {
      setPlayer(character)

      // 初始化世界
      const initialWorld = initWorld(character.background)
      setWorld(initialWorld)

      // 初始化游戏服务
      const newSaveId = `save_${Date.now()}`
      useGameStore.setState({ saveId: newSaveId })
      gameServiceWithMemory.initialize(newSaveId)

      setGamePhase('game')
      toast.success('修仙之旅开始！')

      // 自动生成初始剧情
      setIsLoading(true)
      try {
        const result = await gameServiceWithMemory.generateStory(
          character,
          initialWorld,
          [],
          '我睁开双眼，发现自己身处一个陌生的世界。'
        )

        // 添加初始剧情
        addLog({
          type: 'event',
          content: result.story,
        })

        // 更新行动建议
        setActionSuggestions(result.suggestedActions || [])

        // 首次自动存档
        await autoSave()
      } catch (error) {
        console.error('初始剧情生成失败:', error)
        addLog({
          type: 'system',
          content: '**天道紊乱**：天机推演受阻，请道友稍后再试。',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [setPlayer, initWorld, setWorld, addLog, gameServiceWithMemory, autoSave]
  )

  // 处理玩家行动
  const handleActionSubmit = useCallback(
    async (action: string) => {
      if (!player || !world) return

      setIsLoading(true)

      // 添加玩家行动日志
      addLog({
        type: 'action',
        content: `你决定：${action}`,
      })

      try {
        incrementTurn()

        // 生成剧情
        const result = await gameServiceWithMemory.generateStory(player, world, logs, action)

        // 更新玩家状态
        const updatedPlayer = { ...player }

        // 应用属性变化
        if (result.statChanges) {
          if (result.statChanges.health)
            updatedPlayer.health = Math.max(
              0,
              Math.min(updatedPlayer.maxHealth, updatedPlayer.health + result.statChanges.health)
            )
          if (result.statChanges.maxHealth) updatedPlayer.maxHealth += result.statChanges.maxHealth
          if (result.statChanges.spiritualPower)
            updatedPlayer.spiritualPower = Math.max(
              0,
              Math.min(
                updatedPlayer.maxSpiritualPower,
                updatedPlayer.spiritualPower + result.statChanges.spiritualPower
              )
            )
          if (result.statChanges.maxSpiritualPower)
            updatedPlayer.maxSpiritualPower += result.statChanges.maxSpiritualPower
          if (result.statChanges.attack) updatedPlayer.attack += result.statChanges.attack
          if (result.statChanges.defense) updatedPlayer.defense += result.statChanges.defense
          if (result.statChanges.speed) updatedPlayer.speed += result.statChanges.speed
          if (result.statChanges.luck) updatedPlayer.luck += result.statChanges.luck
          if (result.statChanges.lifespan) updatedPlayer.lifespan += result.statChanges.lifespan
        }

        // 更新时间
        updatedPlayer.age +=
          result.timePassed.year + result.timePassed.month / 12 + result.timePassed.day / 365

        // 消耗寿元
        const lifespanCost =
          result.timePassed.year * 1 + result.timePassed.month * 0.1 + result.timePassed.day * 0.01
        updatedPlayer.lifespan -= lifespanCost

        // 增加修为
        updatedPlayer.cultivationProgress += result.cultivationGained
        if (updatedPlayer.cultivationProgress >= 100) {
          updatedPlayer.cultivationProgress = 100
        }

        // 增加灵气
        updatedPlayer.spiritualEnergy += result.spiritualEnergyGained

        // 处理突破
        if (result.breakthrough.occurred && result.breakthrough.success) {
          updatedPlayer.realm = result.breakthrough.newRealm as Player['realm']
          updatedPlayer.minorRealm = result.breakthrough.newMinorRealm as Player['minorRealm']
          updatedPlayer.cultivationProgress = 0

          // 增加寿元上限
          const realmLifespanBonus: Record<string, number> = {
            炼气期: 150,
            筑基期: 300,
            金丹期: 500,
            元婴期: 1000,
            化神期: 2000,
            炼虚期: 5000,
            合体期: 10000,
            大乘期: 50000,
            渡劫期: 99999,
          }
          updatedPlayer.maxLifespan = realmLifespanBonus[updatedPlayer.realm] || 100
          updatedPlayer.lifespan = updatedPlayer.maxLifespan * 0.5
        }

        // 添加获得的物品
        if (result.itemsGained?.length > 0) {
          updatedPlayer.inventory = [...(updatedPlayer.inventory || []), ...result.itemsGained]
        }

        // 移除失去的物品
        if (result.itemsLost?.length > 0 && updatedPlayer.inventory) {
          updatedPlayer.inventory = updatedPlayer.inventory.filter(
            (item) =>
              !result.itemsLost?.some(
                (lostItem) => item.name === lostItem || item.id === lostItem
              )
          )
        }

        // 添加获得的技能
        if (result.skillsGained?.length > 0) {
          updatedPlayer.skills = [...(updatedPlayer.skills || []), ...result.skillsGained]
        }

        // 提升已有技能
        if (result.skillsImproved?.length > 0 && updatedPlayer.skills) {
          updatedPlayer.skills = updatedPlayer.skills.map((skill) => {
            if (
              result.skillsImproved?.includes(skill.name) &&
              skill.level < skill.maxLevel
            ) {
              return { ...skill, level: skill.level + 1 }
            }
            return skill
          })
        }

        // 更新 NPC 关系
        if (result.npcsMet?.length > 0) {
          const newRelationships = { ...(updatedPlayer.relationships || {}) }
          for (const npc of result.npcsMet) {
            const npcId = npc.id || Math.random().toString(36).substring(2, 15)
            const existingRelationship = newRelationships[npc.name]
            const relationshipChange = npc.relationshipChange || 0

            if (existingRelationship) {
              existingRelationship.favorability += relationshipChange
              existingRelationship.lastInteractionAt = Date.now()
              existingRelationship.interactionCount =
                (existingRelationship.interactionCount || 0) + 1
              existingRelationship.history = [
                ...(existingRelationship.history || []),
                `在${world?.currentLocation || '某地'}相遇`,
              ]
            } else {
              newRelationships[npc.name] = {
                npcId: npcId,
                npcName: npc.name,
                npcEmoji: npc.avatar || npc.emoji,
                npcIdentity: npc.identity || '未知身份',
                level: '中立',
                favorability: relationshipChange,
                description: npc.description || `在修仙路上结识的${npc.identity || '修士'}`,
                firstMetAt: Date.now(),
                lastInteractionAt: Date.now(),
                interactionCount: 1,
                tags: [],
                notes: '',
                history: [],
              }
            }
          }
          updatedPlayer.relationships = newRelationships
        }

        // 应用关系更新
        if (result.relationshipsUpdate) {
          const newRelationships = { ...(updatedPlayer.relationships || {}) }
          for (const [npcName, update] of Object.entries(result.relationshipsUpdate)) {
            if (newRelationships[npcName]) {
              newRelationships[npcName].favorability += update.favorabilityChange
              newRelationships[npcName].lastInteractionAt = Date.now()
              if (update.newLevel) {
                newRelationships[npcName].level = update.newLevel as Relationship['level']
              }
            }
          }
          updatedPlayer.relationships = newRelationships
        }

        // 记录成长历史
        updatedPlayer.growthHistory = [
          ...(updatedPlayer.growthHistory || []),
          `[${Math.floor(updatedPlayer.age)}岁 ${updatedPlayer.realm}·${updatedPlayer.minorRealm} ${updatedPlayer.cultivationProgress.toFixed(1)}%] ${result.story.slice(0, 100)}...`,
        ]

        // 保存更新后的玩家状态
        updatePlayer(updatedPlayer)

        // 添加剧情日志
        addLog({
          type: 'event',
          content: result.story,
        })

        // 记录事件
        if (result.events.length > 0) {
          for (const event of result.events) {
            addLog({
              type: 'system',
              content: `【事件】${event}`,
            })
          }
        }

        // 更新行动建议
        setActionSuggestions(result.suggestedActions || [])

        // 触发自动存档
        await autoSave()
      } catch (error) {
        console.error('生成剧情失败:', error)
        const errorMessage = error instanceof Error ? error.message : '天机难测'
        addLog({
          type: 'system',
          content: `**天道反噬**：推演受阻（${errorMessage}）。请道友稍后再试，或换个思路。`,
        })
        toast.error('天道推演失败，请稍后再试')
      } finally {
        setIsLoading(false)
      }
    },
    [player, world, logs, updatePlayer, addLog, incrementTurn, autoSave]
  )

  return (
    <div className="min-h-screen bg-zinc-950">
      {gamePhase === 'start' && (
        <StartScreen onStart={handleStartFromHome} onContinue={handleContinueGame} />
      )}

      {gamePhase === 'character_creation' && (
        <CharacterCreationScreen
          characters={generatedCharacters}
          isLoading={isLoading}
          onSelectCharacter={handleSelectCharacter}
          onGenerateCharacters={handleGenerateCharacters}
          onReturnHome={handleReturnHome}
        />
      )}

      {gamePhase === 'game' && player && (
        <GameScreen
          player={player}
          world={world}
          logs={logs}
          isLoading={isLoading}
          suggestions={actionSuggestions}
          onActionSubmit={handleActionSubmit}
          onReturnHome={handleReturnHome}
        />
      )}

      <Toaster />
    </div>
  )
}

export default App

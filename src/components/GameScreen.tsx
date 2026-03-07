import { motion } from 'framer-motion'
import { StatusPanel } from './StatusPanel'
import { StoryLog } from './StoryLog'
import { ActionInput } from './ActionInput'
import { TokenDisplay } from './TokenDisplay'
import { ImmersionLoading } from './ImmersionLoading'
import { MapPanel } from './MapPanel'
import { NPCPanel } from './NPCPanel'
import { NPCInteractModal } from './NPCInteractModal'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sun, Moon } from 'lucide-react'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { Player, GameLog, World, NPC, NPCInteractResult } from '@/types/game'

interface GameScreenProps {
  player: Player
  world: World | null
  logs: GameLog[]
  isLoading: boolean
  suggestions: string[]
  onActionSubmit: (action: string) => void
  onReturnHome?: () => void
  // NPC 相关
  nearbyNPCs: NPC[]
  selectedNPC: NPC | null
  isNPCInteracting: boolean
  onSelectNPC: (npc: NPC) => void
  onCloseNPCModal: () => void
  onNPCInteract: (action: string) => Promise<NPCInteractResult>
}

export function GameScreen({
  player,
  world,
  logs,
  isLoading,
  suggestions,
  onActionSubmit,
  onReturnHome,
  nearbyNPCs,
  selectedNPC,
  isNPCInteracting,
  onSelectNPC,
  onCloseNPCModal,
  onNPCInteract,
}: GameScreenProps) {
  const { theme, setTheme } = useSettingsStore()

  // 数据容错处理
  const safeAge = player?.age ?? 18
  const safeRealm = player?.realm ?? '炼气期'
  const safeMinorRealm = player?.minorRealm ?? '初期'

  return (
    <div className="min-h-screen xian-bg text-foreground">
      <div className="max-w-7xl mx-auto p-3 md:p-5 h-screen flex flex-col">
        {/* 顶部标题栏 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between mb-4 flex-shrink-0"
        >
          <div className="flex items-center gap-4">
            {onReturnHome && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReturnHome}
                className="text-[hsl(var(--dim))] hover:text-foreground hover:bg-emerald-500/5 -ml-2 tracking-wide"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回
              </Button>
            )}
            <div>
              <h1 className="text-lg font-bold tracking-[0.15em]">
                <span className="jade-text">九霄界</span>
                <span className="text-[hsl(var(--dim))] font-normal text-sm ml-2">· 修仙录</span>
              </h1>
              <p className="text-xs text-[hsl(var(--dim))] tracking-wider">
                {world?.currentLocation || '未知之地'} · 第 {Math.floor(safeAge)} 年
              </p>
            </div>
          </div>

          {/* 顶部右侧：境界 + 主题切换 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 ink-card rounded-full border border-[hsl(var(--ink-border))]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 tracking-wider text-xs">{safeRealm}·{safeMinorRealm}</span>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-full border border-[hsl(var(--ink-border))] text-[hsl(var(--dim))] hover:text-foreground hover:border-[hsl(var(--primary)_/_0.3)] transition-all duration-200"
              title={theme === 'dark' ? '切换日间模式' : '切换夜间模式'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </motion.div>

        {/* 顶部分隔线 */}
        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent mb-4 flex-shrink-0" />

        {/* 主内容区 - 三栏布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* 左侧：角色状态面板 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3 min-h-0"
          >
            <StatusPanel player={player} />
          </motion.div>

          {/* 中间：修仙历程和行动输入 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-6 flex flex-col gap-3 min-h-0"
          >
            <StoryLog logs={logs} />
            <ActionInput
              onSubmit={onActionSubmit}
              isLoading={isLoading}
              suggestions={suggestions}
            />
          </motion.div>

          {/* 右侧：区域信息和人物信息 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-3 flex flex-col gap-3 min-h-0"
          >
            {/* 地图面板 */}
            <MapPanel
              currentLocation={world?.currentLocation || '未知之地'}
              locationDescription={world?.locationDescription}
            />

            {/* NPC 面板 */}
            <NPCPanel
              npcs={nearbyNPCs}
              onSelectNPC={onSelectNPC}
              isLoading={isLoading}
            />
          </motion.div>
        </div>
      </div>

      {/* Token 统计 - 悬浮显示 */}
      <TokenDisplay position="bottom-right" />

      {/* 沉浸式加载 - 剧情推演中 */}
      <ImmersionLoading isLoading={isLoading} type="story" />

      {/* NPC 互动模态框 */}
      <NPCInteractModal
        npc={selectedNPC}
        isOpen={isNPCInteracting}
        onClose={onCloseNPCModal}
        onInteract={onNPCInteract}
      />
    </div>
  )
}

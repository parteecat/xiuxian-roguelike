import { StatusPanel } from './StatusPanel'
import { StoryLog } from './StoryLog'
import { ActionInput } from './ActionInput'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Player, GameLog, World } from '@/types/game'

interface GameScreenProps {
  player: Player
  world: World | null
  logs: GameLog[]
  isLoading: boolean
  suggestions: string[]
  onActionSubmit: (action: string) => void
  onReturnHome?: () => void
}

export function GameScreen({
  player,
  world,
  logs,
  isLoading,
  suggestions,
  onActionSubmit,
  onReturnHome,
}: GameScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {onReturnHome && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReturnHome}
                className="text-zinc-400 hover:text-zinc-200 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回主页
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">九霄界 · 修仙录</h1>
              <p className="text-sm text-zinc-500">
                {world?.currentLocation || '未知之地'} · 第 {Math.floor(player.age)} 年
              </p>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          {/* 左侧：角色状态面板（固定宽度） */}
          <div className="lg:col-span-4 xl:col-span-3">
            <StatusPanel player={player} />
          </div>

          {/* 右侧：剧情日志和行动输入 */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
            <StoryLog logs={logs} />
            <ActionInput
              onSubmit={onActionSubmit}
              isLoading={isLoading}
              suggestions={suggestions}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

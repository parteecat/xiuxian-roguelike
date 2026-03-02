import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings, Play, RefreshCw, Trash2, Clock } from 'lucide-react'
import { useGameStore } from '@/stores/useGameStore'
import { SettingsPanel } from './SettingsPanel'
import { toast } from 'sonner'

interface StartScreenProps {
  onStart: () => void
  onContinue: () => void
}

export function StartScreen({ onStart, onContinue }: StartScreenProps) {
  const { player, resetGame, lastSavedAt } = useGameStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirmReset, setShowConfirmReset] = useState(false)

  const handleNewGame = () => {
    if (player) {
      setShowConfirmReset(true)
    } else {
      resetGame()
      onStart()
    }
  }

  const handleConfirmReset = () => {
    resetGame()
    setShowConfirmReset(false)
    onStart()
    toast.info('已重新开始新的修仙之旅')
  }

  const formatLastSaved = () => {
    if (!lastSavedAt) return ''
    const date = new Date(lastSavedAt)
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full text-center space-y-8 relative z-10">
        {/* 标题区域 */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-wider bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            九霄界
          </h1>
          <p className="text-zinc-400 tracking-widest text-sm">AI驱动的修仙Roguelike</p>
          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        </div>

        {/* 存档信息卡片 */}
        {player && (
          <Card className="bg-zinc-900/80 border-zinc-800 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{player.avatar}</div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-zinc-100">{player.name}</div>
                  <div className="text-sm text-emerald-400">
                    {player.realm}·{player.minorRealm}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    第 {Math.floor(player.age)} 年 · 寿元 {Math.floor(player.lifespan)}/{player.maxLifespan}
                  </div>
                </div>              
                {lastSavedAt && (
                  <div className="text-xs text-zinc-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatLastSaved()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 按钮区域 */}
        <div className="space-y-3 pt-4">
          {player && (
            <Button
              onClick={onContinue}
              size="lg"
              className="w-full py-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-lg font-medium shadow-lg shadow-emerald-900/20"
            >
              <Play className="w-5 h-5 mr-2" />
              继续修行
            </Button>
          )}

          <Button
            onClick={handleNewGame}
            size="lg"
            variant="outline"
            className={`w-full py-6 text-lg font-medium ${
              player
                ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                : 'border-emerald-700/50 text-emerald-400 hover:bg-emerald-950/30'
            }`}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            {player ? '重新转世' : '踏入仙途'}
          </Button>

          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                variant="ghost"
                className="w-full py-6 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              >
                <Settings className="w-5 h-5 mr-2" />
                天道设置
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-zinc-100">天道设置</DialogTitle>
              </DialogHeader>
              <SettingsPanel />
            </DialogContent>
          </Dialog>
        </div>

        {/* 说明文字 */}
        <p className="text-xs text-zinc-600 pt-4">
          所有数据仅保存在本地浏览器中
        </p>
      </div>

      {/* 确认重新开始对话框 */}
      <Dialog open={showConfirmReset} onOpenChange={setShowConfirmReset}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">确认重新转世？</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm">
              当前存档将被清空，所有修行进度都会丢失。此操作不可撤销。
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-zinc-700 text-zinc-400"
                onClick={() => setShowConfirmReset(false)}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleConfirmReset}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                确认转世
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

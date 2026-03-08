import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings, Play, RefreshCw, Trash2, Clock, Sun, Moon } from 'lucide-react'
import { useGameStore } from '@/stores/useGameStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { SettingsPanel } from './SettingsPanel'
import { REALM_LABELS } from '@/services/runEngine'
import { toast } from 'sonner'

interface StartScreenProps {
  onStart: () => void
  onContinue: () => void
}

export function StartScreen({ onStart, onContinue }: StartScreenProps) {
  const { player, runState, resetGame, lastSavedAt, metaProgress } = useGameStore()
  const { llmConfig, theme, setTheme } = useSettingsStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showConfirmNew, setShowConfirmNew] = useState(false)

  const hasSave = Boolean(runState || player)
  const safeAge = runState?.world.age ?? player?.age ?? 18
  const safeLifespan = runState?.player.lifespan ?? player?.lifespan ?? 120
  const safeMaxLifespan = runState?.player.lifespanMax ?? player?.maxLifespan ?? 120
  const safeRealm = runState ? REALM_LABELS[runState.player.realm] : player?.realm ?? '炼气期'
  const safeMinorRealm = runState ? '' : player?.minorRealm ?? '初期'
  const displayName = runState?.player.name ?? player?.name ?? '无名散修'
  const displayAvatar = runState?.player.avatar ?? player?.avatar ?? '🧙'

  const isModelConfigured = () =>
    !!(llmConfig.baseURL && llmConfig.apiKey && llmConfig.model)

  const handleNewGame = () => setShowConfirmNew(true)

  const handleConfirmNew = () => {
    setShowConfirmNew(false)
    resetGame()
    onStart()
    if (isModelConfigured()) {
      toast.info('踏入仙途，修仙之旅即将开始…')
    } else {
      toast.info('未配置模型，将以本地规则模式开始修行')
    }
  }

  const formatLastSaved = () => {
    if (!lastSavedAt) return ''
    return new Date(lastSavedAt).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen xian-bg text-foreground flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* 背景粒子装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${[200, 300, 150, 250, 180, 220][i]}px`,
              height: `${[200, 300, 150, 250, 180, 220][i]}px`,
              left: `${[10, 70, 30, 60, 20, 80][i]}%`,
              top: `${[20, 60, 75, 15, 45, 40][i]}%`,
              background: i % 2 === 0
                ? 'radial-gradient(circle, hsl(160 84% 39% / 0.05), transparent 70%)'
                : 'radial-gradient(circle, hsl(200 84% 50% / 0.04), transparent 70%)',
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.7,
            }}
          />
        ))}
        {/* 竖线装饰 */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-md w-full text-center space-y-10 relative z-10"
      >
        {/* 主题切换按钮 - 右上角 */}
        <div className="absolute top-0 right-0">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full border border-[hsl(var(--ink-border))] text-[hsl(var(--dim))] hover:text-foreground hover:border-[hsl(var(--primary)_/_0.3)] transition-all duration-200"
            title={theme === 'dark' ? '切换日间模式' : '切换夜间模式'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>
        </div>
        {/* 标题区域 */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {/* 顶部装饰线 */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-500/50" />
            </div>

            <h1 className="text-6xl md:text-7xl font-bold tracking-[0.2em] jade-text drop-shadow-[0_0_40px_hsl(160_84%_39%_/_0.2)]">
              九霄界
            </h1>

            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-500/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-500/50" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-[hsl(var(--dim))] tracking-[0.3em] text-xs uppercase"
          >
            以阶段推进与因果回收驱动的修仙人生模拟器
          </motion.p>
        </div>

        {/* 存档信息卡片 */}
        <AnimatePresence>
          {hasSave && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="ink-card jade-border rounded-xl p-5"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">
                    {displayAvatar}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-foreground tracking-wide">{displayName}</div>
                  <div className="text-sm text-emerald-400 mt-0.5 tracking-wider">
                    {safeMinorRealm ? `${safeRealm} · ${safeMinorRealm}` : safeRealm}
                  </div>
                  <div className="text-xs text-[hsl(var(--dim))] mt-1">
                    第 {Math.floor(safeAge)} 年 · 寿元 {Math.floor(safeLifespan)}/{safeMaxLifespan}
                  </div>
                </div>
                {lastSavedAt && (
                  <div className="text-xs text-[hsl(var(--dim))] flex flex-col items-end gap-0.5">
                    <Clock className="w-3 h-3 text-emerald-500/50" />
                    <span>{formatLastSaved()}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 按钮区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="space-y-3"
        >
          {hasSave && (
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                onClick={onContinue}
                size="lg"
                className="w-full py-6 btn-jade text-lg tracking-widest font-medium rounded-xl"
              >
                <Play className="w-5 h-5 mr-3" />
                继续修行
              </Button>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              onClick={handleNewGame}
              size="lg"
              variant="outline"
              className={`w-full py-6 text-lg tracking-widest font-medium rounded-xl transition-all duration-200 ${
                hasSave
                  ? 'border-[hsl(var(--ink-border))] text-[hsl(var(--dim))] hover:border-emerald-500/30 hover:text-foreground hover:bg-emerald-500/5'
                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50'
              }`}
            >
              <RefreshCw className="w-5 h-5 mr-3" />
              {hasSave ? '重新转世' : '踏入仙途'}
            </Button>
          </motion.div>

          {(metaProgress.unlockedBackgrounds.length > 0 || metaProgress.unlockedTalents.length > 0) && (
            <div className="ink-card rounded-xl p-4 text-left space-y-3">
              <div className="text-xs text-[hsl(var(--dim))] tracking-[0.2em] uppercase">前世残响</div>
              <div className="flex flex-wrap gap-2">
                {metaProgress.unlockedBackgrounds.slice(0, 2).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-emerald-500/15 bg-emerald-500/5 px-2 py-1 text-[10px] text-emerald-300"
                  >
                    背景：{item}
                  </span>
                ))}
                {metaProgress.unlockedTalents.slice(0, 2).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-sky-500/15 bg-sky-500/5 px-2 py-1 text-[10px] text-sky-300"
                  >
                    天赋：{item}
                  </span>
                ))}
              </div>
              <div className="text-xs text-[hsl(var(--dim))] leading-6">
                局终后获得的解锁会保留到下一次转世，并进入新的角色构建候选池。
              </div>
            </div>
          )}

          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                variant="ghost"
                className="w-full py-6 text-[hsl(var(--dim))] hover:text-foreground hover:bg-white/3 rounded-xl tracking-widest"
              >
                <Settings className="w-5 h-5 mr-3" />
                天道设置
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] ink-card border-[hsl(var(--ink-border))]">
              <DialogHeader>
                <DialogTitle className="text-foreground tracking-widest">天道设置</DialogTitle>
              </DialogHeader>
              <SettingsPanel onClose={() => setShowSettings(false)} />
            </DialogContent>
          </Dialog>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-xs text-[hsl(var(--dim))] tracking-widest"
        >
          所有数据仅保存在本地浏览器中
        </motion.p>
      </motion.div>

      {/* 确认开始新游戏 */}
      <Dialog open={showConfirmNew} onOpenChange={setShowConfirmNew}>
        <DialogContent className="ink-card border-[hsl(var(--ink-border))]">
          <DialogHeader>
            <DialogTitle className="text-foreground tracking-wider">
              {hasSave ? '确认重新转世？' : '踏入仙途'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <p className="text-[hsl(var(--dim))] text-sm leading-relaxed">
              {hasSave
                ? '当前存档将被清空，所有修行进度都会丢失。此操作不可撤销。'
                : '准备好踏入九霄界，开启你的修仙传奇了吗？未配置模型时将回退为本地规则模式。'}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-[hsl(var(--ink-border))] text-[hsl(var(--dim))] hover:text-foreground"
                onClick={() => setShowConfirmNew(false)}
              >
                取消
              </Button>
              <Button
                className={`flex-1 ${hasSave ? 'bg-red-600/80 hover:bg-red-600' : 'btn-jade'} text-white`}
                onClick={handleConfirmNew}
              >
                {hasSave ? (
                  <><Trash2 className="w-4 h-4 mr-2" />确认转世</>
                ) : (
                  '踏入仙途'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

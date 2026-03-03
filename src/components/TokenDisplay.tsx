import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTokenStore } from '@/stores/useTokenStore'
import { Coins, X, Trash2 } from 'lucide-react'

interface TokenDisplayProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function TokenDisplay({ position = 'bottom-right' }: TokenDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { lastUsage, sessionUsage, totalUsage, resetSession, resetAll } = useTokenStore()

  // 位置样式
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toLocaleString()
  }

  // 如果没有使用过模型，显示空状态
  if (!lastUsage && sessionUsage.totalTokens === 0 && totalUsage.totalTokens === 0) {
    return null
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 pointer-events-none`}>
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto"
          >
            <div className="ink-card rounded-xl p-4 min-w-[200px] border border-emerald-500/20 bg-background/95 backdrop-blur-sm shadow-lg shadow-emerald-500/10">
              {/* 头部 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-foreground/90 tracking-wider">Token 统计</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 rounded-full text-[hsl(var(--dim))] hover:text-foreground hover:bg-white/5 transition-colors pointer-events-auto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 内容 */}
              <div className="space-y-3">
                {/* 最近一次 */}
                {lastUsage && lastUsage.totalTokens > 0 && (
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="text-xs text-emerald-400/70 mb-2 tracking-wider">最近一次调用</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between text-[hsl(var(--dim))]">
                        <span>输入</span>
                        <span className="text-foreground/80 tabular-nums">{formatNumber(lastUsage.promptTokens)}</span>
                      </div>
                      <div className="flex justify-between text-[hsl(var(--dim))]">
                        <span>输出</span>
                        <span className="text-foreground/80 tabular-nums">{formatNumber(lastUsage.completionTokens)}</span>
                      </div>
                      <div className="col-span-2 flex justify-between text-foreground/90 font-medium pt-1 border-t border-emerald-500/10">
                        <span>合计</span>
                        <span className="tabular-nums">{formatNumber(lastUsage.totalTokens)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 本次会话 */}
                <div className="p-3 rounded-lg bg-white/[0.02] border border-[hsl(var(--ink-border))]">
                  <div className="text-xs text-[hsl(var(--dim))] mb-2 tracking-wider">本次会话</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between text-[hsl(var(--dim))]">
                      <span>输入</span>
                      <span className="text-foreground/80 tabular-nums">{formatNumber(sessionUsage.promptTokens)}</span>
                    </div>
                    <div className="flex justify-between text-[hsl(var(--dim))]">
                      <span>输出</span>
                      <span className="text-foreground/80 tabular-nums">{formatNumber(sessionUsage.completionTokens)}</span>
                    </div>
                    <div className="col-span-2 flex justify-between text-foreground/90 font-medium pt-1 border-t border-[hsl(var(--ink-border))]">
                      <span>合计</span>
                      <span className="tabular-nums text-emerald-400">{formatNumber(sessionUsage.totalTokens)}</span>
                    </div>
                  </div>
                </div>

                {/* 累计 */}
                <div className="p-3 rounded-lg bg-white/[0.02] border border-[hsl(var(--ink-border))]">
                  <div className="text-xs text-[hsl(var(--dim))] mb-2 tracking-wider">累计使用</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between text-[hsl(var(--dim))]">
                      <span>输入</span>
                      <span className="text-foreground/80 tabular-nums">{formatNumber(totalUsage.promptTokens)}</span>
                    </div>
                    <div className="flex justify-between text-[hsl(var(--dim))]">
                      <span>输出</span>
                      <span className="text-foreground/80 tabular-nums">{formatNumber(totalUsage.completionTokens)}</span>
                    </div>
                    <div className="col-span-2 flex justify-between text-foreground/90 font-medium pt-1 border-t border-[hsl(var(--ink-border))]">
                      <span>合计</span>
                      <span className="tabular-nums text-emerald-400">{formatNumber(totalUsage.totalTokens)}</span>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={resetSession}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-[hsl(var(--dim))] hover:text-foreground bg-white/5 hover:bg-white/10 rounded-lg transition-colors pointer-events-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                    清空会话统计
                  </button>
                  <button
                    onClick={resetAll}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-red-400/70 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 rounded-lg transition-colors pointer-events-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                    重置全部统计
                  </button>
                </div>

                {/* 提示信息 */}
                <div className="text-[10px] text-[hsl(var(--dim))]/60 text-center pt-1 border-t border-[hsl(var(--ink-border))]">
                  仅重置 Token 统计数据，不影响游戏存档
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsExpanded(true)}
            className="pointer-events-auto flex items-center gap-2 px-3 py-2 ink-card rounded-full border border-emerald-500/20 bg-background/90 backdrop-blur-sm hover:border-emerald-500/40 transition-all duration-200 group shadow-lg shadow-emerald-500/5"
          >
            <Coins className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs text-foreground/80 tabular-nums tracking-wider">
              {formatNumber(sessionUsage.totalTokens)}
            </span>
            {lastUsage && lastUsage.totalTokens > 0 && (
              <span className="text-[10px] text-emerald-400/70">
                +{formatNumber(lastUsage.totalTokens)}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

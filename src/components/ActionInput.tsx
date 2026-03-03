import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Sparkles } from 'lucide-react'
import { InlineLoading } from './ImmersionLoading'

interface ActionInputProps {
  onSubmit: (action: string) => void
  isLoading?: boolean
  suggestions?: string[]
}

export function ActionInput({ onSubmit, isLoading, suggestions = [] }: ActionInputProps) {
  const [action, setAction] = useState('')

  const handleSubmit = () => {
    if (!action.trim() || isLoading) return
    onSubmit(action.trim())
    setAction('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] p-3 flex-shrink-0 space-y-2.5">
      {/* 建议选项 */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--dim))]">
              <Sparkles className="w-3 h-3 text-emerald-500/60" />
              <span className="tracking-wider">天道推演建议</span>
            </div>
            {/* 桌面端：换行显示 | 移动端：横向滚动 */}
            <div className="hidden sm:flex sm:flex-wrap gap-1.5">
              {suggestions.map((suggestion, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => !isLoading && onSubmit(suggestion)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5
                    bg-emerald-500/5 hover:bg-emerald-500/15
                    text-[hsl(var(--dim))] hover:text-emerald-400
                    border border-emerald-500/10 hover:border-emerald-500/30
                    rounded-full transition-all duration-200 disabled:opacity-40 tracking-wide"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
            {/* 移动端：横向滚动，节省垂直空间 */}
            <div className="flex sm:hidden gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {suggestions.map((suggestion, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => !isLoading && onSubmit(suggestion)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 flex-shrink-0
                    bg-emerald-500/5 hover:bg-emerald-500/15
                    text-[hsl(var(--dim))] hover:text-emerald-400
                    border border-emerald-500/10 hover:border-emerald-500/30
                    rounded-full transition-all duration-200 disabled:opacity-40 tracking-wide"
                  whileTap={{ scale: 0.95 }}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 输入框 + 发送按钮 */}
      <div className="flex gap-2 items-end">
        <Textarea
          value={action}
          onChange={(e) => setAction(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你想做的事情…"
          className="flex-1 border-[hsl(var(--ink-border))] text-foreground/90
            placeholder:text-[hsl(var(--dim))]/50 resize-none min-h-[52px] max-h-[120px]
            focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/30
            text-sm leading-relaxed rounded-lg"
          rows={2}
          disabled={isLoading}
        />
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleSubmit}
            disabled={!action.trim() || isLoading}
            className="h-[52px] w-12 p-0 btn-jade rounded-lg disabled:opacity-40 disabled:transform-none"
          >
            {isLoading ? (
              <span className="relative flex h-4 w-4">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white"
                />
              </span>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </motion.div>
      </div>

      {/* 底部提示 */}
      <div className="flex items-center justify-between text-xs text-[hsl(var(--dim))]/40">
        <span className="tracking-wider">
          {isLoading ? <InlineLoading /> : 'Enter 发送 · Shift+Enter 换行'}
        </span>
        {isLoading && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-emerald-500/50 tracking-wider"
          >
            请稍候...
          </motion.span>
        )}
      </div>
    </div>
  )
}

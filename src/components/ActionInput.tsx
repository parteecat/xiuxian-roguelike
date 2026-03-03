import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, Sparkles } from 'lucide-react'

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
            className="space-y-2 overflow-hidden"
          >
            <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--dim))]">
              <Sparkles className="w-3 h-3 text-emerald-500/60" />
              <span className="tracking-wider">天道推演建议</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
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
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </motion.div>
      </div>

      <div className="text-xs text-[hsl(var(--dim))]/40 text-center tracking-wider">
        Enter 发送 · Shift+Enter 换行
      </div>
    </div>
  )
}

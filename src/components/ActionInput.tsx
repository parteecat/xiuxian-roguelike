import { useState } from 'react'
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

  const handleSuggestionClick = (suggestion: string) => {
    onSubmit(suggestion)
  }

  return (
    <div className="space-y-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
      {/* 建议选项 */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Sparkles className="w-3 h-3" />
            <span>天道推演建议</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 bg-zinc-800/80 hover:bg-emerald-900/50 
                         text-zinc-400 hover:text-emerald-400 
                         border border-zinc-700 hover:border-emerald-700/50 
                         rounded-full transition-colors disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入框 */}
      <div className="flex gap-2">
        <Textarea
          value={action}
          onChange={(e) => setAction(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你想做的事情...（例如：去后山修炼、探索洞穴、与老者交谈）"
          className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 resize-none min-h-[60px]"
          rows={2}
          disabled={isLoading}
        />
        <Button
          onClick={handleSubmit}
          disabled={!action.trim() || isLoading}
          className="h-auto px-4 bg-emerald-600 hover:bg-emerald-700"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* 提示文字 */}
      <div className="text-xs text-zinc-600 text-center">
        点击上方建议可直接执行，或在输入框中输入自定义行动
      </div>
    </div>
  )
}

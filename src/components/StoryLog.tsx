import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import type { GameLog } from '@/types/game'

interface StoryLogProps {
  logs: GameLog[]
}

export function StoryLog({ logs }: StoryLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/80">
        <h3 className="text-sm font-medium text-zinc-300">修仙历程</h3>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center text-zinc-600 py-8">
              暂无记录，开始你的修仙之旅吧...
            </div>
          ) : (
            logs.map((log) => (
              <LogMessage key={log.id} log={log} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function LogMessage({ log }: { log: GameLog }) {
  const isAction = log.type === 'action'
  const isEvent = log.type === 'event'
  const isDialog = log.type === 'dialog'

  // 玩家行动 - 右对齐，蓝色气泡
  if (isAction) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-blue-600/20 border border-blue-600/30 rounded-2xl rounded-tr-sm px-4 py-2">
          <div className="text-sm text-blue-200">
            {log.content}
          </div>
          <div className="text-xs text-blue-400/60 mt-1 text-right">
            {formatTime(log.timestamp)}
          </div>
        </div>
      </div>
    )
  }

  // AI剧情/事件 - 左对齐，绿色气泡，支持Markdown
  if (isEvent) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] bg-emerald-900/20 border border-emerald-600/30 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="text-zinc-200 mb-2 last:mb-0 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="text-emerald-400 font-semibold">{children}</strong>,
                em: ({ children }) => <em className="text-zinc-400 italic">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-emerald-500/50 pl-3 my-2 text-zinc-400 italic">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {log.content}
            </ReactMarkdown>
          </div>
          <div className="text-xs text-emerald-400/60 mt-2">
            {formatTime(log.timestamp)}
          </div>
        </div>
      </div>
    )
  }

  // 对话 - 左对齐，黄色气泡
  if (isDialog) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[80%] bg-yellow-600/10 border border-yellow-600/30 rounded-2xl rounded-tl-sm px-4 py-2">
          <div className="text-sm text-yellow-200">
            {log.content}
          </div>
          <div className="text-xs text-yellow-400/60 mt-1">
            {formatTime(log.timestamp)}
          </div>
        </div>
      </div>
    )
  }

  // 系统消息 - 居中，灰色
  return (
    <div className="flex justify-center">
      <div className="text-xs text-zinc-500 italic px-4 py-1 bg-zinc-800/50 rounded-full">
        {log.content}
      </div>
    </div>
  )
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { GameLog } from "@/types/game";

interface StoryLogProps {
  logs: GameLog[];
}

export function StoryLog({ logs }: StoryLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // 用 requestAnimationFrame 等待 DOM 更新后再滚动
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [logs]);

  return (
    <div className="flex-1 ink-card rounded-xl border border-[hsl(var(--ink-border))] overflow-hidden flex flex-col min-h-0">
      {/* 标题栏 */}
      <div className="px-4 py-2.5 border-b border-[hsl(var(--ink-border))] flex items-center gap-2 flex-shrink-0 bg-white/1">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
          修仙历程
        </h3>
      </div>

      {/* 直接用原生 div 做滚动容器，ref 能直接控制 scrollTop */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {logs.length === 0 ? (
            <div className="text-center text-[hsl(var(--dim))] py-12 text-sm tracking-wider">
              <div className="text-2xl mb-3 opacity-30">☁️</div>
              暂无记录，开始你的修仙之旅吧…
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {logs.map((log) => (
                <LogMessage key={log.id} log={log} />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

function LogMessage({ log }: { log: GameLog }) {
  const isAction = log.type === "action";
  const isEvent = log.type === "event";
  const isDialog = log.type === "dialog";

  // 玩家行动 - 右对齐，靛蓝气泡
  if (isAction) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-tr-sm px-4 py-2.5">
          <div className="text-sm text-blue-400 dark:text-blue-100 leading-relaxed">
            {log.content}
          </div>
          <div className="text-xs text-blue-300/70 dark:text-blue-300/60 mt-1 text-right tabular-nums">
            {formatTime(log.timestamp)}
          </div>
        </div>
      </motion.div>
    );
  }

  // AI剧情 - 左对齐，翡翠气泡 + Markdown
  if (isEvent) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex justify-start"
      >
        <div className="max-w-[92%] bg-emerald-500/5 border border-emerald-500/15 rounded-2xl rounded-tl-sm px-4 py-3">
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="text-foreground/85 mb-2 last:mb-0 leading-[1.8] text-sm">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="text-emerald-400 font-semibold">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="text-foreground/60 italic">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-emerald-500/40 pl-3 my-2 text-foreground/50 italic text-xs">
                    {children}
                  </blockquote>
                ),
                ul: ({ children }) => (
                  <ul className="list-none space-y-1 text-sm">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-foreground/70 flex gap-2 before:content-['·'] before:text-emerald-500/60">
                    {children}
                  </li>
                ),
              }}
            >
              {log.content}
            </ReactMarkdown>
          </div>
          <div className="text-xs text-emerald-500/30 mt-2 tabular-nums">
            {formatTime(log.timestamp)}
          </div>
        </div>
      </motion.div>
    );
  }

  // 对话 - 左对齐，琥珀气泡
  if (isDialog) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-start"
      >
        <div className="max-w-[80%] bg-amber-500/8 border border-amber-500/20 rounded-2xl rounded-tl-sm px-4 py-2.5">
          <div className="text-sm text-amber-200/80 leading-relaxed">
            {log.content}
          </div>
          <div className="text-xs text-amber-400/40 mt-1 tabular-nums">
            {formatTime(log.timestamp)}
          </div>
        </div>
      </motion.div>
    );
  }

  // 系统消息 - 居中，细灰文字
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center py-1"
    >
      <div className="text-xs text-[hsl(var(--dim))]/60 italic px-3 py-1 rounded-full tracking-wider">
        {log.content}
      </div>
    </motion.div>
  );
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

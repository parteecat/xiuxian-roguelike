import { motion } from 'framer-motion'
import type { NPC } from '@/types/game'
import { getFavorColor, getFavorIcon } from '@/types/game'

interface NPCPanelProps {
  npcs: NPC[]
  onSelectNPC: (npc: NPC) => void
  isLoading?: boolean
}

export function NPCPanel({ npcs, onSelectNPC, isLoading }: NPCPanelProps) {
  if (isLoading) {
    return (
      <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
            附近人物
          </h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-24 h-16 bg-white/5 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  if (npcs.length === 0) {
    return (
      <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
            附近人物
          </h3>
        </div>
        <div className="text-center text-[hsl(var(--dim))] py-4 text-sm">
          <div className="text-2xl mb-2 opacity-30">👤</div>
          此地暂无其他修士
        </div>
      </div>
    )
  }

  return (
    <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] p-4 flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
            附近人物
          </h3>
        </div>
        <span className="text-xs text-[hsl(var(--dim))]">{npcs.length} 人</span>
      </div>

      <div className="flex-1 overflow-y-auto -mx-4 px-4 scrollbar-thin min-h-0">
        <div className="space-y-2">
          {npcs.map((npc, index) => (
            <motion.button
              key={npc.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectNPC(npc)}
              className="w-full group"
            >
              <div className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-[hsl(var(--ink-border))] hover:border-emerald-500/30 rounded-xl px-3 py-2.5 transition-all duration-200 active:scale-95 text-left">
                {/* NPC Emoji */}
                <span className="text-2xl filter drop-shadow-sm flex-shrink-0">{npc.emoji}</span>

                {/* NPC Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground/90 truncate">
                    {npc.name}
                  </div>
                  <div className="text-xs text-[hsl(var(--dim))]">
                    {npc.realm}·{npc.minorRealm}
                  </div>
                </div>

                {/* Favor Icon */}
                <div className={`text-lg flex-shrink-0 ${getFavorColor(npc.favor)}`}>
                  {getFavorIcon(npc.favor)}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

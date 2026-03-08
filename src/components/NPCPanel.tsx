import { motion } from 'framer-motion'
import type { NpcState } from '@/types/run'

interface NPCPanelProps {
  npcs: NpcState[]
}

export function NPCPanel({ npcs }: NPCPanelProps) {
  return (
    <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] p-4 flex-1 min-h-0 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
            关键 NPC
          </h3>
        </div>
        <span className="text-xs text-[hsl(var(--dim))]">{npcs.length} 人</span>
      </div>

      {npcs.length === 0 ? (
        <div className="flex-1 rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 grid place-items-center text-sm text-[hsl(var(--dim))]">
          此地暂无关键人物
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {npcs.map((npc, index) => (
            <motion.div
              key={npc.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 px-3 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-foreground/90">{npc.name}</div>
                  <div className="text-[11px] text-[hsl(var(--dim))] mt-1">
                    {npc.title} · {npc.camp}
                  </div>
                </div>
                <div className="text-[10px] text-right">
                  <div className={npc.favor >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                    好感 {npc.favor >= 0 ? `+${npc.favor}` : npc.favor}
                  </div>
                  <div className="text-orange-300 mt-1">信任 {npc.trust}</div>
                </div>
              </div>

              <div className="text-xs text-[hsl(var(--dim))] leading-6 mt-3">
                {npc.playerImpression}
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {npc.functions.map((func) => (
                  <span
                    key={func}
                    className="rounded-full bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300/80"
                  >
                    {functionLabelMap[func]}
                  </span>
                ))}
              </div>

              {npc.sharedHistory.length > 0 && (
                <div className="mt-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-[hsl(var(--dim))] leading-5">
                  最近共同经历：{npc.sharedHistory[0]}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

const functionLabelMap = {
  trade: '交易',
  quest: '任务',
  intel: '情报',
  mentor: '师承',
  romance: '结缘',
  enemy: '敌意',
}

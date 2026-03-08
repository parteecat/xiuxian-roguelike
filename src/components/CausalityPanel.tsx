import type { CausalityRecord, RunState } from '@/types/run'

interface CausalityPanelProps {
  runState: RunState
}

export function CausalityPanel({ runState }: CausalityPanelProps) {
  const groups = [
    {
      title: '已种下',
      items: runState.causality.planted.filter((item) => !item.hidden),
      tone: 'border-sky-500/15 bg-sky-500/5 text-sky-200',
    },
    {
      title: '追踪中',
      items: runState.causality.tracking,
      tone: 'border-amber-500/15 bg-amber-500/5 text-amber-200',
    },
    {
      title: '已回收',
      items: runState.causality.resolved.slice(-3).reverse(),
      tone: 'border-emerald-500/15 bg-emerald-500/5 text-emerald-200',
    },
  ]

  return (
    <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
            因果回收
          </h3>
        </div>
        <div className="text-[10px] text-[hsl(var(--dim))]">
          回收中 {runState.causality.returned.length} 条
        </div>
      </div>

      {runState.causality.returned.length > 0 && (
        <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4">
          <div className="text-sm text-red-300">本月有旧因果正在回收</div>
          <div className="space-y-2 mt-3">
            {runState.causality.returned.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                tone="border-red-500/15 bg-red-500/5 text-red-200"
              />
            ))}
          </div>
        </div>
      )}

      {groups.map((group) => (
        <div key={group.title} className="space-y-2">
          <div className="text-[11px] text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
            {group.title}
          </div>
          {group.items.length > 0 ? (
            <div className="space-y-2">
              {group.items.map((record) => (
                <RecordCard key={record.id} record={record} tone={group.tone} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 px-3 py-3 text-xs text-[hsl(var(--dim))]">
              暂无
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function RecordCard({
  record,
  tone,
}: {
  record: CausalityRecord
  tone: string
}) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm">{record.title}</div>
          <div className="text-xs mt-1 opacity-80 leading-6">{record.summary}</div>
        </div>
        <div className="text-[10px] whitespace-nowrap opacity-80">强度 {record.intensity}</div>
      </div>
      {record.consequences && record.consequences.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {record.consequences.slice(0, 3).map((consequence) => (
            <span
              key={consequence}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px]"
            >
              {consequence}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

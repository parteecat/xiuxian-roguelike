import type { ReactNode } from 'react'
import { ScrollText, Sparkles, Swords, Users } from 'lucide-react'
import type { EndingSummary } from '@/types/run'

interface EndgameSummaryPanelProps {
  summary: EndingSummary
}

export function EndgameSummaryPanel({ summary }: EndgameSummaryPanelProps) {
  return (
    <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-[hsl(var(--dim))] tracking-[0.2em] uppercase">人生结算</div>
          <div className="text-xl text-foreground mt-2">{summary.endingTitle}</div>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {summary.endingTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-emerald-500/15 bg-emerald-500/5 px-2 py-1 text-[10px] text-emerald-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 p-4 text-sm leading-7 text-foreground/85">
        {summary.biography}
      </div>

      <Section icon={<Swords className="w-4 h-4 text-amber-300" />} title="关键选择">
        {summary.topChoices.map((item) => (
          <Item key={item}>{item}</Item>
        ))}
      </Section>

      <Section icon={<ScrollText className="w-4 h-4 text-sky-300" />} title="因果回收">
        {summary.topCausalityReturns.map((item) => (
          <Item key={item}>{item}</Item>
        ))}
      </Section>

      <Section icon={<Users className="w-4 h-4 text-rose-300" />} title="关键关系">
        {summary.relationHighlights.map((item) => (
          <Item key={item}>{item}</Item>
        ))}
      </Section>

      <Section icon={<Sparkles className="w-4 h-4 text-emerald-300" />} title="局外解锁">
        {summary.metaUnlocks.map((item) => (
          <Item key={item}>{item}</Item>
        ))}
      </Section>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-[11px] text-[hsl(var(--dim))] tracking-[0.2em] uppercase">{title}</div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Item({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 px-3 py-3 text-sm text-foreground/85">
      {children}
    </div>
  )
}

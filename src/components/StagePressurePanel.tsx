import type { ReactNode } from 'react'
import { AlarmClock, CalendarRange, Compass, TimerReset } from 'lucide-react'
import type { RunState } from '@/types/run'

interface StagePressurePanelProps {
  runState: RunState
}

export function StagePressurePanel({ runState }: StagePressurePanelProps) {
  const { lifeStage, mainPressure, monthPlan, world } = runState

  return (
    <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
            阶段与压力
          </h3>
        </div>
        <div className="text-[10px] text-[hsl(var(--dim))]">
          第 {world.month} 月 / 3 槽制
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-emerald-300 font-medium">{lifeStage.title}</div>
            <div className="text-xs text-[hsl(var(--dim))] mt-1 leading-6">{lifeStage.goalSummary}</div>
          </div>
          <div className="text-xs text-emerald-300 whitespace-nowrap">{lifeStage.progress}%</div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${Math.min(100, lifeStage.progress)}%` }}
          />
        </div>
        <div className="mt-3 space-y-2">
          {lifeStage.riskSummary.slice(0, 2).map((summary) => (
            <div
              key={summary}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground/75"
            >
              {summary}
            </div>
          ))}
        </div>
      </div>

      {mainPressure && (
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlarmClock className="w-4 h-4 text-amber-300" />
              <div className="text-sm text-foreground">{mainPressure.title}</div>
            </div>
            <div
              className={`text-xs ${
                mainPressure.status === 'resolved'
                  ? 'text-emerald-300'
                  : mainPressure.status === 'failed'
                  ? 'text-red-300'
                  : 'text-amber-300'
              }`}
            >
              {mainPressure.status === 'active'
                ? `剩 ${mainPressure.remainMonths} 月`
                : mainPressure.status === 'resolved'
                ? '已达成'
                : '已错过'}
            </div>
          </div>
          <div className="text-xs text-[hsl(var(--dim))] leading-6 mt-2">{mainPressure.summary}</div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {mainPressure.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-amber-500/15 bg-amber-500/5 px-2 py-1 text-[10px] text-amber-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <MiniInfo
          icon={<CalendarRange className="w-3.5 h-3.5 text-sky-400" />}
          label="本月焦点"
          value={monthPlan.monthlyFocus}
        />
        <MiniInfo
          icon={<TimerReset className="w-3.5 h-3.5 text-emerald-400" />}
          label="剩余行动槽"
          value={`${monthPlan.slotsRemaining}/${monthPlan.slotsTotal}`}
        />
        <MiniInfo
          icon={<Compass className="w-3.5 h-3.5 text-orange-400" />}
          label="最近倒计时"
          value={runState.world.activeCountdowns[0]?.title ?? '暂无'}
        />
      </div>
    </div>
  )
}

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 px-3 py-3">
      <div className="flex items-center gap-2 text-[hsl(var(--dim))]">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <div className="text-sm text-foreground mt-2 leading-6">{value}</div>
    </div>
  )
}

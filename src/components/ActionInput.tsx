import { useMemo, useState } from 'react'
import { Clock3, PencilLine, Sparkles, Swords } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RISK_LABELS } from '@/services/runEngine'
import { cn } from '@/lib/utils'
import type { ActionOption, GamePhase } from '@/types/run'

interface ActionInputProps {
  options: ActionOption[]
  phase: GamePhase
  isLoading?: boolean
  slotsRemaining: number
  onSelectAction: (actionId: string) => void
  onCustomAction: (rawInput: string) => void
}

export function ActionInput({
  options,
  phase,
  isLoading,
  slotsRemaining,
  onSelectAction,
  onCustomAction,
}: ActionInputProps) {
  const [customInput, setCustomInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const optionList = useMemo(() => options.filter((option) => option.kind !== 'custom'), [options])
  const customOption = options.find((option) => option.kind === 'custom')

  const submitCustom = () => {
    if (!customInput.trim() || isLoading) return
    onCustomAction(customInput.trim())
    setCustomInput('')
    setShowCustom(false)
  }

  return (
    <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] p-4 flex flex-col min-h-0 h-full gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
            本月行动
          </h3>
        </div>
        <span className="text-[10px] text-[hsl(var(--dim))] tracking-wider uppercase">
          {phase === 'game_over' ? 'ended' : `slots ${slotsRemaining}`}
        </span>
      </div>

      <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3 text-sm text-foreground/85">
        本月剩余 <span className="text-emerald-300">{slotsRemaining}</span> 个行动槽。高风险突破和资格争夺会一次吃掉 2 格。
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
        {optionList.length > 0 ? (
          optionList.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelectAction(option.id)}
              disabled={isLoading || option.disabled || phase === 'game_over'}
              className={cn(
                'w-full rounded-xl border px-4 py-4 text-left transition-all duration-200 cursor-pointer',
                'bg-white/5 border-[hsl(var(--ink-border))] hover:bg-white/10 hover:border-emerald-500/30',
                'disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-foreground/90 font-medium">{option.title}</div>
                  <div className="text-xs text-[hsl(var(--dim))] leading-6 mt-1">{option.desc}</div>
                </div>
                <div
                  className={cn(
                    'px-2 py-1 rounded-full text-[10px] whitespace-nowrap',
                    option.risk === 'low'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : option.risk === 'mid'
                      ? 'bg-amber-500/10 text-amber-300'
                      : 'bg-red-500/10 text-red-300',
                  )}
                >
                  {RISK_LABELS[option.risk]}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px] text-[hsl(var(--dim))]">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  <Swords className="w-3 h-3" />
                  {option.slotCost} 格行动槽
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  <Clock3 className="w-3 h-3" />
                  {option.timeCostMonths === 0 ? '当月结算' : `${option.timeCostMonths} 月`}
                </span>
                {option.costs.mp ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                    真气 -{option.costs.mp}
                  </span>
                ) : null}
                {option.costs.hp ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                    气血 -{option.costs.hp}
                  </span>
                ) : null}
                {option.costs.spiritStone ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                    灵石 -{option.costs.spiritStone}
                  </span>
                ) : null}
              </div>

              <div className="grid gap-2 mt-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-3 py-3">
                  <div className="text-[10px] text-emerald-300 tracking-[0.2em] uppercase">主要收益</div>
                  <div className="mt-2 text-xs text-foreground/80 leading-6">
                    {option.primaryRewards.join('、')}
                  </div>
                </div>
                <div className="rounded-xl border border-red-500/10 bg-red-500/5 px-3 py-3">
                  <div className="text-[10px] text-red-300 tracking-[0.2em] uppercase">主要代价</div>
                  <div className="mt-2 text-xs text-foreground/80 leading-6">
                    {option.primaryCosts.join('、')}
                  </div>
                </div>
              </div>

              {option.disabled && option.disabledReason && (
                <div className="text-[10px] text-red-300 mt-2">{option.disabledReason}</div>
              )}
            </button>
          ))
        ) : (
          <div className="rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 px-4 py-6 text-sm text-[hsl(var(--dim))] text-center">
            当前没有可执行行动。
          </div>
        )}
      </div>

      {customOption && phase !== 'game_over' && (
        <div className="rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 px-4 py-3 space-y-3">
          <button
            type="button"
            onClick={() => setShowCustom((value) => !value)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 text-sm text-foreground/85">
              <PencilLine className="w-4 h-4 text-emerald-400" />
              {customOption.title}
            </div>
            <span className="text-[10px] text-[hsl(var(--dim))]">{showCustom ? '收起' : '展开'}</span>
          </button>

          <div className="text-xs text-[hsl(var(--dim))] leading-6">{customOption.desc}</div>

          {showCustom && (
            <div className="space-y-2">
              <Textarea
                value={customInput}
                onChange={(event) => setCustomInput(event.target.value)}
                placeholder="例如：先回山门递交情报，再决定本月要不要冲关"
                className="min-h-[96px] resize-none border-[hsl(var(--ink-border))] focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/30"
                disabled={isLoading}
              />
              <Button onClick={submitCustom} disabled={!customInput.trim() || isLoading} className="w-full btn-jade">
                <Sparkles className="w-4 h-4 mr-2" />
                映射为合法行动并执行
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Map,
  Moon,
  Orbit,
  ScrollText,
  Sun,
  Users2,
} from 'lucide-react'
import { ActionInput } from './ActionInput'
import { CausalityPanel } from './CausalityPanel'
import { EndgameSummaryPanel } from './EndgameSummaryPanel'
import { ImmersionLoading } from './ImmersionLoading'
import { MapPanel } from './MapPanel'
import { NPCPanel } from './NPCPanel'
import { StagePressurePanel } from './StagePressurePanel'
import { StatusPanel } from './StatusPanel'
import { StoryLog } from './StoryLog'
import { TokenDisplay } from './TokenDisplay'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getCurrentLocation, getCurrentLocationNpcs, REALM_LABELS } from '@/services/runEngine'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { RunState } from '@/types/run'

interface GameScreenProps {
  runState: RunState
  isLoading: boolean
  onSelectAction: (actionId: string) => void
  onCustomAction: (rawInput: string) => void
  onReturnHome?: () => void
}

type DetailPanelKey = 'life' | 'causality' | 'map' | 'npc' | 'ending' | null

export function GameScreen({
  runState,
  isLoading,
  onSelectAction,
  onCustomAction,
  onReturnHome,
}: GameScreenProps) {
  const { theme, setTheme } = useSettingsStore()
  const [detailPanel, setDetailPanel] = useState<DetailPanelKey>(null)
  const location = getCurrentLocation(runState)
  const npcs = getCurrentLocationNpcs(runState)

  const detailButtons = useMemo(
    () => [
      {
        id: 'life' as const,
        label: '人生',
        hint: `${REALM_LABELS[runState.player.realm]} · ${runState.lifeStage.title}`,
        icon: <Orbit className="w-4 h-4" />,
      },
      {
        id: 'causality' as const,
        label: '因果',
        hint: `${runState.causality.returned.length} 条回收中`,
        icon: <ScrollText className="w-4 h-4" />,
      },
      {
        id: 'map' as const,
        label: '地图',
        hint: location.name,
        icon: <Map className="w-4 h-4" />,
      },
      {
        id: 'npc' as const,
        label: '人物',
        hint: `${npcs.length} 位关键人物`,
        icon: <Users2 className="w-4 h-4" />,
      },
    ],
    [location.name, npcs.length, runState.causality.returned.length, runState.lifeStage.title, runState.player.realm],
  )

  return (
    <div className="h-[100dvh] overflow-hidden xian-bg text-foreground">
      <div className="max-w-7xl mx-auto h-full px-3 py-3 md:px-5 md:py-5 grid grid-rows-[auto_auto_auto_minmax(0,1fr)] gap-3 md:gap-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--ink-border))] bg-[hsl(var(--background)_/_0.88)] backdrop-blur-md px-3 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {onReturnHome && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReturnHome}
                className="text-[hsl(var(--dim))] hover:text-foreground hover:bg-emerald-500/5 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-[0.15em]">
                <span className="jade-text">九霄界</span>
                <span className="text-[hsl(var(--dim))] font-normal text-sm ml-2">· 人生模拟器</span>
              </h1>
              <p className="text-xs text-[hsl(var(--dim))] tracking-wider truncate">
                {location.name} · 第 {runState.world.month} 月 · {runState.lifeStage.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 ink-card rounded-full border border-[hsl(var(--ink-border))]">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  runState.phase === 'game_over' ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />
              <span
                className={`tracking-wider text-xs ${
                  runState.phase === 'game_over' ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {runState.phase === 'game_over'
                  ? '本局结束'
                  : `${REALM_LABELS[runState.player.realm]} · 槽 ${runState.monthPlan.slotsRemaining}`}
              </span>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full border border-[hsl(var(--ink-border))] text-[hsl(var(--dim))] hover:text-foreground hover:border-[hsl(var(--primary)_/_0.3)] transition-all duration-200 cursor-pointer"
              title={theme === 'dark' ? '切换日间模式' : '切换夜间模式'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
          <CompactMetric label="境界" value={REALM_LABELS[runState.player.realm]} accent="text-emerald-300" />
          <CompactMetric label="行动槽" value={`${runState.monthPlan.slotsRemaining}/3`} accent="text-sky-300" />
          <CompactMetric
            label="主线倒计时"
            value={
              runState.mainPressure?.status === 'active'
                ? `${runState.mainPressure.remainMonths} 月`
                : runState.mainPressure?.status === 'resolved'
                ? '已达成'
                : '已错过'
            }
            accent={runState.mainPressure?.status === 'active' ? 'text-amber-300' : 'text-red-300'}
          />
          <CompactMetric
            label="气血 / 真气"
            value={`${Math.floor(runState.player.hp)} / ${Math.floor(runState.player.mp)}`}
            accent="text-foreground"
          />
          <CompactMetric label="寿元" value={`${Math.floor(runState.player.lifespan)}`} accent="text-orange-300" />
          <CompactMetric
            label="因果回收"
            value={`${runState.causality.returned.length} 条`}
            accent={runState.causality.returned.length > 0 ? 'text-red-300' : 'text-[hsl(var(--dim))]'}
            className="hidden xl:block"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-2">
          {detailButtons.map((button) => (
            <button
              key={button.id}
              type="button"
              onClick={() => setDetailPanel(button.id)}
              className="ink-card rounded-xl border border-[hsl(var(--ink-border))] px-3 py-3 text-left hover:border-emerald-500/20 hover:bg-white/10 transition-all duration-200 cursor-pointer min-h-[52px]"
            >
              <div className="flex items-center gap-2 text-sm text-foreground/90">
                {button.icon}
                {button.label}
              </div>
              <div className="text-[11px] text-[hsl(var(--dim))] mt-1 truncate">{button.hint}</div>
            </button>
          ))}
          {runState.phase === 'game_over' && runState.endingSummary && (
            <button
              type="button"
              onClick={() => setDetailPanel('ending')}
              className="ink-card rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-3 text-left hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all duration-200 cursor-pointer min-h-[52px]"
            >
              <div className="flex items-center gap-2 text-sm text-emerald-200">
                <ScrollText className="w-4 h-4" />
                结算
              </div>
              <div className="text-[11px] text-emerald-300/70 mt-1 truncate">
                {runState.endingSummary.endingTitle}
              </div>
            </button>
          )}
        </div>

        <div className="min-h-0 grid grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(19rem,44dvh)] lg:grid-cols-[minmax(0,1.1fr)_minmax(21rem,0.9fr)] lg:grid-rows-1 gap-3 md:gap-4 overflow-hidden">
          <div className="min-h-0 overflow-hidden">
            <StoryLog scene={runState.currentScene} history={runState.history} phase={runState.phase} />
          </div>

          <div className="min-h-0 lg:h-full grid grid-rows-[auto_minmax(0,1fr)] gap-3 md:gap-4 overflow-hidden">
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
              <div className="text-[11px] text-[hsl(var(--dim))] tracking-[0.2em] uppercase">当前月重点</div>
              <div className="text-sm text-foreground mt-2 leading-6">{runState.monthPlan.monthlyFocus}</div>
              <div className="text-xs text-[hsl(var(--dim))] mt-2 leading-6">
                {runState.mainPressure?.summary}
              </div>
            </div>

            <div className="min-h-0 overflow-hidden">
              <ActionInput
                options={runState.currentOptions}
                phase={runState.phase}
                isLoading={isLoading}
                slotsRemaining={runState.monthPlan.slotsRemaining}
                onSelectAction={onSelectAction}
                onCustomAction={onCustomAction}
              />
            </div>
          </div>
        </div>
      </div>

      <DetailPanelDialog
        open={detailPanel !== null}
        panel={detailPanel}
        runState={runState}
        npcs={npcs}
        onOpenChange={(open) => {
          if (!open) setDetailPanel(null)
        }}
      />

      <TokenDisplay position="bottom-right" />
      <ImmersionLoading isLoading={isLoading} type="story" />
    </div>
  )
}

function CompactMetric({
  label,
  value,
  accent,
  className,
}: {
  label: string
  value: string
  accent?: string
  className?: string
}) {
  return (
    <div className={`ink-card rounded-xl border border-[hsl(var(--ink-border))] px-3 py-3 min-h-[56px] ${className ?? ''}`}>
      <div className="text-[10px] text-[hsl(var(--dim))] tracking-[0.2em] uppercase">{label}</div>
      <div className={`text-sm mt-2 truncate ${accent ?? 'text-foreground'}`}>{value}</div>
    </div>
  )
}

function DetailPanelDialog({
  open,
  panel,
  runState,
  npcs,
  onOpenChange,
}: {
  open: boolean
  panel: DetailPanelKey
  runState: RunState
  npcs: ReturnType<typeof getCurrentLocationNpcs>
  onOpenChange: (open: boolean) => void
}) {
  const title = {
    life: '人生状态',
    causality: '因果详情',
    map: '地图与路线',
    npc: '关键人物',
    ending: '人生结算',
  }[panel ?? 'life']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-4xl max-h-[88dvh] p-0 ink-card border-[hsl(var(--ink-border))] overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-[hsl(var(--ink-border))]">
          <DialogTitle className="tracking-wider text-foreground">{title}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(88dvh-4.5rem)] p-4 md:p-5">
          {panel === 'life' && (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-4">
              <StatusPanel runState={runState} />
              <StagePressurePanel runState={runState} />
            </div>
          )}
          {panel === 'causality' && <CausalityPanel runState={runState} />}
          {panel === 'map' && <MapPanel runState={runState} />}
          {panel === 'npc' && <NPCPanel npcs={npcs} />}
          {panel === 'ending' && runState.endingSummary && (
            <EndgameSummaryPanel summary={runState.endingSummary} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

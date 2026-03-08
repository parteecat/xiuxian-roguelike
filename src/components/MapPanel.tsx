import { Compass, MapPin, MoveRight } from 'lucide-react'
import {
  getCurrentLocation,
  getTravelEdges,
  LOCATION_TYPE_LABELS,
  REALM_LABELS,
  RISK_LABELS,
} from '@/services/runEngine'
import type { RunState } from '@/types/run'

interface MapPanelProps {
  runState: RunState
}

export function MapPanel({ runState }: MapPanelProps) {
  const location = getCurrentLocation(runState)
  const travelEdges = getTravelEdges(runState)

  return (
    <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
          地点与路线
        </h3>
      </div>

      <div className="rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-foreground tracking-wide">{location.name}</div>
            <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
              <span className="rounded-full bg-white/5 border border-white/10 px-2 py-1 text-[hsl(var(--dim))]">
                {LOCATION_TYPE_LABELS[location.type]}
              </span>
              <span className="rounded-full bg-white/5 border border-white/10 px-2 py-1 text-[hsl(var(--dim))]">
                {RISK_LABELS[location.riskLevel >= 3 ? 'high' : location.riskLevel === 2 ? 'mid' : 'low']}
              </span>
              <span className="rounded-full bg-white/5 border border-white/10 px-2 py-1 text-[hsl(var(--dim))]">
                推荐 {REALM_LABELS[location.recommendedRealm]}
              </span>
            </div>
            <div className="text-xs text-[hsl(var(--dim))] mt-3 leading-6">
              {location.description}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {location.envTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300/80"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          可前往地点
        </div>
        {travelEdges.map((edge) => {
          const target = runState.map.locations[edge.to]

          return (
            <div
              key={`${edge.from}-${edge.to}`}
              className="rounded-lg border border-[hsl(var(--ink-border))] bg-white/5 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-foreground/85">
                  <MoveRight className="w-3.5 h-3.5 text-emerald-400" />
                  {target.name}
                </div>
                <div className="text-[10px] text-[hsl(var(--dim))]">
                  {edge.slotCost} 格行动槽 · {RISK_LABELS[edge.riskLevel >= 3 ? 'high' : edge.riskLevel === 2 ? 'mid' : 'low']}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

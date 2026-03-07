import { MapPin } from 'lucide-react'

interface MapPanelProps {
  currentLocation: string
  locationDescription?: string
}

export function MapPanel({ currentLocation, locationDescription }: MapPanelProps) {
  return (
    <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
          当前区域
        </h3>
      </div>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-blue-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground tracking-wide">
            {currentLocation}
          </div>
          {locationDescription && (
            <div className="text-xs text-[hsl(var(--dim))] mt-1 leading-relaxed">
              {locationDescription}
            </div>
          )}
        </div>
      </div>

      {/* 占位符：未来扩展为完整地图 */}
      <div className="mt-4 p-4 bg-white/3 rounded-lg border border-dashed border-[hsl(var(--ink-border))] text-center">
        <div className="text-2xl mb-2 opacity-30">🗺️</div>
        <div className="text-xs text-[hsl(var(--dim))]">
          地图系统开发中...
        </div>
      </div>
    </div>
  )
}

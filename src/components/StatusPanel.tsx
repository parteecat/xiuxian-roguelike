import type { ReactNode } from 'react'
import { Flame, Heart, ShieldAlert, Sparkles, TrendingUp, Wallet, Zap } from 'lucide-react'
import { BUILD_TAG_LABELS, REALM_LABELS } from '@/services/runEngine'
import type { BuildTag, RunState, StatusTag } from '@/types/run'

interface StatusPanelProps {
  runState: RunState
}

export function StatusPanel({ runState }: StatusPanelProps) {
  const { player, world, npcs } = runState
  const buildTags = Object.entries(player.buildTags)
    .sort((left, right) => right[1] - left[1])
    .filter(([, value]) => value > 0)
    .slice(0, 4)

  const keyRelations = Object.values(npcs)
    .filter((npc) => npc.favor > 0 || npc.trust > 0 || npc.relationStatus === 'enemy')
    .sort((left, right) => right.trust + right.favor - (left.trust + left.favor))
    .slice(0, 3)

  return (
    <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[hsl(var(--ink-border))] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">
            {player.avatar}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground tracking-wide truncate">{player.name}</div>
            <div className="text-sm text-emerald-400 mt-0.5 tracking-wider">
              {REALM_LABELS[player.realm]}
            </div>
            <div className="text-xs text-[hsl(var(--dim))] mt-0.5 truncate">
              {player.background}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <StatBar label="气血" value={player.hp} max={player.hpMax} colorClass="bg-red-500" />
          <StatBar label="真气" value={player.mp} max={player.mpMax} colorClass="bg-blue-500" />
          <StatBar label="修为" value={player.realmProgress} max={100} colorClass="bg-emerald-500" />
          <StatBar
            label="寿元"
            value={player.lifespan}
            max={player.lifespanMax}
            colorClass={player.lifespan / player.lifespanMax < 0.25 ? 'bg-red-500' : 'bg-amber-500'}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <SectionTitle title="命运资源" />
        <div className="grid grid-cols-2 gap-2">
          <MiniCard icon={<Wallet className="w-3.5 h-3.5 text-emerald-400" />} label="灵石" value={player.spiritStone} />
          <MiniCard icon={<Flame className="w-3.5 h-3.5 text-red-400" />} label="心魔" value={player.heartDemon} />
          <MiniCard icon={<Sparkles className="w-3.5 h-3.5 text-sky-400" />} label="声望" value={player.reputation} />
          <MiniCard icon={<ShieldAlert className="w-3.5 h-3.5 text-orange-400" />} label="恶名" value={player.infamy} />
        </div>

        <SectionTitle title="状态与时间" />
        <div className="space-y-2">
          <MiniCard icon={<Sparkles className="w-3.5 h-3.5 text-emerald-400" />} label="年龄" value={`${world.age.toFixed(2)} 岁`} />
          <MiniCard icon={<TrendingUp className="w-3.5 h-3.5 text-amber-400" />} label="当月" value={`第 ${world.month} 月 · ${world.season}`} />
        </div>

        <SectionTitle title="状态标签" />
        <div className="flex flex-wrap gap-2">
          {player.statusTags.length > 0 ? (
            player.statusTags.map((status) => (
              <span
                key={status}
                className="px-2.5 py-1 rounded-full text-xs bg-red-500/10 text-red-300 border border-red-500/20"
              >
                {statusLabelMap[status]}
              </span>
            ))
          ) : (
            <div className="text-xs text-[hsl(var(--dim))]">当前没有明显负面状态。</div>
          )}
        </div>

        <SectionTitle title="构筑倾向" />
        <div className="space-y-2">
          {buildTags.map(([tag, value]) => (
            <div key={tag} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[hsl(var(--dim))]">{BUILD_TAG_LABELS[tag as BuildTag]}</span>
                <span className="text-foreground/80">{value}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, value * 20)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <SectionTitle title="关键关系" />
        <div className="space-y-2">
          {keyRelations.length > 0 ? (
            keyRelations.map((npc) => (
              <div
                key={npc.id}
                className="rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-foreground">{npc.name}</div>
                  <div className="text-[10px] text-[hsl(var(--dim))]">{npc.relationStatus}</div>
                </div>
                <div className="text-xs text-[hsl(var(--dim))] mt-2 leading-6">{npc.playerImpression}</div>
              </div>
            ))
          ) : (
            <div className="text-xs text-[hsl(var(--dim))]">这一世还没有形成稳定的人情网络。</div>
          )}
        </div>

        <SectionTitle title="修炼根底" />
        <div className="grid grid-cols-2 gap-2 text-xs">
          <MiniCard icon={<Heart className="w-3.5 h-3.5 text-red-400" />} label="根骨" value={player.stats.root} />
          <MiniCard icon={<Zap className="w-3.5 h-3.5 text-blue-400" />} label="灵性" value={player.stats.spirit} />
          <MiniCard icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-400" />} label="悟性" value={player.stats.comprehension} />
          <MiniCard icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />} label="气运" value={player.stats.luck} />
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">{title}</h3>
    </div>
  )
}

function StatBar({
  label,
  value,
  max,
  colorClass,
}: {
  label: string
  value: number
  max: number
  colorClass: string
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[hsl(var(--dim))]">{label}</span>
        <span className="text-foreground/80">{Math.floor(value)}/{max}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function MiniCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 px-3 py-3">
      <div className="flex items-center gap-2 text-[hsl(var(--dim))]">
        {icon}
        <span className="text-[11px]">{label}</span>
      </div>
      <div className="text-sm text-foreground mt-1">{value}</div>
    </div>
  )
}

const statusLabelMap: Record<StatusTag, string> = {
  injured: '受伤',
  unstable: '气息不稳',
  tracked: '被盯上',
  enlightened: '顿悟',
  guarded: '被护持',
  favored: '受偏爱',
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sword, Shield, Zap, Heart, Sparkles, Users, BookOpen, Package } from 'lucide-react'
import type { Player, Skill, Item, Relationship } from '@/types/game'

interface StatusPanelProps {
  player: Player
}

type TabType = 'stats' | 'inventory' | 'skills' | 'relationships'

export function StatusPanel({ player }: StatusPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stats')

  const cultivationPercent = player.cultivationProgress
  const lifespanPercent = (player.lifespan / player.maxLifespan) * 100

  return (
    <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] h-full flex flex-col overflow-hidden">
      {/* 角色头部 */}
      <div className="p-4 border-b border-[hsl(var(--ink-border))] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">
              {player.avatar}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground tracking-wide truncate">{player.name}</div>
            <div className="text-sm text-emerald-400 mt-0.5 tracking-wider">
              {player.realm} · {player.minorRealm}
            </div>
            <div className="text-xs text-[hsl(var(--dim))] mt-0.5 truncate">
              {Math.floor(player.age)} 岁 · {player.background.slice(0, 14)}…
            </div>
          </div>
        </div>

        {/* 核心状态条 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <StatBar
            label="修为"
            value={cultivationPercent}
            max={100}
            display={`${cultivationPercent.toFixed(1)}%`}
            colorClass="progress-jade"
          />
          <StatBar
            label="寿元"
            value={lifespanPercent}
            max={100}
            display={`${Math.floor(player.lifespan)}/${player.maxLifespan}`}
            colorClass={lifespanPercent < 20 ? 'bg-red-500' : 'bg-amber-500'}
            warning={lifespanPercent < 20}
          />
        </div>
      </div>

      {/* 四标签页 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-4 bg-transparent rounded-none border-b border-[hsl(var(--ink-border))] h-10 flex-shrink-0 px-0">
          {[
            { value: 'stats', icon: Sword, label: '属性' },
            { value: 'inventory', icon: Package, label: '背包' },
            { value: 'skills', icon: BookOpen, label: '功法' },
            { value: 'relationships', icon: Users, label: '关系' },
          ].map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="text-xs rounded-none data-[state=active]:bg-transparent data-[state=active]:text-emerald-400 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 text-[hsl(var(--dim))] hover:text-foreground transition-colors h-full"
            >
              <Icon className="w-3 h-3 mr-1" />{label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="stats" className="m-0 h-full">
            <StatsTab player={player} />
          </TabsContent>
          <TabsContent value="inventory" className="m-0">
            <InventoryTab inventory={player.inventory || []} />
          </TabsContent>
          <TabsContent value="skills" className="m-0">
            <SkillsTab skills={player.skills || []} />
          </TabsContent>
          <TabsContent value="relationships" className="m-0">
            <RelationshipsTab relationships={player.relationships || {}} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function StatBar({
  label, value, max, display, colorClass, warning,
}: {
  label: string
  value: number
  max: number
  display: string
  colorClass: string
  warning?: boolean
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[hsl(var(--dim))]">{label}</span>
        <span className={warning ? 'text-red-400' : 'text-foreground/80'}>{display}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

function StatsTab({ player }: { player: Player }) {
  return (
    <div className="p-4 space-y-4">
      {/* 战斗状态 */}
      <div className="space-y-3">
        <SectionTitle icon={Heart} label="战斗状态" />
        <StatBar
          label="气血"
          value={player.health}
          max={player.maxHealth}
          display={`${player.health}/${player.maxHealth}`}
          colorClass="bg-red-500"
        />
        <StatBar
          label="真气"
          value={player.spiritualPower}
          max={player.maxSpiritualPower}
          display={`${player.spiritualPower}/${player.maxSpiritualPower}`}
          colorClass="bg-blue-500"
        />
      </div>

      {/* 基础属性 */}
      <div className="pt-3 border-t border-[hsl(var(--ink-border))] space-y-2">
        <SectionTitle icon={Sword} label="基础属性" />
        <div className="grid grid-cols-2 gap-2">
          <AttrRow label="攻击" value={player.attack} icon={<Sword className="w-3 h-3" />} />
          <AttrRow label="防御" value={player.defense} icon={<Shield className="w-3 h-3" />} />
          <AttrRow label="速度" value={player.speed} icon={<Zap className="w-3 h-3" />} />
          <AttrRow label="气运" value={player.luck} icon={<Sparkles className="w-3 h-3" />} />
          <AttrRow label="根骨" value={player.rootBone} icon={<Heart className="w-3 h-3" />} />
          <AttrRow label="悟性" value={player.comprehension} icon={<BookOpen className="w-3 h-3" />} />
        </div>
      </div>

      {/* 天赋 */}
      {player.talents.length > 0 && (
        <div className="pt-3 border-t border-[hsl(var(--ink-border))]">
          <SectionTitle icon={Sparkles} label="修仙天赋" />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {player.talents.map((talent, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 tracking-wide"
              >
                {talent}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 背景故事 */}
      <div className="pt-3 border-t border-[hsl(var(--ink-border))]">
        <div className="text-xs text-[hsl(var(--dim))] mb-2 tracking-wider">身世背景</div>
        <p className="text-xs text-foreground/60 leading-relaxed">{player.background}</p>
      </div>
    </div>
  )
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--dim))] tracking-wider">
      <Icon className="w-3 h-3" />
      {label}
    </div>
  )
}

function AttrRow({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <div className="flex items-center gap-1.5 text-[hsl(var(--dim))]">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-foreground/80 font-medium tabular-nums text-xs">{value}</span>
    </div>
  )
}

function InventoryTab({ inventory }: { inventory: Item[] }) {
  const itemEmojis: Record<string, string> = {
    '武器': '⚔️', '防具': '🛡️', '丹药': '💊', '符箓': '📜',
    '功法': '📖', '法宝': '🔮', '材料': '🌿', '杂物': '📦', '灵石': '💎',
  }
  const qualityColors: Record<string, string> = {
    '凡品': 'text-[hsl(var(--dim))]',
    '灵品': 'text-blue-400',
    '仙品': 'text-purple-400',
    '神品': 'gold-text',
  }

  if (inventory.length === 0) {
    return <EmptyState emoji="🎒" text="背包空空如也" />
  }

  return (
    <div className="p-2 space-y-1">
      <AnimatePresence>
        {inventory.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/3 transition-colors"
          >
            <span className="text-base flex-shrink-0">{itemEmojis[item.type] || '📦'}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-medium ${qualityColors[item.quality] || 'text-foreground/80'}`}>
                  {item.name}
                </span>
                {item.quantity > 1 && (
                  <span className="text-xs text-[hsl(var(--dim))]">×{item.quantity}</span>
                )}
              </div>
              <div className="text-xs text-[hsl(var(--dim))] truncate mt-0.5">{item.effect}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function SkillsTab({ skills }: { skills: Skill[] }) {
  const skillEmojis: Record<string, string> = {
    '心法': '🧘', '身法': '🏃', '拳法': '👊', '剑法': '⚔️',
    '刀法': '🔪', '枪法': '🔱', '棍法': '🏒', '阵法': '⭕', '丹道': '⚗️', '器道': '🔨',
  }
  const qualityColors: Record<string, string> = {
    '凡阶': 'text-[hsl(var(--dim))]',
    '灵阶': 'text-blue-400',
    '仙阶': 'text-purple-400',
    '神阶': 'gold-text',
  }

  if (skills.length === 0) {
    return <EmptyState emoji="📚" text="尚未习得任何功法" />
  }

  return (
    <div className="p-2 space-y-1">
      {skills.map((skill, i) => (
        <motion.div
          key={skill.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/3 transition-colors"
        >
          <span className="text-base flex-shrink-0">{skillEmojis[skill.category] || '📖'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${qualityColors[skill.quality] || 'text-foreground/80'}`}>
                {skill.name}
              </span>
              <span className="text-xs text-emerald-400 tabular-nums">Lv.{skill.level}</span>
            </div>
            <div className="text-xs text-[hsl(var(--dim))] truncate mt-0.5">{skill.description}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function RelationshipsTab({ relationships }: { relationships: Record<string, Relationship> }) {
  const relationshipList = Object.values(relationships)
  const levelColors: Record<string, string> = {
    '敌对': 'text-red-400', '冷淡': 'text-[hsl(var(--dim))]',
    '中立': 'text-foreground/60', '友好': 'text-blue-400',
    '亲密': 'text-emerald-400', '挚爱': 'text-pink-400',
  }

  if (relationshipList.length === 0) {
    return <EmptyState emoji="🤝" text="尚未结识任何道友" />
  }

  return (
    <div className="p-2 space-y-1">
      {relationshipList.map((rel, i) => (
        <motion.div
          key={rel.npcId}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/3 transition-colors"
        >
          <span className="text-base flex-shrink-0">{rel.npcEmoji || '👤'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground/80">{rel.npcName}</span>
              <span className={`text-xs ${levelColors[rel.level] || 'text-foreground/50'}`}>{rel.level}</span>
            </div>
            <div className="text-xs text-[hsl(var(--dim))] truncate mt-0.5">{rel.npcIdentity}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${rel.favorability >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, Math.abs(rel.favorability))}%` }}
                />
              </div>
              <span className={`text-xs tabular-nums ${rel.favorability >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {rel.favorability > 0 ? '+' : ''}{rel.favorability}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="p-8 text-center text-[hsl(var(--dim))]">
      <div className="text-3xl mb-2 opacity-50">{emoji}</div>
      <div className="text-xs tracking-wider">{text}</div>
    </div>
  )
}

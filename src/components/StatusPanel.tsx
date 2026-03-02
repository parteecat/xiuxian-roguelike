import { useState } from 'react'
import { Card } from '@/components/ui/card'
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
    <Card className="bg-zinc-900 border-zinc-800">
      {/* 角色头部信息 */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="text-5xl">{player.avatar}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-zinc-100">{player.name}</span>
              <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                {player.mbti}
              </span>
            </div>            
            <div className="text-sm text-emerald-400 mt-0.5">
              {player.realm}·{player.minorRealm}
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {player.age}岁 · {player.background.slice(0, 20)}...
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
            color="bg-emerald-500"
          />
          <StatBar 
            label="寿元" 
            value={lifespanPercent} 
            max={100}
            display={`${Math.floor(player.lifespan)}/${player.maxLifespan}`}
            color={lifespanPercent < 20 ? 'bg-red-500' : 'bg-orange-500'}
            warning={lifespanPercent < 20}
          />
        </div>
      </div>

      {/* 四标签页 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
        <TabsList className="w-full grid grid-cols-4 bg-zinc-900 rounded-none border-b border-zinc-800">
          <TabsTrigger value="stats" className="text-xs data-[state=active]:bg-zinc-800">
            <Sword className="w-3 h-3 mr-1" />属性
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs data-[state=active]:bg-zinc-800">
            <Package className="w-3 h-3 mr-1" />背包
          </TabsTrigger>
          <TabsTrigger value="skills" className="text-xs data-[state=active]:bg-zinc-800">
            <BookOpen className="w-3 h-3 mr-1" />功法
          </TabsTrigger>
          <TabsTrigger value="relationships" className="text-xs data-[state=active]:bg-zinc-800">
            <Users className="w-3 h-3 mr-1" />关系
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="m-0">
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
      </Tabs>
    </Card>
  )
}

function StatBar({ label, value, max, display, color, warning }: { 
  label: string
  value: number
  max: number
  display: string
  color: string
  warning?: boolean
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className={warning ? 'text-red-400' : 'text-zinc-300'}>{display}</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function StatsTab({ player }: { player: Player }) {
  return (
    <div className="p-4 space-y-4">
      {/* 战斗属性 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
          <Heart className="w-3 h-3" />
          <span>战斗状态</span>
        </div>

        <StatBar 
          label="气血" 
          value={player.health} 
          max={player.maxHealth}
          display={`${player.health}/${player.maxHealth}`}
          color="bg-red-500"
        />
        <StatBar 
          label="真气" 
          value={player.spiritualPower} 
          max={player.maxSpiritualPower}
          display={`${player.spiritualPower}/${player.maxSpiritualPower}`}
          color="bg-blue-500"
        />
      </div>

      {/* 基础属性 */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800">
        <Attribute label="攻击" value={player.attack} icon=<Sword className="w-3 h-3" /> />
        <Attribute label="防御" value={player.defense} icon=<Shield className="w-3 h-3" /> />
        <Attribute label="速度" value={player.speed} icon=<Zap className="w-3 h-3" /> />
        <Attribute label="气运" value={player.luck} icon=<Sparkles className="w-3 h-3" /> />
        <Attribute label="根骨" value={player.rootBone} icon=<Heart className="w-3 h-3" /> />
        <Attribute label="悟性" value={player.comprehension} icon=<BookOpen className="w-3 h-3" /> />
      </div>

      {/* 天赋 */}
      {player.talents.length > 0 && (
        <div className="pt-3 border-t border-zinc-800">
          <div className="text-xs text-zinc-500 mb-2">修仙天赋</div>
          <div className="flex flex-wrap gap-1">
            {player.talents.map((talent, i) => (
              <span 
                key={i} 
                className="text-xs px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded border border-emerald-800/50"
              >
                {talent}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 背景故事 */}
      <div className="pt-3 border-t border-zinc-800">
        <div className="text-xs text-zinc-500 mb-2">身世背景</div>
        <p className="text-xs text-zinc-400 leading-relaxed">{player.background}</p>
      </div>
    </div>
  )
}

function Attribute({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-1.5 text-zinc-500">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-zinc-300 font-medium">{value}</span>
    </div>
  )
}

function InventoryTab({ inventory }: { inventory: Item[] }) {
  const itemEmojis: Record<string, string> = {
    '武器': '⚔️',
    '防具': '🛡️',
    '丹药': '💊',
    '符箓': '📜',
    '功法': '📖',
    '法宝': '🔮',
    '材料': '🌿',
    '杂物': '📦',
    '灵石': '💎',
  }

  const qualityColors: Record<string, string> = {
    '凡品': 'text-zinc-400',
    '灵品': 'text-blue-400',
    '仙品': 'text-purple-400',
    '神品': 'text-yellow-400',
  }

  if (inventory.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-600">
        <div className="text-2xl mb-2">🎒</div>
        <div className="text-xs">背包空空如也</div>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
      {inventory.map((item) => (
        <div 
          key={item.id} 
          className="flex items-start gap-2 p-2 bg-zinc-800/50 rounded hover:bg-zinc-800 transition-colors"
        >
          <span className="text-lg">{itemEmojis[item.type] || '📦'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${qualityColors[item.quality] || 'text-zinc-300'}`}>
                {item.name}
              </span>
              {item.quantity > 1 && (
                <span className="text-xs text-zinc-500">x{item.quantity}</span>
              )}
            </div>            
            <div className="text-xs text-zinc-500 truncate">{item.effect}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SkillsTab({ skills }: { skills: Skill[] }) {
  const skillEmojis: Record<string, string> = {
    '心法': '🧘',
    '身法': '🏃',
    '拳法': '👊',
    '剑法': '⚔️',
    '刀法': '🔪',
    '枪法': '🔱',
    '棍法': '🏒',
    '阵法': '⭕',
    '丹道': '⚗️',
    '器道': '🔨',
  }

  const qualityColors: Record<string, string> = {
    '凡阶': 'text-zinc-400',
    '灵阶': 'text-blue-400',
    '仙阶': 'text-purple-400',
    '神阶': 'text-yellow-400',
  }

  if (skills.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-600">
        <div className="text-2xl mb-2">📚</div>
        <div className="text-xs">尚未习得任何功法</div>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
      {skills.map((skill) => (
        <div 
          key={skill.id} 
          className="flex items-start gap-2 p-2 bg-zinc-800/50 rounded hover:bg-zinc-800 transition-colors"
        >
          <span className="text-lg">{skillEmojis[skill.category] || '📖'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${qualityColors[skill.quality] || 'text-zinc-300'}`}>
                {skill.name}
              </span>
              <span className="text-xs text-emerald-400">Lv.{skill.level}</span>
            </div>            
            <div className="text-xs text-zinc-500">{skill.description}</div>
            <div className="text-xs text-zinc-600 mt-0.5">
              {skill.category} · {skill.type} · 需{skill.realmRequirement}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RelationshipsTab({ relationships }: { relationships: Record<string, Relationship> }) {
  const relationshipList = Object.values(relationships)

  const levelColors: Record<string, string> = {
    '敌对': 'text-red-400',
    '冷淡': 'text-zinc-500',
    '中立': 'text-zinc-400',
    '友好': 'text-blue-400',
    '亲密': 'text-emerald-400',
    '挚爱': 'text-pink-400',
  }

  if (relationshipList.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-600">
        <div className="text-2xl mb-2">🤝</div>
        <div className="text-xs">尚未结识任何道友</div>
      </div>
    )
  }

  return (
    <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
      {relationshipList.map((rel) => (
        <div 
          key={rel.npcId} 
          className="flex items-start gap-2 p-2 bg-zinc-800/50 rounded hover:bg-zinc-800 transition-colors"
        >
          <span className="text-lg">{rel.npcEmoji || '👤'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">{rel.npcName}</span>
              <span className={`text-xs ${levelColors[rel.level] || 'text-zinc-400'}`}>
                {rel.level}
              </span>
            </div>            
            <div className="text-xs text-zinc-500">{rel.npcIdentity}</div>
            <div className="flex items-center gap-1 mt-1">
              <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${rel.favorability >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ 
                    width: `${Math.min(100, Math.abs(rel.favorability))}%`,
                    opacity: rel.favorability === 0 ? 0 : 1
                  }}
                />
              </div>
              <span className={`text-xs ${rel.favorability >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {rel.favorability > 0 ? '+' : ''}{rel.favorability}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export type CultivationRealm =
  | '炼气期'
  | '筑基期'
  | '金丹期'
  | '元婴期'
  | '化神期'
  | '炼虚期'
  | '合体期'
  | '大乘期'
  | '渡劫期'

export type MinorRealm = '初期' | '中期' | '后期' | '巅峰'

export type ItemType =
  | '武器'
  | '防具'
  | '丹药'
  | '符箓'
  | '功法'
  | '法宝'
  | '材料'
  | '杂物'
  | '灵石'

export type ItemQuality = '凡品' | '灵品' | '仙品' | '神品'

export type SkillType = '攻击' | '防御' | '辅助' | '特殊'

export type SkillCategory =
  | '心法'
  | '身法'
  | '拳法'
  | '剑法'
  | '刀法'
  | '枪法'
  | '棍法'
  | '阵法'
  | '丹道'
  | '器道'

export type SkillQuality = '凡阶' | '灵阶' | '仙阶' | '神阶'

export type RelationshipLevel = '敌对' | '冷淡' | '中立' | '友好' | '亲密' | '挚爱'

export type MemoryType = '角色状态变化' | 'NPC 交互' | '关键事件' | '普通对话' | '背景信息'

export interface Time {
  year: number
  month: number
  day: number
  shichen: number
}

export interface Embedding {
  id: string
  vector: number[]
  timestamp: number
}

export interface Memory {
  id: string
  saveId: string
  type: MemoryType
  content: string
  embedding?: Embedding
  timestamp: number
  importance: number
}

export interface Item {
  id: string
  name: string
  type: ItemType
  quality: ItemQuality
  effect: string
  quantity: number
}

export interface Skill {
  id: string
  name: string
  type: SkillType
  category: SkillCategory
  quality: SkillQuality
  description: string
  realmRequirement: CultivationRealm
  level: number
  maxLevel: number
}

export interface Relationship {
  npcId: string
  npcName: string
  npcEmoji: string
  npcIdentity: string
  level: RelationshipLevel
  favorability: number
  description?: string
  firstMetAt?: number
  lastInteractionAt?: number
  interactionCount?: number
  tags?: string[]
  notes?: string
  history: string[]
}

export interface Player {
  id: string
  name: string
  gender: string
  background: string
  mbti: string
  realm: CultivationRealm
  minorRealm: MinorRealm
  cultivationProgress: number
  spiritualEnergy: number
  lifespan: number
  maxLifespan: number
  age: number
  spiritualPower: number
  maxSpiritualPower: number
  health: number
  maxHealth: number
  attack: number
  defense: number
  speed: number
  luck: number
  rootBone: number
  comprehension: number
  karma: number
  talents: string[]
  inventory: Item[]
  skills: Skill[]
  relationships: Record<string, Relationship>
  growthHistory: string[]
  avatar: string
}

export interface NPC {
  id: string
  name: string
  emoji: string
  avatar: string
  realm: CultivationRealm
  minorRealm: MinorRealm
  identity: string
  relationship: number
  description: string
  history: string[]
  talents: string[]
  personality: string
  relationships: Record<string, Relationship>
  health: number
  maxHealth: number
  spiritualPower: number
  maxSpiritualPower: number
  attack: number
  defense: number
  speed: number
  rootBone: number
  comprehension: number
  relationshipChange?: number
}

export interface World {
  id: string
  name: string
  description: string
  currentLocation: string
  locations: string[]
  time: Time
  factions: string[]
}

export interface Event {
  id: string
  type: string
  description: string
  timestamp: Time
  choices?: string[]
  consequences?: string[]
}

export interface GameLog {
  id: string
  timestamp: number
  content: string
  type: 'action' | 'event' | 'dialog' | 'system'
}

export interface GameState {
  player: Player | null
  npcs: NPC[]
  world: World | null
  logs: GameLog[]
  events: Event[]
  memories: Memory[]
  memorySummary: string
  turn: number
  isPlaying: boolean
  isLoading: boolean
  error: string | null
}

export interface LLMConfig {
  baseURL: string
  apiKey: string
  model: string
}

export interface GameSettings {
  llmConfig: LLMConfig
  autoSave: boolean
  theme: 'light' | 'dark'
}

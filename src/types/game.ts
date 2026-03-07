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

// NPC 好感度级别
export type FavorLevel = '仇敌' | '敌视' | '陌生' | '朋友' | '好友' | '生死之交' | '道侣'

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

// NPC 属性（探查后可见）
export interface NPCAttributes {
  attack: number
  defense: number
  speed: number
  luck: number
  rootBone: number
  comprehension: number
  health: number
  maxHealth: number
  spiritualPower: number
  maxSpiritualPower: number
}

// NPC 交互选项类型
export type NPCInteractionType =
  | '打听消息'
  | '赠送礼物'
  | '切磋'
  | '探查'
  | '结为好友'
  | '结为道侣'
  | '离开'

export interface NPCInteraction {
  type: NPCInteractionType
  label: string
  description: string
  enabled: boolean
  reason?: string // 不可用时显示的原因
}

export interface NPC {
  id: string
  name: string
  emoji: string
  avatar: string
  realm: CultivationRealm
  minorRealm: MinorRealm
  identity: string
  // 好感度系统
  favor: number // -100 ~ 100
  favorLevel: FavorLevel
  description: string
  history: string[]
  talents: string[]
  personality: string
  relationships: Record<string, Relationship>
  // 探查后可见的属性
  attributes?: NPCAttributes
  revealedAttributes: boolean
  // 物品和技能
  items?: string[]
  skills?: string[]
  // 记忆标签（LLM 使用）
  memoryTags: string[]
  // 与玩家的关系描述
  relationshipDesc?: string
  // 上次交互时间
  lastInteractionAt?: number
  // 交互次数
  interactionCount: number
}

export interface World {
  id: string
  name: string
  description: string
  currentLocation: string
  locations: string[]
  time: Time
  factions: string[]
  // 当前区域中的 NPC ID 列表
  nearbyNPCs: string[]
  // 区域描述
  locationDescription?: string
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
  // 当前选中的 NPC（用于互动模式）
  selectedNPCId: string | null
  // 是否处于 NPC 互动模式
  isNPCInteracting: boolean
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

// NPC 交互结果
export interface NPCInteractResult {
  dialogue: string // NPC 的回复文字
  possibleInteractions: NPCInteraction[] // 可用的互动选项
  npcStateDelta: {
    favor?: number
    memoryTags?: string[]
    revealedAttributes?: boolean
    relationshipDesc?: string
  }
  playerStateDelta?: {
    health?: number
    spiritualPower?: number
    itemsGained?: Item[]
    itemsLost?: string[]
  }
  newNPCs?: NPC[] // 可能生成的新 NPC
  locationChange?: string // 可能触发的位置变化
  timePassed?: Time
  storyUpdate?: string // 剧情更新文本
}

// 获取好感度级别
export function getFavorLevel(favor: number): FavorLevel {
  if (favor <= -100) return '仇敌'
  if (favor <= -50) return '敌视'
  if (favor < 30) return '陌生'
  if (favor < 60) return '朋友'
  if (favor < 80) return '好友'
  if (favor < 100) return '生死之交'
  return '道侣'
}

// 获取好感度颜色
export function getFavorColor(favor: number): string {
  if (favor <= -100) return 'text-red-600'
  if (favor <= -50) return 'text-orange-500'
  if (favor < 30) return 'text-gray-400'
  if (favor < 60) return 'text-emerald-400'
  if (favor < 80) return 'text-green-400'
  if (favor < 100) return 'text-purple-400'
  return 'text-pink-400'
}

// 获取好感度图标
export function getFavorIcon(favor: number): string {
  if (favor <= -100) return '💀'
  if (favor <= -50) return '⚔️'
  if (favor < 30) return '😐'
  if (favor < 60) return '🙂'
  if (favor < 80) return '😊'
  if (favor < 100) return '💜'
  return '💗'
}

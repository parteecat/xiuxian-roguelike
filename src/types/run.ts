export type GamePhase =
  | 'boot'
  | 'generate_turn'
  | 'choose_action'
  | 'resolve_action'
  | 'settlement'
  | 'game_over'

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export type Weather = 'sunny' | 'rain' | 'storm' | 'fog' | 'snow'

export type RiskLevel = 'low' | 'mid' | 'high'

export type RealmKey =
  | 'qi_1'
  | 'qi_2'
  | 'qi_3'
  | 'qi_4'
  | 'qi_5'
  | 'foundation_1'
  | 'foundation_2'
  | 'golden_core_1'

export type BuildTag =
  | 'sword'
  | 'body'
  | 'spell'
  | 'alchemy'
  | 'social'
  | 'evil'
  | 'survival'

export type StatusTag =
  | 'injured'
  | 'unstable'
  | 'tracked'
  | 'enlightened'
  | 'guarded'
  | 'favored'

export type LifeStageKey = 'qi_early' | 'qi_late' | 'ending'

export type PressureType = 'secret_realm'

export type PressureStatus = 'active' | 'resolved' | 'failed'

export type CausalityCategory =
  | 'favor'
  | 'debt'
  | 'betrayal'
  | 'promise'
  | 'loot'
  | 'enmity'
  | 'secret'

export type CausalityStatus = 'planted' | 'tracking' | 'returned' | 'resolved' | 'failed'

export type CountdownType = 'life_stage' | 'main_pressure' | 'causality' | 'npc'

export interface CountdownState {
  id: string
  title: string
  remainMonths: number
  type: CountdownType
  locationId?: string
  eventId?: string
  tags: string[]
}

export interface WorldState {
  day: number
  month: number
  year: number
  season: Season
  weather: Weather
  age: number
  dangerLevel: number
  worldTags: string[]
  rumors: string[]
  activeCountdowns: CountdownState[]
}

export interface PlayerStats {
  root: number
  comprehension: number
  luck: number
  physique: number
  spirit: number
  charm: number
}

export interface TalentState {
  id: string
  name: string
  desc: string
  buildAffinity?: Partial<Record<BuildTag, number>>
}

export interface SkillState {
  id: string
  name: string
  desc: string
  level: number
  tags: string[]
}

export interface ItemState {
  id: string
  name: string
  type: 'consumable' | 'material' | 'manual' | 'quest' | 'treasure' | 'weapon'
  quantity: number
  value: number
  tags: string[]
  description: string
}

export interface CurrencyState {
  id: string
  name: string
  amount: number
}

export interface PlayerState {
  id: string
  name: string
  avatar: string
  background: string
  realm: RealmKey
  realmLayer: number
  realmProgress: number
  hp: number
  hpMax: number
  mp: number
  mpMax: number
  lifespan: number
  lifespanMax: number
  spiritStone: number
  heartDemon: number
  reputation: number
  infamy: number
  stats: PlayerStats
  statusTags: StatusTag[]
  talents: TalentState[]
  skills: SkillState[]
  items: ItemState[]
  currencies: CurrencyState[]
  buildTags: Record<BuildTag, number>
  discoveredLocationIds: string[]
  factionRelations: Record<string, number>
  flags: string[]
}

export interface TravelEdge {
  from: string
  to: string
  slotCost: 1
  riskLevel: number
  requirementFlags?: string[]
}

export interface LocationState {
  id: string
  name: string
  type: 'safe' | 'resource' | 'danger' | 'special'
  riskLevel: number
  recommendedRealm: RealmKey
  envTags: string[]
  discovered: boolean
  unlocked: boolean
  availableActionPool: string[]
  encounterPool: string[]
  dropPool: string[]
  npcIds: string[]
  description: string
}

export interface MapState {
  currentLocationId: string
  locations: Record<string, LocationState>
  travelGraph: TravelEdge[]
}

export interface NpcState {
  id: string
  name: string
  title: string
  camp: string
  realm: RealmKey
  favor: number
  trust: number
  fear: number
  danger: number
  relationStatus: 'neutral' | 'friendly' | 'ally' | 'suspicious' | 'enemy' | 'lover' | 'mentor'
  firstImpression: string
  moralView: string
  playerImpression: string
  sharedHistory: string[]
  karmaLinks: string[]
  functions: Array<'trade' | 'quest' | 'intel' | 'mentor' | 'romance' | 'enemy'>
  hiddenGoals: string[]
  tags: string[]
  flags: string[]
  locationId: string
}

export interface Condition {
  type:
    | 'month_gte'
    | 'location_is'
    | 'realm_gte'
    | 'has_item'
    | 'favor_gte'
    | 'flag_on'
    | 'event_stage'
    | 'status_has'
    | 'causality_status'
  key: string
  value: string | number
}

export interface Reward {
  type:
    | 'item'
    | 'currency'
    | 'progress'
    | 'favor'
    | 'tag'
    | 'flag'
    | 'unlock_location'
    | 'reputation'
    | 'secret_realm_ticket'
  key: string
  value: string | number
}

export interface Penalty {
  type: 'hp' | 'mp' | 'lifespan' | 'heartDemon' | 'infamy' | 'status' | 'flag'
  key: string
  value: string | number
}

export interface EventState {
  id: string
  title: string
  category: 'main' | 'side' | 'npc' | 'world' | 'causality' | 'breakthrough'
  stage: number
  status: 'active' | 'resolved' | 'failed' | 'hidden' | 'cooldown'
  priority: number
  deadlineMonth?: number
  phaseHint?: string
  triggerConditions: Condition[]
  failConditions?: Condition[]
  rewards?: Reward[]
  penalties?: Penalty[]
  relatedNpcIds?: string[]
  relatedLocationIds?: string[]
  relatedCausalityIds?: string[]
  summary: string
  nextStageHint?: string
  flags: string[]
}

export type ActionKind =
  | 'rest'
  | 'cultivate'
  | 'explore'
  | 'travel'
  | 'trade'
  | 'social'
  | 'breakthrough'
  | 'investigate'
  | 'event'
  | 'custom'

export interface ActionCost {
  hp: number
  mp: number
  spiritStone: number
  lifespan: number
  heartDemon: number
}

export type ResolverKey =
  | 'resolveRest'
  | 'resolveCultivation'
  | 'resolveExplore'
  | 'resolveTravel'
  | 'resolveTrade'
  | 'resolveSocial'
  | 'resolveBreakthrough'
  | 'resolveInvestigate'
  | 'resolveEvent'
  | 'resolveCustomAction'

export interface ActionOption {
  id: string
  kind: ActionKind
  title: string
  desc: string
  risk: RiskLevel
  slotCost: 1 | 2
  timeCostMonths: number
  costs: Partial<ActionCost>
  primaryRewards: string[]
  primaryCosts: string[]
  requirements: Condition[]
  tags: string[]
  relatedNpcId?: string
  relatedEventId?: string
  relatedCausalityId?: string
  targetId?: string
  targetType?: 'location' | 'npc' | 'event' | 'causality' | 'breakthrough'
  resolver: ResolverKey
  disabled?: boolean
  disabledReason?: string
}

export interface SceneState {
  sceneType: 'normal' | 'event' | 'settlement' | 'ending'
  title: string
  summary: string
  riskHints: string[]
  resultBlocks: string[]
  remark?: string
  locationId?: string
}

export interface TurnLog {
  turn: number
  month: number
  phase: GamePhase
  actionId?: string
  actionTitle?: string
  summary: string
  gains: string[]
  losses: string[]
  triggeredEventIds: string[]
  snapshotAt?: number
}

export interface LifeStageState {
  currentStage: LifeStageKey
  title: string
  goalSummary: string
  riskSummary: string[]
  milestoneFlags: string[]
  progress: number
}

export interface MainPressureState {
  id: string
  type: PressureType
  title: string
  startMonth: number
  targetMonth: number
  remainMonths: number
  stage: number
  summary: string
  tags: string[]
  status: PressureStatus
}

export interface CausalityRecord {
  id: string
  title: string
  sourceTurn: number
  sourceStage: LifeStageKey
  category: CausalityCategory
  ownerNpcId?: string
  ownerFactionId?: string
  relatedItemId?: string
  relatedLocationId?: string
  summary: string
  intensity: number
  hidden: boolean
  status: CausalityStatus
  expectedReturnPhase?: LifeStageKey
  expectedReturnTags?: string[]
  consequences?: string[]
}

export interface CausalityState {
  planted: CausalityRecord[]
  tracking: CausalityRecord[]
  returned: CausalityRecord[]
  resolved: CausalityRecord[]
}

export interface MonthSettlement {
  summary: string
  gains: string[]
  losses: string[]
  worldChanges: string[]
  triggeredCausalityIds: string[]
}

export interface MonthPlanState {
  currentMonthIndex: number
  slotsTotal: number
  slotsRemaining: number
  chosenActionIds: string[]
  monthlyFocus: string
  lastSettlement: MonthSettlement | null
}

export interface EndingSummary {
  endingTitle: string
  endingTags: string[]
  milestones: string[]
  topChoices: string[]
  topCausalityReturns: string[]
  relationHighlights: string[]
  biography: string
  metaUnlocks: string[]
}

export interface MetaState {
  unlockedBackgrounds: string[]
  unlockedTalents: string[]
  unlockedWorldTags: string[]
  unlockedRelics: string[]
  achievementFlags: string[]
}

export interface UIState {
  loading: boolean
  error?: string
  autoSaveAt?: number
  expandedPanels: string[]
}

export interface PendingAction {
  actionId: string
  rawInput?: string
  createdAt: number
}

export interface RunState {
  version: string
  seed: string
  phase: GamePhase
  turn: number
  world: WorldState
  player: PlayerState
  map: MapState
  npcs: Record<string, NpcState>
  events: Record<string, EventState>
  battle: null
  lifeStage: LifeStageState
  mainPressure: MainPressureState | null
  causality: CausalityState
  monthPlan: MonthPlanState
  meta: MetaState
  history: TurnLog[]
  currentScene: SceneState | null
  currentOptions: ActionOption[]
  pendingAction: PendingAction | null
  endingSummary: EndingSummary | null
  ui: UIState
}

export interface ActionResolution {
  title: string
  summary: string
  gains: string[]
  losses: string[]
  resultBlocks?: string[]
  triggeredEventIds?: string[]
}

export interface TurnEnhancement {
  sceneTitle: string
  sceneSummary: string
  riskHints: string[]
  remark?: string
  optionTexts: Array<{
    id: string
    title: string
    desc: string
  }>
}

export interface EndingEnhancement {
  biography: string
  topChoices: string[]
  topCausalityReturns: string[]
  relationHighlights: string[]
}

export interface ResolutionEnhancement {
  title: string
  summary: string
  resultBlocks: string[]
  remark?: string
}

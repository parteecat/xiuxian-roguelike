# 前端本地状态机设计 + JSON 数据结构 + 回合结算伪代码

## 1. 目标

这份文档用于指导你把 AI 修仙 Roguelike 做成“前端本地规则层 + 大模型叙事层”的结构。

核心目标：

- 关键规则在前端本地可控
- 大模型负责生成文本与策略选项
- 游戏不会因为模型发散而崩掉
- 本地可存档、可回放、可调试
- 后续可逐步扩展，不依赖服务端

一句话架构：

> 前端负责状态、概率、结算、存档；大模型负责局势描述、选项包装、事件文本和 NPC 反应。

---

## 2. 推荐整体架构

```text
UI 层
  ↓
Game Engine（本地状态机）
  ├─ State Store
  ├─ Rule Engine
  ├─ Event Engine
  ├─ Battle Resolver
  ├─ Progression Engine
  ├─ Save/Load
  └─ LLM Adapter
         ↓
      大模型
```

### 模块职责

#### UI 层
负责：
- 展示状态
- 展示回合结果
- 展示行动按钮
- 接收玩家输入

#### State Store
负责：
- 存储完整游戏状态
- 提供读取 / 更新接口
- 支持快照

#### Rule Engine
负责：
- 计算数值变化
- 处理资源消耗
- 计算概率修正
- 校验行动是否合法

#### Event Engine
负责：
- 管理事件链
- 推进倒计时
- 触发新事件
- 移除失效事件

#### Battle Resolver
负责：
- 战斗阶段推进
- 敌我状态变化
- 战斗结果输出

#### Progression Engine
负责：
- 修为增长
- 突破逻辑
- 流派标签成长
- Meta 解锁

#### Save/Load
负责：
- localStorage / IndexedDB 存档
- 自动存档
- 快照回退（可选）

#### LLM Adapter
负责：
- 把当前状态裁剪后发给大模型
- 接收模型输出
- 解析结构化结果
- 对异常输出做兜底

---

## 3. 状态机设计思路

不要把整个游戏当成一个大页面状态。
建议拆成“全局状态 + 回合状态 + 临时状态”。

---

## 3.1 顶层状态结构

```ts
export type GameState = {
  version: string
  seed: string
  phase: GamePhase
  turn: number
  world: WorldState
  player: PlayerState
  map: MapState
  npcs: Record<string, NpcState>
  events: Record<string, EventState>
  battle: BattleState | null
  meta: MetaState
  history: TurnLog[]
  currentScene: SceneState | null
  currentOptions: ActionOption[]
  pendingAction: PendingAction | null
  ui: UIState
}
```

---

## 3.2 GamePhase

```ts
export type GamePhase =
  | 'boot'
  | 'init'
  | 'idle'
  | 'generate_turn'
  | 'choose_action'
  | 'resolve_action'
  | 'resolve_battle'
  | 'resolve_breakthrough'
  | 'settlement'
  | 'game_over'
```

### 含义

- `boot`: 游戏加载
- `init`: 初始化开局
- `idle`: 静置态，等待下一步
- `generate_turn`: 准备新回合内容
- `choose_action`: 玩家选择行动
- `resolve_action`: 前端本地结算该行动
- `resolve_battle`: 若进入战斗，战斗专用阶段
- `resolve_breakthrough`: 若进入突破，突破专用阶段
- `settlement`: 回合收尾
- `game_over`: 死亡 / 通关 / 结局

---

## 4. JSON 数据结构设计

下面给你一套适合 MVP 的最小可用结构。

---

## 4.1 WorldState

```ts
export type WorldState = {
  day: number
  month: number
  year: number
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  weather: 'sunny' | 'rain' | 'storm' | 'fog' | 'snow'
  age: number
  dangerLevel: number
  worldTags: string[]
  rumors: string[]
  activeCountdowns: CountdownState[]
}

export type CountdownState = {
  id: string
  title: string
  remainDays: number
  type: 'market' | 'sect' | 'secret_realm' | 'revenge' | 'npc' | 'custom'
  locationId?: string
  eventId?: string
  tags: string[]
}
```

---

## 4.2 PlayerState

```ts
export type PlayerState = {
  id: string
  name: string
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

export type PlayerStats = {
  root: number
  comprehension: number
  luck: number
  physique: number
  spirit: number
  charm: number
}
```

---

## 4.3 RealmKey / BuildTag / StatusTag

```ts
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
  | 'seriously_injured'
  | 'poisoned'
  | 'tracked'
  | 'wanted'
  | 'enlightened'
  | 'unstable'
  | 'blessed'
  | 'cursed'
```

---

## 4.4 Talent / Skill / Item

```ts
export type TalentState = {
  id: string
  name: string
  desc: string
  tags: string[]
  modifiers: Modifier[]
}

export type SkillState = {
  id: string
  name: string
  level: number
  category: 'combat' | 'movement' | 'alchemy' | 'social' | 'cultivation'
  tags: string[]
  modifiers: Modifier[]
}

export type ItemState = {
  id: string
  name: string
  type: 'material' | 'consumable' | 'weapon' | 'manual' | 'quest' | 'artifact'
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  count: number
  tags: string[]
  modifiers?: Modifier[]
}

export type CurrencyState = {
  key: 'spiritStone' | 'sectContribution' | 'favorToken'
  value: number
}
```

---

## 4.5 Modifier 通用修正器

这块很关键。你很多系统都可以复用 modifier。

```ts
export type Modifier = {
  id: string
  type:
    | 'success_rate'
    | 'injury_rate'
    | 'drop_rate'
    | 'xp_gain'
    | 'hp_cost'
    | 'mp_cost'
    | 'time_cost'
    | 'favor_gain'
    | 'heart_demon_gain'
    | 'breakthrough_rate'
  target: string
  operator: 'add' | 'mul'
  value: number
  source?: string
}
```

例如：
- 剑修功法给 `success_rate` on `combat_sword`
- 丹药给 `breakthrough_rate` on `breakthrough`
- 受伤状态给 `injury_rate` on `danger_explore`

---

## 4.6 MapState / LocationState

```ts
export type MapState = {
  currentLocationId: string
  locations: Record<string, LocationState>
  travelGraph: TravelEdge[]
}

export type LocationState = {
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
}

export type TravelEdge = {
  from: string
  to: string
  timeCost: number
  riskLevel: number
  requirementFlags?: string[]
}
```

---

## 4.7 NpcState

```ts
export type NpcState = {
  id: string
  name: string
  title: string
  camp: string
  favor: number
  trust: number
  danger: number
  relationStatus: 'neutral' | 'friendly' | 'ally' | 'suspicious' | 'enemy' | 'lover'
  functions: Array<'trade' | 'quest' | 'intel' | 'mentor' | 'romance' | 'enemy'>
  tags: string[]
  impression: string
  secrets: string[]
  flags: string[]
}
```

---

## 4.8 EventState

```ts
export type EventState = {
  id: string
  title: string
  category: 'main' | 'side' | 'countdown' | 'npc' | 'world' | 'battle' | 'breakthrough'
  stage: number
  status: 'active' | 'resolved' | 'failed' | 'hidden' | 'cooldown'
  priority: number
  deadlineDay?: number
  triggerConditions: Condition[]
  failConditions?: Condition[]
  rewards?: Reward[]
  penalties?: Penalty[]
  relatedNpcIds?: string[]
  relatedLocationIds?: string[]
  summary: string
  nextStageHint?: string
  flags: string[]
}
```

---

## 4.9 Condition / Reward / Penalty

```ts
export type Condition = {
  type:
    | 'day_gte'
    | 'location_is'
    | 'realm_gte'
    | 'has_item'
    | 'favor_gte'
    | 'flag_on'
    | 'event_stage'
    | 'status_has'
  key: string
  value: string | number
}

export type Reward = {
  type: 'item' | 'currency' | 'xp' | 'favor' | 'tag' | 'flag' | 'unlock_location'
  key: string
  value: string | number
}

export type Penalty = {
  type: 'hp' | 'mp' | 'lifespan' | 'heartDemon' | 'infamy' | 'status' | 'flag'
  key: string
  value: string | number
}
```

---

## 4.10 ActionOption

这个结构最好由前端本地生成基础骨架，再让 LLM 补文字。

```ts
export type ActionOption = {
  id: string
  kind: ActionKind
  title: string
  desc: string
  risk: 'low' | 'mid' | 'high'
  timeCost: number
  costs: Partial<ActionCost>
  rewardsPreview: string[]
  requirements: Condition[]
  tags: string[]
  targetId?: string
  targetType?: 'location' | 'npc' | 'event' | 'battle' | 'breakthrough'
  resolver: ResolverKey
  disabled?: boolean
  disabledReason?: string
}

export type ActionKind =
  | 'rest'
  | 'cultivate'
  | 'explore'
  | 'travel'
  | 'trade'
  | 'social'
  | 'battle'
  | 'breakthrough'
  | 'investigate'
  | 'custom'

export type ActionCost = {
  hp: number
  mp: number
  spiritStone: number
  lifespan: number
}

export type ResolverKey =
  | 'resolveRest'
  | 'resolveCultivation'
  | 'resolveExplore'
  | 'resolveTravel'
  | 'resolveTrade'
  | 'resolveSocial'
  | 'resolveBattleEntry'
  | 'resolveBreakthrough'
  | 'resolveInvestigate'
  | 'resolveCustomAction'
```

---

## 4.11 BattleState

```ts
export type BattleState = {
  id: string
  enemyId: string
  phase: 'opening' | 'mid' | 'ending'
  round: number
  enemy: EnemyState
  playerBattleBuffs: string[]
  enemyBattleBuffs: string[]
  battleLog: string[]
  pendingChoices: ActionOption[]
}

export type EnemyState = {
  id: string
  name: string
  realm: RealmKey
  hp: number
  hpMax: number
  mp: number
  mpMax: number
  tags: string[]
  intent?: string
  lootPool: string[]
}
```

---

## 4.12 SceneState / TurnLog / MetaState / UIState

```ts
export type SceneState = {
  sceneType: 'normal' | 'battle' | 'breakthrough' | 'event' | 'settlement'
  title: string
  summary: string
  riskHints: string[]
  resultBlocks: string[]
}

export type TurnLog = {
  turn: number
  phase: GamePhase
  actionId?: string
  actionTitle?: string
  summary: string
  gains: string[]
  losses: string[]
  triggeredEventIds: string[]
  snapshotAt?: number
}

export type MetaState = {
  unlockedBackgrounds: string[]
  unlockedTalents: string[]
  unlockedWorldTags: string[]
  unlockedRelics: string[]
  achievementFlags: string[]
}

export type UIState = {
  loading: boolean
  error?: string
  autoSaveAt?: number
  expandedPanels: string[]
}

export type PendingAction = {
  actionId: string
  rawInput?: string
  createdAt: number
}
```

---

## 5. 前端本地状态机怎么跑

建议你用一个统一的 `dispatch(action)` 驱动状态机，而不是页面里到处直接改状态。

---

## 5.1 Engine Action

```ts
export type EngineAction =
  | { type: 'GAME_INIT'; payload?: { seed?: string } }
  | { type: 'TURN_GENERATE' }
  | { type: 'ACTION_SELECT'; payload: { actionId: string } }
  | { type: 'ACTION_CUSTOM'; payload: { text: string } }
  | { type: 'ACTION_RESOLVE' }
  | { type: 'BATTLE_CHOOSE'; payload: { actionId: string } }
  | { type: 'BATTLE_RESOLVE' }
  | { type: 'BREAKTHROUGH_START' }
  | { type: 'BREAKTHROUGH_RESOLVE' }
  | { type: 'TURN_SETTLE' }
  | { type: 'GAME_OVER' }
  | { type: 'SAVE_GAME' }
  | { type: 'LOAD_GAME'; payload: { snapshot: GameState } }
```

---

## 5.2 基本 reducer / engine 流程

```ts
function gameEngine(state: GameState, action: EngineAction): GameState {
  switch (action.type) {
    case 'GAME_INIT':
      return initGame(action.payload)

    case 'TURN_GENERATE':
      return generateTurn(state)

    case 'ACTION_SELECT':
      return selectAction(state, action.payload.actionId)

    case 'ACTION_CUSTOM':
      return selectCustomAction(state, action.payload.text)

    case 'ACTION_RESOLVE':
      return resolvePendingAction(state)

    case 'BATTLE_CHOOSE':
      return selectBattleChoice(state, action.payload.actionId)

    case 'BATTLE_RESOLVE':
      return resolveBattle(state)

    case 'BREAKTHROUGH_START':
      return startBreakthrough(state)

    case 'BREAKTHROUGH_RESOLVE':
      return resolveBreakthrough(state)

    case 'TURN_SETTLE':
      return settleTurn(state)

    case 'GAME_OVER':
      return handleGameOver(state)

    case 'LOAD_GAME':
      return action.payload.snapshot

    default:
      return state
  }
}
```

---

## 6. 回合生成逻辑

你每回合最好分成两个部分：

1. **前端本地先生成候选行动骨架**
2. **再调用 LLM 补充场景文案与选项表述**

这样更稳。

---

## 6.1 generateTurn 伪代码

```ts
function generateTurn(state: GameState): GameState {
  const next = clone(state)
  next.phase = 'generate_turn'

  // 1. 推进世界基础时间状态（仅在某些结算后推进也可以）
  applyPassiveWorldDrift(next)

  // 2. 刷新倒计时
  tickCountdownPreview(next)

  // 3. 检查强制事件
  const forcedScene = detectForcedScene(next)
  if (forcedScene) {
    next.currentScene = forcedScene.scene
    next.currentOptions = forcedScene.options
    next.phase = 'choose_action'
    return next
  }

  // 4. 根据地点、状态、事件，筛选候选行动
  const optionPool = buildActionPool(next)
  const validOptions = optionPool.filter(opt => checkConditions(next, opt.requirements))

  // 5. 按“稳健/成长/赌博/社交/推进”分类挑 3~5 个
  next.currentOptions = pickDiverseOptions(validOptions, 5)

  // 6. 创建基础 scene
  next.currentScene = buildLocalSceneSummary(next)

  // 7. 可选：调用 LLM 生成更好的局势文本与选项描述
  // next = await enhanceTurnByLLM(next)

  next.phase = 'choose_action'
  return next
}
```

---

## 6.2 buildActionPool 伪代码

```ts
function buildActionPool(state: GameState): ActionOption[] {
  const result: ActionOption[] = []

  result.push(...buildRestActions(state))
  result.push(...buildCultivationActions(state))
  result.push(...buildExploreActions(state))
  result.push(...buildTravelActions(state))
  result.push(...buildNpcActions(state))
  result.push(...buildEventActions(state))
  result.push(...buildBreakthroughActions(state))

  return result
}
```

---

## 7. 本地结算的关键思想

所有关键结果都应该先在本地确定，再让 LLM 叙述。

### 本地负责决定：
- 成功 / 失败
- 掉血 / 掉蓝 / 掉寿元
- 获得物品 / 修为 / 标签
- 事件是否推进
- 是否触发战斗
- 是否死亡

### LLM 负责决定：
- 这段结果如何描述得有味道
- NPC 说了什么
- 当前局势如何包装
- 选项标题怎么写更像修仙游戏

---

## 8. 概率系统落地方案

建议统一采用：

```ts
finalRate = clamp(baseRate + addBonus, min, max) * mulBonus
```

其中：
- `baseRate`：基础概率
- `addBonus`：来自数值、状态、地点、事件的加减
- `mulBonus`：来自 rare buff / debuff 的倍率修正

---

## 8.1 通用概率上下文

```ts
export type RateContext = {
  player: PlayerState
  location: LocationState
  world: WorldState
  event?: EventState
  npc?: NpcState
  tags?: string[]
}
```

---

## 8.2 例子：探索成功率

```ts
function calcExploreSuccessRate(ctx: RateContext): number {
  let rate = 0.65

  rate += (ctx.player.stats.luck - 5) * 0.02
  rate += (ctx.player.stats.comprehension - 5) * 0.01
  rate -= ctx.location.riskLevel * 0.05

  if (ctx.player.hp / ctx.player.hpMax < 0.4) rate -= 0.12
  if (ctx.player.statusTags.includes('injured')) rate -= 0.08
  if (ctx.player.buildTags.survival >= 3) rate += 0.1
  if (ctx.world.worldTags.includes('灵气紊乱')) rate -= 0.05
  if (ctx.location.envTags.includes('mist')) rate -= 0.05

  return clamp(rate, 0.05, 0.95)
}
```

---

## 8.3 例子：突破成功率

```ts
function calcBreakthroughRate(ctx: RateContext): number {
  let rate = 0.35

  rate += ctx.player.realmProgress / 100 * 0.25
  rate += (ctx.player.stats.root - 5) * 0.03
  rate += (ctx.player.stats.comprehension - 5) * 0.02
  rate -= ctx.player.heartDemon * 0.01

  if (ctx.location.envTags.includes('spirit_vein')) rate += 0.12
  if (ctx.player.statusTags.includes('enlightened')) rate += 0.1
  if (ctx.player.statusTags.includes('unstable')) rate -= 0.12

  const hasAssistPill = ctx.player.items.some(i => i.id === 'pill_breakthrough')
  if (hasAssistPill) rate += 0.15

  return clamp(rate, 0.01, 0.95)
}
```

---

## 9. 回合结算伪代码

下面是最核心的一部分。

---

## 9.1 resolvePendingAction 总入口

```ts
function resolvePendingAction(state: GameState): GameState {
  const next = clone(state)
  const pending = next.pendingAction
  if (!pending) return next

  const option = next.currentOptions.find(i => i.id === pending.actionId)
  if (!option) {
    next.ui.error = '未找到行动选项'
    return next
  }

  next.phase = 'resolve_action'

  const resolverMap: Record<ResolverKey, (s: GameState, o: ActionOption) => GameState> = {
    resolveRest,
    resolveCultivation,
    resolveExplore,
    resolveTravel,
    resolveTrade,
    resolveSocial,
    resolveBattleEntry,
    resolveBreakthrough,
    resolveInvestigate,
    resolveCustomAction,
  }

  const resolver = resolverMap[option.resolver]
  const resolved = resolver(next, option)
  resolved.pendingAction = null
  return resolved
}
```

---

## 9.2 休息结算

```ts
function resolveRest(state: GameState, option: ActionOption): GameState {
  const next = clone(state)

  advanceDays(next, option.timeCost)
  spendCosts(next, option.costs)

  const heal = randInt(12, 24)
  const restoreMp = randInt(8, 16)

  next.player.hp = clamp(next.player.hp + heal, 0, next.player.hpMax)
  next.player.mp = clamp(next.player.mp + restoreMp, 0, next.player.mpMax)

  removeStatusChance(next.player, 'injured', 0.35)

  pushSceneResult(next, {
    title: '休整结束',
    summary: `你暂时压下伤势，调息之后气息平稳了许多。`,
    gains: [`气血 +${heal}`, `真气 +${restoreMp}`],
    losses: [`时间 +${option.timeCost} 天`],
  })

  next.phase = 'settlement'
  return next
}
```

---

## 9.3 修炼结算

```ts
function resolveCultivation(state: GameState, option: ActionOption): GameState {
  const next = clone(state)

  advanceDays(next, option.timeCost)
  spendCosts(next, option.costs)

  let progressGain = randInt(5, 12)

  if (next.map.locations[next.map.currentLocationId].envTags.includes('spirit_vein')) {
    progressGain += 4
  }

  if (next.player.buildTags.spell >= 2 || next.player.buildTags.sword >= 2) {
    progressGain += 2
  }

  if (next.player.statusTags.includes('unstable')) {
    progressGain -= 3
  }

  progressGain = Math.max(1, progressGain)
  next.player.realmProgress += progressGain

  if (Math.random() < 0.12) {
    addStatus(next.player, 'enlightened')
  }

  normalizeRealmProgress(next.player)

  pushSceneResult(next, {
    title: '修炼所得',
    summary: `你运转功法，体内灵气缓缓归拢，修为有所精进。`,
    gains: [`修为 +${progressGain}%`],
    losses: [`时间 +${option.timeCost} 天`, `真气 -${option.costs.mp ?? 0}`],
  })

  next.phase = 'settlement'
  return next
}
```

---

## 9.4 探索结算

```ts
function resolveExplore(state: GameState, option: ActionOption): GameState {
  const next = clone(state)
  const location = next.map.locations[next.map.currentLocationId]

  advanceDays(next, option.timeCost)
  spendCosts(next, option.costs)

  const successRate = calcExploreSuccessRate({
    player: next.player,
    location,
    world: next.world,
    tags: option.tags,
  })

  const roll = Math.random()

  if (roll <= successRate) {
    const reward = rollExploreReward(next, location, option)
    applyReward(next, reward)
    growBuildTags(next.player, option.tags)

    if (Math.random() < 0.25) {
      triggerRandomEvent(next, 'explore_success')
    }

    pushSceneResult(next, {
      title: '探索成功',
      summary: `你在 ${location.name} 的行动还算顺利，确实有所收获。`,
      gains: rewardToTextList(reward),
      losses: [`时间 +${option.timeCost} 天`],
    })
  } else {
    const injury = resolveExploreFailure(next, location, option)

    pushSceneResult(next, {
      title: '探索受挫',
      summary: `你在 ${location.name} 遭遇了意外，原本顺畅的节奏被彻底打断。`,
      gains: [],
      losses: injury,
    })
  }

  if (next.player.hp <= 0 || next.player.lifespan <= 0) {
    next.phase = 'game_over'
  } else {
    next.phase = 'settlement'
  }

  return next
}
```

---

## 9.5 探索失败细节

```ts
function resolveExploreFailure(
  state: GameState,
  location: LocationState,
  option: ActionOption,
): string[] {
  const losses: string[] = []

  const hpLoss = randInt(8 + location.riskLevel * 2, 18 + location.riskLevel * 4)
  state.player.hp = Math.max(0, state.player.hp - hpLoss)
  losses.push(`气血 -${hpLoss}`)

  if (Math.random() < 0.35) {
    addStatus(state.player, 'injured')
    losses.push('状态：受伤')
  }

  if (Math.random() < 0.15) {
    state.player.heartDemon += 2
    losses.push('心魔 +2')
  }

  if (Math.random() < 0.18) {
    const battle = tryCreateBattle(state, location)
    if (battle) {
      state.battle = battle
      state.phase = 'resolve_battle'
      losses.push('触发战斗')
    }
  }

  return losses
}
```

---

## 9.6 旅行结算

```ts
function resolveTravel(state: GameState, option: ActionOption): GameState {
  const next = clone(state)
  const targetId = option.targetId!
  const edge = next.map.travelGraph.find(
    e => e.from === next.map.currentLocationId && e.to === targetId,
  )

  if (!edge) {
    next.ui.error = '路径不存在'
    return next
  }

  advanceDays(next, edge.timeCost)
  next.map.currentLocationId = targetId
  next.map.locations[targetId].discovered = true

  if (edge.riskLevel >= 3 && Math.random() < 0.2) {
    addStatus(next.player, 'tracked')
  }

  pushSceneResult(next, {
    title: '转移地点',
    summary: `你离开原地，前往 ${next.map.locations[targetId].name}。`,
    gains: [`到达：${next.map.locations[targetId].name}`],
    losses: [`时间 +${edge.timeCost} 天`],
  })

  next.phase = 'settlement'
  return next
}
```

---

## 9.7 社交结算

```ts
function resolveSocial(state: GameState, option: ActionOption): GameState {
  const next = clone(state)
  const npc = next.npcs[option.targetId!]
  if (!npc) return next

  advanceDays(next, option.timeCost)
  spendCosts(next, option.costs)

  let rate = 0.55
  rate += npc.favor * 0.02
  rate += (next.player.reputation - next.player.infamy) * 0.01
  rate += (next.player.stats.charm - 5) * 0.03

  if (npc.relationStatus === 'suspicious') rate -= 0.15
  if (next.player.statusTags.includes('wanted')) rate -= 0.2
  if (next.player.buildTags.social >= 2) rate += 0.1

  rate = clamp(rate, 0.05, 0.95)

  if (Math.random() < rate) {
    npc.favor += 1
    npc.trust += 1
    maybeGrantNpcIntel(next, npc)

    pushSceneResult(next, {
      title: '交流顺利',
      summary: `你与 ${npc.name} 的接触还算顺利，对方的态度明显缓和了一些。`,
      gains: [`${npc.name} 好感 +1`, `${npc.name} 信任 +1`],
      losses: [`时间 +${option.timeCost} 天`],
    })
  } else {
    npc.danger += 1
    if (Math.random() < 0.3) npc.relationStatus = 'suspicious'

    pushSceneResult(next, {
      title: '交流受阻',
      summary: `你的话并未打动 ${npc.name}，反而让对方多了几分戒备。`,
      gains: [],
      losses: [`${npc.name} 危险度 +1`, `时间 +${option.timeCost} 天`],
    })
  }

  next.phase = 'settlement'
  return next
}
```

---

## 9.8 战斗入口结算

```ts
function resolveBattleEntry(state: GameState, option: ActionOption): GameState {
  const next = clone(state)
  const battle = createBattleFromOption(next, option)
  next.battle = battle
  next.phase = 'resolve_battle'

  next.currentScene = {
    sceneType: 'battle',
    title: `遭遇战：${battle.enemy.name}`,
    summary: `${battle.enemy.name} 已拦在你面前，气机锁定，退路并不轻松。`,
    riskHints: ['本场战斗分为开局 / 中盘 / 残局三段'],
    resultBlocks: [],
  }

  next.currentOptions = buildBattleChoices(next.battle)
  return next
}
```

---

## 9.9 战斗三段式结算

```ts
function resolveBattle(state: GameState): GameState {
  const next = clone(state)
  const battle = next.battle
  if (!battle) return next

  const chosen = getSelectedBattleOption(next)
  const outcome = calcBattleOutcome(next.player, battle.enemy, battle.phase, chosen)

  applyBattleOutcome(next, outcome)

  battle.battleLog.push(outcome.summary)
  battle.round += 1

  if (battle.enemy.hp <= 0) {
    grantBattleLoot(next, battle.enemy)
    next.battle = null
    pushSceneResult(next, {
      title: '战斗结束',
      summary: `你击败了 ${battle.enemy.name}。`,
      gains: ['获得战利品'],
      losses: outcome.losses,
    })
    next.phase = 'settlement'
    return next
  }

  if (next.player.hp <= 0) {
    next.phase = 'game_over'
    return next
  }

  battle.phase = nextBattlePhase(battle.phase)
  next.currentOptions = buildBattleChoices(battle)
  next.currentScene = buildBattleScene(next, battle, outcome)
  next.phase = 'choose_action'
  return next
}
```

---

## 9.10 突破结算

```ts
function resolveBreakthrough(state: GameState, option: ActionOption): GameState {
  const next = clone(state)
  const location = next.map.locations[next.map.currentLocationId]

  advanceDays(next, option.timeCost)
  spendCosts(next, option.costs)

  const rate = calcBreakthroughRate({
    player: next.player,
    location,
    world: next.world,
  })

  const roll = Math.random()

  if (roll < rate) {
    promoteRealm(next.player)
    next.player.realmProgress = 0
    next.player.hp = Math.min(next.player.hpMax, next.player.hp + 10)
    next.player.mp = Math.min(next.player.mpMax, next.player.mp + 10)

    pushSceneResult(next, {
      title: '突破成功',
      summary: `你体内的桎梏被一举冲开，气机攀升，境界终于迈入新的层次。`,
      gains: [`境界提升：${next.player.realm}`],
      losses: [`时间 +${option.timeCost} 天`],
    })
  } else {
    const hpLoss = randInt(10, 25)
    next.player.hp = Math.max(0, next.player.hp - hpLoss)
    next.player.heartDemon += randInt(1, 4)

    if (Math.random() < 0.35) addStatus(next.player, 'unstable')
    if (Math.random() < 0.12) next.player.lifespan -= 1

    pushSceneResult(next, {
      title: '突破失败',
      summary: `你强行冲关，却未能真正破开瓶颈，反而经脉震荡，留下隐患。`,
      gains: [],
      losses: [`气血 -${hpLoss}`, '心魔上升'],
    })
  }

  if (next.player.hp <= 0 || next.player.lifespan <= 0) {
    next.phase = 'game_over'
  } else {
    next.phase = 'settlement'
  }

  return next
}
```

---

## 10. 回合收尾 settlement

回合结算结束后，要统一做几件事：

- 倒计时减少
- 事件阶段推进
- 检查强制触发事件
- 检查角色死亡 / 通关
- 写入日志
- 自动存档

---

## 10.1 settleTurn 伪代码

```ts
function settleTurn(state: GameState): GameState {
  const next = clone(state)

  tickCountdowns(next)
  progressEvents(next)
  cleanupExpiredEffects(next)
  recalculateDerivedStats(next)
  appendTurnLog(next)

  if (shouldTriggerForcedEvent(next)) {
    injectForcedEventScene(next)
  }

  autoSave(next)

  if (next.player.hp <= 0 || next.player.lifespan <= 0) {
    next.phase = 'game_over'
    return next
  }

  next.phase = 'generate_turn'
  return next
}
```

---

## 11. 事件引擎建议

你最好做成“事件池 + 条件匹配”，不要写死在页面逻辑里。

---

## 11.1 事件模板 JSON 示例

```json
{
  "id": "evt_save_girl",
  "title": "山林救人",
  "category": "side",
  "stage": 1,
  "status": "active",
  "priority": 8,
  "deadlineDay": 18,
  "triggerConditions": [
    { "type": "location_is", "key": "location", "value": "black_wind_ridge" },
    { "type": "realm_gte", "key": "realm", "value": "qi_3" }
  ],
  "relatedNpcIds": ["npc_mysterious_girl"],
  "relatedLocationIds": ["black_wind_ridge"],
  "summary": "你在黑风岭附近听到求救声。",
  "nextStageHint": "若出手相救，可能会卷入更复杂的因果。",
  "flags": ["rescue", "npc_line"]
}
```

---

## 11.2 事件推进伪代码

```ts
function progressEvents(state: GameState) {
  for (const event of Object.values(state.events)) {
    if (event.status !== 'active') continue

    if (event.deadlineDay && state.world.day > event.deadlineDay) {
      event.status = 'failed'
      applyEventFailure(state, event)
      continue
    }

    if (checkEventStageAdvance(state, event)) {
      event.stage += 1
      applyEventStageAdvance(state, event)
    }
  }
}
```

---

## 12. 存档建议

纯前端 MVP 用 `localStorage` 就够了，后续大一点再切 `IndexedDB`。

---

## 12.1 存档结构

```ts
export type SaveData = {
  slotId: string
  updatedAt: number
  gameState: GameState
}
```

---

## 12.2 存档伪代码

```ts
function saveGame(slotId: string, gameState: GameState) {
  const data: SaveData = {
    slotId,
    updatedAt: Date.now(),
    gameState,
  }
  localStorage.setItem(`xiuxian_save_${slotId}`, JSON.stringify(data))
}

function loadGame(slotId: string): GameState | null {
  const raw = localStorage.getItem(`xiuxian_save_${slotId}`)
  if (!raw) return null
  const data = JSON.parse(raw) as SaveData
  return data.gameState
}
```

---

## 13. LLM Adapter 设计建议

这里很重要：

**LLM 不要返回最终真实状态，只返回“建议文本层”。**

真正状态仍以前端本地为准。

---

## 13.1 推荐输入给 LLM 的内容

- 当前地点
- 玩家关键状态（精简版）
- 当前事件摘要
- 当前 NPC 摘要
- 当前已生成的选项骨架
- 本回合结果摘要（若是结算后）

不要把无关大历史全部丢进去，否则上下文会越来越臃肿。

---

## 13.2 推荐 LLM 返回结构

```ts
type LLMTurnResponse = {
  sceneTitle: string
  sceneSummary: string
  riskHints: string[]
  optionTexts: Array<{
    id: string
    title: string
    desc: string
  }>
  resultNarration?: {
    title: string
    summary: string
  }
}
```

---

## 13.3 容错策略

如果 LLM：
- 没返回
- 返回格式错
- 返回胡话

前端直接使用本地模板兜底。

```ts
function mergeLLMResponse(state: GameState, res?: Partial<LLMTurnResponse>) {
  if (!res) return state

  if (state.currentScene) {
    state.currentScene.title = res.sceneTitle || state.currentScene.title
    state.currentScene.summary = res.sceneSummary || state.currentScene.summary
    state.currentScene.riskHints = res.riskHints?.length
      ? res.riskHints
      : state.currentScene.riskHints
  }

  if (res.optionTexts?.length) {
    state.currentOptions = state.currentOptions.map(opt => {
      const found = res.optionTexts?.find(i => i.id === opt.id)
      return found
        ? { ...opt, title: found.title || opt.title, desc: found.desc || opt.desc }
        : opt
    })
  }

  return state
}
```

---

## 14. Vue / React 实际工程建议

你是前端出身，这块我直接给落地建议。

### 推荐分层

```text
src/
  game/
    engine/
      engine.ts
      reducers.ts
      resolvers/
      calculators/
      events/
      battle/
    data/
      locations.ts
      npcs.ts
      events.ts
      items.ts
    llm/
      prompt.ts
      adapter.ts
      parser.ts
    store/
      gameStore.ts
    utils/
      random.ts
      clone.ts
      guards.ts
  components/
    panels/
    scene/
    options/
    status/
```

### 如果你用 Vue 3
推荐：
- `pinia` 存状态
- `computed` 做派生状态
- engine 独立成纯 ts 模块

### 如果你用 React / Next
推荐：
- `zustand` 或 `jotai`
- engine 仍然独立成纯 ts 模块

关键点：

**状态机和 UI 一定分离。**

---

## 15. MVP 最小落地顺序

建议你按这个顺序写，不要一上来全做。

### 第 1 步
先做：
- `GameState`
- 初始化开局
- 左侧面板状态显示
- 当前地点显示
- 回合推进按钮

### 第 2 步
做：
- `generateTurn`
- 候选选项生成
- 选项点击
- 本地结算

### 第 3 步
做：
- 探索 / 休息 / 修炼 / 移动 4 个 resolver
- 历史记录
- localStorage 存档

### 第 4 步
做：
- 事件链
- NPC 好感系统
- 突破系统
- 战斗三段式

### 第 5 步
最后再接：
- LLM scene 包装
- LLM 选项润色
- LLM NPC 对话增强

不要反过来先把 AI 接得很复杂。

---

## 16. 一份最小初始化 JSON 示例

```json
{
  "version": "0.1.0",
  "seed": "demo-seed-001",
  "phase": "generate_turn",
  "turn": 1,
  "world": {
    "day": 1,
    "month": 1,
    "year": 1,
    "season": "spring",
    "weather": "sunny",
    "age": 16,
    "dangerLevel": 1,
    "worldTags": ["灵气平稳"],
    "rumors": ["青木坊市近期会有黑市交易"],
    "activeCountdowns": []
  },
  "player": {
    "id": "player_001",
    "name": "无名散修",
    "realm": "qi_1",
    "realmLayer": 1,
    "realmProgress": 12,
    "hp": 100,
    "hpMax": 100,
    "mp": 50,
    "mpMax": 50,
    "lifespan": 59,
    "lifespanMax": 60,
    "spiritStone": 20,
    "heartDemon": 0,
    "reputation": 0,
    "infamy": 0,
    "stats": {
      "root": 6,
      "comprehension": 5,
      "luck": 5,
      "physique": 5,
      "spirit": 5,
      "charm": 4
    },
    "statusTags": [],
    "talents": [],
    "skills": [],
    "items": [],
    "currencies": [],
    "buildTags": {
      "sword": 0,
      "body": 0,
      "spell": 0,
      "alchemy": 0,
      "social": 0,
      "evil": 0,
      "survival": 1
    },
    "discoveredLocationIds": ["green_wood_market"],
    "factionRelations": {},
    "flags": []
  },
  "map": {
    "currentLocationId": "green_wood_market",
    "locations": {},
    "travelGraph": []
  },
  "npcs": {},
  "events": {},
  "battle": null,
  "meta": {
    "unlockedBackgrounds": [],
    "unlockedTalents": [],
    "unlockedWorldTags": [],
    "unlockedRelics": [],
    "achievementFlags": []
  },
  "history": [],
  "currentScene": null,
  "currentOptions": [],
  "pendingAction": null,
  "ui": {
    "loading": false,
    "expandedPanels": []
  }
}
```

---

## 17. 最后给你的工程判断

如果你想把这个项目做出来，而且不想再滑回“互动小说生成器”，那最关键的不是 prompt，而是这三点：

### 1）前端自己掌握状态真相
谁都可以写文案，但状态必须你自己算。

### 2）前端自己掌握结果结算
尤其是掉血、得宝、突破、死亡、事件推进。

### 3）LLM 只做增强层
让它负责“更好玩”“更有味道”，不要让它负责“决定世界的真相”。

---

## 18. 你下一步最适合做什么

最实用的下一步不是继续写文档，而是开始落第一个工程骨架：

1. `types.ts`
2. `engine.ts`
3. `generateTurn.ts`
4. `resolveExplore.ts`
5. `resolveRest.ts`
6. `saveLoad.ts`
7. `prompt.ts`

把这 7 个文件先立起来，你的项目就真正从“想法”进入“可跑的游戏框架”了。

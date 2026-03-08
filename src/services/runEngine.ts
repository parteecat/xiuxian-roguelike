import type { Player } from '@/types/game'
import type {
  ActionOption,
  ActionResolution,
  BuildTag,
  CausalityRecord,
  CausalityState,
  CountdownState,
  EndingSummary,
  LifeStageState,
  LocationState,
  MainPressureState,
  MapState,
  MetaState,
  MonthSettlement,
  NpcState,
  RealmKey,
  ResolutionEnhancement,
  RiskLevel,
  RunState,
  SceneState,
  StatusTag,
  TurnEnhancement,
  TurnLog,
  Weather,
  WorldState,
} from '@/types/run'

export const REALM_ORDER: RealmKey[] = [
  'qi_1',
  'qi_2',
  'qi_3',
  'qi_4',
  'qi_5',
  'foundation_1',
  'foundation_2',
  'golden_core_1',
]

export const REALM_LABELS: Record<RealmKey, string> = {
  qi_1: '炼气一层',
  qi_2: '炼气二层',
  qi_3: '炼气三层',
  qi_4: '炼气四层',
  qi_5: '炼气五层',
  foundation_1: '筑基初境',
  foundation_2: '筑基中境',
  golden_core_1: '金丹初境',
}

export const LOCATION_TYPE_LABELS: Record<LocationState['type'], string> = {
  safe: '安全区',
  resource: '资源区',
  danger: '危险区',
  special: '事件区',
}

export const BUILD_TAG_LABELS: Record<BuildTag, string> = {
  sword: '剑修',
  body: '体修',
  spell: '法修',
  alchemy: '丹修',
  social: '人情流',
  evil: '邪修',
  survival: '苟道',
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  mid: '中风险',
  high: '高风险',
}

const WEATHER_BY_MONTH: Weather[] = ['sunny', 'sunny', 'fog', 'rain', 'storm', 'sunny', 'fog']

const EMPTY_META: MetaState = {
  unlockedBackgrounds: [],
  unlockedTalents: [],
  unlockedWorldTags: [],
  unlockedRelics: [],
  achievementFlags: [],
}

type ResolverOutcome = {
  resolution: ActionResolution
}

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function cloneState<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as T
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function uniq<T>(values: T[]) {
  return Array.from(new Set(values))
}

function getSeason(month: number): WorldState['season'] {
  if (month <= 3) return 'spring'
  if (month <= 6) return 'summer'
  if (month <= 9) return 'autumn'
  return 'winter'
}

function mergeMeta(base: MetaState, incoming: Partial<MetaState> | null | undefined): MetaState {
  return {
    unlockedBackgrounds: uniq([
      ...base.unlockedBackgrounds,
      ...(incoming?.unlockedBackgrounds ?? []),
    ]),
    unlockedTalents: uniq([
      ...base.unlockedTalents,
      ...(incoming?.unlockedTalents ?? []),
    ]),
    unlockedWorldTags: uniq([
      ...base.unlockedWorldTags,
      ...(incoming?.unlockedWorldTags ?? []),
    ]),
    unlockedRelics: uniq([
      ...base.unlockedRelics,
      ...(incoming?.unlockedRelics ?? []),
    ]),
    achievementFlags: uniq([
      ...base.achievementFlags,
      ...(incoming?.achievementFlags ?? []),
    ]),
  }
}

export function compareRealm(left: RealmKey, right: RealmKey): number {
  return REALM_ORDER.indexOf(left) - REALM_ORDER.indexOf(right)
}

export function getAbsoluteDay(world: WorldState): number {
  return (world.month - 1) * 30 + world.day
}

export function isRunStateCompatible(runState: Pick<RunState, 'version'> | null | undefined) {
  return Boolean(runState?.version?.startsWith('2.'))
}

function mapRealm(player: Player): RealmKey {
  if (player.realm === '金丹期') return 'golden_core_1'
  if (player.realm === '筑基期') return 'foundation_1'
  if (player.cultivationProgress >= 85) return 'qi_5'
  if (player.cultivationProgress >= 65) return 'qi_4'
  if (player.cultivationProgress >= 40) return 'qi_3'
  if (player.cultivationProgress >= 20) return 'qi_2'
  return 'qi_1'
}

function normalizeStat(value: number) {
  return clamp(Math.round(value / 10), 1, 10)
}

function deriveInitialBuildTags(player: Player): Record<BuildTag, number> {
  const tags: Record<BuildTag, number> = {
    sword: 0,
    body: 0,
    spell: 0,
    alchemy: 0,
    social: 0,
    evil: 0,
    survival: 1,
  }

  if (player.attack >= 32) tags.sword += 2
  if (player.maxHealth >= 125) tags.body += 2
  if (player.comprehension >= 65) tags.spell += 2
  if (player.luck >= 65) tags.social += 1
  if (player.rootBone >= 65) tags.body += 1

  for (const talent of player.talents) {
    if (talent.includes('剑')) tags.sword += 1
    if (talent.includes('丹') || talent.includes('医')) tags.alchemy += 1
    if (talent.includes('魅') || talent.includes('缘')) tags.social += 1
    if (talent.includes('魔') || talent.includes('煞')) tags.evil += 1
    if (talent.includes('体') || talent.includes('骨')) tags.body += 1
    if (talent.includes('悟') || talent.includes('灵')) tags.spell += 1
  }

  if (player.background.includes('药') || player.background.includes('炉')) {
    tags.alchemy += 1
  }

  if (player.background.includes('宗门') || player.background.includes('世家')) {
    tags.social += 1
  }

  return tags
}

function createInitialMap(): MapState {
  const locations: Record<string, LocationState> = {
    green_wood_market: {
      id: 'green_wood_market',
      name: '青木坊市',
      type: 'safe',
      riskLevel: 1,
      recommendedRealm: 'qi_1',
      envTags: ['market', 'safe', 'crowded'],
      discovered: true,
      unlocked: true,
      availableActionPool: ['trade', 'social', 'investigate', 'travel'],
      encounterPool: ['黑市掮客', '旧物买家', '宗门线人'],
      dropPool: ['止血散', '残卷抄本', '旧情报'],
      npcIds: ['npc_shopkeeper', 'npc_old_man', 'npc_wanderer'],
      description: '青木坊市不大，但每一条流言都可能变成筹码或旧债。',
    },
    blackwind_ridge: {
      id: 'blackwind_ridge',
      name: '黑风岭',
      type: 'danger',
      riskLevel: 3,
      recommendedRealm: 'qi_2',
      envTags: ['wild', 'beast', 'mist'],
      discovered: true,
      unlocked: true,
      availableActionPool: ['explore', 'event', 'travel'],
      encounterPool: ['黑风狼', '妖雾裂隙', '散修伏杀'],
      dropPool: ['妖丹', '风行草', '秘境材料'],
      npcIds: [],
      description: '黑风岭出产资源，也出产尸骨，是资格准备期最直接的赌桌。',
    },
    ruined_temple: {
      id: 'ruined_temple',
      name: '旧庙遗址',
      type: 'special',
      riskLevel: 2,
      recommendedRealm: 'qi_2',
      envTags: ['ruins', 'yin', 'secret'],
      discovered: true,
      unlocked: true,
      availableActionPool: ['investigate', 'explore', 'travel'],
      encounterPool: ['残阵回响', '旧债幻影', '重伤少女'],
      dropPool: ['残符', '香灰', '因果线索'],
      npcIds: ['npc_mysterious_girl'],
      description: '旧庙看似荒废，却最擅长把过去没做完的选择重新推到你面前。',
    },
    sect_gate: {
      id: 'sect_gate',
      name: '宗门山门',
      type: 'safe',
      riskLevel: 1,
      recommendedRealm: 'qi_2',
      envTags: ['sect', 'trial', 'order'],
      discovered: true,
      unlocked: true,
      availableActionPool: ['social', 'event', 'travel'],
      encounterPool: ['山门试炼', '资格审查', '执事问心'],
      dropPool: ['试炼令牌', '宗门名帖'],
      npcIds: ['npc_sect_deacon'],
      description: '山门不会替你决定命运，但会逼你承认自己打算成为什么样的人。',
    },
    backhill_cave: {
      id: 'backhill_cave',
      name: '后山洞府',
      type: 'resource',
      riskLevel: 1,
      recommendedRealm: 'qi_1',
      envTags: ['spirit_vein', 'quiet', 'cave'],
      discovered: true,
      unlocked: true,
      availableActionPool: ['cultivate', 'rest', 'travel'],
      encounterPool: ['灵脉震荡', '心魔低语', '旧物余烬'],
      dropPool: ['灵髓', '青木晶砂'],
      npcIds: [],
      description: '后山洞府是最像“自己的人生”的地方，安静，也逼人直面瓶颈。',
    },
  }

  return {
    currentLocationId: 'green_wood_market',
    locations,
    travelGraph: [
      { from: 'green_wood_market', to: 'ruined_temple', slotCost: 1, riskLevel: 2 },
      { from: 'green_wood_market', to: 'sect_gate', slotCost: 1, riskLevel: 1 },
      { from: 'green_wood_market', to: 'blackwind_ridge', slotCost: 1, riskLevel: 2 },
      { from: 'green_wood_market', to: 'backhill_cave', slotCost: 1, riskLevel: 1 },
      { from: 'ruined_temple', to: 'green_wood_market', slotCost: 1, riskLevel: 2 },
      { from: 'sect_gate', to: 'green_wood_market', slotCost: 1, riskLevel: 1 },
      { from: 'blackwind_ridge', to: 'green_wood_market', slotCost: 1, riskLevel: 2 },
      { from: 'backhill_cave', to: 'green_wood_market', slotCost: 1, riskLevel: 1 },
      { from: 'ruined_temple', to: 'blackwind_ridge', slotCost: 1, riskLevel: 3 },
      { from: 'blackwind_ridge', to: 'ruined_temple', slotCost: 1, riskLevel: 3 },
    ],
  }
}

function createInitialNpcs(): Record<string, NpcState> {
  return {
    npc_shopkeeper: {
      id: 'npc_shopkeeper',
      name: '沈掌柜',
      title: '药铺掌柜',
      camp: '青木坊市',
      realm: 'qi_3',
      favor: 0,
      trust: 0,
      fear: 0,
      danger: 1,
      relationStatus: 'neutral',
      firstImpression: '谨慎精明，知道什么时候该闭嘴。',
      moralView: '认利不认情，但不喜欢亏欠。',
      playerImpression: '你像一块还没磨开的玉，值不值得赌要再看看。',
      sharedHistory: [],
      karmaLinks: [],
      functions: ['trade', 'intel'],
      hiddenGoals: ['稳住坊市秩序，别让黑市彻底做大。'],
      tags: ['market', 'alchemy'],
      flags: [],
      locationId: 'green_wood_market',
    },
    npc_old_man: {
      id: 'npc_old_man',
      name: '祁无咎',
      title: '可疑老者',
      camp: '散修',
      realm: 'foundation_1',
      favor: 0,
      trust: 0,
      fear: 0,
      danger: 2,
      relationStatus: 'neutral',
      firstImpression: '像个会在最后一刻把价码翻倍的人。',
      moralView: '只看你能不能扛得起自己挑的东西。',
      playerImpression: '你身上有点赌徒气，正合残卷这种事。',
      sharedHistory: [],
      karmaLinks: [],
      functions: ['intel', 'mentor'],
      hiddenGoals: ['替残卷找一个能活到后面的持有人。'],
      tags: ['scroll', 'sword', 'spell'],
      flags: [],
      locationId: 'green_wood_market',
    },
    npc_wanderer: {
      id: 'npc_wanderer',
      name: '韩逐尘',
      title: '落魄散修',
      camp: '散修',
      realm: 'qi_3',
      favor: -1,
      trust: 0,
      fear: 0,
      danger: 3,
      relationStatus: 'suspicious',
      firstImpression: '一眼就能看出他缺资源，也缺底线。',
      moralView: '活下来最重要，名声和规矩都能卖。',
      playerImpression: '你若不肯卖，我就记住你。',
      sharedHistory: [],
      karmaLinks: [],
      functions: ['quest', 'enemy', 'intel'],
      hiddenGoals: ['拿到进秘境的捷径，哪怕踩着别人。'],
      tags: ['black_market', 'survival', 'evil'],
      flags: [],
      locationId: 'green_wood_market',
    },
    npc_sect_deacon: {
      id: 'npc_sect_deacon',
      name: '陆执事',
      title: '宗门执事',
      camp: '青岚宗',
      realm: 'foundation_2',
      favor: 0,
      trust: 0,
      fear: 0,
      danger: 1,
      relationStatus: 'neutral',
      firstImpression: '说话温和，判断却比刀更硬。',
      moralView: '宗门可以帮人上岸，但不会替人埋单。',
      playerImpression: '你若肯守规矩，就有被宗门接住的资格。',
      sharedHistory: [],
      karmaLinks: [],
      functions: ['quest', 'mentor'],
      hiddenGoals: ['替宗门筛出能在秘境资格战中活下来的苗子。'],
      tags: ['sect', 'trial', 'order'],
      flags: [],
      locationId: 'sect_gate',
    },
    npc_mysterious_girl: {
      id: 'npc_mysterious_girl',
      name: '苏晚蝉',
      title: '神秘少女',
      camp: '未知',
      realm: 'qi_4',
      favor: 0,
      trust: 0,
      fear: 0,
      danger: 3,
      relationStatus: 'neutral',
      firstImpression: '她看起来快死了，但眼神还在给别人挑死法。',
      moralView: '恩情会还，怨也会记。',
      playerImpression: '你是救命恩人，还是把我卖掉的人，要看你后来怎么选。',
      sharedHistory: [],
      karmaLinks: [],
      functions: ['romance', 'quest', 'enemy'],
      hiddenGoals: ['在资格争夺前找回自己丢失的东西。'],
      tags: ['secret', 'causality', 'npc_line'],
      flags: [],
      locationId: 'ruined_temple',
    },
  }
}

function createInitialEvents(): Record<string, RunState['events'][string]> {
  return {
    event_sect_recruitment: {
      id: 'event_sect_recruitment',
      title: '宗门收徒',
      category: 'main',
      stage: 1,
      status: 'active',
      priority: 3,
      deadlineMonth: 2,
      phaseHint: '先拿到宗门的正当入场资格。',
      triggerConditions: [],
      summary: '青岚宗的收徒窗口只开到第二个月，错过就只能用更昂贵的方式争资格。',
      nextStageHint: '趁还来得及去山门试试。',
      flags: [],
      relatedNpcIds: ['npc_sect_deacon'],
      relatedLocationIds: ['sect_gate'],
    },
    event_secret_realm: {
      id: 'event_secret_realm',
      title: '秘境资格争夺',
      category: 'main',
      stage: 1,
      status: 'active',
      priority: 4,
      deadlineMonth: 6,
      phaseHint: '半年之内准备修为、材料、人脉和立场。',
      triggerConditions: [],
      summary: '半年后的秘境资格争夺，是这段人生能否跃迁的最大压力源。',
      nextStageHint: '别只长数值，还要准备资格和帮手。',
      flags: [],
      relatedNpcIds: ['npc_sect_deacon', 'npc_wanderer', 'npc_mysterious_girl'],
      relatedLocationIds: ['sect_gate', 'blackwind_ridge', 'green_wood_market'],
    },
    event_scroll_line: {
      id: 'event_scroll_line',
      title: '残卷捡漏',
      category: 'side',
      stage: 1,
      status: 'active',
      priority: 2,
      deadlineMonth: 4,
      phaseHint: '残卷既是机缘，也是黑市盯梢的起点。',
      triggerConditions: [],
      summary: '祁无咎手里的残卷不是白送的，接了就意味着后面还有人会来追。',
      nextStageHint: '查它的来路，或者把消息卖掉。',
      flags: [],
      relatedNpcIds: ['npc_old_man', 'npc_wanderer'],
      relatedLocationIds: ['green_wood_market'],
    },
    event_rescue_girl: {
      id: 'event_rescue_girl',
      title: '旧庙救人',
      category: 'npc',
      stage: 1,
      status: 'active',
      priority: 2,
      deadlineMonth: 2,
      phaseHint: '这不是单次善举，而是未来会回来的因果。',
      triggerConditions: [],
      summary: '旧庙里的重伤少女不只是一条支线，她会把你今天的选择带到后半生。',
      nextStageHint: '救下她，或者把消息卖给别人。',
      flags: [],
      relatedNpcIds: ['npc_mysterious_girl'],
      relatedLocationIds: ['ruined_temple'],
    },
  }
}

function createInitialWorld(player: Player, meta: MetaState): WorldState {
  const worldTags = uniq([
    '灵气平稳',
    meta.unlockedWorldTags[0] ?? '正邪暗涌',
  ])

  return {
    day: 1,
    month: 1,
    year: 1,
    season: 'spring',
    weather: WEATHER_BY_MONTH[0],
    age: player.age,
    dangerLevel: 1,
    worldTags,
    rumors: [
      '半年后秘境资格争夺将决定这片地界下一批新秀的命。',
      '坊市里有人在找肯为残卷担风险的人。',
    ],
    activeCountdowns: [],
  }
}

function createPlayerState(player: Player) {
  const buildTags = deriveInitialBuildTags(player)
  const realm = mapRealm(player)

  return {
    id: player.id,
    name: player.name,
    avatar: player.avatar,
    background: player.background,
    realm,
    realmLayer: REALM_ORDER.indexOf(realm) + 1,
    realmProgress: clamp(Math.round(player.cultivationProgress || 15), 0, 100),
    hp: player.health,
    hpMax: player.maxHealth,
    mp: player.spiritualPower,
    mpMax: player.maxSpiritualPower,
    lifespan: Math.round(player.lifespan),
    lifespanMax: Math.round(player.maxLifespan),
    spiritStone: 24,
    heartDemon: Math.max(0, Math.round(Math.abs(player.karma) / 20)),
    reputation: 0,
    infamy: 0,
    stats: {
      root: normalizeStat(player.rootBone),
      comprehension: normalizeStat(player.comprehension),
      luck: normalizeStat(player.luck),
      physique: normalizeStat(player.maxHealth / 2),
      spirit: normalizeStat(player.maxSpiritualPower / 2),
      charm: clamp(4 + Math.round(player.luck / 25), 1, 10),
    },
    statusTags: [],
    talents: player.talents.map((name) => ({
      id: createId('talent'),
      name,
      desc: `来自前世或命格的先天倾向：${name}`,
    })),
    skills: [
      {
        id: 'skill_breathing',
        name: '青木吐纳术',
        desc: '稳妥积累修为的基础心法。',
        level: 1,
        tags: ['survival', 'spell'],
      },
    ],
    items: [],
    currencies: [],
    buildTags,
    discoveredLocationIds: ['green_wood_market', 'ruined_temple', 'sect_gate', 'backhill_cave', 'blackwind_ridge'],
    factionRelations: {
      青岚宗: 0,
      散修: 0,
      黑市: 0,
    },
    flags: [],
  }
}

function deriveLifeStage(month: number): LifeStageState {
  if (month >= 7) {
    return {
      currentStage: 'ending',
      title: '终局回响',
      goalSummary: '回收这一世的因果，接受你真正经营出来的命运。',
      riskSummary: ['没处理完的旧债会在结算时变成真正的代价。'],
      milestoneFlags: ['ending_open'],
      progress: 100,
    }
  }

  if (month >= 4) {
    return {
      currentStage: 'qi_late',
      title: '炼气后期 · 定道期',
      goalSummary: '准备秘境资格、明确站队、处理第一次大因果回收。',
      riskSummary: ['站队太晚会被两边同时怀疑。', '旧人旧债会在第五个月后开始回来。'],
      milestoneFlags: ['qi_late_open'],
      progress: Math.round(((month - 4) / 2) * 100),
    }
  }

  return {
    currentStage: 'qi_early',
    title: '入道前期 · 求生期',
    goalSummary: '活下来，攒资源，决定你最先相信谁、得罪谁。',
    riskSummary: ['宗门窗口只开到第二个月。', '轻率种下的因果会在中期回来。'],
    milestoneFlags: ['qi_early_open'],
    progress: Math.round(((month - 1) / 2) * 100),
  }
}

function deriveMainPressure(run: RunState): MainPressureState {
  const currentMonth = run.world.month
  const remainMonths = Math.max(0, 6 - currentMonth)
  const stage = currentMonth <= 2 ? 1 : currentMonth <= 4 ? 2 : 3
  let status: MainPressureState['status'] = 'active'

  if (run.player.flags.includes('secret_realm_ticket')) {
    status = 'resolved'
  } else if (currentMonth >= 7) {
    status = 'failed'
  }

  const summaryByStage = {
    1: '先拿到宗门或黑市方向的入场资格，再决定你是靠实力、关系还是灰色路线挤进去。',
    2: '开始准备秘境材料和站队筹码，单靠修为已经不够。',
    3: '资格争夺进入收口期，过去种下的人情和旧债会集中兑现。',
  }

  return {
    id: 'pressure_secret_realm',
    type: 'secret_realm',
    title: '半年后秘境资格争夺',
    startMonth: 1,
    targetMonth: 6,
    remainMonths,
    stage,
    summary: summaryByStage[stage as 1 | 2 | 3],
    tags: ['secret_realm', 'deadline', 'qualification'],
    status,
  }
}

function upsertRumor(run: RunState, rumor: string) {
  run.world.rumors = [rumor, ...run.world.rumors.filter((item) => item !== rumor)].slice(0, 5)
}

function addFlag(run: RunState, flag: string) {
  if (!run.player.flags.includes(flag)) {
    run.player.flags.push(flag)
  }
}

function hasFlag(run: RunState, flag: string) {
  return run.player.flags.includes(flag)
}

function addStatus(run: RunState, status: StatusTag) {
  if (!run.player.statusTags.includes(status)) {
    run.player.statusTags.push(status)
  }
}

function removeStatus(run: RunState, status: StatusTag) {
  run.player.statusTags = run.player.statusTags.filter((item) => item !== status)
}

function addNpcHistory(run: RunState, npcId: string, history: string) {
  const npc = run.npcs[npcId]
  if (!npc) return
  npc.sharedHistory = [history, ...npc.sharedHistory.filter((item) => item !== history)].slice(0, 6)
}

function setNpcImpression(run: RunState, npcId: string, impression: string) {
  if (run.npcs[npcId]) {
    run.npcs[npcId].playerImpression = impression
  }
}

function getCausalityBucket(causality: CausalityState, status: CausalityRecord['status']) {
  switch (status) {
    case 'planted':
      return causality.planted
    case 'tracking':
      return causality.tracking
    case 'returned':
      return causality.returned
    case 'resolved':
    case 'failed':
      return causality.resolved
  }
}

function findCausality(run: RunState, id: string) {
  return [
    ...run.causality.planted,
    ...run.causality.tracking,
    ...run.causality.returned,
    ...run.causality.resolved,
  ].find((item) => item.id === id)
}

function placeCausality(run: RunState, record: CausalityRecord) {
  run.causality.planted = run.causality.planted.filter((item) => item.id !== record.id)
  run.causality.tracking = run.causality.tracking.filter((item) => item.id !== record.id)
  run.causality.returned = run.causality.returned.filter((item) => item.id !== record.id)
  run.causality.resolved = run.causality.resolved.filter((item) => item.id !== record.id)
  getCausalityBucket(run.causality, record.status).push(record)
}

function plantCausality(
  run: RunState,
  record: Omit<CausalityRecord, 'sourceTurn' | 'sourceStage' | 'status'>,
) {
  placeCausality(run, {
    ...record,
    sourceTurn: run.turn,
    sourceStage: run.lifeStage.currentStage,
    status: 'planted',
  })
}

function setCausalityStatus(
  run: RunState,
  id: string,
  status: CausalityRecord['status'],
  extra: Partial<CausalityRecord> = {},
) {
  const current = findCausality(run, id)
  if (!current) return
  placeCausality(run, {
    ...current,
    ...extra,
    status,
  })
}

export function getVisibleCausality(run: RunState) {
  return {
    planted: run.causality.planted.filter((item) => !item.hidden),
    tracking: run.causality.tracking,
    returned: run.causality.returned,
    resolved: run.causality.resolved,
  }
}

function getMonthFocus(month: number) {
  switch (month) {
    case 1:
      return '先活下来，再决定你最先相信谁。'
    case 2:
      return '在宗门窗口关闭前拿到第一张入场券。'
    case 3:
      return '秘境资格不是单看修为，开始补足材料与情报。'
    case 4:
      return '明确站队，让别人知道你到底站在哪边。'
    case 5:
      return '旧因果开始回收，别把中期当成单纯冲数值。'
    case 6:
      return '主线收口，该由谁帮你，或由谁报复你，都要落定。'
    default:
      return '回看这一世的因果和代价。'
  }
}

function syncDerivedState(run: RunState) {
  run.lifeStage = deriveLifeStage(run.world.month)
  run.mainPressure = deriveMainPressure(run)
  run.monthPlan.currentMonthIndex = run.world.month
  run.monthPlan.monthlyFocus = getMonthFocus(run.world.month)
  run.world.season = getSeason(run.world.month)
  run.world.weather = WEATHER_BY_MONTH[Math.min(WEATHER_BY_MONTH.length - 1, run.world.month - 1)]
  run.world.activeCountdowns = buildCountdowns(run)
  run.events.event_secret_realm.stage = run.mainPressure?.stage ?? 1
  run.events.event_secret_realm.status =
    run.mainPressure?.status === 'failed'
      ? 'failed'
      : run.mainPressure?.status === 'resolved'
      ? 'resolved'
      : 'active'
}

function buildCountdowns(run: RunState): CountdownState[] {
  const countdowns: CountdownState[] = []

  if (run.mainPressure && run.mainPressure.status === 'active') {
    countdowns.push({
      id: run.mainPressure.id,
      title: run.mainPressure.title,
      remainMonths: run.mainPressure.remainMonths,
      type: 'main_pressure',
      locationId: 'sect_gate',
      eventId: 'event_secret_realm',
      tags: run.mainPressure.tags,
    })
  }

  countdowns.push({
    id: `countdown_stage_${run.lifeStage.currentStage}`,
    title: run.lifeStage.title,
    remainMonths: run.lifeStage.currentStage === 'qi_early' ? 3 - run.world.month : Math.max(0, 6 - run.world.month),
    type: 'life_stage',
    tags: ['life_stage'],
  })

  for (const event of Object.values(run.events)) {
    if (event.status !== 'active' || event.deadlineMonth === undefined) continue
    countdowns.push({
      id: `countdown_${event.id}`,
      title: event.title,
      remainMonths: Math.max(0, event.deadlineMonth - run.world.month),
      type: event.category === 'causality' ? 'causality' : 'npc',
      locationId: event.relatedLocationIds?.[0],
      eventId: event.id,
      tags: event.flags,
    })
  }

  for (const record of run.causality.returned) {
    countdowns.push({
      id: `countdown_${record.id}`,
      title: record.title,
      remainMonths: 0,
      type: 'causality',
      locationId: record.relatedLocationId,
      tags: record.expectedReturnTags ?? [],
    })
  }

  return countdowns.sort((left, right) => left.remainMonths - right.remainMonths)
}

function createBaseCausalityState(): CausalityState {
  return {
    planted: [],
    tracking: [],
    returned: [],
    resolved: [],
  }
}

export function createInitialRun(player: Player, meta: MetaState = EMPTY_META): RunState {
  const mergedMeta = mergeMeta(EMPTY_META, meta)
  const run: RunState = {
    version: '2.0.0',
    seed: createId('seed'),
    phase: 'generate_turn',
    turn: 1,
    world: createInitialWorld(player, mergedMeta),
    player: createPlayerState(player),
    map: createInitialMap(),
    npcs: createInitialNpcs(),
    events: createInitialEvents(),
    battle: null,
    lifeStage: deriveLifeStage(1),
    mainPressure: null,
    causality: createBaseCausalityState(),
    monthPlan: {
      currentMonthIndex: 1,
      slotsTotal: 3,
      slotsRemaining: 3,
      chosenActionIds: [],
      monthlyFocus: getMonthFocus(1),
      lastSettlement: null,
    },
    meta: mergedMeta,
    history: [],
    currentScene: null,
    currentOptions: [],
    pendingAction: null,
    endingSummary: null,
    ui: {
      loading: false,
      expandedPanels: ['status', 'pressure', 'story', 'actions'],
    },
  }

  syncDerivedState(run)
  return run
}

export function getCurrentLocation(run: RunState): LocationState {
  return run.map.locations[run.map.currentLocationId]
}

export function getCurrentLocationNpcs(run: RunState): NpcState[] {
  return getCurrentLocation(run).npcIds.map((npcId) => run.npcs[npcId]).filter(Boolean)
}

export function getTravelEdges(run: RunState) {
  return run.map.travelGraph.filter((edge) => edge.from === run.map.currentLocationId)
}

function hasItem(run: RunState, itemId: string) {
  return run.player.items.some((item) => item.id === itemId && item.quantity > 0)
}

function spendCosts(run: RunState, option: ActionOption) {
  const { hp, mp, spiritStone, lifespan, heartDemon } = option.costs

  if (hp) run.player.hp = clamp(run.player.hp - hp, 0, run.player.hpMax)
  if (mp) run.player.mp = clamp(run.player.mp - mp, 0, run.player.mpMax)
  if (spiritStone) run.player.spiritStone = Math.max(0, run.player.spiritStone - spiritStone)
  if (lifespan) run.player.lifespan = Math.max(0, run.player.lifespan - lifespan)
  if (heartDemon) run.player.heartDemon = clamp(run.player.heartDemon + heartDemon, 0, 10)
}

function checkConditions(run: RunState, conditions: ActionOption['requirements']) {
  return conditions.every((condition) => {
    switch (condition.type) {
      case 'month_gte':
        return run.world.month >= Number(condition.value)
      case 'location_is':
        return run.map.currentLocationId === condition.value
      case 'realm_gte':
        return compareRealm(run.player.realm, condition.value as RealmKey) >= 0
      case 'has_item':
        return hasItem(run, String(condition.value))
      case 'favor_gte':
        return (run.npcs[condition.key]?.favor ?? 0) >= Number(condition.value)
      case 'flag_on':
        return hasFlag(run, condition.key)
      case 'event_stage':
        return run.events[condition.key]?.stage === Number(condition.value)
      case 'status_has':
        return run.player.statusTags.includes(condition.value as StatusTag)
      case 'causality_status':
        return findCausality(run, condition.key)?.status === condition.value
      default:
        return true
    }
  })
}

function baseOption(
  run: RunState,
  option: Omit<ActionOption, 'id' | 'disabled' | 'disabledReason'>,
): ActionOption {
  const insufficientSpiritStone =
    option.costs.spiritStone !== undefined && run.player.spiritStone < option.costs.spiritStone
  const insufficientMp = option.costs.mp !== undefined && run.player.mp < option.costs.mp
  const insufficientHp = option.costs.hp !== undefined && run.player.hp <= option.costs.hp
  const insufficientSlots = run.monthPlan.slotsRemaining < option.slotCost
  const conditionsPassed = checkConditions(run, option.requirements)

  return {
    ...option,
    id: createId(option.kind),
    disabled: insufficientSpiritStone || insufficientMp || insufficientHp || insufficientSlots || !conditionsPassed,
    disabledReason: insufficientSpiritStone
      ? '灵石不足'
      : insufficientMp
      ? '真气不足'
      : insufficientHp
      ? '气血过低'
      : insufficientSlots
      ? '本月行动槽不足'
      : conditionsPassed
      ? undefined
      : '当前条件不足',
  }
}

function createRestAction(run: RunState): ActionOption {
  const location = getCurrentLocation(run)

  return baseOption(run, {
    kind: 'rest',
    title: location.type === 'safe' ? '稳妥休整' : '压住伤势',
    desc:
      location.type === 'safe'
        ? '花一格行动槽把气血、真气和状态拉回安全线。'
        : '强行按住伤势，至少保证这个月不会当场崩盘。',
    risk: 'low',
    slotCost: 1,
    timeCostMonths: 0,
    costs: {},
    primaryRewards: ['恢复气血', '恢复真气', '降低心魔'],
    primaryCosts: ['占用 1 行动槽'],
    requirements: [],
    tags: ['steady', 'recover'],
    resolver: 'resolveRest',
  })
}

function createGrowthAction(run: RunState): ActionOption {
  const location = getCurrentLocation(run)

  if (run.player.realmProgress >= 100) {
    return baseOption(run, {
      kind: 'breakthrough',
      title: '稳妥冲关',
      desc: '拿资源和时间换更高成功率，把这次突破当成人生节点而不是按钮。',
      risk: 'mid',
      slotCost: 2,
      timeCostMonths: 0,
      costs: {
        mp: 10,
        spiritStone: 8,
      },
      primaryRewards: ['提升境界', '刷新后续行动池'],
      primaryCosts: ['消耗 2 行动槽', '需要稳定心境'],
      requirements: [],
      tags: ['growth', 'steady', 'breakthrough'],
      targetType: 'breakthrough',
      resolver: 'resolveBreakthrough',
    })
  }

  return baseOption(run, {
    kind: 'cultivate',
    title: location.id === 'backhill_cave' ? '借灵脉闭关' : '稳妥吐纳',
    desc:
      location.id === 'backhill_cave'
        ? '在后山洞府把修为拉高一截，适合本月想稳扎稳打的人。'
        : '稳定积累修为，慢，但不会把自己送进坑里。',
    risk: location.id === 'backhill_cave' ? 'mid' : 'low',
    slotCost: 1,
    timeCostMonths: 0,
    costs: {
      mp: location.id === 'backhill_cave' ? 8 : 5,
    },
    primaryRewards: ['修为提升', '可能稳定道心'],
    primaryCosts: ['消耗真气'],
    requirements: [],
    tags: ['growth', location.id === 'backhill_cave' ? 'spell' : 'survival'],
    resolver: 'resolveCultivation',
  })
}

function createNarrativeAction(run: RunState): ActionOption {
  const location = getCurrentLocation(run)
  const month = run.world.month

  if (location.id === 'ruined_temple' && !hasFlag(run, 'rescued_suwanchan') && !hasFlag(run, 'sold_suwanchan')) {
    return baseOption(run, {
      kind: 'investigate',
      title: '救下苏晚蝉',
      desc: '这不是一次普通善举，而是一条未来一定会回来的因果线。',
      risk: 'mid',
      slotCost: 1,
      timeCostMonths: 0,
      costs: { mp: 5 },
      primaryRewards: ['种下正向因果', '关键 NPC 信任', '后续护法可能'],
      primaryCosts: ['占用 1 行动槽', '可能卷入旧案'],
      requirements: [],
      tags: ['causality', 'npc', 'stage'],
      relatedEventId: 'event_rescue_girl',
      relatedNpcId: 'npc_mysterious_girl',
      relatedCausalityId: 'cause_suwanchan',
      resolver: 'resolveInvestigate',
    })
  }

  if (location.id === 'green_wood_market' && !hasFlag(run, 'investigated_scroll')) {
    return baseOption(run, {
      kind: 'investigate',
      title: '调查残卷来路',
      desc: '残卷会给你成长线，也会让黑市开始记住你。',
      risk: 'mid',
      slotCost: 1,
      timeCostMonths: 0,
      costs: { spiritStone: 2 },
      primaryRewards: ['残卷线索', '修为成长', '中期回报'],
      primaryCosts: ['灵石', '会种下黑市因果'],
      requirements: [],
      tags: ['causality', 'scroll', 'growth'],
      relatedEventId: 'event_scroll_line',
      relatedNpcId: 'npc_old_man',
      relatedCausalityId: 'cause_scroll',
      resolver: 'resolveInvestigate',
    })
  }

  const returned = run.causality.returned[0]
  if (returned) {
    return baseOption(run, {
      kind: 'event',
      title: `处理因果：${returned.title}`,
      desc: '旧事已经回来，不处理只会带着它进入下个月。',
      risk: returned.intensity >= 7 ? 'high' : 'mid',
      slotCost: 1,
      timeCostMonths: 0,
      costs: {},
      primaryRewards: ['化解或兑现旧债', '锁定终局走向'],
      primaryCosts: ['放着不管会在月末恶化'],
      requirements: [],
      tags: ['causality', 'returned'],
      relatedCausalityId: returned.id,
      resolver: 'resolveEvent',
    })
  }

  if (location.id === 'sect_gate' && month <= 2 && !hasFlag(run, 'passed_sect_trial')) {
    return baseOption(run, {
      kind: 'event',
      title: '参加宗门试炼',
      desc: '用一次结构化试炼给自己换入场资格，过了就不再只是散修。',
      risk: 'mid',
      slotCost: 1,
      timeCostMonths: 0,
      costs: { mp: 6 },
      primaryRewards: ['宗门资格', '声望', '后续正道支援'],
      primaryCosts: ['错过时机就只能走更贵的路'],
      requirements: [],
      tags: ['main', 'sect', 'stage'],
      relatedEventId: 'event_sect_recruitment',
      relatedNpcId: 'npc_sect_deacon',
      relatedCausalityId: 'cause_alignment',
      resolver: 'resolveEvent',
    })
  }

  if (location.id === 'sect_gate' && month >= 5 && !hasFlag(run, 'secret_realm_ticket')) {
    return baseOption(run, {
      kind: 'event',
      title: '参加秘境资格争夺',
      desc: '前半生积攒的修为、关系和因果，会在这一格行动里被统一结算。',
      risk: 'high',
      slotCost: 2,
      timeCostMonths: 0,
      costs: { mp: 10, spiritStone: 4 },
      primaryRewards: ['秘境资格', '主线成功', '结局上限'],
      primaryCosts: ['消耗 2 行动槽', '失败会直接影响终局'],
      requirements: [],
      tags: ['main', 'deadline', 'qualification'],
      relatedEventId: 'event_secret_realm',
      resolver: 'resolveEvent',
    })
  }

  return baseOption(run, {
    kind: 'investigate',
    title: '整理当月局势',
    desc: '把流言、关系和下一阶段目标梳理清楚，为后面的月度动作定方向。',
    risk: 'low',
    slotCost: 1,
    timeCostMonths: 0,
    costs: {},
    primaryRewards: ['刷新风向', '降低失误'],
    primaryCosts: ['收益偏稳'],
    requirements: [],
    tags: ['stage', 'planning'],
    resolver: 'resolveInvestigate',
  })
}

function createPressureAction(run: RunState): ActionOption {
  const location = getCurrentLocation(run)
  const month = run.world.month

  if (month <= 2 && !hasFlag(run, 'rescued_suwanchan') && !hasFlag(run, 'sold_suwanchan') && location.id !== 'ruined_temple') {
    return baseOption(run, {
      kind: 'travel',
      title: '先去旧庙看那名重伤修士',
      desc: '前期最容易种下长期因果的一步，拖太久就会直接错过。',
      risk: 'mid',
      slotCost: 1,
      timeCostMonths: 0,
      costs: {},
      primaryRewards: ['开启救人因果线'],
      primaryCosts: ['占用 1 行动槽'],
      requirements: [],
      tags: ['travel', 'causality', 'npc'],
      targetId: 'ruined_temple',
      targetType: 'location',
      resolver: 'resolveTravel',
    })
  }

  if (location.id === 'green_wood_market' && month >= 3 && !hasFlag(run, 'chose_sect') && !hasFlag(run, 'chose_wanderer')) {
    return baseOption(run, {
      kind: 'trade',
      title: '把消息卖给韩逐尘',
      desc: '这是最直接的灵石和黑市支持，但也会把你往灰线里推。',
      risk: 'high',
      slotCost: 1,
      timeCostMonths: 0,
      costs: {},
      primaryRewards: ['灵石', '黑市支援', '灰线资格'],
      primaryCosts: ['恶名', '站队因果'],
      requirements: [],
      tags: ['alignment', 'black_market', 'high_reward'],
      relatedNpcId: 'npc_wanderer',
      relatedCausalityId: 'cause_alignment',
      resolver: 'resolveTrade',
    })
  }

  if (location.id === 'sect_gate' && month >= 3 && !hasFlag(run, 'chose_sect')) {
    return baseOption(run, {
      kind: 'social',
      title: '向陆执事递交情报',
      desc: '提前把自己绑到宗门这边，能换来后期更稳的资格支援。',
      risk: 'mid',
      slotCost: 1,
      timeCostMonths: 0,
      costs: {},
      primaryRewards: ['宗门信任', '声望', '正线支援'],
      primaryCosts: ['会得罪黑市一边'],
      requirements: [],
      tags: ['alignment', 'sect', 'support'],
      relatedNpcId: 'npc_sect_deacon',
      relatedCausalityId: 'cause_alignment',
      resolver: 'resolveSocial',
    })
  }

  if (location.id !== 'blackwind_ridge' && month >= 3) {
    return baseOption(run, {
      kind: 'travel',
      title: '赶去黑风岭搜集秘境材料',
      desc: '资格战不只看关系，缺材料的人到了终局一样会卡死。',
      risk: 'mid',
      slotCost: 1,
      timeCostMonths: 0,
      costs: {},
      primaryRewards: ['切换到材料地点', '打开高收益成长线'],
      primaryCosts: ['占用 1 行动槽'],
      requirements: [],
      tags: ['travel', 'main', 'materials'],
      targetId: 'blackwind_ridge',
      targetType: 'location',
      resolver: 'resolveTravel',
    })
  }

  if (location.id !== 'sect_gate' && month <= 2) {
    return baseOption(run, {
      kind: 'travel',
      title: '前往宗门山门',
      desc: '若还想走正线入口，现在去还不算太晚。',
      risk: 'low',
      slotCost: 1,
      timeCostMonths: 0,
      costs: {},
      primaryRewards: ['开启宗门行动池'],
      primaryCosts: ['占用 1 行动槽'],
      requirements: [],
      tags: ['travel', 'main'],
      targetId: 'sect_gate',
      targetType: 'location',
      resolver: 'resolveTravel',
    })
  }

  return baseOption(run, {
    kind: 'travel',
    title: '转场寻找新机会',
    desc: '换个地方，换一套行动池，避免这个月只剩同质化选项。',
    risk: 'low',
    slotCost: 1,
    timeCostMonths: 0,
    costs: {},
    primaryRewards: ['改变地点', '刷新机会'],
    primaryCosts: ['占用 1 行动槽'],
    requirements: [],
    tags: ['travel'],
    targetId: location.id === 'green_wood_market' ? 'backhill_cave' : 'green_wood_market',
    targetType: 'location',
    resolver: 'resolveTravel',
  })
}

function createGambleAction(run: RunState): ActionOption {
  const location = getCurrentLocation(run)

  if (run.player.realmProgress >= 100) {
    return baseOption(run, {
      kind: 'breakthrough',
      title: '强行破境',
      desc: '用气血和心魔去赌滚雪球，成功很赚，失败就带着裂痕进终局。',
      risk: 'high',
      slotCost: 2,
      timeCostMonths: 0,
      costs: {
        hp: 12,
        mp: 8,
        heartDemon: 2,
      },
      primaryRewards: ['更快破境', '高额构筑成长'],
      primaryCosts: ['心魔', '重伤风险', '消耗 2 行动槽'],
      requirements: [],
      tags: ['breakthrough', 'forced', 'high_reward'],
      targetType: 'breakthrough',
      resolver: 'resolveBreakthrough',
    })
  }

  return baseOption(run, {
    kind: 'explore',
    title: location.id === 'blackwind_ridge' ? '深入黑风岭' : '赌一把黑市偏门',
    desc:
      location.id === 'blackwind_ridge'
        ? '直接往高收益区域里钻，可能补齐秘境材料，也可能把自己打残。'
        : '用高风险方式换灵石和线索，不适合怕背锅的人。',
    risk: 'high',
    slotCost: 1,
    timeCostMonths: 0,
    costs: {
      mp: 6,
      hp: location.id === 'blackwind_ridge' ? 8 : 3,
    },
    primaryRewards: ['高额资源', '主线捷径', '构筑偏移'],
    primaryCosts: ['气血', '真气', '高波动后果'],
    requirements: [],
    tags: ['gamble', location.id === 'blackwind_ridge' ? 'materials' : 'black_market'],
    resolver: location.id === 'blackwind_ridge' ? 'resolveExplore' : 'resolveTrade',
  })
}

function createCustomAction(run: RunState): ActionOption {
  return baseOption(run, {
    kind: 'custom',
    title: '自定义行动',
    desc: '保留自由度，但系统会先映射到最近的合法月度行动，不再走自由聊天主循环。',
    risk: 'mid',
    slotCost: 1,
    timeCostMonths: 0,
    costs: {},
    primaryRewards: ['保留创意空间'],
    primaryCosts: ['会被映射为合法结构化行动'],
    requirements: [],
    tags: ['custom'],
    resolver: 'resolveCustomAction',
  })
}

function buildActionPool(run: RunState) {
  return [
    createRestAction(run),
    createGrowthAction(run),
    createNarrativeAction(run),
    createPressureAction(run),
    createGambleAction(run),
    createCustomAction(run),
  ]
}

function topBuildTags(buildTags: Record<BuildTag, number>) {
  return Object.entries(buildTags)
    .sort((left, right) => right[1] - left[1])
    .filter(([, value]) => value > 0)
    .slice(0, 3)
    .map(([tag, value]) => `${BUILD_TAG_LABELS[tag as BuildTag]} ${value}`)
    .join(' / ')
}

function buildScene(run: RunState): SceneState {
  const location = getCurrentLocation(run)
  const returnedTitles = run.causality.returned.map((item) => item.title)
  const urgentCountdown = run.world.activeCountdowns[0]
  const settlement = run.monthPlan.lastSettlement
  const resultBlocks = settlement
    ? [
        settlement.summary,
        ...settlement.worldChanges.slice(0, 2),
      ]
    : []

  const summaryParts = [
    `当前是第 ${run.world.month} 月，处于 ${run.lifeStage.title}。${run.lifeStage.goalSummary}`,
    `${location.name}：${location.description}`,
    run.mainPressure?.status === 'active'
      ? `主线压力“${run.mainPressure.title}”还剩 ${run.mainPressure.remainMonths} 个月。${run.mainPressure.summary}`
      : run.mainPressure?.status === 'resolved'
      ? '你已经拿到秘境资格，后续将直接影响结局标签。'
      : '你没能在主线压力内拿到资格，这会明显压低终局上限。',
  ]

  if (returnedTitles.length > 0) {
    summaryParts.push(`已回来的因果：${returnedTitles.join('、')}。`)
  }

  const riskHints = [
    `本月还剩 ${run.monthPlan.slotsRemaining}/${run.monthPlan.slotsTotal} 个行动槽。`,
    urgentCountdown
      ? `${urgentCountdown.title} 剩余 ${urgentCountdown.remainMonths} 个月。`
      : '当前没有新的外部倒计时，但你的旧选择仍会继续发酵。',
  ]

  if (run.player.hp / run.player.hpMax <= 0.45) {
    riskHints.push('气血偏低，再点高风险行动可能直接把局势送进终局。')
  }

  if (run.player.heartDemon >= 6) {
    riskHints.push('心魔已经足够高，强行突破或旧债回收都可能被放大成坏结局。')
  }

  if (!hasFlag(run, 'secret_realm_ticket') && run.world.month >= 5) {
    riskHints.push('资格争夺阶段已经开始，继续拖延会把前面攒的优势一点点烧掉。')
  }

  return {
    sceneType: settlement ? 'settlement' : run.causality.returned.length > 0 ? 'event' : 'normal',
    title: `${run.lifeStage.title} · ${location.name}`,
    summary: summaryParts.slice(0, 4).join(' '),
    riskHints: riskHints.slice(0, 4),
    resultBlocks,
    remark: `月度关注：${run.monthPlan.monthlyFocus}｜构筑倾向：${topBuildTags(run.player.buildTags)}`,
    locationId: location.id,
  }
}

export function applyTurnEnhancement(run: RunState, enhancement: TurnEnhancement): RunState {
  const next = cloneState(run)

  if (next.currentScene) {
    next.currentScene.title = enhancement.sceneTitle || next.currentScene.title
    next.currentScene.summary = enhancement.sceneSummary || next.currentScene.summary
    next.currentScene.riskHints =
      enhancement.riskHints.length > 0 ? enhancement.riskHints.slice(0, 4) : next.currentScene.riskHints
    next.currentScene.remark = enhancement.remark || next.currentScene.remark
  }

  next.currentOptions = next.currentOptions.map((option) => {
    const text = enhancement.optionTexts.find((item) => item.id === option.id)
    if (!text) return option

    return {
      ...option,
      title: text.title || option.title,
      desc: text.desc || option.desc,
    }
  })

  return next
}

export function applyResolutionEnhancement(
  resolution: ActionResolution,
  enhancement: ResolutionEnhancement,
): ActionResolution {
  return {
    ...resolution,
    title: enhancement.title || resolution.title,
    summary: enhancement.summary || resolution.summary,
    resultBlocks:
      enhancement.resultBlocks.length > 0 ? enhancement.resultBlocks : resolution.resultBlocks,
  }
}

export function generateTurn(run: RunState): RunState {
  const next = cloneState(run)
  next.phase = 'generate_turn'
  next.ui.error = undefined
  next.currentOptions = buildActionPool(next).filter((option) => !option.disabled)
  next.currentScene = buildScene(next)
  next.phase = 'choose_action'
  return next
}

export function refreshRunState(run: RunState): RunState {
  const next = cloneState(run)
  syncDerivedState(next)
  return next
}

function appendHistory(run: RunState, option: ActionOption, resolution: ActionResolution) {
  const log: TurnLog = {
    turn: run.turn,
    month: run.world.month,
    phase: run.phase,
    actionId: option.id,
    actionTitle: option.title,
    summary: resolution.summary,
    gains: resolution.gains,
    losses: resolution.losses,
    triggeredEventIds: resolution.triggeredEventIds ?? [],
    snapshotAt: Date.now(),
  }

  run.history = [log, ...run.history].slice(0, 30)
}

function applyMonthlyWear(run: RunState) {
  run.player.lifespan = clamp(Number((run.player.lifespan - 1.5).toFixed(1)), 0, run.player.lifespanMax)
  run.world.age = Number((run.world.age + 0.08).toFixed(2))
  run.player.hp = clamp(run.player.hp + 6, 0, run.player.hpMax)
  run.player.mp = clamp(run.player.mp + 8, 0, run.player.mpMax)

  if (run.player.realmProgress >= 100 && !hasFlag(run, 'secret_realm_ticket')) {
    run.player.heartDemon = clamp(run.player.heartDemon + 1, 0, 10)
  }
}

function progressStageAndEvents(run: RunState, settlement: MonthSettlement) {
  const month = run.world.month

  if (month > 2 && !hasFlag(run, 'passed_sect_trial')) {
    run.events.event_sect_recruitment.status = 'failed'
    settlement.worldChanges.push('宗门收徒窗口关闭，你失去了最稳的前期入口。')
  }

  if (month > 2 && run.events.event_rescue_girl.status === 'active' && !hasFlag(run, 'rescued_suwanchan') && !hasFlag(run, 'sold_suwanchan')) {
    run.events.event_rescue_girl.status = 'failed'
    settlement.worldChanges.push('旧庙的气息散了，那名少女的命运不再由你直接掌控。')
  }

  if (month >= 3 && findCausality(run, 'cause_scroll')?.status === 'planted') {
    setCausalityStatus(run, 'cause_scroll', 'tracking')
    settlement.worldChanges.push('残卷的消息开始在黑市里流动，盯你的人变多了。')
  }

  if (month >= 3 && findCausality(run, 'cause_suwanchan')?.status === 'planted') {
    setCausalityStatus(run, 'cause_suwanchan', 'tracking')
    settlement.worldChanges.push('苏晚蝉的旧债并没有结束，它只是进入了追踪阶段。')
  }

  if (month >= 4 && findCausality(run, 'cause_alignment')?.status === 'planted') {
    setCausalityStatus(run, 'cause_alignment', 'tracking')
    settlement.worldChanges.push('你在人群中的立场已经开始固定，别人也会据此下注。')
  }

  if (month >= 5) {
    for (const id of ['cause_suwanchan', 'cause_scroll', 'cause_alignment']) {
      const current = findCausality(run, id)
      if (current && current.status === 'tracking') {
        setCausalityStatus(run, id, 'returned')
        settlement.triggeredCausalityIds.push(id)
      }
    }
  }

  if (month >= 5 && settlement.triggeredCausalityIds.length > 0) {
    settlement.worldChanges.push('旧因果开始成批回收，本月每一步都更难装作没发生过。')
    upsertRumor(run, '最近总有人提起你以前做过的事，像在等它们结账。')
  }

  if (month >= 7 && !hasFlag(run, 'secret_realm_ticket')) {
    run.mainPressure = run.mainPressure
      ? {
          ...run.mainPressure,
          status: 'failed',
          remainMonths: 0,
        }
      : run.mainPressure
    run.events.event_secret_realm.status = 'failed'
  }
}

function applyReturnedCausalityFailure(
  run: RunState,
  settlement: MonthSettlement,
  pendingIdsFromPreviousMonth: string[],
) {
  const unresolved = run.causality.returned.filter((record) =>
    pendingIdsFromPreviousMonth.includes(record.id),
  )
  if (unresolved.length === 0) return

  for (const record of unresolved) {
    if (record.id === 'cause_scroll') {
      addStatus(run, 'tracked')
      run.player.spiritStone = Math.max(0, run.player.spiritStone - 6)
      run.player.infamy += 1
      settlement.losses.push('残卷黑市回响未处理：灵石 -6')
      settlement.worldChanges.push('黑市决定先从你的储物袋里讨一笔。')
    } else if (record.id === 'cause_alignment') {
      run.player.reputation = Math.max(0, run.player.reputation - 1)
      run.player.infamy += 1
      settlement.losses.push('站队回响未处理：声望 -1，恶名 +1')
    } else if (record.id === 'cause_suwanchan') {
      run.player.hp = clamp(run.player.hp - 10, 0, run.player.hpMax)
      run.player.heartDemon = clamp(run.player.heartDemon + 2, 0, 10)
      settlement.losses.push('苏晚蝉旧债未处理：气血 -10，心魔 +2')
    }

    setCausalityStatus(run, record.id, 'failed')
  }
}

function settleMonth(run: RunState, carriedGains: string[], carriedLosses: string[]) {
  const settlement: MonthSettlement = {
    summary: `第 ${run.world.month} 月结束。你这一个月更像是在经营人生，而不是单纯刷数值。`,
    gains: carriedGains,
    losses: carriedLosses,
    worldChanges: [],
    triggeredCausalityIds: [],
  }

  const pendingReturnedIds = run.causality.returned.map((record) => record.id)
  applyMonthlyWear(run)
  run.world.month += 1
  run.world.day = 1
  run.monthPlan.slotsRemaining = run.monthPlan.slotsTotal
  run.monthPlan.chosenActionIds = []
  progressStageAndEvents(run, settlement)
  applyReturnedCausalityFailure(run, settlement, pendingReturnedIds)
  run.monthPlan.lastSettlement = settlement
  syncDerivedState(run)

  if (run.player.hp <= 0) {
    finishRun(run, '护人而殒')
    return
  }

  if (run.player.lifespan <= 0 || run.player.heartDemon >= 10 || run.world.month >= 7) {
    finishRun(run)
  }
}

function promoteRealm(run: RunState) {
  const currentIndex = REALM_ORDER.indexOf(run.player.realm)
  const nextRealm = REALM_ORDER[Math.min(REALM_ORDER.length - 1, currentIndex + 1)]
  run.player.realm = nextRealm
  run.player.realmLayer = REALM_ORDER.indexOf(nextRealm) + 1
  run.player.realmProgress = 0
  run.player.hpMax += 10
  run.player.mpMax += 12
  run.player.hp = run.player.hpMax
  run.player.mp = run.player.mpMax
}

function scoreBreakthrough(run: RunState, forced = false) {
  let score = 40
  score += run.player.stats.root * 3
  score += run.player.stats.comprehension * 2
  score += Math.round(run.player.realmProgress / 10)
  score -= run.player.heartDemon * 6

  if (hasFlag(run, 'suwanchan_help')) score += 16
  if (hasFlag(run, 'suwanchan_betrayal')) score -= 20
  if (hasFlag(run, 'sect_support')) score += 8
  if (forced) score -= 12

  return score
}

function resolveReturnedCausality(run: RunState, causalityId: string): ActionResolution {
  if (causalityId === 'cause_suwanchan') {
    if (hasFlag(run, 'sold_suwanchan') || run.npcs.npc_mysterious_girl.fear >= 2) {
      addFlag(run, 'suwanchan_betrayal')
      run.player.hp = clamp(run.player.hp - 16, 0, run.player.hpMax)
      run.player.heartDemon = clamp(run.player.heartDemon + 2, 0, 10)
      run.npcs.npc_mysterious_girl.relationStatus = 'enemy'
      setCausalityStatus(run, causalityId, 'resolved', {
        consequences: ['苏晚蝉在关键时刻反噬你。'],
      })
      return {
        title: '苏晚蝉反噬',
        summary: '你早先对苏晚蝉的处理方式，在中后期变成了一次清晰的反噬。',
        gains: [],
        losses: ['气血 -16', '心魔 +2'],
        resultBlocks: ['这条因果没有消失，只是挑了最疼的时候回来。'],
      }
    }

    if (run.npcs.npc_mysterious_girl.trust >= 2 || hasFlag(run, 'rescued_suwanchan')) {
      addFlag(run, 'suwanchan_help')
      run.player.mp = clamp(run.player.mp + 14, 0, run.player.mpMax)
      run.player.reputation += 1
      run.npcs.npc_mysterious_girl.relationStatus = 'ally'
      setCausalityStatus(run, causalityId, 'resolved', {
        consequences: ['苏晚蝉选择在关键节点护你一程。'],
      })
      return {
        title: '苏晚蝉护你一程',
        summary: '你早先留下的善意没有白费，她选择在中期回到你的阵线里。',
        gains: ['真气 +14', '声望 +1'],
        losses: [],
        resultBlocks: ['这次回收是帮助，也是对你此前选择的确认。'],
      }
    }

    addStatus(run, 'tracked')
    run.player.spiritStone += 4
    setCausalityStatus(run, causalityId, 'resolved')
    return {
      title: '苏晚蝉的牵连',
      summary: '她没有帮你，也没有立刻害你，只留下了一段还算温和的牵连。',
      gains: ['灵石 +4'],
      losses: ['被盯上'],
      resultBlocks: ['灰度回收同样会改变你后面的月度节奏。'],
    }
  }

  if (causalityId === 'cause_scroll') {
    if (hasFlag(run, 'sold_scroll_tip') || hasFlag(run, 'black_market_deal')) {
      addStatus(run, 'tracked')
      run.player.spiritStone += 12
      run.player.infamy += 2
      setCausalityStatus(run, causalityId, 'resolved', {
        consequences: ['黑市兑现了好处，也顺便标记了你。'],
      })
      return {
        title: '残卷黑市兑现',
        summary: '你从残卷上拿到了钱，但也把自己真正卖进了黑市的视野里。',
        gains: ['灵石 +12'],
        losses: ['恶名 +2', '被盯上'],
      }
    }

    run.player.realmProgress = clamp(run.player.realmProgress + 18, 0, 100)
    addFlag(run, 'scroll_clean_clue')
    run.player.buildTags.spell += 1
    run.player.buildTags.sword += 1
    setCausalityStatus(run, causalityId, 'resolved', {
      consequences: ['残卷终于变成了真正可用的线索。'],
    })
    return {
      title: '残卷回响成机缘',
      summary: '你没有把残卷完全卖掉，于是它在中期回到了“机缘”而不是“赃物”的形态。',
      gains: ['修为 +18%', '解锁干净线索'],
      losses: [],
    }
  }

  if (hasFlag(run, 'chose_sect')) {
    addFlag(run, 'sect_support')
    run.player.reputation += 2
    run.npcs.npc_sect_deacon.trust += 1
    setCausalityStatus(run, causalityId, 'resolved')
    return {
      title: '宗门回收旧情报',
      summary: '你此前把消息递给了宗门，所以资格战前它也愿意替你说一次话。',
      gains: ['声望 +2', '宗门支援'],
      losses: [],
    }
  }

  if (hasFlag(run, 'chose_wanderer')) {
    run.player.spiritStone += 8
    run.player.infamy += 2
    addFlag(run, 'wanderer_support')
    setCausalityStatus(run, causalityId, 'resolved')
    return {
      title: '韩逐尘兑现灰线支援',
      summary: '你欠下的灰线人情被兑现了，它不干净，但足够实用。',
      gains: ['灵石 +8', '黑市支援'],
      losses: ['恶名 +2'],
    }
  }

  run.player.reputation = Math.max(0, run.player.reputation - 1)
  run.player.infamy += 1
  setCausalityStatus(run, causalityId, 'resolved')
  return {
    title: '站队摇摆的代价',
    summary: '你没有真正站稳，于是回收也只剩下两边都不完全相信你。',
    gains: [],
    losses: ['声望 -1', '恶名 +1'],
  }
}

function resolveRest(run: RunState, option: ActionOption): ResolverOutcome {
  spendCosts(run, option)
  run.player.hp = clamp(run.player.hp + 18, 0, run.player.hpMax)
  run.player.mp = clamp(run.player.mp + 16, 0, run.player.mpMax)
  run.player.heartDemon = clamp(run.player.heartDemon - 1, 0, 10)
  removeStatus(run, 'injured')
  if (getCurrentLocation(run).type === 'safe') {
    removeStatus(run, 'tracked')
  }

  return {
    resolution: {
      title: option.title,
      summary: '你用一个行动槽把局势从“快崩了”拉回了“还可以再经营一轮”。',
      gains: ['气血 +18', '真气 +16', '心魔 -1'],
      losses: [],
    },
  }
}

function resolveCultivation(run: RunState, option: ActionOption): ResolverOutcome {
  spendCosts(run, option)
  const inCave = getCurrentLocation(run).id === 'backhill_cave'
  const gain = inCave ? 28 : 18
  run.player.realmProgress = clamp(run.player.realmProgress + gain, 0, 100)
  if (inCave) run.player.buildTags.spell += 1
  else run.player.buildTags.survival += 1
  if (inCave && run.player.stats.comprehension >= 7) {
    addStatus(run, 'enlightened')
  }

  return {
    resolution: {
      title: option.title,
      summary: '你把这格行动明确投给成长，节奏稳，但压力也没有因此暂停。',
      gains: [`修为 +${gain}%`],
      losses: option.costs.mp ? [`真气 -${option.costs.mp}`] : [],
      resultBlocks: run.player.realmProgress >= 100 ? ['你已经摸到当前境界瓶颈，下次可以考虑突破。'] : [],
    },
  }
}

function resolveExplore(run: RunState, option: ActionOption): ResolverOutcome {
  spendCosts(run, option)
  const location = getCurrentLocation(run)

  if (location.id === 'blackwind_ridge') {
    run.player.spiritStone += 8
    run.player.realmProgress = clamp(run.player.realmProgress + 14, 0, 100)
    addFlag(run, 'secret_realm_material')
    run.player.buildTags.body += 1
    run.player.buildTags.survival += 1
    return {
      resolution: {
        title: option.title,
        summary: '你用痛换到了主线材料，这是最典型的“赌命推进”。',
        gains: ['灵石 +8', '修为 +14%', '拿到秘境材料'],
        losses: ['气血受损', '真气受损'],
      },
    }
  }

  run.player.realmProgress = clamp(run.player.realmProgress + 10, 0, 100)
  run.player.spiritStone += 4
  return {
    resolution: {
      title: option.title,
      summary: '这次冒险没有爆炸，但你确实把一格行动换成了更快的成长。',
      gains: ['修为 +10%', '灵石 +4'],
      losses: option.costs.hp ? [`气血 -${option.costs.hp}`] : [],
    },
  }
}

function resolveTravel(run: RunState, option: ActionOption): ResolverOutcome {
  spendCosts(run, option)

  if (option.targetId && run.map.locations[option.targetId]) {
    run.map.currentLocationId = option.targetId
  }

  return {
    resolution: {
      title: option.title,
      summary: `你把这格行动用在了换场景上，后续的月度选项也会随地点改变。`,
      gains: [`到达 ${getCurrentLocation(run).name}`],
      losses: [],
    },
  }
}

function resolveTrade(run: RunState, option: ActionOption): ResolverOutcome {
  spendCosts(run, option)

  if (option.relatedCausalityId === 'cause_alignment') {
    addFlag(run, 'chose_wanderer')
    addFlag(run, 'sold_scroll_tip')
    run.player.spiritStone += 10
    run.player.infamy += 2
    run.npcs.npc_wanderer.favor += 2
    run.npcs.npc_wanderer.trust += 1
    addNpcHistory(run, 'npc_wanderer', '你把一部分消息卖给了韩逐尘。')
    setNpcImpression(run, 'npc_wanderer', '你愿意做交易，这比道德更有价值。')
    if (!findCausality(run, 'cause_alignment')) {
      plantCausality(run, {
        id: 'cause_alignment',
        title: '站队与告密',
        category: 'betrayal',
        ownerNpcId: 'npc_wanderer',
        summary: '你选择先把消息卖给韩逐尘，灰线会在资格战时回来。',
        intensity: 7,
        hidden: false,
        expectedReturnPhase: 'qi_late',
        expectedReturnTags: ['alignment', 'black_market'],
        consequences: ['黑市支援或灰线反噬'],
      })
    }

    return {
      resolution: {
        title: option.title,
        summary: '你把自己的一部分未来押给了韩逐尘，回报很快，代价会更晚来。',
        gains: ['灵石 +10', '韩逐尘信任 +1'],
        losses: ['恶名 +2', '种下灰线站队因果'],
        triggeredEventIds: ['event_secret_realm'],
      },
    }
  }

  run.player.spiritStone += 7
  run.player.infamy += 1
  addFlag(run, 'black_market_deal')
  return {
    resolution: {
      title: option.title,
      summary: '你从黑市里拿到了立刻见效的好处，也顺手把自己的痕迹留了下来。',
      gains: ['灵石 +7'],
      losses: ['恶名 +1'],
    },
  }
}

function resolveSocial(run: RunState, option: ActionOption): ResolverOutcome {
  spendCosts(run, option)

  if (option.relatedNpcId === 'npc_sect_deacon') {
    addFlag(run, 'chose_sect')
    run.player.reputation += 2
    run.npcs.npc_sect_deacon.favor += 2
    run.npcs.npc_sect_deacon.trust += 2
    addNpcHistory(run, 'npc_sect_deacon', '你提前把情报和诚意交到了宗门手里。')
    setNpcImpression(run, 'npc_sect_deacon', '你开始像个能被规矩接住的人。')
    if (!findCausality(run, 'cause_alignment')) {
      plantCausality(run, {
        id: 'cause_alignment',
        title: '站队与告密',
        category: 'promise',
        ownerNpcId: 'npc_sect_deacon',
        summary: '你主动向陆执事示好，宗门是否在关键时刻拉你一把，将在资格战时兑现。',
        intensity: 7,
        hidden: false,
        expectedReturnPhase: 'qi_late',
        expectedReturnTags: ['alignment', 'sect'],
        consequences: ['宗门支援或两边不讨好'],
      })
    }

    return {
      resolution: {
        title: option.title,
        summary: '你把自己提前和宗门绑定，这条线更稳，但也意味着你以后很难装作中立。',
        gains: ['声望 +2', '陆执事信任 +2'],
        losses: ['会被黑市记住'],
      },
    }
  }

  if (option.relatedNpcId === 'npc_shopkeeper') {
    run.npcs.npc_shopkeeper.favor += 1
    run.npcs.npc_shopkeeper.trust += 1
    run.player.spiritStone += 3
    addNpcHistory(run, 'npc_shopkeeper', '你在坊市里留了一个还算可靠的人情。')
    return {
      resolution: {
        title: option.title,
        summary: '这格行动没有爆点，但它让你在坊市少了一个潜在坑点。',
        gains: ['灵石 +3', '沈掌柜好感 +1'],
        losses: [],
      },
    }
  }

  return {
    resolution: {
      title: option.title,
      summary: '你把行动槽用在了维护关系上，短期看不炸，长期会被慢慢回收。',
      gains: ['关系稳定'],
      losses: [],
    },
  }
}

function resolveSectEvent(run: RunState): ActionResolution {
  const score =
    run.player.stats.comprehension +
    run.player.stats.root +
    Math.floor(run.player.realmProgress / 20) +
    Math.max(0, run.player.reputation)

  if (score >= 14) {
    addFlag(run, 'passed_sect_trial')
    run.player.reputation += 2
    run.npcs.npc_sect_deacon.trust += 1
    run.events.event_sect_recruitment.status = 'resolved'
    addNpcHistory(run, 'npc_sect_deacon', '你通过了宗门试炼。')
    return {
      title: '宗门试炼通过',
      summary: '你拿到了宗门认可，这让后续的资格线终于不再全靠硬赌。',
      gains: ['宗门资格', '声望 +2'],
      losses: [],
      triggeredEventIds: ['event_sect_recruitment'],
    }
  }

  run.player.hp = clamp(run.player.hp - 8, 0, run.player.hpMax)
  addStatus(run, 'injured')
  return {
    title: '宗门试炼失利',
    summary: '你没能一次过关，这意味着后续要么补功课，要么改走别的入口。',
    gains: [],
    losses: ['气血 -8', '受伤'],
    triggeredEventIds: ['event_sect_recruitment'],
  }
}

function resolveSecretRealmEvent(run: RunState): ActionResolution {
  let score = 0

  if (hasFlag(run, 'passed_sect_trial')) score += 2
  if (hasFlag(run, 'secret_realm_material')) score += 1
  if (hasFlag(run, 'scroll_clean_clue')) score += 1
  if (hasFlag(run, 'sect_support')) score += 2
  if (hasFlag(run, 'wanderer_support')) score += 1
  if (hasFlag(run, 'suwanchan_help')) score += 1
  if (compareRealm(run.player.realm, 'qi_4') >= 0) score += 1
  if (run.player.heartDemon >= 6) score -= 1

  if (score >= 4) {
    addFlag(run, 'secret_realm_ticket')
    run.events.event_secret_realm.status = 'resolved'
    run.mainPressure = run.mainPressure
      ? {
          ...run.mainPressure,
          status: 'resolved',
          remainMonths: 0,
        }
      : run.mainPressure
    return {
      title: '拿下秘境资格',
      summary: '你把前六个月积累的人、物、线索和境界都压了上去，终于换来资格。',
      gains: ['秘境资格', '终局上限提升'],
      losses: [],
      triggeredEventIds: ['event_secret_realm'],
    }
  }

  run.events.event_secret_realm.stage = 3
  run.player.reputation = Math.max(0, run.player.reputation - 1)
  run.player.infamy += 1
  return {
    title: '资格争夺失手',
    summary: '你没能在主线压力收口前把筹码凑够，这会直接写进结局标签。',
    gains: [],
    losses: ['声望 -1', '恶名 +1'],
    triggeredEventIds: ['event_secret_realm'],
  }
}

function resolveEvent(run: RunState, option: ActionOption): ResolverOutcome {
  if (option.relatedCausalityId) {
    return {
      resolution: resolveReturnedCausality(run, option.relatedCausalityId),
    }
  }

  if (option.relatedEventId === 'event_sect_recruitment') {
    return {
      resolution: resolveSectEvent(run),
    }
  }

  if (option.relatedEventId === 'event_secret_realm') {
    return {
      resolution: resolveSecretRealmEvent(run),
    }
  }

  return {
    resolution: {
      title: option.title,
      summary: '这个事件被你处理了，但真正的后果要靠后面的月度推进来写清楚。',
      gains: [],
      losses: [],
    },
  }
}

function resolveInvestigate(run: RunState, option: ActionOption): ResolverOutcome {
  spendCosts(run, option)

  if (option.relatedCausalityId === 'cause_suwanchan') {
    addFlag(run, 'rescued_suwanchan')
    run.npcs.npc_mysterious_girl.favor += 2
    run.npcs.npc_mysterious_girl.trust += 2
    addNpcHistory(run, 'npc_mysterious_girl', '你在旧庙里救过她一次。')
    setNpcImpression(run, 'npc_mysterious_girl', '你至少证明了自己不是见死不救的人。')
    run.events.event_rescue_girl.status = 'resolved'
    plantCausality(run, {
      id: 'cause_suwanchan',
      title: '救下苏晚蝉',
      category: 'favor',
      ownerNpcId: 'npc_mysterious_girl',
      relatedLocationId: 'ruined_temple',
      summary: '你救下了苏晚蝉，这份因果会在突破或资格战时回来。',
      intensity: 8,
      hidden: false,
      expectedReturnPhase: 'qi_late',
      expectedReturnTags: ['rescue', 'npc', 'breakthrough'],
      consequences: ['护法', '牵连', '背刺'],
    })

    return {
      resolution: {
        title: option.title,
        summary: '你把一格行动槽换成了一条以后一定会回来的因果，这正是 v2 的核心风险。',
        gains: ['苏晚蝉好感 +2', '种下正向因果'],
        losses: ['真气消耗'],
        triggeredEventIds: ['event_rescue_girl'],
      },
    }
  }

  if (option.relatedCausalityId === 'cause_scroll') {
    addFlag(run, 'investigated_scroll')
    run.player.realmProgress = clamp(run.player.realmProgress + 12, 0, 100)
    run.player.buildTags.sword += 1
    run.player.buildTags.spell += 1
    addNpcHistory(run, 'npc_old_man', '你接下了残卷这条线。')
    setNpcImpression(run, 'npc_old_man', '你果然愿意为机缘担风险。')
    run.events.event_scroll_line.stage = 2
    plantCausality(run, {
      id: 'cause_scroll',
      title: '残卷与黑市线',
      category: 'loot',
      ownerNpcId: 'npc_old_man',
      relatedLocationId: 'green_wood_market',
      summary: '你碰了残卷，黑市和旧主都会记住你。',
      intensity: 7,
      hidden: false,
      expectedReturnPhase: 'qi_late',
      expectedReturnTags: ['scroll', 'market'],
      consequences: ['黑市回报', '盯梢', '净化机缘'],
    })

    return {
      resolution: {
        title: option.title,
        summary: '残卷先给你带来了成长，但真正麻烦是它让别人也开始看见你。',
        gains: ['修为 +12%', '剑修/法修倾向 +1'],
        losses: ['灵石 -2', '种下残卷因果'],
        triggeredEventIds: ['event_scroll_line'],
      },
    }
  }

  return {
    resolution: {
      title: option.title,
      summary: '你把一格行动投给了梳理局势，这种稳健行为本身也是阶段推进的一部分。',
      gains: ['获得下一阶段提示'],
      losses: [],
    },
  }
}

function resolveBreakthrough(run: RunState, option: ActionOption): ResolverOutcome {
  spendCosts(run, option)

  if (run.world.month >= 5 && findCausality(run, 'cause_suwanchan')?.status === 'returned') {
    const causal = resolveReturnedCausality(run, 'cause_suwanchan')
    const score = scoreBreakthrough(run, option.tags.includes('forced'))
    if (score >= (option.tags.includes('forced') ? 48 : 58)) {
      promoteRealm(run)
      return {
        resolution: {
          title: option.title,
          summary: `${causal.summary} 因果被卷进突破节点，最终帮你冲开了这一步。`,
          gains: [`境界提升至 ${REALM_LABELS[run.player.realm]}`],
          losses: causal.losses,
          resultBlocks: causal.resultBlocks,
        },
      }
    }

    addStatus(run, 'unstable')
    run.player.hp = clamp(run.player.hp - 10, 0, run.player.hpMax)
    return {
      resolution: {
        title: option.title,
        summary: `${causal.summary} 这次突破没能稳住，代价被直接写进了你接下来的局势里。`,
        gains: [],
        losses: [...causal.losses, '突破失败', '气血 -10'],
      },
    }
  }

  const score = scoreBreakthrough(run, option.tags.includes('forced'))
  if (score >= (option.tags.includes('forced') ? 48 : 58)) {
    promoteRealm(run)
    if (option.tags.includes('forced')) {
      run.player.buildTags.evil += 1
    } else {
      run.player.buildTags.spell += 1
    }
    return {
      resolution: {
        title: option.title,
        summary: '你把月度行动槽烧成了一次人生跃迁，这会显著改变后面的动作权重。',
        gains: [`境界提升至 ${REALM_LABELS[run.player.realm]}`],
        losses: option.primaryCosts,
      },
    }
  }

  addStatus(run, 'unstable')
  run.player.heartDemon = clamp(run.player.heartDemon + 1, 0, 10)
  return {
    resolution: {
      title: option.title,
      summary: '你没能跨过去，这次失败不会立刻结束游戏，但会让后续风险更高。',
      gains: [],
      losses: ['突破失败', '心魔 +1', '气息不稳'],
    },
  }
}

function inferCustomAction(run: RunState, rawInput: string | undefined) {
  const input = (rawInput ?? '').trim()
  if (!input) {
    return createRestAction(run)
  }

  const options = buildActionPool(run).filter((option) => option.kind !== 'custom' && !option.disabled)

  const matchers: Array<{ pattern: RegExp; predicate: (option: ActionOption) => boolean }> = [
    { pattern: /休|疗|恢复|养/, predicate: (option) => option.kind === 'rest' },
    { pattern: /修|闭关|吐纳/, predicate: (option) => option.kind === 'cultivate' || option.kind === 'breakthrough' },
    { pattern: /破境|突破/, predicate: (option) => option.kind === 'breakthrough' },
    { pattern: /调查|打听|残卷|旧庙|秘境|资格/, predicate: (option) => ['investigate', 'event'].includes(option.kind) },
    { pattern: /卖|黑市|交易/, predicate: (option) => option.kind === 'trade' },
    { pattern: /陆执事|宗门|示好|站队/, predicate: (option) => option.relatedNpcId === 'npc_sect_deacon' || option.relatedEventId === 'event_sect_recruitment' },
    { pattern: /韩逐尘|灰线|黑市/, predicate: (option) => option.relatedNpcId === 'npc_wanderer' || option.kind === 'trade' },
    { pattern: /前往|去|赶去|转场/, predicate: (option) => option.kind === 'travel' },
    { pattern: /探索|搜集|黑风岭/, predicate: (option) => option.kind === 'explore' },
  ]

  for (const matcher of matchers) {
    if (!matcher.pattern.test(input)) continue
    const matched = options.find(matcher.predicate)
    if (matched) return matched
  }

  return options.find((option) => option.risk === 'low') ?? createRestAction(run)
}

function resolveCustomAction(run: RunState, option: ActionOption, rawInput?: string): ResolverOutcome {
  const mapped = inferCustomAction(run, rawInput)
  const outcome = resolverMap[mapped.resolver](run, mapped, rawInput)

  return {
    resolution: {
      ...outcome.resolution,
      title: `${option.title} → ${mapped.title}`,
      resultBlocks: [
        ...(outcome.resolution.resultBlocks ?? []),
        `原始输入：${rawInput?.trim() || '未提供，已回退到稳健动作。'}`,
      ],
    },
  }
}

const resolverMap: Record<
  ActionOption['resolver'],
  (run: RunState, option: ActionOption, rawInput?: string) => ResolverOutcome
> = {
  resolveRest,
  resolveCultivation,
  resolveExplore,
  resolveTravel,
  resolveTrade,
  resolveSocial,
  resolveBreakthrough,
  resolveInvestigate,
  resolveEvent,
  resolveCustomAction,
}

function resolveMetaUnlocks(endingTitle: string) {
  switch (endingTitle) {
    case '宗门新秀':
      return {
        unlockedBackgrounds: ['宗门旧识'],
        unlockedTalents: ['门规在心'],
        achievementFlags: ['ending_sect_rookie'],
      }
    case '秘境得缘':
      return {
        unlockedBackgrounds: ['秘境余辉'],
        unlockedTalents: ['机缘不绝'],
        unlockedRelics: ['前世残卷'],
        achievementFlags: ['ending_secret_realm'],
      }
    case '旧债反噬':
      return {
        unlockedBackgrounds: ['债业缠身'],
        unlockedTalents: ['债业感应'],
        achievementFlags: ['ending_old_debt'],
      }
    case '护人而殒':
      return {
        unlockedBackgrounds: ['故人遗泽'],
        unlockedTalents: ['护道人心'],
        achievementFlags: ['ending_guard'],
      }
    case '心魔噬主':
      return {
        unlockedBackgrounds: ['魔念残痕'],
        unlockedTalents: ['心魔同燃'],
        achievementFlags: ['ending_heart_demon'],
      }
    default:
      return {
        unlockedBackgrounds: ['旧市游修'],
        unlockedTalents: ['散修韧性'],
        achievementFlags: ['ending_wanderer'],
      }
  }
}

function deriveEndingTitle(run: RunState, preferred?: EndingSummary['endingTitle']) {
  if (preferred) return preferred
  if (run.player.hp <= 0 && hasFlag(run, 'rescued_suwanchan')) return '护人而殒'
  if (run.player.heartDemon >= 8 || hasFlag(run, 'suwanchan_betrayal')) return '心魔噬主'
  if (run.mainPressure?.status === 'resolved' && hasFlag(run, 'passed_sect_trial')) return '宗门新秀'
  if (run.mainPressure?.status === 'resolved') return '秘境得缘'

  const negativeCausality = run.causality.resolved.filter((item) => item.status === 'failed').length
  if (negativeCausality >= 1 || hasFlag(run, 'sold_scroll_tip') || hasFlag(run, 'chose_wanderer')) {
    return '旧债反噬'
  }

  return '凡尘散修'
}

function buildEndingSummary(run: RunState, preferredTitle?: EndingSummary['endingTitle']): EndingSummary {
  const endingTitle = deriveEndingTitle(run, preferredTitle)
  const topChoices = run.history
    .slice(0, 3)
    .map((entry) => `${entry.actionTitle}（第 ${entry.month} 月）`)
  const topCausalityReturns = run.causality.resolved
    .slice(-3)
    .map((item) => item.title)
  const relationHighlights = Object.values(run.npcs)
    .filter((npc) => npc.favor > 0 || npc.trust > 0 || npc.relationStatus === 'enemy')
    .sort((left, right) => right.trust + right.favor - (left.trust + left.favor))
    .slice(0, 3)
    .map((npc) => `${npc.name}：${npc.playerImpression}`)

  const milestones = [
    run.lifeStage.currentStage === 'ending' ? '完整走到终局结算' : '中途身死或心魔失控',
    hasFlag(run, 'passed_sect_trial') ? '拿到宗门正当入口' : '宗门入口未稳',
    hasFlag(run, 'secret_realm_ticket') ? '拿下秘境资格' : '未拿下秘境资格',
  ]

  const unlocks = resolveMetaUnlocks(endingTitle)
  run.meta = mergeMeta(run.meta, unlocks)

  return {
    endingTitle,
    endingTags: [
      endingTitle,
      run.mainPressure?.status === 'resolved' ? '主线完成' : '主线失手',
      topBuildTags(run.player.buildTags).split(' / ')[0] || '散修',
    ],
    milestones,
    topChoices,
    topCausalityReturns,
    relationHighlights,
    biography: `这一世止于“${endingTitle}”。你在第 ${run.world.month} 月前后，把修为、关系、主线和旧债经营成了如今的样子。`,
    metaUnlocks: uniq([
      ...unlocks.unlockedBackgrounds,
      ...unlocks.unlockedTalents,
      ...(unlocks.unlockedRelics ?? []),
    ]),
  }
}

function finishRun(run: RunState, preferredTitle?: EndingSummary['endingTitle']) {
  run.phase = 'game_over'
  run.currentOptions = []
  run.endingSummary = buildEndingSummary(run, preferredTitle)
  run.currentScene = {
    sceneType: 'ending',
    title: run.endingSummary.endingTitle,
    summary: `这一局的人生已经收口。${run.endingSummary.biography}`,
    riskHints: ['失败不会清零，解锁会带到下一次转世。'],
    resultBlocks: [
      `结局标签：${run.endingSummary.endingTags.join(' / ')}`,
      `关键因果：${run.endingSummary.topCausalityReturns.join('、') || '暂无'}`,
    ],
    remark: `局外解锁：${run.endingSummary.metaUnlocks.join('、') || '暂无'}`,
  }
}

export function resolveRunAction(run: RunState, actionId: string, rawInput?: string): RunState {
  const next = cloneState(run)
  next.ui.error = undefined

  const option =
    next.currentOptions.find((item) => item.id === actionId) ??
    (actionId === 'custom' ? next.currentOptions.find((item) => item.kind === 'custom') : undefined)

  if (!option) {
    next.ui.error = '未找到对应行动'
    return next
  }

  if (option.disabled) {
    next.ui.error = option.disabledReason || '当前无法执行该行动'
    return next
  }

  next.pendingAction = {
    actionId: option.id,
    rawInput,
    createdAt: Date.now(),
  }
  next.phase = 'resolve_action'

  const outcome = resolverMap[option.resolver](next, option, rawInput)
  appendHistory(next, option, outcome.resolution)
  next.monthPlan.chosenActionIds.push(option.id)
  next.monthPlan.slotsRemaining = Math.max(0, next.monthPlan.slotsRemaining - option.slotCost)
  next.turn += 1
  next.pendingAction = null

  if (next.player.hp <= 0 || next.player.lifespan <= 0 || next.player.heartDemon >= 10) {
    finishRun(next)
    return next
  }

  next.monthPlan.lastSettlement = null

  if (next.monthPlan.slotsRemaining <= 0) {
    settleMonth(next, outcome.resolution.gains, outcome.resolution.losses)
    if (next.endingSummary) {
      return next
    }
  }

  return generateTurn(next)
}

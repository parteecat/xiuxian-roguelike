import { describe, expect, it } from 'vitest'
import {
  createInitialRun,
  generateTurn,
  isRunStateCompatible,
  refreshRunState,
  resolveRunAction,
} from './runEngine'
import type { Player } from '@/types/game'
import type { RunState } from '@/types/run'

function createTestPlayer(): Player {
  return {
    id: 'player_test',
    name: '林见山',
    gender: '男',
    background: '寒门散修，曾在药铺打杂',
    realm: '炼气期',
    minorRealm: '初期',
    cultivationProgress: 18,
    spiritualEnergy: 0,
    lifespan: 120,
    maxLifespan: 120,
    age: 18,
    spiritualPower: 100,
    maxSpiritualPower: 100,
    health: 110,
    maxHealth: 110,
    attack: 28,
    defense: 22,
    speed: 24,
    luck: 62,
    rootBone: 68,
    comprehension: 66,
    karma: 0,
    talents: ['青木灵息', '稳心守一'],
    inventory: [],
    skills: [],
    relationships: {},
    growthHistory: [],
    avatar: '🗡️',
  }
}

function createPlayableRun() {
  return generateTurn(createInitialRun(createTestPlayer()))
}

function selectAction(run: RunState, matcher: (run: RunState) => string, rawInput?: string) {
  const actionId = matcher(run)
  return resolveRunAction(run, actionId, rawInput)
}

function findActionId(run: RunState, text: string) {
  const action = run.currentOptions.find((option) => option.title.includes(text))
  expect(action, `expected action with title containing "${text}"`).toBeTruthy()
  return action!.id
}

function findLowRiskActionId(run: RunState) {
  const action = run.currentOptions.find((option) => option.kind !== 'custom' && option.risk === 'low')
  expect(action, 'expected a low risk action').toBeTruthy()
  return action!.id
}

function advanceToMonth(targetMonth: number, run: RunState) {
  let next = run

  while (next.world.month < targetMonth && next.phase !== 'game_over') {
    next = selectAction(next, findLowRiskActionId)
  }

  return next
}

describe('runEngine v2 loop', () => {
  it('consumes three action slots and settles into the next month', () => {
    let run = createPlayableRun()
    const startMonth = run.world.month

    run = selectAction(run, findLowRiskActionId)
    expect(run.monthPlan.slotsRemaining).toBe(2)

    run = selectAction(run, findLowRiskActionId)
    expect(run.monthPlan.slotsRemaining).toBe(1)

    run = selectAction(run, findLowRiskActionId)
    expect(run.world.month).toBe(startMonth + 1)
    expect(run.monthPlan.slotsRemaining).toBe(3)
    expect(run.monthPlan.lastSettlement).not.toBeNull()
  })

  it('progresses from qi_early to qi_late and then to ending', () => {
    let run = createPlayableRun()

    run = advanceToMonth(4, run)
    expect(run.lifeStage.currentStage).toBe('qi_late')

    run = advanceToMonth(7, run)
    expect(run.phase).toBe('game_over')
    expect(run.lifeStage.currentStage).toBe('ending')
    expect(run.endingSummary).not.toBeNull()
  })

  it('advances rescue causality from planted to returned to resolved', () => {
    let run = createPlayableRun()

    run = selectAction(run, (current) => findActionId(current, '旧庙'))
    run = selectAction(run, (current) => findActionId(current, '救下苏晚蝉'))
    expect(run.causality.planted.map((item) => item.id)).toContain('cause_suwanchan')

    run = advanceToMonth(5, run)
    expect(run.causality.returned.map((item) => item.id)).toContain('cause_suwanchan')

    run = selectAction(run, (current) => {
      const option = current.currentOptions.find((item) => item.relatedCausalityId === 'cause_suwanchan')
      expect(option).toBeTruthy()
      return option!.id
    })

    expect(run.causality.resolved.map((item) => item.id)).toContain('cause_suwanchan')
  })

  it('advances scroll causality from planted to returned to resolved', () => {
    let run = createPlayableRun()

    run = selectAction(run, (current) => findActionId(current, '残卷'))
    expect(run.causality.planted.map((item) => item.id)).toContain('cause_scroll')

    run = advanceToMonth(5, run)
    expect(run.causality.returned.map((item) => item.id)).toContain('cause_scroll')

    run = selectAction(run, (current) => {
      const option = current.currentOptions.find((item) => item.relatedCausalityId === 'cause_scroll')
      expect(option).toBeTruthy()
      return option!.id
    })

    expect(run.causality.resolved.map((item) => item.id)).toContain('cause_scroll')
  })

  it('advances alignment causality from planted to returned to resolved', () => {
    let run = createPlayableRun()

    run.world.month = 3
    run.map.currentLocationId = 'sect_gate'
    run.monthPlan.slotsRemaining = 3
    run = generateTurn(refreshRunState(run))

    run = selectAction(run, (current) => findActionId(current, '陆执事'))
    expect(run.causality.planted.map((item) => item.id)).toContain('cause_alignment')

    run = advanceToMonth(5, run)
    expect(run.causality.returned.map((item) => item.id)).toContain('cause_alignment')

    run = selectAction(run, (current) => {
      const option = current.currentOptions.find((item) => item.relatedCausalityId === 'cause_alignment')
      expect(option).toBeTruthy()
      return option!.id
    })

    expect(run.causality.resolved.map((item) => item.id)).toContain('cause_alignment')
  })

  it('resolves main pressure success and failure branches', () => {
    let successRun = createPlayableRun()
    successRun.world.month = 5
    successRun.map.currentLocationId = 'sect_gate'
    successRun.monthPlan.slotsRemaining = 3
    successRun.player.realm = 'qi_4'
    successRun.player.realmProgress = 85
    successRun.player.flags.push('passed_sect_trial', 'secret_realm_material', 'scroll_clean_clue', 'sect_support')
    successRun = generateTurn(refreshRunState(successRun))

    successRun = selectAction(successRun, (current) => findActionId(current, '秘境资格争夺'))
    expect(successRun.player.flags).toContain('secret_realm_ticket')
    expect(successRun.mainPressure?.status).toBe('resolved')

    let failedRun = createPlayableRun()
    failedRun.world.month = 5
    failedRun.map.currentLocationId = 'sect_gate'
    failedRun.monthPlan.slotsRemaining = 3
    failedRun.player.realm = 'qi_2'
    failedRun.player.realmProgress = 20
    failedRun = generateTurn(refreshRunState(failedRun))

    failedRun = selectAction(failedRun, (current) => findActionId(current, '秘境资格争夺'))
    expect(failedRun.player.flags).not.toContain('secret_realm_ticket')
    expect(failedRun.events.event_secret_realm.status).not.toBe('resolved')
  })

  it('applies ending priority and meta unlocks on game over', () => {
    let run = createPlayableRun()
    run.player.heartDemon = 10

    run = selectAction(run, (current) => {
      const option = current.currentOptions.find((item) => item.kind === 'cultivate')
      expect(option).toBeTruthy()
      return option!.id
    })
    expect(run.phase).toBe('game_over')
    expect(run.endingSummary?.endingTitle).toBe('心魔噬主')
    expect(run.meta.unlockedBackgrounds).toContain('魔念残痕')
    expect(run.meta.unlockedTalents).toContain('心魔同燃')
  })

  it('rejects incompatible saved run versions', () => {
    expect(isRunStateCompatible({ version: '2.0.0' })).toBe(true)
    expect(isRunStateCompatible({ version: '1.0.0' } as Pick<RunState, 'version'>)).toBe(false)
    expect(isRunStateCompatible(null)).toBe(false)
  })
})

import {
  buildEndingEnhancementPrompt,
  buildTurnEnhancementPrompt,
  endingSystemPrompt,
  turnSystemPrompt,
} from '@/prompts/turn'
import { useTokenStore } from '@/stores/useTokenStore'
import type { Player } from '@/types/game'
import type { EndingEnhancement, MetaState, RunState, TurnEnhancement } from '@/types/run'
import type { LLMService } from './llmService'
import {
  applyTurnEnhancement,
  createInitialRun,
  generateTurn,
  getCurrentLocation,
  getCurrentLocationNpcs,
  getVisibleCausality,
  resolveRunAction,
} from './runEngine'

export class RunService {
  private llmService: LLMService

  constructor(llmService: LLMService) {
    this.llmService = llmService
  }

  private recordTokenUsage(
    usage:
      | {
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
        }
      | undefined,
  ) {
    if (!usage) return

    useTokenStore.getState().addUsage({
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    })
  }

  createRun(player: Player, meta?: MetaState): RunState {
    return createInitialRun(player, meta)
  }

  async prepareTurn(run: RunState): Promise<RunState> {
    if (run.phase === 'game_over' && run.endingSummary) {
      return this.enhanceEnding(run)
    }

    const next =
      run.phase === 'choose_action' && run.currentScene && run.currentOptions.length > 0
        ? run
        : generateTurn(run)

    return this.enhanceTurn(next)
  }

  async submitAction(run: RunState, actionId: string, rawInput?: string): Promise<RunState> {
    const next = resolveRunAction(run, actionId, rawInput)

    if (next.phase === 'game_over' && next.endingSummary) {
      return this.enhanceEnding(next)
    }

    if (next.phase === 'choose_action' && next.currentScene && next.currentOptions.length > 0) {
      return this.enhanceTurn(next)
    }

    return next
  }

  private async enhanceTurn(run: RunState): Promise<RunState> {
    if (!this.llmService.isConfigured() || !run.currentScene) {
      return run
    }

    try {
      const payload = JSON.stringify(
        {
          phase: run.phase,
          world: {
            month: run.world.month,
            year: run.world.year,
            season: run.world.season,
            weather: run.world.weather,
            age: run.world.age,
            dangerLevel: run.world.dangerLevel,
            worldTags: run.world.worldTags,
            rumors: run.world.rumors,
          },
          lifeStage: run.lifeStage,
          mainPressure: run.mainPressure,
          monthPlan: run.monthPlan,
          player: {
            name: run.player.name,
            realm: run.player.realm,
            realmProgress: run.player.realmProgress,
            hp: run.player.hp,
            hpMax: run.player.hpMax,
            mp: run.player.mp,
            mpMax: run.player.mpMax,
            lifespan: run.player.lifespan,
            lifespanMax: run.player.lifespanMax,
            spiritStone: run.player.spiritStone,
            heartDemon: run.player.heartDemon,
            reputation: run.player.reputation,
            infamy: run.player.infamy,
            statusTags: run.player.statusTags,
            buildTags: run.player.buildTags,
          },
          visibleCausality: getVisibleCausality(run),
          location: getCurrentLocation(run),
          npcs: getCurrentLocationNpcs(run).map((npc) => ({
            id: npc.id,
            name: npc.name,
            title: npc.title,
            favor: npc.favor,
            trust: npc.trust,
            fear: npc.fear,
            relationStatus: npc.relationStatus,
            playerImpression: npc.playerImpression,
            sharedHistory: npc.sharedHistory,
            functions: npc.functions,
          })),
          events: Object.values(run.events)
            .filter((event) => event.status === 'active')
            .slice(0, 4),
          localScene: run.currentScene,
          options: run.currentOptions.map((option) => ({
            id: option.id,
            kind: option.kind,
            title: option.title,
            desc: option.desc,
            risk: option.risk,
            slotCost: option.slotCost,
            timeCostMonths: option.timeCostMonths,
            primaryRewards: option.primaryRewards,
            primaryCosts: option.primaryCosts,
            tags: option.tags,
          })),
        },
        null,
        2,
      )

      const response = await this.llmService.generate(
        [
          { role: 'system', content: turnSystemPrompt },
          { role: 'user', content: buildTurnEnhancementPrompt(payload) },
        ],
        {
          temperature: 0.55,
          response_format: { type: 'json_object' },
          max_tokens: 1200,
        },
      )

      this.recordTokenUsage(response.usage)

      const parsed = JSON.parse(response.content) as Partial<TurnEnhancement>
      if (!parsed.sceneTitle || !parsed.sceneSummary || !Array.isArray(parsed.optionTexts)) {
        return run
      }

      return applyTurnEnhancement(run, {
        sceneTitle: parsed.sceneTitle,
        sceneSummary: parsed.sceneSummary,
        riskHints: Array.isArray(parsed.riskHints) ? parsed.riskHints.filter(Boolean).slice(0, 4) : [],
        remark: parsed.remark,
        optionTexts: parsed.optionTexts
          .filter((item): item is { id: string; title: string; desc: string } =>
            Boolean(item?.id && typeof item.title === 'string' && typeof item.desc === 'string'),
          )
          .slice(0, run.currentOptions.length),
      })
    } catch (error) {
      console.warn('月度润色失败，回退到本地文案:', error)
      return run
    }
  }

  private async enhanceEnding(run: RunState): Promise<RunState> {
    if (!this.llmService.isConfigured() || !run.endingSummary) {
      return run
    }

    try {
      const payload = JSON.stringify(
        {
          ending: run.endingSummary,
          lifeStage: run.lifeStage,
          mainPressure: run.mainPressure,
          player: {
            name: run.player.name,
            realm: run.player.realm,
            lifespan: run.player.lifespan,
            reputation: run.player.reputation,
            infamy: run.player.infamy,
            buildTags: run.player.buildTags,
          },
          history: run.history.slice(0, 6),
        },
        null,
        2,
      )

      const response = await this.llmService.generate(
        [
          { role: 'system', content: endingSystemPrompt },
          { role: 'user', content: buildEndingEnhancementPrompt(payload) },
        ],
        {
          temperature: 0.7,
          response_format: { type: 'json_object' },
          max_tokens: 900,
        },
      )

      this.recordTokenUsage(response.usage)

      const parsed = JSON.parse(response.content) as Partial<EndingEnhancement>
      const next = structuredClone(run)

      if (!next.endingSummary) {
        return run
      }

      if (typeof parsed.biography === 'string' && parsed.biography.trim()) {
        next.endingSummary.biography = parsed.biography.trim()
      }

      if (Array.isArray(parsed.topChoices) && parsed.topChoices.length > 0) {
        next.endingSummary.topChoices = parsed.topChoices.filter(Boolean).slice(0, 3)
      }

      if (Array.isArray(parsed.topCausalityReturns) && parsed.topCausalityReturns.length > 0) {
        next.endingSummary.topCausalityReturns = parsed.topCausalityReturns.filter(Boolean).slice(0, 3)
      }

      if (Array.isArray(parsed.relationHighlights) && parsed.relationHighlights.length > 0) {
        next.endingSummary.relationHighlights = parsed.relationHighlights.filter(Boolean).slice(0, 3)
      }

      if (next.currentScene) {
        next.currentScene.summary = `这一局的人生已经收口。${next.endingSummary.biography}`
        next.currentScene.resultBlocks = [
          `结局标签：${next.endingSummary.endingTags.join(' / ')}`,
          `关键因果：${next.endingSummary.topCausalityReturns.join('、') || '暂无'}`,
        ]
      }

      return next
    } catch (error) {
      console.warn('局终传记润色失败，回退到本地结算文案:', error)
      return run
    }
  }
}

export const createRunService = (llmService: LLMService) => new RunService(llmService)

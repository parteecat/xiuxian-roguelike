
import { LLMService } from './llmService'
import { MemoryService } from './memoryService'
import { db } from './db'
import { characterSystemPrompt, characterGenerationPrompt } from '@/prompts/character'
import { storySystemPrompt, storyGenerationPrompt } from '@/prompts/story'
import type { Player, GameLog, NPC, Item, Skill, GameState, Time } from '@/types/game'

export interface GeneratedCharacter {
  characters: Player[]
}

export interface StoryResult {
  story: string
  timePassed: Time
  cultivationGained: number
  spiritualEnergyGained: number
  breakthrough: {
    occurred: boolean
    success: boolean
    newRealm: string
    newMinorRealm: string
  }
  statChanges: {
    health?: number
    maxHealth?: number
    spiritualPower?: number
    maxSpiritualPower?: number
    attack?: number
    defense?: number
    speed?: number
    luck?: number
    lifespan?: number
    rootBone?: number
    comprehension?: number
    karma?: number
  }
  itemsGained: Item[]
  itemsLost: string[]
  skillsGained: Skill[]
  skillsImproved: string[]
  npcsMet: NPC[]
  relationshipsUpdate: Record<string, { favorabilityChange: number; newLevel?: string }>
  events: string[]
  suggestedActions: string[]
}

export class GameService {
  private llmService: LLMService
  private memoryService: MemoryService | null = null
  private saveId: string = ''

  constructor(llmService: LLMService) {
    this.llmService = llmService
  }

  initialize(saveId: string) {
    this.saveId = saveId
    this.memoryService = new MemoryService(this.llmService, saveId)
  }

  // 生成角色
  async generateCharacters(): Promise<Player[]> {
    const messages = [
      { role: 'system' as const, content: characterSystemPrompt },
      { role: 'user' as const, content: characterGenerationPrompt },
    ]

    const response = await this.llmService.generate(messages, {
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const result: GeneratedCharacter = JSON.parse(response.content)
    
    // 确保所有必要字段都存在
    return result.characters.map(char => ({
      ...char,
      id: this.generateId(),
      growthHistory: [],
      skills: [],
      relationships: {},
      inventory: [],
      // 确保所有属性都有默认值
      health: char.health || char.maxHealth || 100,
      maxHealth: char.maxHealth || char.health || 100,
      spiritualPower: char.spiritualPower || char.maxSpiritualPower || 100,
      maxSpiritualPower: char.maxSpiritualPower || char.spiritualPower || 100,
      attack: char.attack || 20,
      defense: char.defense || 20,
      speed: char.speed || 20,
      luck: char.luck || 50,
      rootBone: char.rootBone || 50,
      comprehension: char.comprehension || 50,
      karma: char.karma || 0,
      cultivationProgress: char.cultivationProgress || 0,
      spiritualEnergy: char.spiritualEnergy || 0,
      realm: char.realm || '炼气期',
      minorRealm: char.minorRealm || '初期',
      age: char.age || 18,
      lifespan: char.lifespan || char.maxLifespan || 120,
      maxLifespan: char.maxLifespan || 120,
    }))
  }

  // 随机生成3组基础属性面板
  generateStatPanels(): Array<{
    health: number; maxHealth: number
    spiritualPower: number; maxSpiritualPower: number
    attack: number; defense: number; speed: number
    luck: number; rootBone: number; comprehension: number
    label: string
  }> {
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    const templates = [
      { label: '体修·刚猛', healthBonus: 30, atkBonus: 10, defBonus: 5, spdBonus: 0 },
      { label: '剑修·均衡', healthBonus: 10, atkBonus: 5, defBonus: 5, spdBonus: 5 },
      { label: '道修·灵动', healthBonus: 0, atkBonus: 0, defBonus: 5, spdBonus: 10 },
    ]
    return templates.map(t => ({
      label: t.label,
      health: 100 + t.healthBonus,
      maxHealth: 100 + t.healthBonus,
      spiritualPower: 100,
      maxSpiritualPower: 100,
      attack: 20 + t.atkBonus + rand(-3, 3),
      defense: 20 + t.defBonus + rand(-3, 3),
      speed: 20 + t.spdBonus + rand(-3, 3),
      luck: rand(40, 70),
      rootBone: rand(40, 70),
      comprehension: rand(40, 70),
    }))
  }

  // 生成性格/出生/背景选项（根据用户填写的名称）
  async generatePersonalityOptions(name: string): Promise<{
    personalities: Array<{ gender: string; avatar: string; desc: string }>
    origins: Array<{ label: string; desc: string }>
    backgrounds: Array<{ label: string; background: string }>
  }> {
    const prompt = `你是修仙世界的天道，请为名为"${name}"的修士生成角色选项，返回JSON：
{
  "personalities": [
    { "gender": "男", "avatar": "🧙‍♂️", "desc": "冷静多谋，不苟言笑" },
    { "gender": "女", "avatar": "🌸", "desc": "活泼开朗，热情似火" },
    { "gender": "男", "avatar": "⚔️", "desc": "沉稳守规，意志如铁" }
  ],
  "origins": [
    { "label": "世家弃子", "desc": "曾是名门望族，却因故被逐出家门" },
    { "label": "山野孤儿", "desc": "自幼父母双亡，靠自身摸爬滚打成长" },
    { "label": "凡人天才", "desc": "生于普通农家，却拥有常人难及的天资" }
  ],
  "backgrounds": [
    { "label": "机缘巧合", "background": "偶然间得到一本残缺古籍，从此踏上修仙路" },
    { "label": "家仇国恨", "background": "家人惨遭杀害，为报仇雪恨而踏入仙途" },
    { "label": "追逐长生", "background": "目睹至亲病逝，立志追求长生之道" }
  ]
}`
    const messages = [
      { role: 'system' as const, content: '你是修仙世界的天道意志，请生成多样化的角色选项，必须返回有效JSON。' },
      { role: 'user' as const, content: prompt },
    ]
    const response = await this.llmService.generate(messages, {
      temperature: 0.9,
      response_format: { type: 'json_object' },
    })
    return JSON.parse(response.content)
  }

  // 生成初始天赋选项
  async generateTalentOptions(name: string, origin: string, background: string): Promise<{
    talents: Array<{ name: string; desc: string; type: string }>
  }> {
    const prompt = `修士"${name}"，出身${origin}，背景：${background}。
请为其生成6个初始天赋选项（玩家从中选2个），返回JSON：
{
  "talents": [
    { "name": "天生剑骨", "desc": "与生俱来的剑道亲和力，领悟剑法事半功倍", "type": "战斗" },
    { "name": "五灵根", "desc": "修炼速度极快，但突破时风险更高", "type": "修炼" },
    { "name": "过目不忘", "desc": "见过的功法秘籍皆能记住并融会贯通", "type": "辅助" }
  ]
}
生成6个风格迥异的天赋，涵盖战斗/修炼/炼器/丹道/阵法/特殊等类型。`
    const messages = [
      { role: 'system' as const, content: '你是修仙世界的天道意志，请生成独特的天赋选项，必须返回有效JSON。' },
      { role: 'user' as const, content: prompt },
    ]
    const response = await this.llmService.generate(messages, {
      temperature: 0.9,
      response_format: { type: 'json_object' },
    })
    return JSON.parse(response.content)
  }

  // 生成剧情
  async generateStory(
    player: Player,
    world: GameState['world'],
    logs: GameLog[],
    action: string
  ): Promise<StoryResult> {
    if (!this.memoryService) {
      throw new Error('GameService not initialized')
    }

    // 构建记忆上下文
    const memoryContext = await this.memoryService.buildMemoryContext(action)

    const playerInfo = `
姓名: ${player.name}
境界: ${player.realm}·${player.minorRealm}
修为: ${player.cultivationProgress.toFixed(1)}%
寿元: ${player.lifespan}/${player.maxLifespan} 年
年龄: ${player.age} 岁
气血: ${player.health}/${player.maxHealth}
真气: ${player.spiritualPower}/${player.maxSpiritualPower}
属性: 攻击${player.attack} 防御${player.defense} 速度${player.speed} 气运${player.luck} 根骨${player.rootBone} 悟性${player.comprehension}
天赋: ${player.talents.join(', ')}
背景: ${player.background}
    `.trim()

    const worldInfo = world ? `
当前位置: ${world.currentLocation}
时间: ${world.time.year}年${world.time.month}月${world.time.day}日 第${world.time.shichen}时辰
描述: ${world.description}
    `.trim() : '未知'

    const recentLogs = logs.slice(-5).map(log => log.content).join('\n')

    const summaryMemory = memoryContext.summaryMemory
      ? `\n历史摘要: ${memoryContext.summaryMemory}\n`
      : ''

    const retrievedMemories = memoryContext.retrievedMemories.length > 0
      ? `\n相关记忆:\n${memoryContext.retrievedMemories.map(m => `- ${m.content}`).join('\n')}\n`
      : ''

    const messages = [
      { role: 'system' as const, content: storySystemPrompt },
      { role: 'user' as const, content: storyGenerationPrompt({
        player: playerInfo,
        world: worldInfo,
        recentLogs: recentLogs + summaryMemory + retrievedMemories,
        action,
      })},
    ]

    const response = await this.llmService.generate(messages, {
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const result: StoryResult = JSON.parse(response.content)

    // 记录到记忆
    await this.memoryService.addMemory(
      `玩家行动: ${action}\n结果: ${result.story}`,
      '关键事件',
      7
    )

    // 如果有新结识的 NPC，记录关系
    for (const npc of result.npcsMet) {
      await this.memoryService.addMemory(
        `结识 NPC: ${npc.name} (${npc.identity})`,
        'NPC 交互',
        8
      )
    }

    return result
  }

  // 保存游戏状态
  async saveGame(state: GameState): Promise<void> {
    if (!this.saveId) return

    const saveData = {
      saveId: this.saveId,
      data: state,
    }

    await db.saveSaveData(saveData)
  }

  // 加载游戏状态
  async loadGame(saveId: string): Promise<GameState | null> {
    const saveData = await db.getSaveData(saveId)
    return saveData?.data || null
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15)
  }
}

export const createGameService = (llmService: LLMService) => new GameService(llmService)

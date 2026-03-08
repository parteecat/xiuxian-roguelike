
import { LLMService } from './llmService'
import { MemoryService } from './memoryService'
import { db } from './db'
import { useTokenStore } from '@/stores/useTokenStore'
import { characterSystemPrompt, characterGenerationPrompt } from '@/prompts/character'
import { storySystemPrompt, storyGenerationPrompt } from '@/prompts/story'
import { npcInteractSystemPrompt, npcInteractGenerationPrompt } from '@/prompts/npcInteract'
import type { Player, GameLog, NPC, Item, Skill, GameState, Time, NPCInteractResult } from '@/types/game'

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

  // 记录 token 使用量
  private recordTokenUsage(usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined) {
    if (!usage) return
    useTokenStore.getState().addUsage({
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
    })
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

    // 记录 token 使用量
    this.recordTokenUsage(response.usage)

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
    label: string; desc: string
  }> {
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    const templates = [
      { label: '体修·金刚', desc: '钢筋铁骨，气血充沛，防御惊人', healthBonus: 35, atkBonus: 8, defBonus: 8, spdBonus: -5, luck: 50, rootBone: 65, comprehension: 45 },
      { label: '剑修·凌厉', desc: '剑气纵横，攻伐无双，身法迅捷', healthBonus: 10, atkBonus: 15, defBonus: 0, spdBonus: 10, luck: 55, rootBone: 55, comprehension: 60 },
      { label: '道修·玄妙', desc: '道法自然，悟性超群，均衡发展', healthBonus: 5, atkBonus: 5, defBonus: 5, spdBonus: 5, luck: 60, rootBone: 50, comprehension: 70 },
      { label: '法修·焚天', desc: '术法通神，破坏极强，身躯孱弱', healthBonus: 0, atkBonus: 20, defBonus: -5, spdBonus: 0, luck: 45, rootBone: 60, comprehension: 65 },
      { label: '医修·回春', desc: '妙手仁心，生生不息，不善攻伐', healthBonus: 25, atkBonus: 0, defBonus: 10, spdBonus: -5, luck: 65, rootBone: 55, comprehension: 55 },
      { label: '符修·诡道', desc: '符箓万千，神出鬼没，气运加身', healthBonus: 5, atkBonus: 10, defBonus: 0, spdBonus: 15, luck: 70, rootBone: 50, comprehension: 60 },
      { label: '阵修·不动', desc: '阵法宗师，固若金汤，行动迟缓', healthBonus: 15, atkBonus: 0, defBonus: 20, spdBonus: -10, luck: 50, rootBone: 60, comprehension: 55 },
      { label: '灵修·福缘', desc: '天道眷顾，气运逆天，福泽深厚', healthBonus: 10, atkBonus: 0, defBonus: 0, spdBonus: 5, luck: 85, rootBone: 50, comprehension: 60 },
      { label: '魔修·嗜血', desc: '以血为引，疯狂嗜杀，业力缠身', healthBonus: 20, atkBonus: 18, defBonus: 0, spdBonus: 5, luck: 35, rootBone: 70, comprehension: 50 },
      { label: '妖修·野性', desc: '妖血沸腾，肉身强横，灵智稍逊', healthBonus: 25, atkBonus: 12, defBonus: 5, spdBonus: 8, luck: 50, rootBone: 75, comprehension: 40 },
      { label: '佛修·禅心', desc: '禅意通明，金刚不坏，悟性高深', healthBonus: 30, atkBonus: 5, defBonus: 15, spdBonus: -5, luck: 60, rootBone: 55, comprehension: 65 },
      { label: '儒修·浩然', desc: '正气凛然，博览群书，智慧超群', healthBonus: 15, atkBonus: 8, defBonus: 8, spdBonus: 0, luck: 55, rootBone: 50, comprehension: 75 },
    ]
    // 随机打乱模板，取前3个
    const shuffled = templates.sort(() => Math.random() - 0.5).slice(0, 3)
    return shuffled.map(t => ({
      label: t.label,
      desc: t.desc,
      health: 100 + t.healthBonus,
      maxHealth: 100 + t.healthBonus,
      spiritualPower: 100,
      maxSpiritualPower: 100,
      attack: 20 + t.atkBonus + rand(-3, 3),
      defense: 20 + t.defBonus + rand(-3, 3),
      speed: 20 + t.spdBonus + rand(-3, 3),
      luck: t.luck + rand(-5, 5),
      rootBone: t.rootBone + rand(-5, 5),
      comprehension: t.comprehension + rand(-5, 5),
    }))
  }

  // 生成随机修士名字
  generateRandomName(): string {
    const surnames = [
      '李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
      '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
      '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
      '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
      '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎',
      '段', '雷', '侯', '龙', '史', '陶', '黎', '贺', '顾', '毛',
      '郝', '龚', '邵', '万', '钱', '严', '覃', '武', '戴', '莫',
      '孔', '白', '盛', '林', '刁', '钟', '徐', '邱', '骆', '高',
      '夏', '蔡', '田', '樊', '胡', '凌', '霍', '虞', '支', '柯',
      '昝', '管', '卢', '莫', '经', '房', '裘', '缪', '干', '解',
      '慕容', '欧阳', '上官', '诸葛', '东方', '司徒', '令狐', '轩辕', '独孤'
    ]
    const names = [
      '逍遥', '无忌', '长卿', '子轩', '天宇', '浩然', '文轩', '子墨', '思远', '俊杰',
      '嘉懿', '煜城', '懿轩', '烨伟', '苑博', '伟泽', '熠彤', '鸿煊', '博涛', '烨霖',
      '依晨', '可馨', '雨嘉', '雅琳', '诗涵', '瑾萱', '梦洁', '凌薇', '美琳', '欢馨',
      '婉婷', '钰彤', '璟雯', '婧琪', '玥婷', '梦瑶', '静宸', '诗琪', '羽馨', '歆瑶',
      '云', '风', '雨', '雷', '电', '霜', '雪', '冰', '火', '炎',
      '山', '河', '海', '川', '江', '湖', '波', '涛', '浪', '潮',
      '天', '地', '玄', '黄', '宇', '宙', '洪', '荒', '日', '月',
      '星', '辰', '空', '霄', '穹', '苍', '冥', '幽', '明', '光',
      '剑', '刀', '枪', '戟', '斧', '钺', '钩', '叉', '鞭', '锏',
      '锤', '抓', '拐', '杖', '棒', '笔', '墨', '纸', '砚', '琴',
      '棋', '书', '画', '诗', '酒', '茶', '花', '草', '松', '柏',
      '竹', '梅', '兰', '菊', '莲', '荷', '蓉', '芷', '若', '兰',
      '青', '白', '黑', '赤', '橙', '黄', '绿', '蓝', '紫', '灰',
      '金', '银', '铜', '铁', '玉', '石', '珠', '宝', '珍', '瑞',
      '龙', '凤', '虎', '豹', '狼', '鹰', '鹏', '鹤', '鸾', '麒',
      '麟', '龟', '蛇', '蛟', '鲤', '鲲', '鳌', '蝉', '蝶', '萤',
      '飞', '翔', '跃', '腾', '奔', '驰', '疾', '迅', '猛', '威',
      '霸', '狂', '傲', '孤', '独', '绝', '灭', '杀', '破', '斩',
      '无双', '至尊', '无极', '太上', '混元', '开天', '辟地', '通天', '彻地', '惊天',
      '动地', '诛仙', '弑神', '屠魔', '灭佛', '逆天', '改命', '夺舍', '重生', '轮回'
    ]
    const surname = surnames[Math.floor(Math.random() * surnames.length)]
    const name = names[Math.floor(Math.random() * names.length)]
    return surname + name
  }

  // 生成性格/出生/背景选项（根据用户填写的名称）
  async generatePersonalityOptions(name: string): Promise<{
    personalities: Array<{ gender: string; avatar: string; desc: string }>
    origins: Array<{ label: string; desc: string }>
    backgrounds: Array<{ label: string; background: string }>
  }> {
    const prompt = `你是修仙世界的天道，请为名为"${name}"的修士推演命格，生成多样化的角色选项。

要求：
1. personalities（性格）：生成6个不同性格，男女各3个，每个配一个合适的emoji表情
2. origins（出生）：生成6个不同出身背景，涵盖各种阶层和境遇
3. backgrounds（背景故事）：生成6个不同的修仙契机和初始经历

必须返回以下格式的JSON：
{
  "personalities": [
    { "gender": "男", "avatar": "🧙‍♂️", "desc": "性格描述，如：冷静多谋，不苟言笑" },
    { "gender": "女", "avatar": "🌸", "desc": "性格描述" }
    // ... 共6个，3男3女
  ],
  "origins": [
    { "label": "出身标签，如：世家弃子", "desc": "出身描述，如：曾是名门望族，却因故被逐出家门" }
    // ... 共6个
  ],
  "backgrounds": [
    { "label": "背景标签，如：机缘巧合", "background": "详细背景故事，50-80字" }
    // ... 共6个
  ]
}

注意：
- 内容要有修仙特色，避免过于现代化的表达
- 性格和出身要有关联性，比如孤僻性格配寒门出身更合理
- 背景故事要详细具体，能引发后续的剧情发展`

    const messages = [
      { role: 'system' as const, content: '你是修仙世界的天道意志，请生成多样化的角色选项，必须返回有效JSON。' },
      { role: 'user' as const, content: prompt },
    ]
    const response = await this.llmService.generate(messages, {
      temperature: 0.9,
      response_format: { type: 'json_object' },
    })

    // 记录 token 使用量
    this.recordTokenUsage(response.usage)

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

    // 记录 token 使用量
    this.recordTokenUsage(response.usage)

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

    // 记录 token 使用量
    this.recordTokenUsage(response.usage)

    const parsed = JSON.parse(response.content)

    // 添加默认值防止NaN
    const result: StoryResult = {
      story: parsed.story || '无事发生',
      timePassed: {
        year: Number(parsed.timePassed?.year) || 0,
        month: Number(parsed.timePassed?.month) || 0,
        day: Number(parsed.timePassed?.day) || 0,
        shichen: Number(parsed.timePassed?.shichen) || 0,
      },
      cultivationGained: Number(parsed.cultivationGained) || 0,
      spiritualEnergyGained: Number(parsed.spiritualEnergyGained) || 0,
      breakthrough: {
        occurred: Boolean(parsed.breakthrough?.occurred),
        success: Boolean(parsed.breakthrough?.success),
        newRealm: parsed.breakthrough?.newRealm || '',
        newMinorRealm: parsed.breakthrough?.newMinorRealm || '',
      },
      statChanges: parsed.statChanges || {},
      itemsGained: parsed.itemsGained || [],
      itemsLost: parsed.itemsLost || [],
      skillsGained: parsed.skillsGained || [],
      skillsImproved: parsed.skillsImproved || [],
      npcsMet: parsed.npcsMet || [],
      relationshipsUpdate: parsed.relationshipsUpdate || {},
      events: parsed.events || [],
      suggestedActions: parsed.suggestedActions || [],
    }

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
      data: state as unknown as Record<string, unknown>,
    }

    await db.saveSaveData(saveData)
  }

  // 加载游戏状态
  async loadGame(saveId: string): Promise<GameState | null> {
    const saveData = await db.getSaveData(saveId)
    return (saveData?.data as unknown as GameState) || null
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  // NPC 交互
  async interactWithNPC(
    npc: NPC,
    player: Player,
    currentLocation: string,
    action: string
  ): Promise<NPCInteractResult> {
    if (!this.memoryService) {
      throw new Error('GameService not initialized')
    }

    const messages = [
      { role: 'system' as const, content: npcInteractSystemPrompt },
      { role: 'user' as const, content: npcInteractGenerationPrompt({
        npc,
        player,
        action,
        currentLocation,
      })},
    ]

    const response = await this.llmService.generate(messages, {
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    // 记录 token 使用量
    this.recordTokenUsage(response.usage)

    const parsed = JSON.parse(response.content)

    // 添加默认值
    const result: NPCInteractResult = {
      dialogue: parsed.dialogue || '...',
      possibleInteractions: parsed.possibleInteractions || [],
      npcStateDelta: {
        favor: Number(parsed.npcStateDelta?.favor) || 0,
        memoryTags: parsed.npcStateDelta?.memoryTags || [],
        revealedAttributes: Boolean(parsed.npcStateDelta?.revealedAttributes),
        relationshipDesc: parsed.npcStateDelta?.relationshipDesc || npc.relationshipDesc,
      },
      playerStateDelta: parsed.playerStateDelta || {},
      timePassed: parsed.timePassed || { years: 0, months: 0, days: 0, shichen: 1 },
      storyUpdate: parsed.storyUpdate,
    }

    // 记录到记忆
    await this.memoryService.addMemory(
      `与 ${npc.name} 互动: ${action}\n结果: ${result.dialogue.slice(0, 100)}...`,
      'NPC 交互',
      6
    )

    return result
  }

  // 生成区域 NPC
  async generateLocationNPCs(
    location: string,
    locationDescription: string,
    player: Player,
    count: number = 3
  ): Promise<NPC[]> {
    const prompt = `你是九霄界的"天道推演者"。

当前区域：${location}
区域描述：${locationDescription}
玩家境界：${player.realm}·${player.minorRealm}

请为该区域生成 ${count} 个 NPC，这些 NPC 应该：
1. 符合区域特点（如：山麓可能有采药人、散修；宗门可能有弟子、长老）
2. 境界应该与玩家相当或略高/略低（不要差距太大）
3. 性格各异，有正有邪
4. 初始好感度为 0（陌生）

返回 JSON 格式：
{
  "npcs": [
    {
      "id": "npc_随机id",
      "name": "姓名",
      "emoji": "外观emoji",
      "avatar": "头像emoji",
      "realm": "炼气期",
      "minorRealm": "初期",
      "identity": "身份描述，如：青云宗外门弟子",
      "favor": 0,
      "favorLevel": "陌生",
      "description": "详细描述",
      "history": [],
      "talents": ["天赋1", "天赋2"],
      "personality": "性格描述",
      "relationships": {},
      "revealedAttributes": false,
      "memoryTags": ["初始标签"],
      "interactionCount": 0
    }
  ]
}`

    const messages = [
      { role: 'system' as const, content: '你是修仙世界的造物主，请生成符合区域特色的NPC，必须返回有效JSON。' },
      { role: 'user' as const, content: prompt },
    ]

    const response = await this.llmService.generate(messages, {
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    this.recordTokenUsage(response.usage)

    const result = JSON.parse(response.content)
    return (result.npcs || []).map((npc: NPC) => ({
      ...npc,
      id: npc.id || this.generateId(),
      favor: npc.favor ?? 0,
      favorLevel: npc.favorLevel || '陌生',
      memoryTags: npc.memoryTags || [],
      revealedAttributes: npc.revealedAttributes ?? false,
      interactionCount: npc.interactionCount ?? 0,
    }))
  }
}

export const createGameService = (llmService: LLMService) => new GameService(llmService)

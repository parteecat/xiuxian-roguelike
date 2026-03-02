
import { db, MemoryItem } from './db'
import { LLMService, LLMMessage } from './llmService'
import { summarySystemPrompt, summaryGenerationPrompt } from '@/prompts/summary'
import type { Memory, GameLog } from '@/types/game'

// 使用轻量级嵌入模型
let embeddingPipeline: any = null

export interface MemoryContext {
  workingMemory: string[]
  summaryMemory: string
  retrievedMemories: MemoryItem[]
}

export class MemoryService {
  private llmService: LLMService
  private saveId: string
  private workingMemorySize: number = 10
  private summaryThreshold: number = 50

  constructor(llmService: LLMService, saveId: string) {
    this.llmService = llmService
    this.saveId = saveId
  }

  // 初始化嵌入模型
  async initEmbeddingModel(): Promise<void> {
    if (embeddingPipeline) return
    
    try {
      const { pipeline } = await import('@xenova/transformers')
      embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    } catch (error) {
      console.warn('嵌入模型加载失败，将使用备用方案:', error)
    }
  }

  // 生成嵌入向量
  async generateEmbedding(text: string): Promise<number[]> {
    if (!embeddingPipeline) {
      await this.initEmbeddingModel()
    }

    if (embeddingPipeline) {
      try {
        const output = await embeddingPipeline(text, { pooling: 'mean', normalize: true })
        return Array.from(output.data)
      } catch (error) {
        console.warn('嵌入生成失败:', error)
      }
    }

    // 备用方案：简单的哈希向量
    return this.simpleHashEmbedding(text)
  }

  // 简单的哈希嵌入（备用方案）
  private simpleHashEmbedding(text: string): number[] {
    const vector = new Array(128).fill(0)
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      vector[i % 128] += char / 1000
    }
    // 归一化
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
    return vector.map(v => v / (magnitude || 1))
  }

  // 计算余弦相似度
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1)
  }

  // 添加记忆片段
  async addMemory(content: string, type: Memory['type'], importance: number = 5): Promise<void> {
    const embedding = await this.generateEmbedding(content)
    
    const memory: MemoryItem = {
      id: this.generateId(),
      saveId: this.saveId,
      type,
      content,
      embedding,
      timestamp: Date.now(),
      importance,
    }

    await db.addMemory(memory)
  }

  // 从游戏日志创建记忆
  async addLogAsMemory(log: GameLog): Promise<void> {
    const importance = this.calculateImportance(log)
    await this.addMemory(log.content, log.type as Memory['type'], importance)
  }

  // 计算记忆重要性
  private calculateImportance(log: GameLog): number {
    const content = log.content
    let importance = 5

    // 高重要性关键词
    const highImportance = ['突破', '死亡', '奇遇', '传承', '天劫', '飞升', '获得', '结识']
    const mediumImportance = ['修炼', '战斗', '探索', '学习', '炼制']

    if (highImportance.some(kw => content.includes(kw))) importance = 9
    else if (mediumImportance.some(kw => content.includes(kw))) importance = 7

    return importance
  }

  // 检索相关记忆（RAG）
  async retrieveRelevantMemories(query: string, topK: number = 5): Promise<MemoryItem[]> {
    const queryEmbedding = await this.generateEmbedding(query)
    const allMemories = await db.getMemoriesBySaveId(this.saveId)

    // 计算相似度并排序
    const scoredMemories = allMemories.map(memory => ({
      memory,
      score: memory.embedding 
        ? this.cosineSimilarity(queryEmbedding, memory.embedding)
        : 0,
    }))

    scoredMemories.sort((a, b) => b.score - a.score)

    return scoredMemories.slice(0, topK).map(item => item.memory)
  }

  // 获取工作记忆（最近 N 条）
  async getWorkingMemory(): Promise<MemoryItem[]> {
    return db.getMemoriesBySaveId(this.saveId, this.workingMemorySize)
  }

  // 生成摘要记忆
  async generateSummary(): Promise<string> {
    const memories = await db.getMemoriesBySaveId(this.saveId)
    
    if (memories.length < this.summaryThreshold) {
      return ''
    }

    // 获取需要摘要的旧记忆
    const oldMemories = memories.slice(this.workingMemorySize)
    const logContents = oldMemories.map(m => m.content)

    try {
      const messages: LLMMessage[] = [
        { role: 'system', content: summarySystemPrompt },
        { role: 'user', content: summaryGenerationPrompt(logContents) },
      ]

      const response = await this.llmService.generate(messages, {
        temperature: 0.5,
        response_format: { type: 'json_object' },
      })

      const result = JSON.parse(response.content)
      return result.summary || ''
    } catch (error) {
      console.error('生成摘要失败:', error)
      return ''
    }
  }

  // 组装完整的记忆上下文
  async buildMemoryContext(query: string): Promise<MemoryContext> {
    const [workingMemory, retrievedMemories, summaryMemory] = await Promise.all([
      this.getWorkingMemory(),
      this.retrieveRelevantMemories(query),
      this.generateSummary(),
    ])

    return {
      workingMemory: workingMemory.map(m => m.content),
      summaryMemory,
      retrievedMemories,
    }
  }

  // 检查是否需要生成摘要
  async shouldGenerateSummary(): Promise<boolean> {
    const memories = await db.getMemoriesBySaveId(this.saveId)
    return memories.length >= this.summaryThreshold
  }

  // 清理旧记忆（保留重要记忆）
  async cleanupOldMemories(): Promise<void> {
    const memories = await db.getMemoriesBySaveId(this.saveId)
    const importantMemories = memories.filter(m => m.importance >= 8)
    const recentMemories = memories.slice(0, this.workingMemorySize)
    
    // 合并重要记忆和最近记忆，去重
    const keepIds = new Set([
      ...importantMemories.map(m => m.id),
      ...recentMemories.map(m => m.id),
    ])

    // 删除不在保留列表中的记忆
    const toDelete = memories.filter(m => !keepIds.has(m.id))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _memory of toDelete) {
      // 这里可以添加删除逻辑，但当前 db.ts 没有单个删除方法
      // 可以后续扩展
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9)
  }
}

export const createMemoryService = (llmService: LLMService, saveId: string) => 
  new MemoryService(llmService, saveId)

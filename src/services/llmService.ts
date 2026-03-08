
import type { LLMConfig } from '@/types/game'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class LLMService {
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  isConfigured(): boolean {
    return Boolean(this.config.baseURL && this.config.apiKey && this.config.model)
  }

  updateConfig(config: Partial<LLMConfig>) {
    this.config = { ...this.config, ...config }
  }

  async generate(
    messages: LLMMessage[],
    options: {
      temperature?: number
      max_tokens?: number
      response_format?: { type: 'json_object' | 'text' }
    } = {}
  ): Promise<LLMResponse> {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.makeRequest(messages, options)
        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`LLM 调用失败 (尝试 ${attempt}/${maxRetries}):`, lastError.message)
        
        if (attempt < maxRetries) {
          await this.delay(1000 * attempt)
        }
      }
    }

    throw new Error(`LLM 调用失败，已重试 ${maxRetries} 次: ${lastError?.message}`)
  }

  private async makeRequest(
    messages: LLMMessage[],
    options: {
      temperature?: number
      max_tokens?: number
      response_format?: { type: 'json_object' | 'text' }
    }
  ): Promise<LLMResponse> {
    const { baseURL, apiKey, model } = this.config

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 2000,
        response_format: options.response_format,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 错误 (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    
    return {
      content: data.choices[0]?.message?.content ?? '',
      usage: data.usage,
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const createLLMService = (config: LLMConfig) => new LLMService(config)

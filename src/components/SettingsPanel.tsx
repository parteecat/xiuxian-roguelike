import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { createLLMService } from '@/services/llmService'
import { Save, RotateCcw, TestTube, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

export function SettingsPanel() {
  const { llmConfig, setLlmConfig, resetSettings } = useSettingsStore()
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSave = () => {
    // 配置会自动保存到 localStorage（通过 zustand persist）
    toast.success('设置已保存', {
      description: '模型配置已更新',
    })
  }

  const handleTest = async () => {
    if (!llmConfig.baseURL || !llmConfig.apiKey || !llmConfig.model) {
      toast.error('请填写完整的模型信息', {
        description: 'API URL、API Key 和模型名称不能为空',
      })
      return
    }

    setIsTesting(true)
    setTestStatus('idle')

    try {
      const llmService = createLLMService(llmConfig)
      
      // 发送一个简单的测试请求
      const response = await llmService.generate(
        [
          { role: 'system', content: '你是一个简单的测试助手，请回复"测试成功"四个字。' },
          { role: 'user', content: '测试连接' }
        ],
        {
          temperature: 0.1,
          max_tokens: 50,
        }
      )

      if (response.content) {
        setTestStatus('success')
        toast.success('连接测试成功', {
          description: `模型响应正常，返回内容：${response.content.slice(0, 50)}`,
        })
      } else {
        throw new Error('模型返回内容为空')
      }
    } catch (error) {
      setTestStatus('error')
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      toast.error('连接测试失败', {
        description: errorMessage,
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-300">LLM 设置</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="baseURL" className="text-xs text-zinc-400">
            API Base URL
          </Label>
          <Input
            id="baseURL"
            value={llmConfig.baseURL}
            onChange={(e) => setLlmConfig({ baseURL: e.target.value })}
            placeholder="https://api.openai.com/v1"
            className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey" className="text-xs text-zinc-400">
            API Key
          </Label>
          <Input
            id="apiKey"
            type="password"
            value={llmConfig.apiKey}
            onChange={(e) => setLlmConfig({ apiKey: e.target.value })}
            placeholder="sk-..."
            className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model" className="text-xs text-zinc-400">
            模型
          </Label>
          <Input
            id="model"
            value={llmConfig.model}
            onChange={(e) => setLlmConfig({ model: e.target.value })}
            placeholder="gpt-4"
            className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            size="sm"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-1" />
            确定
          </Button>
          <Button
            onClick={handleTest}
            disabled={isTesting}
            size="sm"
            variant="outline"
            className={`flex-1 border-zinc-700 ${
              testStatus === 'success' 
                ? 'text-emerald-400 hover:text-emerald-300 border-emerald-600' 
                : testStatus === 'error'
                ? 'text-red-400 hover:text-red-300 border-red-600'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                测试中...
              </>
            ) : testStatus === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                测试成功
              </>
            ) : testStatus === 'error' ? (
              <>
                <XCircle className="w-4 h-4 mr-1" />
                测试失败
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-1" />
                测试连接
              </>
            )}
          </Button>
          <Button
            onClick={resetSettings}
            size="sm"
            variant="outline"
            className="border-zinc-700 text-zinc-400 hover:text-zinc-200"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            重置
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

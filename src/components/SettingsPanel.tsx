import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { createLLMService } from '@/services/llmService'
import { Save, RotateCcw, TestTube, Loader2, CheckCircle, XCircle, Sun, Moon } from 'lucide-react'
import { toast } from 'sonner'

interface SettingsPanelProps {
  onClose?: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { llmConfig, setLlmConfig, resetSettings, theme, setTheme } = useSettingsStore()
  const [isTesting, setIsTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSave = () => {
    toast.success('设置已保存', { description: '模型配置已更新' })
    onClose?.()
  }

  const handleTest = async () => {
    if (!llmConfig.baseURL || !llmConfig.apiKey || !llmConfig.model) {
      toast.error('请填写完整的模型信息')
      return
    }
    setIsTesting(true)
    setTestStatus('idle')
    try {
      const llmService = createLLMService(llmConfig)
      const response = await llmService.generate(
        [
          { role: 'system', content: '你是一个简单的测试助手，请回复"测试成功"四个字。' },
          { role: 'user', content: '测试连接' },
        ],
        { temperature: 0.1, max_tokens: 50 }
      )
      if (response.content) {
        setTestStatus('success')
        toast.success('连接测试成功', { description: `模型响应正常` })
      } else {
        throw new Error('模型返回内容为空')
      }
    } catch (error) {
      setTestStatus('error')
      toast.error('连接测试失败', {
        description: error instanceof Error ? error.message : '未知错误',
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-5 py-2">
      <div className="text-xs text-[hsl(var(--dim))] tracking-widest mb-4 pb-3 border-b border-[hsl(var(--ink-border))]">
        LLM 模型配置
      </div>

      {/* 主题切换 */}
      <div className="space-y-1.5">
        <Label className="text-xs text-[hsl(var(--dim))] tracking-widest">界面主题</Label>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-all duration-200 tracking-wider ${
              theme === 'light'
                ? 'border-amber-400/50 bg-amber-400/10 text-amber-500'
                : 'border-[hsl(var(--ink-border))] text-[hsl(var(--dim))] hover:text-foreground hover:border-[hsl(var(--ink-border))]'
            }`}
          >
            <Sun className="w-4 h-4" />
            日间
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-all duration-200 tracking-wider ${
              theme === 'dark'
                ? 'border-blue-400/50 bg-blue-400/10 text-blue-400'
                : 'border-[hsl(var(--ink-border))] text-[hsl(var(--dim))] hover:text-foreground hover:border-[hsl(var(--ink-border))]'
            }`}
          >
            <Moon className="w-4 h-4" />
            夜间
          </button>
        </div>
      </div>

      {[
        { id: 'baseURL', label: 'API Base URL', type: 'text', placeholder: 'https://api.openai.com/v1', key: 'baseURL' as const },
        { id: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...', key: 'apiKey' as const },
        { id: 'model', label: '模型名称', type: 'text', placeholder: 'gpt-4o', key: 'model' as const },
      ].map(({ id, label, type, placeholder, key }) => (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1.5"
        >
          <Label htmlFor={id} className="text-xs text-[hsl(var(--dim))] tracking-widest">{label}</Label>
          <Input
            id={id}
            type={type}
            value={llmConfig[key]}
            onChange={(e) => setLlmConfig({ [key]: e.target.value })}
            placeholder={placeholder}
            className="border-[hsl(var(--ink-border))] text-foreground/90 text-sm
              focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/30 placeholder:text-[hsl(var(--dim))]/40"
          />
        </motion.div>
      ))}

      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSave}
          size="sm"
          className="flex-1 btn-jade rounded-lg tracking-wider"
        >
          <Save className="w-4 h-4 mr-1.5" />
          保存
        </Button>
        <Button
          onClick={handleTest}
          disabled={isTesting}
          size="sm"
          variant="outline"
          className={`flex-1 rounded-lg tracking-wider border transition-colors ${
            testStatus === 'success'
              ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/5'
              : testStatus === 'error'
              ? 'border-red-500/40 text-red-400 hover:bg-red-500/5'
              : 'border-[hsl(var(--ink-border))] text-[hsl(var(--dim))] hover:text-foreground hover:border-emerald-500/20'
          }`}
        >
          {isTesting ? (
            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />测试中…</>
          ) : testStatus === 'success' ? (
            <><CheckCircle className="w-4 h-4 mr-1.5" />测试成功</>
          ) : testStatus === 'error' ? (
            <><XCircle className="w-4 h-4 mr-1.5" />测试失败</>
          ) : (
            <><TestTube className="w-4 h-4 mr-1.5" />测试连接</>
          )}
        </Button>
        <Button
          onClick={resetSettings}
          size="sm"
          variant="outline"
          className="border-[hsl(var(--ink-border))] text-[hsl(var(--dim))] hover:text-foreground hover:border-[hsl(var(--ink-border))] rounded-lg"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

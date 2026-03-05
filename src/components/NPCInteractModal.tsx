import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Heart, Sword, Eye, Users, LogOut, Loader2 } from 'lucide-react'
import type { NPC, NPCInteraction, NPCInteractResult } from '@/types/game'
import { getFavorColor, getFavorLevel } from '@/types/game'

interface NPCInteractModalProps {
  npc: NPC | null
  isOpen: boolean
  onClose: () => void
  onInteract: (action: string) => Promise<NPCInteractResult>
}

const interactionIcons: Record<string, React.ReactNode> = {
  '打听消息': <MessageCircle className="w-4 h-4" />,
  '赠送礼物': <Heart className="w-4 h-4" />,
  '切磋': <Sword className="w-4 h-4" />,
  '探查': <Eye className="w-4 h-4" />,
  '结为好友': <Users className="w-4 h-4" />,
  '结为道侣': <Heart className="w-4 h-4 text-pink-400" />,
  '离开': <LogOut className="w-4 h-4" />,
}

export function NPCInteractModal({
  npc,
  isOpen,
  onClose,
  onInteract,
}: NPCInteractModalProps) {
  const [dialogue, setDialogue] = useState('')
  const [interactions, setInteractions] = useState<NPCInteraction[]>([])
  const [interactLoading, setInteractLoading] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  if (!isOpen || !npc) return null

  const handleInteract = async (action: string) => {
    if (action === '离开' || action === '【离开】') {
      onClose()
      return
    }

    setInteractLoading(true)
    try {
      const result = await onInteract(action)
      setDialogue(result.dialogue)
      setInteractions(result.possibleInteractions)
      setHasInteracted(true)
    } catch (error) {
      console.error('NPC 交互失败:', error)
    } finally {
      setInteractLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* 模态框 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:max-h-[80vh] bg-background border border-[hsl(var(--ink-border))] rounded-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--ink-border))] bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl">
                  {npc.emoji}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{npc.name}</div>
                  <div className="text-xs text-[hsl(var(--dim))]">
                    {npc.realm}·{npc.minorRealm} · {npc.identity}
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-[hsl(var(--dim))]" />
              </button>
            </div>

            {/* 好感度条 */}
            <div className="px-4 py-3 border-b border-[hsl(var(--ink-border))] bg-white/3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[hsl(var(--dim))]">好感度</span>
                <span className={`text-xs font-medium ${getFavorColor(npc.favor)}`}>
                  {getFavorLevel(npc.favor)} ({npc.favor})
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${
                    npc.favor >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.abs(npc.favor))}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* 对话区域 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[150px]">
              {!hasInteracted ? (
                <div className="text-center text-[hsl(var(--dim))] py-8">
                  <div className="text-4xl mb-3">{npc.emoji}</div>
                  <div className="text-sm">{npc.description}</div>
                  <div className="text-xs mt-2 opacity-70">性格：{npc.personality}</div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{npc.emoji}</span>
                    <div className="flex-1 text-sm leading-relaxed text-foreground/90">
                      {dialogue}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 已探查属性 */}
              {npc.revealedAttributes && npc.attributes && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-3 gap-2 p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg"
                >
                  <div className="text-center">
                    <div className="text-xs text-[hsl(var(--dim))]">攻击</div>
                    <div className="text-sm font-medium text-blue-400">{npc.attributes.attack}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[hsl(var(--dim))]">防御</div>
                    <div className="text-sm font-medium text-blue-400">{npc.attributes.defense}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-[hsl(var(--dim))]">速度</div>
                    <div className="text-sm font-medium text-blue-400">{npc.attributes.speed}</div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* 互动选项 */}
            <div className="p-4 border-t border-[hsl(var(--ink-border))] bg-white/3">
              {interactLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              ) : interactions.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {interactions.map((interaction, index) => (
                    <motion.button
                      key={interaction.type}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleInteract(interaction.label)}
                      disabled={!interaction.enabled}
                      title={interaction.reason}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        interaction.enabled
                          ? 'bg-white/5 border-[hsl(var(--ink-border))] hover:bg-white/10 hover:border-emerald-500/30 active:scale-95'
                          : 'bg-white/3 border-white/5 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400">{interactionIcons[interaction.type] || <MessageCircle className="w-4 h-4" />}</span>
                        <span className="text-sm font-medium">{interaction.label.replace(/[【】]/g, '')}</span>
                      </div>
                      <div className="text-xs text-[hsl(var(--dim))] mt-1 pl-6">{interaction.description}</div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {['【打听消息】', '【赠送礼物】', '【切磋】', '【离开】'].map((action, index) => (
                    <motion.button
                      key={action}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleInteract(action)}
                      className="p-3 rounded-lg border border-[hsl(var(--ink-border))] bg-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all active:scale-95 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400">{interactionIcons[action.replace(/[【】]/g, '')] || <MessageCircle className="w-4 h-4" />}</span>
                        <span className="text-sm font-medium">{action.replace(/[【】]/g, '')}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

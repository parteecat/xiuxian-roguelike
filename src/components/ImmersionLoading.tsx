import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ImmersionLoadingProps {
  isLoading: boolean
  type?: 'character' | 'story' | 'breakthrough' | 'divination'
  message?: string
  onComplete?: () => void
}

// 修仙主题加载提示语
const loadingMessages = {
  character: [
    '感知天地灵气...',
    '推演灵根属性...',
    '测算命格运势...',
    '凝聚三魂七魄...',
    '觉醒前世记忆...',
    '沟通天道法则...',
    '铸造修仙之基...',
    '开启通天之路...',
  ],
  story: [
    '神游太虚...',
    '推演天机...',
    '观测因果...',
    '衍化万物...',
    '聆听大道之音...',
    '捕捉时光碎片...',
    '编织命运之网...',
    '演化乾坤万象...',
    '感悟天地至理...',
    '凝练无上道韵...',
  ],
  breakthrough: [
    '灵气汇聚丹田...',
    '冲破境界桎梏...',
    '感悟突破契机...',
    '凝聚突破之力...',
    '天地异象显现...',
    '雷劫酝酿之中...',
    '道心坚定如磐...',
    '一朝悟道飞升...',
  ],
  divination: [
    '起卦问天...',
    '阴阳流转...',
    '八卦推演...',
    '奇门遁甲...',
    '测算吉凶...',
    '洞察先机...',
    '因果纠缠...',
    '天命昭昭...',
  ],
}

// 八卦符号
const trigrams = ['☰', '☷', '☳', '☵', '☶', '☴', '☲', '☱']

// 符文
const runes = ['炁', '道', '法', '术', '真', '灵', '仙', '神', '玄', '妙']

export function ImmersionLoading({
  isLoading,
  type = 'story',
  message,
  onComplete,
}: ImmersionLoadingProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  const messages = loadingMessages[type]

  // 循环切换提示语
  useEffect(() => {
    if (!isLoading) return

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length)
    }, 2000)

    return () => clearInterval(messageInterval)
  }, [isLoading, messages.length])

  // 进度条动画
  useEffect(() => {
    if (!isLoading) {
      setProgress(0)
      return
    }

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 800)

    return () => clearInterval(progressInterval)
  }, [isLoading])

  // 完成时进度到100%
  useEffect(() => {
    if (!isLoading && progress > 0) {
      setProgress(100)
      const timer = setTimeout(() => {
        onComplete?.()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isLoading, progress, onComplete])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* 主容器 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <div className="ink-card rounded-2xl p-8 min-w-[320px] border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
              {/* 中心动画区域 */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                {/* 外圈光环 */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                >
                  <div className="w-full h-full rounded-full border-2 border-dashed border-emerald-500/20" />
                </motion.div>

                {/* 中圈光环（反向） */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-2"
                >
                  <div className="w-full h-full rounded-full border border-emerald-400/30" />
                </motion.div>

                {/* 内圈发光环 */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 blur-sm"
                />

                {/* 八卦符号 */}
                {trigrams.map((trigram, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0.3, 0.8, 0.3],
                      scale: 1,
                      rotate: index * 45,
                    }}
                    transition={{
                      opacity: { duration: 2, repeat: Infinity, delay: index * 0.2 },
                      scale: { duration: 0.5, delay: index * 0.1 },
                    }}
                    className="absolute inset-0"
                  >
                    <span
                      className="absolute left-1/2 -translate-x-1/2 text-emerald-400/60 text-lg"
                      style={{ top: '-8px' }}
                    >
                      {trigram}
                    </span>
                  </motion.div>
                ))}

                {/* 中心符文 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentMessageIndex}
                      initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                      transition={{ duration: 0.5 }}
                      className="text-4xl text-emerald-400 font-serif select-none"
                    >
                      {runes[currentMessageIndex % runes.length]}
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* 飘动的灵气粒子 */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-emerald-400/60"
                    initial={{
                      x: 64,
                      y: 64,
                      opacity: 0,
                    }}
                    animate={{
                      x: 64 + Math.cos((i * 60 * Math.PI) / 180) * 50,
                      y: 64 + Math.sin((i * 60 * Math.PI) / 180) * 50,
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              {/* 提示文字 */}
              <div className="text-center space-y-3">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentMessageIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-emerald-400/90 tracking-widest font-medium"
                  >
                    {message || messages[currentMessageIndex]}
                  </motion.p>
                </AnimatePresence>

                {/* 进度条 */}
                <div className="relative h-1 bg-emerald-500/10 rounded-full overflow-hidden mt-4">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/60 to-emerald-400 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                  {/* 进度条光效 */}
                  <motion.div
                    className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>

                {/* 底部小字 */}
                <p className="text-[10px] text-[hsl(var(--dim))]/50 tracking-wider pt-1">
                  大道无形，生育天地
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 简化版 Loading - 用于按钮等小块区域
interface MiniLoadingProps {
  isLoading: boolean
  text?: string
}

export function MiniLoading({ isLoading, text = '推演中...' }: MiniLoadingProps) {
  if (!isLoading) return null

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="inline-flex items-center gap-2"
    >
      <span className="relative flex h-4 w-4">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-emerald-500/30 border-t-emerald-400"
        />
      </span>
      <span className="text-emerald-400/80 text-sm tracking-wider">{text}</span>
    </motion.span>
  )
}

// 行内加载 - 用于文本流中的等待
export function InlineLoading() {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="inline-flex items-center gap-1 text-emerald-400/60"
    >
      <motion.span
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-xs tracking-wider"
      >
        天道推演中
      </motion.span>
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, times: [0, 0.5, 1] }}
      >
        ...
      </motion.span>
    </motion.span>
  )
}

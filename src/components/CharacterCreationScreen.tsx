import { useState, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TokenDisplay } from './TokenDisplay'
import { ImmersionLoading, MiniLoading } from './ImmersionLoading'
import { ArrowLeft, ArrowRight, Check, RefreshCw, Heart, Zap, Sword, Shield, Wind, Sparkles } from 'lucide-react'
import type { Player } from '@/types/game'
import type { GameService } from '@/services/gameService'
import { toast } from 'sonner'

type StepId = 'name_stats' | 'personality' | 'talents'

interface StatPanel {
  label: string
  health: number; maxHealth: number
  spiritualPower: number; maxSpiritualPower: number
  attack: number; defense: number; speed: number
  luck: number; rootBone: number; comprehension: number
}

interface PersonalityOption { gender: string; avatar: string; desc: string }
interface OriginOption { label: string; desc: string }
interface BackgroundOption { label: string; background: string }
interface TalentOption { name: string; desc: string; type: string }

interface CharacterCreationScreenProps {
  gameService: GameService
  onSelectCharacter: (character: Player) => void
  onReturnHome?: () => void
}

const STEP_LABELS: Record<StepId, string> = {
  name_stats: '命格初定',
  personality: '性格出身',
  talents: '初始天赋',
}

const steps: StepId[] = ['name_stats', 'personality', 'talents']

export function CharacterCreationScreen({
  gameService,
  onSelectCharacter,
  onReturnHome,
}: CharacterCreationScreenProps) {
  const [step, setStep] = useState<StepId>('name_stats')
  const [isLoading, setIsLoading] = useState(false)

  const [name, setName] = useState('')
  const [statPanels, setStatPanels] = useState<StatPanel[]>(() => gameService.generateStatPanels())
  const [selectedStatIdx, setSelectedStatIdx] = useState<number | null>(null)

  const [personalities, setPersonalities] = useState<PersonalityOption[]>([])
  const [origins, setOrigins] = useState<OriginOption[]>([])
  const [backgrounds, setBackgrounds] = useState<BackgroundOption[]>([])
  const [selectedPersonalityIdx, setSelectedPersonalityIdx] = useState<number | null>(null)
  const [selectedOriginIdx, setSelectedOriginIdx] = useState<number | null>(null)
  const [selectedBackgroundIdx, setSelectedBackgroundIdx] = useState<number | null>(null)

  const [talentOptions, setTalentOptions] = useState<TalentOption[]>([])
  const [selectedTalents, setSelectedTalents] = useState<Set<number>>(new Set())

  const rerollStats = useCallback(() => {
    setStatPanels(gameService.generateStatPanels())
    setSelectedStatIdx(null)
  }, [gameService])

  const handleStep1Next = useCallback(async () => {
    if (!name.trim()) { toast.error('请填写修士名号'); return }
    if (selectedStatIdx === null) { toast.error('请选择一组基础属性'); return }
    setIsLoading(true)
    try {
      const data = await gameService.generatePersonalityOptions(name.trim())
      setPersonalities(data.personalities || [])
      setOrigins(data.origins || [])
      setBackgrounds(data.backgrounds || [])
      setStep('personality')
    } catch {
      toast.error('天机推演受阻，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [name, selectedStatIdx, gameService])

  const handleStep2Next = useCallback(async () => {
    if (selectedPersonalityIdx === null) { toast.error('请选择性格'); return }
    if (selectedOriginIdx === null) { toast.error('请选择出生'); return }
    if (selectedBackgroundIdx === null) { toast.error('请选择背景'); return }
    setIsLoading(true)
    try {
      const o = origins[selectedOriginIdx]
      const b = backgrounds[selectedBackgroundIdx]
      const data = await gameService.generateTalentOptions(name, o.label, b.background)
      setTalentOptions(data.talents || [])
      setStep('talents')
    } catch {
      toast.error('天机推演受阻，请重试')
    } finally {
      setIsLoading(false)
    }
  }, [selectedPersonalityIdx, selectedOriginIdx, selectedBackgroundIdx, origins, backgrounds, name, gameService])

  const toggleTalent = (idx: number) => {
    setSelectedTalents(prev => {
      const next = new Set(prev)
      if (next.has(idx)) { next.delete(idx) }
      else if (next.size < 2) { next.add(idx) }
      else { toast.info('最多选择2个天赋') }
      return next
    })
  }

  const handleFinish = () => {
    if (selectedTalents.size < 1) { toast.error('请至少选择1个天赋'); return }
    if (selectedStatIdx === null || selectedPersonalityIdx === null || selectedOriginIdx === null || selectedBackgroundIdx === null) return

    const stats = statPanels[selectedStatIdx]
    const p = personalities[selectedPersonalityIdx]
    const bg = backgrounds[selectedBackgroundIdx]
    const talents = Array.from(selectedTalents).map(i => talentOptions[i].name)

    const character: Player = {
      id: Math.random().toString(36).substring(2, 15),
      name: name.trim(), gender: p.gender, avatar: p.avatar, background: bg.background,
      realm: '炼气期', minorRealm: '初期', cultivationProgress: 0,
      spiritualEnergy: 0, age: 18, lifespan: 120, maxLifespan: 120,
      health: stats.health, maxHealth: stats.maxHealth,
      spiritualPower: stats.spiritualPower, maxSpiritualPower: stats.maxSpiritualPower,
      attack: stats.attack, defense: stats.defense, speed: stats.speed,
      luck: stats.luck, rootBone: stats.rootBone, comprehension: stats.comprehension,
      karma: 0, talents, inventory: [], skills: [], relationships: {}, growthHistory: [],
    }
    onSelectCharacter(character)
  }

  const stepIdx = steps.indexOf(step)

  return (
    <div className="min-h-screen xian-bg p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* 顶部导航 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-10 relative"
        >
          {onReturnHome && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReturnHome}
              className="text-[hsl(var(--dim))] hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />返回
            </Button>
          )}
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <h1 className="text-2xl font-bold jade-text tracking-[0.2em]">踏入仙途</h1>
          </div>
        </motion.div>

        {/* 步骤指示器 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2 mb-10"
        >
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs tracking-wider transition-all duration-300 ${
                i < stepIdx
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : i === stepIdx
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white/3 text-[hsl(var(--dim))] border border-[hsl(var(--ink-border))]'
              }`}>
                {i < stepIdx ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                <span>{STEP_LABELS[s]}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px transition-colors duration-300 ${i < stepIdx ? 'bg-emerald-500/50' : 'bg-[hsl(var(--ink-border))]'}`} />
              )}
            </div>
          ))}
        </motion.div>

        {/* 步骤内容 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Step 1 */}
            {step === 'name_stats' && (
              <div className="space-y-7">
                <div className="space-y-2">
                  <Label className="text-foreground/70 text-xs tracking-widest">修士名号</Label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="请输入你的名字…"
                    className="border-[hsl(var(--ink-border))] text-foreground text-lg py-6
                      focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/30 tracking-wide"
                    maxLength={16}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground/70 text-xs tracking-widest">选择基础属性面板</Label>
                    <Button variant="ghost" size="sm" onClick={rerollStats}
                      className="text-[hsl(var(--dim))] hover:text-foreground text-xs">
                      <RefreshCw className="w-3 h-3 mr-1.5" />重新随机
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {statPanels.map((panel, idx) => (
                      <motion.div
                        key={idx}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedStatIdx(idx)}
                        className={`ink-card rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          selectedStatIdx === idx
                            ? 'card-selected'
                            : 'border border-[hsl(var(--ink-border))] hover:border-emerald-500/20'
                        }`}
                      >
                        <div className="text-center mb-3">
                          <span className="text-sm font-medium text-emerald-400 tracking-wider">{panel.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          <StatRow icon={<Heart className="w-3 h-3" />} label="气血" value={panel.maxHealth} />
                          <StatRow icon={<Zap className="w-3 h-3" />} label="真气" value={panel.maxSpiritualPower} />
                          <StatRow icon={<Sword className="w-3 h-3" />} label="攻击" value={panel.attack} />
                          <StatRow icon={<Shield className="w-3 h-3" />} label="防御" value={panel.defense} />
                          <StatRow icon={<Wind className="w-3 h-3" />} label="速度" value={panel.speed} />
                          <StatRow label="气运" value={panel.luck} />
                          <StatRow label="根骨" value={panel.rootBone} />
                          <StatRow label="悟性" value={panel.comprehension} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleStep1Next}
                    disabled={isLoading || !name.trim() || selectedStatIdx === null}
                    className="btn-jade px-8 rounded-xl tracking-widest disabled:opacity-40"
                  >
                    {isLoading ? (
                      <MiniLoading isLoading={true} text="推演中..." />
                    ) : (
                      <>下一步<ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 'personality' && (
              <div className="space-y-7">
                <SelectGroup
                  title="选择性格"
                  items={personalities.map(p => ({ label: `${p.avatar} ${p.gender}`, desc: p.desc }))}
                  selected={selectedPersonalityIdx}
                  onSelect={setSelectedPersonalityIdx}
                />
                <SelectGroup
                  title="选择出生"
                  items={origins.map(o => ({ label: o.label, desc: o.desc }))}
                  selected={selectedOriginIdx}
                  onSelect={setSelectedOriginIdx}
                />
                <SelectGroup
                  title="选择背景"
                  items={backgrounds.map(b => ({ label: b.label, desc: b.background }))}
                  selected={selectedBackgroundIdx}
                  onSelect={setSelectedBackgroundIdx}
                />
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep('name_stats')}
                    className="text-[hsl(var(--dim))] hover:text-foreground tracking-wider">
                    <ArrowLeft className="w-4 h-4 mr-1" />上一步
                  </Button>
                  <Button
                    onClick={handleStep2Next}
                    disabled={isLoading || selectedPersonalityIdx === null || selectedOriginIdx === null || selectedBackgroundIdx === null}
                    className="btn-jade px-8 rounded-xl tracking-widest disabled:opacity-40"
                  >
                    {isLoading ? (
                      <MiniLoading isLoading={true} text="推演中..." />
                    ) : (
                      <>下一步<ArrowRight className="w-4 h-4 ml-2" /></>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 'talents' && (
              <div className="space-y-7">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground/70 text-xs tracking-widest">选择初始天赋（最多2个）</Label>
                    <span className="text-xs text-[hsl(var(--dim))]">已选 {selectedTalents.size}/2</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {talentOptions.map((talent, idx) => {
                      const chosen = selectedTalents.has(idx)
                      return (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => toggleTalent(idx)}
                          className={`ink-card rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                            chosen
                              ? 'card-selected'
                              : 'border border-[hsl(var(--ink-border))] hover:border-emerald-500/20'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                              chosen ? 'bg-emerald-500 border-emerald-400' : 'border-[hsl(var(--ink-border))]'
                            }`}>
                              {chosen && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground/90 text-sm tracking-wide">{talent.name}</span>
                                <span className="text-xs px-1.5 py-0.5 bg-white/5 text-[hsl(var(--dim))] rounded border border-[hsl(var(--ink-border))]">
                                  {talent.type}
                                </span>
                              </div>
                              <p className="text-xs text-[hsl(var(--dim))] leading-relaxed">{talent.desc}</p>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="ghost" onClick={() => setStep('personality')}
                    className="text-[hsl(var(--dim))] hover:text-foreground tracking-wider">
                    <ArrowLeft className="w-4 h-4 mr-1" />上一步
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={selectedTalents.size < 1}
                    className="btn-jade px-8 rounded-xl tracking-widest disabled:opacity-40"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />踏入仙途
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Token 统计 - 悬浮显示 */}
      <TokenDisplay position="bottom-right" />

      {/* 沉浸式加载 */}
      <ImmersionLoading isLoading={isLoading} type="character" />
    </div>
  )
}

function StatRow({ icon, label, value }: { icon?: ReactNode; label: string; value: number }) {
  return (
    <div className="flex justify-between text-[hsl(var(--dim))]">
      <span className="flex items-center gap-1">{icon}{label}</span>
      <span className="text-foreground/80 tabular-nums">{value}</span>
    </div>
  )
}

function SelectGroup({
  title, items, selected, onSelect,
}: {
  title: string
  items: Array<{ label: string; desc: string }>
  selected: number | null
  onSelect: (i: number) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-foreground/70 text-xs tracking-widest">{title}</Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(idx)}
            className={`ink-card rounded-xl p-3 cursor-pointer transition-all duration-200 ${
              selected === idx
                ? 'card-selected'
                : 'border border-[hsl(var(--ink-border))] hover:border-emerald-500/20'
            }`}
          >
            <div className="font-medium text-foreground/90 text-sm mb-1 tracking-wide">{item.label}</div>
            <p className="text-xs text-[hsl(var(--dim))] leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

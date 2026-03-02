
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Sparkles, Settings, ArrowLeft, Heart, Zap, Sword, Shield, Wind } from 'lucide-react'
import type { Player } from '@/types/game'
import { SettingsPanel } from './SettingsPanel'

interface CharacterCreationScreenProps {
  characters: Player[]
  isLoading: boolean
  onSelectCharacter: (character: Player) => void
  onGenerateCharacters: () => void
  onReturnHome?: () => void
}

export function CharacterCreationScreen({
  characters,
  isLoading,
  onSelectCharacter,
  onGenerateCharacters,
  onReturnHome,
}: CharacterCreationScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      onSelectCharacter(characters[selectedIndex])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 标题和返回按钮 */}
        <div className="text-center mb-8 relative">
          {onReturnHome && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReturnHome}
              className="absolute left-0 top-0 text-zinc-400 hover:text-zinc-200"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回主页
            </Button>
          )}
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            踏入仙途
          </h1>
          <p className="text-zinc-400 text-lg">
            选择你的修仙之路，开启一段传奇 journey
          </p>
        </div>

        {/* 生成按钮和模型设置 */}
        {characters.length === 0 && (
          <div className="text-center mb-8 space-y-4">
            <Button
              onClick={onGenerateCharacters}
              disabled={isLoading}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  正在生成角色...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  生成角色
                </>
              )}
            </Button>

            {/* 模型设置按钮 */}
            <div>
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    模型设置
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-zinc-100">
                  <DialogHeader>
                    <DialogTitle className="text-zinc-100">模型设置</DialogTitle>
                  </DialogHeader>
                  <SettingsPanel />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {/* 角色卡片网格 */}
        {characters.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {characters.map((character, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedIndex === index
                      ? 'ring-2 ring-emerald-500 bg-zinc-800'
                      : 'hover:bg-zinc-800/50 bg-zinc-900'
                  }`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <CardHeader className="text-center pb-2">
                    <div className="text-6xl mb-2">{character.avatar}</div>
                    <CardTitle className="text-zinc-100">{character.name}</CardTitle>
                    <div className="flex justify-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                        {character.mbti}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                        {character.gender}
                      </span>
                    </div>
                    <CardDescription className="text-zinc-400 mt-2 line-clamp-2">
                      {character.background}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* 境界 */}
                    <div className="text-center">
                      <span className="text-emerald-400 font-medium">
                        {character.realm}·{character.minorRealm}
                      </span>
                    </div>

                    {/* 属性预览 */}
                    <div className="space-y-2">
                      {/* 基础属性 */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between text-zinc-400">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />气血</span>
                          <span className="text-zinc-200">{character.maxHealth}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3" />真气</span>
                          <span className="text-zinc-200">{character.maxSpiritualPower}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span className="flex items-center gap-1"><Sword className="w-3 h-3" />攻击</span>
                          <span className="text-zinc-200">{character.attack}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span className="flex items-center gap-1"><Shield className="w-3 h-3" />防御</span>
                          <span className="text-zinc-200">{character.defense}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span className="flex items-center gap-1"><Wind className="w-3 h-3" />速度</span>
                          <span className="text-zinc-200">{character.speed}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>气运</span>
                          <span className="text-zinc-200">{character.luck}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>根骨</span>
                          <span className="text-zinc-200">{character.rootBone}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>悟性</span>
                          <span className="text-zinc-200">{character.comprehension}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>寿元</span>
                          <span className="text-zinc-200">{character.maxLifespan}年</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span>年龄</span>
                          <span className="text-zinc-200">{character.age}岁</span>
                        </div>
                      </div>
                    </div>

                    {/* 天赋 */}
                    <div className="flex flex-wrap gap-1 pt-2 border-t border-zinc-800">
                      {character.talents.slice(0, 3).map((talent, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded"
                        >
                          {talent}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 确认按钮 */}
            <div className="text-center">
              <Button
                onClick={handleConfirm}
                disabled={selectedIndex === null}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-6 text-lg"
              >
                {selectedIndex !== null ? (
                  <>选择 {characters[selectedIndex].name} 踏入仙途</>
                ) : (
                  '请先选择一个角色'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

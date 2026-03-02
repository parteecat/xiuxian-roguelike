
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Heart, Skull, Minus } from 'lucide-react'
import type { Relationship } from '@/types/game'

interface RelationshipPanelProps {
  relationships: Record<string, Relationship>
}

export function RelationshipPanel({ relationships }: RelationshipPanelProps) {
  const getRelationshipIcon = (level: Relationship['level']) => {
    switch (level) {
      case '敌对':
        return <Skull className="w-4 h-4 text-red-400" />
      case '友好':
      case '亲密':
      case '挚爱':
        return <Heart className="w-4 h-4 text-pink-400" />
      default:
        return <Minus className="w-4 h-4 text-zinc-400" />
    }
  }

  const getRelationshipColor = (level: Relationship['level']) => {
    switch (level) {
      case '敌对':
        return 'text-red-400 border-red-900/30 bg-red-900/10'
      case '冷淡':
        return 'text-zinc-400 border-zinc-800 bg-zinc-900/30'
      case '中立':
        return 'text-blue-400 border-blue-900/30 bg-blue-900/10'
      case '友好':
        return 'text-emerald-400 border-emerald-900/30 bg-emerald-900/10'
      case '亲密':
        return 'text-pink-400 border-pink-900/30 bg-pink-900/10'
      case '挚爱':
        return 'text-purple-400 border-purple-900/30 bg-purple-900/10'
      default:
        return 'text-zinc-400'
    }
  }

  const getRelationshipText = (level: Relationship['level']) => {
    return level || '未知'
  }

  const relationshipList = Object.entries(relationships)

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
          <Users className="w-4 h-4" />
          人际关系 ({relationshipList.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {relationshipList.length === 0 ? (
          <div className="text-center text-zinc-600 py-4 text-sm">
            尚未结识任何人...
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {relationshipList.map(([npcId, relationship]) => (
                <div
                  key={npcId}
                  className={`p-3 rounded-lg border ${getRelationshipColor(relationship.level)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{relationship.npcEmoji}</span>
                      <div>
                        <div className="font-medium text-sm">
                          {relationship.npcName}
                        </div>
                        <div className="text-xs opacity-80">
                          {relationship.npcIdentity}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {getRelationshipIcon(relationship.level)}
                      <span className="text-xs font-medium">
                        {getRelationshipText(relationship.level)}
                      </span>
                    </div>
                  </div>
                  {relationship.description && (
                    <div className="mt-2 text-xs opacity-70 border-t border-current pt-2">
                      {relationship.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Package, Sword, Shield, FlaskConical, Scroll, Gem } from 'lucide-react'
import type { Item } from '@/types/game'

interface InventoryPanelProps {
  inventory: Item[]
}

export function InventoryPanel({ inventory }: InventoryPanelProps) {
  const getItemIcon = (type: Item['type']) => {
    switch (type) {
      case '武器':
        return <Sword className="w-4 h-4" />
      case '防具':
        return <Shield className="w-4 h-4" />
      case '丹药':
        return <FlaskConical className="w-4 h-4" />
      case '功法':
        return <Scroll className="w-4 h-4" />
      case '法宝':
      case '材料':
        return <Gem className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getQualityColor = (quality: Item['quality']) => {
    switch (quality) {
      case '凡品':
        return 'text-zinc-400'
      case '灵品':
        return 'text-emerald-400'
      case '仙品':
        return 'text-purple-400'
      case '神品':
        return 'text-yellow-400'
      default:
        return 'text-zinc-400'
    }
  }

  const getItemTypeText = (type: Item['type']) => {
    return type || '物品'
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
          <Package className="w-4 h-4" />
          背包 ({inventory.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {inventory.length === 0 ? (
          <div className="text-center text-zinc-600 py-4 text-sm">
            背包空空如也...
          </div>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {inventory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className={`${getQualityColor(item.quality)}`}>
                    {getItemIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate ${getQualityColor(item.quality)}`}>
                        {item.name}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-zinc-500">x{item.quantity}</span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {getItemTypeText(item.type)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

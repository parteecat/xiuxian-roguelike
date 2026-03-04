# 地图系统设计文档

## 1. 概述

地图系统为修仙世界提供地理维度的策略性，不同地点拥有独特的环境特征、可行动作和事件触发条件。玩家需要根据当前所在位置，选择合适的行动策略。

## 2. 核心设计目标

- **地点有意义**：每个地点类型决定可执行的行动范围
- **可视化呈现**：直观的地图界面显示当前位置和可移动区域
- **策略性移动**：移动消耗时间和寿元，需要权衡利弊
- **环境影响**：地点影响修炼效率、奇遇概率、遭遇敌人类型

## 3. 地图架构

### 3.1 世界地图结构

```
┌─────────────────────────────────────────────────────────────┐
│                        九霄界地图                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   [🏔️ 极北冰原] ──── [🌲 万妖山脉] ──── [🏛️ 青云主城]        │
│        │                  │                  │              │
│   [❄️ 寒冰洞窟]      [🌿 妖兽森林] ──── [🌊 碧水河]         │
│                             │                  │            │
│                        [⛰️ 古修遗迹] ──── [🏘️ 凡人村镇]      │
│                             │                               │
│                        [🗻 上古禁地]                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 地点类型定义

| 类型 | 描述 | 适合行动 | 限制 |
|------|------|----------|------|
| **仙城** | 修仙者聚集地，设施完善 | 交易、学习、社交、接任务 | 无法野外修炼 |
| **坊市** | 商业交易中心 | 买卖物品、打听消息 | 无法修炼、停留过久需付费 |
| **宗门** | 门派驻地 | 学习功法、获得庇护、参与门派活动 | 需好感度或身份 |
| **野外** | 自然环境 | 采集、狩猎、探索 | 无法城市活动 |
| **洞府** | 修炼场所 | 闭关、炼丹、炼器 | 无法探索外界 |
| **禁地** | 危险区域 | 探索遗迹、寻找传承 | 高风险、需特定条件进入 |
| **山脉** | 妖兽聚集地 | 猎妖、采药、历练 | 危险度高 |
| **水域** | 江河湖海 | 钓鱼、寻找水属性材料 | 需水属性功法或法术 |

### 3.3 地点数据模型

```typescript
// 地点类型
export type LocationType =
  | 'city'        // 仙城
  | 'market'      // 坊市
  | 'sect'        // 宗门
  | 'wilderness'  // 野外
  | 'cave'        // 洞府
  | 'forbidden'   // 禁地
  | 'mountain'    // 山脉
  | 'water'       // 水域
  | 'forest'      // 森林
  | 'ruins'       // 遗迹

// 地点连接信息
export interface LocationConnection {
  targetId: string      // 目标地点ID
  distance: number      // 距离（影响移动时间）
  dangerLevel: number   // 危险等级 1-10
  requirements?: {      // 通行要求
    minRealm?: CultivationRealm
    reputation?: number
    faction?: string
    questCompleted?: string
  }
}

// 地点定义
export interface Location {
  id: string
  name: string
  type: LocationType
  description: string
  emoji: string
  features: string[]           // 地点特色描述
  availableActions: string[]   // 可执行的行动类型
  forbiddenActions: string[]   // 禁止的行动类型
  cultivationBonus: number     // 修炼效率加成
  dangerLevel: number          // 危险等级
  connections: LocationConnection[]
  resources: {                  // 可采集资源
    herbs?: number
    ores?: number
    spiritualStones?: number
  }
  npcs: string[]              // 常驻NPC
  events: string[]            // 可能触发的事件
}

// 世界地图
export interface WorldMap {
  id: string
  name: string
  locations: Record<string, Location>
  startingLocation: string
  factions: Faction[]
}
```

## 4. 地点行动系统

### 4.1 行动分类

```typescript
// 行动类型映射表
export const locationActionMap: Record<LocationType, {
  allowed: string[]
  forbidden: string[]
  bonus: string[]
}> = {
  city: {
    allowed: ['交易', '学习', '社交', '休息', '接任务', '打听消息', '寻找道侣'],
    forbidden: ['野外修炼', '采集灵草', '狩猎妖兽', '开辟洞府'],
    bonus: ['社交效率+50%', '交易价格优惠']
  },
  market: {
    allowed: ['购买物品', '出售物品', '鉴定物品', '打听消息'],
    forbidden: ['修炼', '炼丹', '炼器', '长期停留'],
    bonus: ['物品种类丰富', '可能有稀有物品']
  },
  wilderness: {
    allowed: ['采集', '狩猎', '探索', '修炼', '开辟洞府', '寻找机缘'],
    forbidden: ['逛夜市', '酒馆喝酒', '门派任务', '交易法器'],
    bonus: ['灵气浓度可能更高', '奇遇概率提升']
  },
  cave: {
    allowed: ['闭关修炼', '炼丹', '炼器', '布阵', '休息'],
    forbidden: ['探索', '社交', '交易', '采集'],
    bonus: ['修炼速度+100%', '不受外界干扰']
  },
  forbidden: {
    allowed: ['探索遗迹', '挑战试炼', '寻找传承', '寻宝'],
    forbidden: ['长期停留', '建立关系', '修炼功法'],
    bonus: ['稀有物品', '传承功法', '大量修为'],
    risk: ['高死亡率', '可能被困']
  }
  // ... 其他地点类型
}
```

### 4.2 行动过滤逻辑

当玩家输入行动时，系统根据当前地点类型进行过滤和提示：

```typescript
export function validateAction(
  action: string,
  currentLocation: Location
): { valid: boolean; reason?: string; suggestion?: string } {
  // 检查禁止行动
  for (const forbidden of currentLocation.forbiddenActions) {
    if (action.includes(forbidden)) {
      return {
        valid: false,
        reason: `在${currentLocation.name}无法进行"${forbidden}"`,
        suggestion: getAlternativeAction(currentLocation.type, forbidden)
      }
    }
  }

  // 检查特殊要求
  if (currentLocation.type === 'forbidden') {
    return {
      valid: true,
      warning: '⚠️ 禁地危险，生死自负'
    }
  }

  return { valid: true }
}
```

## 5. 移动系统

### 5.1 移动规则

```typescript
export interface MoveResult {
  success: boolean
  timeCost: TimeCost
  dangerEncounter?: DangerEncounter
  newLocation: Location
}

export function calculateMoveCost(
  from: Location,
  to: Location,
  player: Player
): MoveResult {
  // 基础时间消耗
  const connection = from.connections.find(c => c.targetId === to.id)
  if (!connection) {
    return { success: false, reason: '无法直接到达，需要先前往中间地点' }
  }

  // 计算时间成本
  const baseDays = connection.distance
  const speedFactor = player.speed / 50  // 速度影响
  const realmFactor = getRealmMoveFactor(player.realm)

  const actualDays = Math.max(1, Math.floor(baseDays / (speedFactor * realmFactor)))

  // 计算遭遇危险概率
  const dangerRoll = Math.random() * 100
  const dangerThreshold = connection.dangerLevel * 10 - player.luck * 0.5

  let dangerEncounter = null
  if (dangerRoll < dangerThreshold) {
    dangerEncounter = generateDangerEncounter(connection.dangerLevel, to.type)
  }

  return {
    success: true,
    timeCost: { days: actualDays },
    dangerEncounter,
    newLocation: to
  }
}
```

### 5.2 移动界面

```
┌─────────────────────────────────────────┐
│ 📍 当前位置：青云城                        │
├─────────────────────────────────────────┤
│                                         │
│     可前往的地点：                        │
│                                         │
│   [🌲 迷雾森林]  ← 2天 → 危险度：⭐⭐      │
│   [🏘️ 坊市]     ← 0.5天 → 危险度：⭐      │
│   [⛰️ 古剑山脉]  ← 5天 → 危险度：⭐⭐⭐    │
│                                         │
│   [其他远方地点...]                       │
│                                         │
└─────────────────────────────────────────┘
```

## 6. 地点特效

### 6.1 修炼加成

不同地点对修炼有不同加成效果：

| 地点 | 修炼加成 | 特殊效果 |
|------|----------|----------|
| 灵脉洞府 | +150% | 灵气自动恢复 |
| 宗门禁地 | +200% | 但需贡献度 |
| 妖兽山脉 | +50% | 可能被打断 |
| 上古遗迹 | +100% | 可能触发奇遇 |
| 普通野外 | +0% | 基础修炼 |
| 城市客栈 | -30% | 但安全 |

### 6.2 奇遇触发

```typescript
export function checkRandomEncounter(
  location: Location,
  player: Player,
  action: string
): RandomEncounter | null {
  const baseChance = location.dangerLevel * 0.5 + player.luck * 0.1
  const roll = Math.random() * 100

  if (roll < baseChance) {
    // 根据地点类型生成对应奇遇
    return generateEncounter(location.type, player)
  }

  return null
}
```

## 7. UI设计

### 7.1 地图组件

```typescript
interface WorldMapProps {
  currentLocationId: string
  visitedLocations: string[]
  knownLocations: string[]
  onLocationSelect: (locationId: string) => void
  player: Player
}

// 地图显示模式
export type MapViewMode = 'full' | 'local' | 'mini'
```

### 7.2 地点信息面板

```
┌─────────────────────────────────────────┐
│ 📍 迷雾森林                              │
├─────────────────────────────────────────┤
│ 🏷️ 类型：野外                             │
│ ⚠️ 危险度：⭐⭐⭐                         │
│ 🌿 资源：灵草丰富、妖兽出没                │
│                                         │
│ 可执行行动：                              │
│ ✓ 采集灵草                               │
│ ✓ 狩猎妖兽                               │
│ ✓ 寻找洞府                               │
│ ✓ 闭关修炼                               │
│                                         │
│ 不可执行：                                │
│ ✗ 逛夜市、酒馆喝酒                         │
│ ✗ 购买法器                               │
│                                         │
│ [前往此地] [查看附近]                     │
└─────────────────────────────────────────┘
```

### 7.3 小地图嵌入

在GameScreen顶部显示当前位置信息：

```
┌─────────────────────────────────────────┐
│ 九霄界 · 📍迷雾森林 · 🕐第23年3月         │
│ [展开地图] [快速移动] [探索四周]          │
└─────────────────────────────────────────┘
```

## 8. LLM集成

### 8.1 地点感知提示词

在剧情推演提示词中加入地点信息：

```typescript
export const locationAwarePrompt = (context: {
  player: Player
  currentLocation: Location
  action: string
}) => `
当前地点：${context.currentLocation.name}
地点类型：${context.currentLocation.type}
环境描述：${context.currentLocation.description}
危险等级：${context.currentLocation.dangerLevel}/10

地点特色：
${context.currentLocation.features.map(f => `- ${f}`).join('\n')}

可执行行动：
${context.currentLocation.availableActions.join('、')}

禁止行动：
${context.currentLocation.forbiddenActions.join('、')}

玩家行动："${context.action}"

请根据地点环境推演剧情结果。如果玩家尝试在不适合的地点进行某行动，请：
1. 说明为什么不能这样做
2. 提供替代方案
3. 或推演尝试失败的后果

以JSON格式返回结果。
`
```

### 8.2 动态行动建议

根据当前地点，LLM生成的建议行动列表：

```typescript
export function generateLocationBasedSuggestions(
  location: Location,
  player: Player
): string[] {
  const baseSuggestions = location.availableActions.slice(0, 4)

  // 根据玩家状态调整
  if (player.health < 30 && location.type !== 'city') {
    baseSuggestions.push('寻找安全地点疗伤')
  }

  if (player.cultivationProgress > 90) {
    baseSuggestions.push('寻找适合突破的地点')
  }

  return baseSuggestions
}
```

## 9. 数据持久化

### 9.1 地图数据存储

```typescript
// 存储在 IndexedDB 的地图相关数据
interface MapSaveData {
  saveId: string
  currentLocationId: string
  visitedLocations: string[]
  knownLocations: string[]
  discoveredSecrets: string[]
  locationHistory: {
    locationId: string
    arrivedAt: number
    departedAt?: number
    events: string[]
  }[]
}
```

### 9.2 世界数据

世界地图数据作为静态配置存储在 `src/data/worldMap.ts`，不随存档变化。

## 10. 实现清单

### Phase 1: 基础数据
- [ ] 创建 `src/data/worldMap.ts` - 世界地图数据
- [ ] 更新 `src/types/game.ts` - 添加Location类型
- [ ] 创建 `src/utils/locationActions.ts` - 行动验证工具

### Phase 2: 状态管理
- [ ] 更新 `src/stores/useGameStore.ts` - 添加地图相关状态
- [ ] 创建 `src/stores/useMapStore.ts` - 地图专用store

### Phase 3: 组件开发
- [ ] 创建 `src/components/WorldMap.tsx` - 地图组件
- [ ] 创建 `src/components/LocationInfo.tsx` - 地点信息
- [ ] 创建 `src/components/LocationSelector.tsx` - 地点选择器

### Phase 4: 集成
- [ ] 更新 `src/components/GameScreen.tsx` - 嵌入地图UI
- [ ] 更新 `src/prompts/story.ts` - 地点感知提示词
- [ ] 更新 `src/services/gameService.ts` - 地点相关逻辑

### Phase 5: 行动过滤
- [ ] 更新 `src/components/ActionInput.tsx` - 地点感知建议
- [ ] 实现行动验证拦截逻辑

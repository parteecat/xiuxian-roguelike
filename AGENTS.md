# AGENTS.md - 修仙 Roguelike 项目开发指南

本文件为 AI 编码助手提供项目规范和工作流程指导。

## 项目概述

这是一个纯前端修仙主题 Roguelike 游戏，使用 LLM 实时驱动游戏内容生成。

**核心特性：**
- AI 驱动的角色创建（生成 3 个随机角色供选择）
- AI DM 剧情推演系统（根据玩家行动实时生成剧情）
- 完整的修仙系统（修为、寿元、境界突破、根骨悟性等）
- NPC 交互和好感度系统
- 多层记忆系统（工作记忆 + 摘要记忆 + RAG 检索）
- 混合存储方案（localStorage + IndexedDB）

**技术栈：**
- Vite + React 18 + TypeScript
- TailwindCSS + shadcn/ui
- Zustand (状态管理) + zustand-persist (持久化)
- lucide-react (图标)
- @xenova/transformers (浏览器端嵌入模型)
- Vitest (测试)

---

## 1. 构建和开发命令

### 开发服务器
```bash
npm run dev          # 启动开发服务器
```

### 构建
```bash
npm run build         # 生产构建 (tsc && vite build)
npm run preview       # 预览构建结果
```

### 代码检查
```bash
npm run lint        # ESLint 检查
```

### 测试
```bash
npm run test                    # 运行测试 (watch 模式)
npm run test:run                # 单次运行测试
npm run test:coverage          # 生成覆盖率报告
```

---

## 2. 游戏核心系统规范

### 2.1 境界系统

**境界等级（CultivationRealm）：**
```typescript
type CultivationRealm = 
  | '炼气期'
  | '筑基期'
  | '金丹期'
  | '元婴期'
  | '化神期'
  | '炼虚期'
  | '合体期'
  | '大乘期'
  | '渡劫期'
```

**小境界（MinorRealm）：** `初期 | 中期 | 后期 | 巅峰`

**寿元上限参考：**
- 炼气期：100-150 岁
- 筑基期：200-300 岁
- 金丹期：500 岁
- 元婴期：1000 岁
- 更高境界依次递增

### 2.2 属性系统

**核心属性：**
- `health/maxHealth` - 气血（生命值）
- `spiritualPower/maxSpiritualPower` - 真气（施法消耗）
- `attack` - 攻击
- `defense` - 防御
- `speed` - 速度
- `luck` - 气运（奇遇概率）
- `rootBone` - 根骨（影响修炼速度、突破成功率）
- `comprehension` - 悟性（影响领悟功法、技能学习速度）

**修为相关：**
- `cultivationProgress` - 修为进度（0-100%）
- `spiritualEnergy` - 灵气值
- `lifespan/maxLifespan` - 剩余寿元/最大寿元
- `age` - 年龄

### 2.3 时间消耗系统

**行动时间参考：**
- 短途移动（城内）：1-6 时辰
- 长途移动（跨城）：1-30 天
- 普通修炼：1-7 天
- 闭关修炼：1-12 个月
- 探索秘境：1-30 天
- 炼制丹药/法器：1-30 天
- 学习功法：1-30 天
- 战斗：数时辰

**修为增长参考：**
- 普通修炼：每天 1-5%（受根骨、环境灵气影响）
- 服用丹药：立即获得 5-20%（有丹毒风险）
- 奇遇/传承：获得 10-50%

---

## 3. 代码风格指南

### 3.1 导入规范

#### 导入顺序（从上到下）：
1. React 相关导入
2. 第三方库导入
3. 内部模块导入 (@/ 别名)
4. 相对路径导入
5. 样式导入

示例：
```typescript
import { useState, useEffect } from 'react'
import { useStore } from 'zustand'
import { Button } from '@/components/ui/button'
import { useGameStore } from '@/stores/useGameStore'
import { GameState } from '@/types/game'
import './styles.css'
```

### 3.2 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| 组件 | PascalCase | `GameScreen.tsx` |
| 函数/变量 | camelCase | `generateWorld` |
| 常量 | UPPER_SNAKE_CASE | `MAX_LIFESPAN` |
| 接口/类型 | PascalCase | `Player` |
| 枚举值 | 中文（修仙术语）| `'炼气期'`, `'友好'` |
| Hook | use + camelCase | `useGameState` |
| CSS 类 | kebab-case | `status-panel` |

### 3.3 类型规范

- **强制使用 TypeScript，避免 `any` 类型**
- 优先使用接口定义对象类型
- 类型定义统一放在 `src/types/` 目录
- 游戏相关字符串枚举使用中文（修仙风格）

```typescript
// 好的实践 - 使用中文枚举
export type CultivationRealm = '炼气期' | '筑基期' | '金丹期'
export type RelationshipLevel = '敌对' | '冷淡' | '中立' | '友好' | '亲密' | '挚爱'

export interface Player {
  id: string
  name: string
  realm: CultivationRealm
  rootBone: number  // 根骨
  comprehension: number  // 悟性
}
```

### 3.4 格式化

- 使用 2 空格缩进
- 行尾无分号
- 使用单引号
- 每行最多 100 字符
- 对象/数组最后加 trailing comma

### 3.5 错误处理

```typescript
// 使用 try-catch 处理异步操作
// 始终提供有意义的错误消息
// 使用 toast 显示用户友好的错误提示

import { toast } from 'sonner'

async function fetchData() {
  try {
    const result = await llmService.generate()
    return result
  } catch (error) {
    console.error('生成失败:', error)
    toast.error('世界生成失败，请重试')
    throw new Error('生成失败')
  }
}
```

### 3.6 组件规范

- 组件文件命名与组件名一致
- 优先使用函数组件
- 使用 TypeScript 定义 Props 类型
- 使用 cn() 工具合并 className

```typescript
import { cn } from '@/lib/utils'

interface StatusPanelProps {
  player: Player
  className?: string
}

export function StatusPanel({ player, className }: StatusPanelProps) {
  return <div className={cn('status-panel', className)}>{/* ... */}</div>
}
```

---

## 4. 项目结构

```
xianxia-roguelike/
├── src/
│   ├── components/          # React 组件
│   │   ├── ui/             # shadcn/ui 组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── textarea.tsx
│   │   ├── CharacterCreationScreen.tsx  # 角色创建界面
│   │   ├── GameScreen.tsx               # 游戏主界面
│   │   ├── StatusPanel.tsx              # 角色状态面板
│   │   ├── StoryLog.tsx                 # 剧情日志
│   │   ├── ActionInput.tsx              # 行动输入
│   │   ├── SettingsPanel.tsx            # 设置面板
│   │   ├── InventoryPanel.tsx           # 背包面板
│   │   └── RelationshipPanel.tsx        # 关系面板
│   ├── stores/             # Zustand stores
│   │   ├── useGameStore.ts      # 游戏状态管理
│   │   └── useSettingsStore.ts  # 设置状态管理
│   ├── types/              # TypeScript 类型定义
│   │   └── game.ts         # 游戏相关类型
│   ├── services/           # 服务层
│   │   ├── llmService.ts       # LLM API 调用
│   │   ├── gameService.ts      # 游戏逻辑服务
│   │   ├── memoryService.ts    # 记忆管理服务
│   │   └── db.ts               # IndexedDB 封装
│   ├── prompts/            # LLM 提示词
│   │   ├── character.ts    # 角色生成提示词
│   │   ├── story.ts        # 剧情推演提示词
│   │   └── summary.ts      # 记忆摘要提示词
│   ├── lib/                # 工具函数
│   │   └── utils.ts        # 通用工具函数
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── .trae/
│   └── specs/              # Trae 需求规格文档
│       └── implement-xianxia-roguelike/
│           ├── spec.md
│           ├── tasks.md
│           └── checklist.md
├── public/                 # 静态资源
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── .eslintrc.cjs
└── AGENTS.md               # 本文件
```

---

## 5. Zustand Store 规范

### 5.1 Store 定义规范

```typescript
// src/stores/useGameStore.ts
import { create } from 'zustand'
import type { Player, NPC, World, GameLog, Event, Memory } from '@/types/game'

interface GameStore {
  // State
  player: Player | null
  npcs: NPC[]
  world: World | null
  logs: GameLog[]
  isLoading: boolean
  
  // Actions
  setPlayer: (player: Player | null) => void
  updatePlayer: (updates: Partial<Player>) => void
  addLog: (log: Omit<GameLog, 'id' | 'timestamp'>) => void
  setIsLoading: (isLoading: boolean) => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>()((set) => ({
  // 初始状态
  player: null,
  npcs: [],
  world: null,
  logs: [],
  isLoading: false,
  
  // Actions
  setPlayer: (player) => set({ player }),
  
  updatePlayer: (updates) =>
    set((state) => ({
      player: state.player ? { ...state.player, ...updates } : null,
    })),
  
  addLog: (log) =>
    set((state) => ({
      logs: [
        ...state.logs,
        { ...log, id: generateId(), timestamp: Date.now() },
      ],
    })),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  resetGame: () =>
    set({
      player: null,
      npcs: [],
      world: null,
      logs: [],
      isLoading: false,
    }),
}))
```

### 5.2 持久化规范

- **localStorage**: 用于存储用户设置（API 配置、主题等）
- **IndexedDB**: 用于存储游戏存档和记忆片段（大容量）

```typescript
// 设置 Store 使用 localStorage 持久化
import { persist, createJSONStorage } from 'zustand/middleware'

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({ ... }),
    {
      name: 'xiuxian-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
```

---

## 6. LLM 相关规范

### 6.1 API 调用规范

```typescript
// 必须使用 JSON 模式
const response = await llmService.generate(messages, {
  temperature: 0.7,
  response_format: { type: 'json_object' },  // 强制使用
})

// 解析并验证结果
const result = JSON.parse(response.content)
```

### 6.2 重试机制

- 所有 LLM 调用必须有重试逻辑（默认 3 次）
- 使用指数退避策略
- 解析失败时提供友好的错误处理

```typescript
const maxRetries = 3
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    return await this.makeRequest(messages, options)
  } catch (error) {
    if (attempt === maxRetries) throw error
    await this.delay(1000 * attempt)
  }
}
```

### 6.3 提示词规范

- 系统提示词定义在 `src/prompts/` 目录
- 按功能分类：character.ts（角色）、story.ts（剧情）、summary.ts（摘要）
- 提示词必须明确要求返回 JSON 格式
- 包含完整的数据结构和示例

---

## 7. 记忆系统规范

### 7.1 三层记忆架构

1. **工作记忆（Working Memory）**: 最近 N 条完整对话（默认 10 条）
2. **摘要记忆（Summary Memory）**: 旧对话压缩摘要
3. **RAG 检索（RAG）**: 基于语义相似度的记忆检索

### 7.2 记忆类型

```typescript
type MemoryType = 
  | '角色状态变化' 
  | 'NPC 交互' 
  | '关键事件' 
  | '普通对话' 
  | '背景信息'
```

### 7.3 记忆重要性评分

- 9-10: 突破、死亡、奇遇、传承、天劫、飞升、获得重要物品
- 7-8: 修炼、战斗、探索、学习、炼制、结识 NPC
- 5-6: 普通对话、背景信息

---

## 8. UI 设计规范

### 8.1 配色方案

**主题**: Zinc (灰) + Emerald (绿) 暗黑修仙风格

**颜色使用：**
- 背景: `bg-zinc-950` (主背景), `bg-zinc-900` (卡片)
- 边框: `border-zinc-800`
- 文字: `text-zinc-100` (主文字), `text-zinc-400` (次要), `text-zinc-500` (提示)
- 强调色: `text-emerald-400` (修为、成功), `text-red-400` (危险、敌对)
- 进度条: 修为(emerald), 寿元(orange/red), 气血(red), 真气(blue)

### 8.2 布局规范

**桌面端:**
- 左侧：角色状态面板（3/12）
- 右侧：剧情日志 + 行动输入（9/12）
- 最大宽度：`max-w-7xl`

**移动端:**
- 垂直堆叠布局
- 状态面板可折叠

### 8.3 组件规范

**卡片样式：**
```tsx
<Card className="bg-zinc-900 border-zinc-800">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

**按钮样式：**
```tsx
// 主按钮
<Button className="bg-emerald-600 hover:bg-emerald-700">

// 次要按钮
<Button variant="outline" className="border-zinc-700">
```

---

## 9. Git 提交规范

提交信息格式：
```
<type>(<scope>): <subject>

<body>
```

**Type 类型：**
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

**示例：**
```
feat(game): 实现突破境界逻辑

- 添加突破成功率计算（基于根骨、悟性、气运）
- 实现突破成功/失败的剧情分支
- 更新寿元上限计算
```

---

## 10. 开发检查清单

在完成任何功能后，请确认：

- [ ] TypeScript 类型定义完整
- [ ] `npm run build` 构建成功
- [ ] `npm run lint` ESLint 检查通过
- [ ] 移动端适配正常
- [ ] 错误处理完善（try-catch + toast 提示）
- [ ] 新增的文件符合项目结构规范

---

## 11. 参考文档

- **项目需求**: `.trae/specs/implement-xianxia-roguelike/spec.md`
- **任务清单**: `.trae/specs/implement-xianxia-roguelike/checklist.md`
- **类型定义**: `src/types/game.ts`
- **shadcn/ui**: https://ui.shadcn.com/

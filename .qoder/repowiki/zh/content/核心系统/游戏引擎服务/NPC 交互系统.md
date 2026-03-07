# NPC 交互系统

<cite>
**本文档引用的文件**
- [game.ts](file://src/types/game.ts)
- [gameService.ts](file://src/services/gameService.ts)
- [NPCInteractModal.tsx](file://src/components/NPCInteractModal.tsx)
- [useGameStore.ts](file://src/stores/useGameStore.ts)
- [App.tsx](file://src/App.tsx)
- [GameScreen.tsx](file://src/components/GameScreen.tsx)
- [NPCPanel.tsx](file://src/components/NPCPanel.tsx)
- [RelationshipPanel.tsx](file://src/components/RelationshipPanel.tsx)
- [memoryService.ts](file://src/services/memoryService.ts)
</cite>

## 目录
1. [简介](#简介)
2. [项目结构](#项目结构)
3. [核心组件](#核心组件)
4. [架构概览](#架构概览)
5. [详细组件分析](#详细组件分析)
6. [依赖关系分析](#依赖关系分析)
7. [性能考虑](#性能考虑)
8. [故障排除指南](#故障排除指南)
9. [结论](#结论)

## 简介

NPC 交互系统是修仙 Roguelike 游戏中的核心社交机制，负责管理玩家与非玩家角色之间的互动。该系统基于大型语言模型（LLM）驱动，实现了动态的对话生成、状态管理和关系系统。系统支持多种互动类型，包括打听消息、赠送礼物、切磋、探查、结为好友和结为道侣等。

## 项目结构

NPC 交互系统主要分布在以下几个模块中：

```mermaid
graph TB
subgraph "类型定义层"
Types[游戏类型定义<br/>game.ts]
end
subgraph "服务层"
GameService[游戏服务<br/>gameService.ts]
MemoryService[记忆服务<br/>memoryService.ts]
end
subgraph "组件层"
App[应用组件<br/>App.tsx]
GameScreen[游戏界面<br/>GameScreen.tsx]
NPCPanel[NPC面板<br/>NPCPanel.tsx]
NPCModal[NPC交互模态框<br/>NPCInteractModal.tsx]
RelationshipPanel[关系面板<br/>RelationshipPanel.tsx]
end
subgraph "状态管理层"
GameStore[游戏状态存储<br/>useGameStore.ts]
end
Types --> GameService
GameService --> App
App --> GameScreen
GameScreen --> NPCPanel
GameScreen --> NPCModal
NPCModal --> GameService
App --> GameStore
GameService --> MemoryService
```

**图表来源**
- [game.ts](file://src/types/game.ts#L1-L319)
- [gameService.ts](file://src/services/gameService.ts#L1-L541)
- [App.tsx](file://src/App.tsx#L1-L588)

**章节来源**
- [game.ts](file://src/types/game.ts#L1-L319)
- [gameService.ts](file://src/services/gameService.ts#L1-L541)

## 核心组件

### NPC 交互结果结构

NPCInteractResult 是交互系统的核心数据结构，定义了交互后的所有可能结果：

```mermaid
classDiagram
class NPCInteractResult {
+string dialogue
+NPCInteraction[] possibleInteractions
+npcStateDelta : NPCStateDelta
+playerStateDelta? : PlayerStateDelta
+NPC[] newNPCs?
+string locationChange?
+Time timePassed?
+string storyUpdate?
}
class NPCStateDelta {
+number favor?
+string[] memoryTags?
+boolean revealedAttributes?
+string relationshipDesc?
}
class PlayerStateDelta {
+number health?
+number spiritualPower?
+Item[] itemsGained?
+string[] itemsLost?
}
class NPCInteraction {
+NPCInteractionType type
+string label
+string description
+boolean enabled
+string reason?
}
NPCInteractResult --> NPCStateDelta
NPCInteractResult --> PlayerStateDelta
NPCInteractResult --> NPCInteraction
```

**图表来源**
- [game.ts](file://src/types/game.ts#L265-L285)

### NPC 关系系统

系统实现了完整的 NPC 关系管理系统，包括好感度计算、关系等级和记忆标签机制：

```mermaid
classDiagram
class Relationship {
+string npcId
+string npcName
+string npcEmoji
+string npcIdentity
+RelationshipLevel level
+number favorability
+string description?
+number firstMetAt?
+number lastInteractionAt?
+number interactionCount?
+string[] tags?
+string notes?
+string[] history
}
class NPC {
+string id
+string name
+string emoji
+string avatar
+CultivationRealm realm
+MinorRealm minorRealm
+string identity
+number favor
+FavorLevel favorLevel
+string[] memoryTags
+number interactionCount
+Record~string,Relationship~ relationships
}
class Memory {
+string id
+string saveId
+MemoryType type
+string content
+Embedding embedding?
+number timestamp
+number importance
}
NPC --> Relationship : "管理"
Relationship --> Memory : "记录"
```

**图表来源**
- [game.ts](file://src/types/game.ts#L94-L108)
- [game.ts](file://src/types/game.ts#L173-L203)
- [game.ts](file://src/types/game.ts#L63-L71)

**章节来源**
- [game.ts](file://src/types/game.ts#L94-L108)
- [game.ts](file://src/types/game.ts#L173-L203)
- [game.ts](file://src/types/game.ts#L265-L285)

## 架构概览

NPC 交互系统采用分层架构设计，确保了良好的模块分离和可维护性：

```mermaid
sequenceDiagram
participant Player as 玩家
participant Modal as NPC交互模态框
participant App as 应用组件
participant Service as 游戏服务
participant LLM as LLM服务
participant Memory as 记忆服务
participant Store as 状态存储
Player->>Modal : 选择NPC并打开交互
Modal->>App : 触发交互动作
App->>Service : interactWithNPC(npc, player, location, action)
Service->>Memory : 添加交互记忆
Memory-->>Service : 记忆ID
Service->>LLM : 生成交互结果
LLM-->>Service : NPCInteractResult
Service-->>App : 返回交互结果
App->>Store : 更新NPC状态
App->>Store : 更新玩家状态
App-->>Modal : 显示对话和选项
Modal-->>Player : 展示交互结果
```

**图表来源**
- [App.tsx](file://src/App.tsx#L481-L548)
- [gameService.ts](file://src/services/gameService.ts#L416-L469)

## 详细组件分析

### interactWithNPC() 方法实现

interactWithNPC() 是 NPC 交互系统的核心方法，负责处理所有类型的 NPC 互动：

#### 方法签名和参数
- **输入参数**：NPC 对象、Player 对象、当前位置字符串、交互动作字符串
- **返回值**：Promise<NPCInteractResult> 异步结果对象

#### 实现流程

```mermaid
flowchart TD
Start([开始交互]) --> Validate["验证内存服务初始化"]
Validate --> BuildMessages["构建LLM消息"]
BuildMessages --> CallLLM["调用LLM生成"]
CallLLM --> ParseResult["解析JSON结果"]
ParseResult --> AddMemory["记录交互记忆"]
AddMemory --> ReturnResult["返回结果对象"]
ReturnResult --> End([结束])
Validate --> |失败| Error["抛出错误"]
Error --> End
```

**图表来源**
- [gameService.ts](file://src/services/gameService.ts#L416-L469)

#### 关键实现细节

1. **消息构建**：系统构建包含系统提示词和用户提示词的消息数组
2. **LLM 调用**：使用温度参数 0.7 和 JSON 格式响应
3. **结果解析**：将 LLM 返回的 JSON 字符串解析为结构化对象
4. **默认值处理**：为缺失字段提供安全的默认值
5. **记忆记录**：将交互过程记录到记忆服务中

**章节来源**
- [gameService.ts](file://src/services/gameService.ts#L416-L469)

### NPCInteractResult 结构详解

NPCInteractResult 结构包含了交互后的所有可能变化：

#### 对话生成机制
- **对话内容**：NPC 的回复文本，通过 LLM 动态生成
- **互动选项**：基于当前情境和玩家状态生成的可用选项
- **上下文感知**：结合玩家境界、NPC 特性和位置环境

#### 状态变化字段

| 字段名 | 类型 | 描述 | 示例 |
|--------|------|------|------|
| dialogue | string | NPC 的回复文字 | "年轻人，你看起来很有潜力..." |
| possibleInteractions | NPCInteraction[] | 可用的互动选项列表 | [打听消息, 赠送礼物, 离开] |
| npcStateDelta | NPCStateDelta | NPC 状态变化 | 好感度变化, 属性揭示 |
| playerStateDelta | PlayerStateDelta | 玩家状态变化 | 生命值变化, 真气增减 |
| timePassed | Time | 时间流逝 | 年, 月, 日, 时辰 |
| storyUpdate | string | 剧情更新文本 | 新的故事情节发展 |

#### NPC 状态变化

```mermaid
classDiagram
class NPCStateDelta {
+number favor
+string[] memoryTags
+boolean revealedAttributes
+string relationshipDesc
}
class PlayerStateDelta {
+number health
+number spiritualPower
+Item[] itemsGained
+string[] itemsLost
}
class Time {
+number year
+number month
+number day
+number shichen
}
NPCStateDelta --> Time : "可能包含"
```

**图表来源**
- [game.ts](file://src/types/game.ts#L269-L284)

**章节来源**
- [game.ts](file://src/types/game.ts#L265-L285)

### generateLocationNPCs() 区域 NPC 生成算法

generateLocationNPCs() 方法实现了智能的区域 NPC 生成算法：

#### 算法流程

```mermaid
flowchart TD
Start([开始生成]) --> GetLocation["获取位置信息"]
GetLocation --> GetPlayer["获取玩家境界"]
GetPlayer --> BuildPrompt["构建生成提示词"]
BuildPrompt --> CallLLM["调用LLM生成"]
CallLLM --> ParseResult["解析JSON结果"]
ParseResult --> ValidateFields["验证必需字段"]
ValidateFields --> SetDefaults["设置默认值"]
SetDefaults --> ReturnNPCs["返回NPC列表"]
ReturnNPCs --> End([结束])
```

**图表来源**
- [gameService.ts](file://src/services/gameService.ts#L471-L537)

#### 生成规则

1. **位置适配**：根据区域特点生成合适的 NPC 类型
   - 山麓：采药人、散修
   - 宗门：弟子、长老
   - 城市：商人、游侠

2. **境界匹配**：NPC 境界与玩家相当或略高/略低
3. **多样性保证**：性格各异，包含正邪角色
4. **初始状态**：所有 NPC 初始好感度为 0（陌生）

**章节来源**
- [gameService.ts](file://src/services/gameService.ts#L471-L537)

### NPC 关系系统设计

#### 好感度计算机制

系统实现了多层次的好感度系统：

```mermaid
flowchart TD
FavorStart[初始好感度: 0] --> Action[执行交互动作]
Action --> Change{动作类型}
Change --> |赠送礼物| Gift["+10~+30"]
Change --> |切磋| Fight["±5~±15"]
Change --> |打听消息| Talk["±2~±8"]
Change --> |探查| Probe["±1~±5"]
Change --> |结为好友| Friend["+50~+80"]
Change --> |结为道侣| Lover["+80~+100"]
Gift --> Update["更新关系等级"]
Fight --> Update
Talk --> Update
Probe --> Update
Friend --> Update
Lover --> Update
Update --> LevelCheck{"检查关系等级"}
LevelCheck --> |<= -100| Enemy["仇敌"]
LevelCheck --> |-100~-50| Hostile["敌视"]
LevelCheck --> |-50~30| Stranger["陌生"]
LevelCheck --> |30~60| Friend["朋友"]
LevelCheck --> |60~80| GoodFriend["好友"]
LevelCheck --> |80~100| Intimate["生死之交"]
LevelCheck --> |>100| Lover2["道侣"]
Enemy --> End([完成])
Hostile --> End
Stranger --> End
Friend --> End
GoodFriend --> End
Intimate --> End
Lover2 --> End
```

**图表来源**
- [game.ts](file://src/types/game.ts#L287-L296)

#### 关系等级系统

| 等级 | 分数范围 | 描述 | 颜色 |
|------|----------|------|------|
| 仇敌 | ≤ -100 | 深仇大恨 | 🖤 死亡 |
| 敌视 | -100~-50 | 敌对关系 | ⚔️ 战争 |
| 陌生 | -50~30 | 初次见面 | 😐 中性 |
| 朋友 | 30~60 | 友好关系 | 🙂 友谊 |
| 好友 | 60~80 | 深厚友谊 | 😊 信任 |
| 生死之交 | 80~100 | 生死兄弟 | 💜 深情 |
| 道侣 | > 100 | 修仙伴侣 | 💗 深爱 |

**章节来源**
- [game.ts](file://src/types/game.ts#L43-L46)
- [game.ts](file://src/types/game.ts#L287-L296)

### 用户界面组件

#### NPC 交互模态框

NPCInteractModal 提供了直观的交互界面：

```mermaid
classDiagram
class NPCInteractModal {
+NPC npc
+boolean isOpen
+function onClose
+function onInteract
-string dialogue
-NPCInteraction[] interactions
-boolean interactLoading
-boolean hasInteracted
+handleInteract(action)
}
class InteractionIcon {
+string 打听消息
+string 赠送礼物
+string 切磋
+string 探查
+string 结为好友
+string 结为道侣
+string 离开
}
NPCInteractModal --> InteractionIcon : "使用"
```

**图表来源**
- [NPCInteractModal.tsx](file://src/components/NPCInteractModal.tsx#L1-L223)

#### NPC 面板

NPCPanel 展示了附近 NPC 的基本信息：

- **头像显示**：使用 emoji 表示 NPC 外观
- **境界信息**：显示 NPC 的修仙境界和小境界
- **好感度图标**：根据好感度显示不同表情符号
- **点击交互**：点击 NPC 打开交互模态框

**章节来源**
- [NPCInteractModal.tsx](file://src/components/NPCInteractModal.tsx#L1-L223)
- [NPCPanel.tsx](file://src/components/NPCPanel.tsx#L1-L99)

## 依赖关系分析

NPC 交互系统涉及多个层次的依赖关系：

```mermaid
graph TB
subgraph "外部依赖"
LLM[LLM服务]
DB[数据库]
Transformers[Transformers库]
end
subgraph "内部模块"
GameService[游戏服务]
MemoryService[记忆服务]
GameStore[游戏状态存储]
NPCModal[NPC交互模态框]
NPCPanel[NPC面板]
RelationshipPanel[关系面板]
end
subgraph "类型定义"
GameTypes[游戏类型]
NPCTypes[NPC类型]
MemoryTypes[记忆类型]
end
GameService --> LLM
GameService --> MemoryService
MemoryService --> DB
MemoryService --> Transformers
NPCModal --> GameService
NPCPanel --> GameStore
RelationshipPanel --> GameStore
GameService --> GameTypes
MemoryService --> MemoryTypes
NPCModal --> NPCTypes
```

**图表来源**
- [gameService.ts](file://src/services/gameService.ts#L1-L10)
- [memoryService.ts](file://src/services/memoryService.ts#L1-L24)

### 关键依赖关系

1. **LLM 服务依赖**：所有 AI 驱动的功能都依赖于 LLM 服务
2. **记忆服务依赖**：通过 MemoryService 实现长期记忆管理
3. **状态存储依赖**：使用 Zustand 管理全局游戏状态
4. **UI 组件依赖**：React 组件负责用户交互和状态展示

**章节来源**
- [gameService.ts](file://src/services/gameService.ts#L1-L10)
- [memoryService.ts](file://src/services/memoryService.ts#L1-L24)

## 性能考虑

### LLM 调用优化

1. **温度参数控制**：交互系统使用温度 0.7，在创造性和稳定性之间取得平衡
2. **JSON 格式约束**：强制 JSON 输出格式，减少解析错误
3. **批量处理**：支持同时生成多个 NPC 和交互结果

### 记忆系统优化

1. **嵌入向量缓存**：使用特征提取模型生成嵌入向量
2. **相似度计算**：实现余弦相似度算法进行高效检索
3. **摘要生成**：定期生成记忆摘要，减少查询负载

### 状态管理优化

1. **局部状态**：UI 组件使用本地状态管理即时反馈
2. **全局状态**：Zustand 管理持久化游戏状态
3. **懒加载**：按需加载 NPC 和记忆数据

## 故障排除指南

### 常见问题及解决方案

#### LLM 服务初始化失败
- **症状**：调用 interactWithNPC() 抛出 "GameService not initialized" 错误
- **原因**：未正确初始化 GameService
- **解决**：确保在使用前调用 `gameService.initialize(saveId)`

#### 记忆服务不可用
- **症状**：交互过程中出现内存相关错误
- **原因**：MemoryService 未正确初始化
- **解决**：检查嵌入模型加载和数据库连接状态

#### NPC 生成异常
- **症状**：generateLocationNPCs() 返回空列表或格式错误
- **原因**：LLM 输出不符合预期格式
- **解决**：检查提示词构建和 JSON 解析逻辑

#### 状态更新延迟
- **症状**：交互结果显示后状态未及时更新
- **原因**：异步操作未正确等待
- **解决**：确保在 UI 组件中正确处理异步状态更新

**章节来源**
- [gameService.ts](file://src/services/gameService.ts#L422-L424)
- [App.tsx](file://src/App.tsx#L481-L548)

## 结论

NPC 交互系统通过精心设计的架构和算法，实现了丰富而动态的修仙世界社交体验。系统的核心优势包括：

1. **智能化交互**：基于 LLM 的动态对话生成，提供沉浸式的互动体验
2. **完整关系系统**：多层次的好感度和关系等级，支持复杂的社交动态
3. **可扩展架构**：清晰的模块分离，便于功能扩展和维护
4. **性能优化**：合理的缓存策略和异步处理，确保流畅的游戏体验

该系统为修仙 Roguelike 游戏提供了坚实的社交基础，玩家可以通过各种互动方式影响 NPC 的态度和行为，从而塑造独特的修仙历程。

# Tasks

* [ ] Task 1: 扩展类型定义 - 更新 src/types/game.ts，添加完整的游戏数据类型

  * [ ] SubTask 1.1: 扩展 Player 类型，添加属性（根骨、悟性）、修为、灵气、寿元、年龄、小境界、成长历程等字段

  * [ ] SubTask 1.2: 扩展 NPC 类型，添加天赋、性格、人物关系等字段

  * [ ] SubTask 1.3: 添加 Item、Skill、Relationship、Event、CultivationRealm、Time、Memory、Embedding 等新类型

* [ ] Task 2: 创建 Zustand Store - 实现游戏状态管理

  * [ ] SubTask 2.1: 创建 src/stores/useGameStore.ts，管理游戏核心状态（包括修为、寿元、时间系统）

  * [ ] SubTask 2.2: 创建 src/stores/useSettingsStore.ts，管理设置和 LLM 配置

  * [ ] SubTask 2.3: 集成 localStorage 持久化（用于设置、存档元数据）

* [ ] Task 2.5: 实现 IndexedDB 存储 - 大容量数据持久化

  * [ ] SubTask 2.5.1: 创建 src/services/db.ts，封装 IndexedDB 操作（使用 localForage 或原生 IndexedDB）

  * [ ] SubTask 2.5.2: 实现存档数据存储（完整游戏数据）

  * [ ] SubTask 2.5.3: 实现记忆片段存储（用于 RAG 检索）

* [ ] Task 3: 实现 LLM 服务层与记忆管理 - 封装 AI 调用和记忆系统

  * [ ] SubTask 3.1: 创建 src/services/llmService.ts，实现 OpenAI 兼容 API 调用

  * [ ] SubTask 3.2: 创建 src/prompts/ 目录，编写角色生成、剧情推演（包含修为、寿元、时间消耗判定）、记忆摘要等提示词

  * [ ] SubTask 3.3: 实现重试机制和错误处理

  * [ ] SubTask 3.4: 创建 src/services/memoryService.ts，实现多层记忆系统（工作记忆 + 摘要记忆 + RAG 检索）

  * [ ] SubTask 3.5: 集成浏览器端嵌入模型（如 Transformers.js 的 all-MiniLM-L6-v2）生成向量

  * [ ] SubTask 3.6: 实现记忆摘要功能（定期压缩旧对话）

* [ ] Task 4: 创建 shadcn/ui 组件 - 初始化 UI 组件库

  * [ ] SubTask 4.1: 初始化 shadcn/ui，安装必要的组件（Button、Input、Card、Tabs、Progress 等）

  * [ ] SubTask 4.2: 配置 TailwindCSS 主题（Zinc + Emerald 配色）

* [ ] Task 5: 实现游戏 UI 组件 - 构建核心界面

  * [ ] SubTask 5.1: 创建 src/components/CharacterCreationScreen.tsx - 角色创建界面（展示修为、寿元、根骨、悟性等）

  * [ ] SubTask 5.2: 创建 src/components/GameScreen.tsx - 游戏主界面

  * [ ] SubTask 5.3: 创建 src/components/StatusPanel.tsx - 左侧角色状态面板（包含修为进度条、寿元/年龄显示、根骨悟性属性）

  * [ ] SubTask 5.4: 创建 src/components/StoryLog.tsx - 剧情日志面板（显示时间消耗、修为增长等信息）

  * [ ] SubTask 5.5: 创建 src/components/ActionInput.tsx - 行动输入组件

  * [ ] SubTask 5.6: 创建 src/components/SettingsPanel.tsx - 设置面板

  * [ ] SubTask 5.7: 创建 src/components/InventoryPanel.tsx - 背包面板

  * [ ] SubTask 5.8: 创建 src/components/RelationshipPanel.tsx - 关系面板

* [ ] Task 6: 实现游戏核心逻辑 - 角色创建和剧情推演

  * [ ] SubTask 6.1: 实现角色创建流程（AI 生成 3 个角色供选择，包含修为、寿元、根骨、悟性）

  * [ ] SubTask 6.2: 实现 AI DM 剧情推演逻辑（包含修为增长、寿元消耗、时间流逝判定）

  * [ ] SubTask 6.3: 实现 NPC 交互和好感度系统

  * [ ] SubTask 6.4: 实现物品、功法获取逻辑

  * [ ] SubTask 6.5: 实现修为进度系统（修炼、丹药、天材地宝增加修为）

  * [ ] SubTask 6.6: 实现突破系统（修为 100% 后尝试突破下一境界）

  * [ ] SubTask 6.7: 实现寿元/时间系统（所有行动消耗时间，寿元归零时死亡）

* [ ] Task 7: 整合 App.tsx - 组装完整应用

  * [ ] SubTask 7.1: 更新 src/App.tsx，整合所有组件

  * [ ] SubTask 7.2: 实现路由/状态切换（角色创建 -&gt; 游戏主界面）

* [ ] Task 8: 测试与优化

  * [ ] SubTask 8.1: 运行 ESLint 检查

  * [ ] SubTask 8.2: 运行 TypeScript 类型检查

  * [ ] SubTask 8.3: 测试移动端适配

  * [ ] SubTask 8.4: 优化 UI 交互体验

# Task Dependencies

* Task 2 依赖 Task 1

* Task 2.5 依赖 Task 1

* Task 3 依赖 Task 1, Task 2.5

* Task 4 依赖 Task 1

* Task 5 依赖 Task 2, Task 3, Task 4

* Task 6 依赖 Task 2, Task 3, Task 2.5

* Task 7 依赖 Task 5, Task 6

* Task 8 依赖 Task 7


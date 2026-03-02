
# 修仙 Roguelike 游戏实现 Spec

## Why

实现一个纯前端的 AI 驱动修仙 Roguelike 游戏，让用户通过自填 API Key 接入大模型，需要支持 openai 格式的请求规范体验完全随机生成的修仙世界。

## What Changes

* **新增**：完整的游戏核心系统（角色创建、AI DM、剧情推演、修为系统、寿元系统）

* **新增**：Zustand Store 管理游戏状态

* **新增**：LLM 服务层（支持 OpenAI 兼容格式）+ 多层记忆系统（工作记忆+摘要+RAG）

* **新增**：IndexedDB 大容量存储（用于存档和记忆向量）

* **新增**：游戏 UI 组件（角色面板、剧情日志、设置面板等）

* **新增**：混合存储持久化（localStorage + IndexedDB）

* **更新**：types/game.ts 扩展类型定义

## Impact

* Affected specs: 无

* Affected code: src/ 目录下所有文件

## ADDED Requirements

### Requirement: 游戏核心系统

系统 SHALL 提供完整的修仙 Roguelike 游戏体验。

#### Scenario: 角色创建成功

* **WHEN** 用户点击"踏入仙途"

* **THEN** AI 生成 3 个随机角色供选择，每个角色包含：身世、天赋、MBTI 性格、基础属性（气血、真气、攻击、防御、速度、气运、根骨、悟性）、修为、寿元、年龄、Emoji 外观

#### Scenario: AI DM 剧情推演

* **WHEN** 用户在输入框中输入行动指令

* **THEN** AI 结合当前角色属性、技能、性格、修为、寿元、人际关系、历史事件，推演出随机剧情发展，自动判定是否获得奇遇、获得灵气/修为增长、突破境界、获得物品/功法、结识 NPC、消耗寿元/时间

#### Scenario: NPC 交互

* **WHEN** 用户与 NPC 交互

* **THEN** NPC 以 Emoji 作为外观，拥有符合修仙小说的身份设定，交互改变好感度，关系记录在左侧面板并影响后续剧情

#### Scenario: 修为进度系统

* **WHEN** 玩家修炼、服用丹药、吸收天材地宝

* **THEN** 修为进度增长，达到 100% 时可尝试突破到下一境界

#### Scenario: 寿元系统

* **WHEN** 玩家执行任何行动

* **THEN** 消耗对应时间（寿元），寿元归零时角色死亡

### Requirement: 本地存储与配置

系统 SHALL 支持用户配置 LLM API 并持久化所有游戏数据。

#### Scenario: API Key 配置

* **WHEN** 用户在设置面板填入 API Key、Base URL、模型名称

* **THEN** 配置保存在 localStorage，游戏使用该配置调用 LLM

#### Scenario: 混合存储方案

* **WHEN** 游戏需要持久化数据

* **THEN** 使用 localStorage 存储设置和存档元数据，使用 IndexedDB 存储完整存档数据和记忆片段（容量 250MB+）

#### Scenario: 游戏存档

* **WHEN** 用户进行游戏

* **THEN** 所有游戏数据（角色属性、物品、技能、人际关系、历史事件、修为、寿元、时间）自动保存到 IndexedDB

### Requirement: LLM 记忆管理

系统 SHALL 提供高效的记忆管理，在保证上下文的同时降低 Token 成本。

#### Scenario: 多层记忆系统

* **WHEN** 调用 LLM 生成剧情

* **THEN** 使用三层记忆架构：工作记忆（最近 N 条完整对话）+ 摘要记忆（旧对话压缩摘要）+ RAG 检索（语义相关记忆片段），Token 成本降低 70%-90%

#### Scenario: 浏览器端向量生成

* **WHEN** 存储新的记忆片段

* **THEN** 使用 Transformers.js 在浏览器本地生成嵌入向量，保存到 IndexedDB 用于 RAG 检索

### Requirement: UI 设计

系统 SHALL 提供沉浸式暗黑修仙风格 UI。

#### Scenario: 布局展示

* **WHEN** 用户打开游戏

* **THEN** 左侧面板展示角色状态（头像、境界、修为进度条、寿元/年龄、气血/真气条、属性、背包、功法、关系），右侧为剧情日志和行动输入框，适配移动端和桌面端

## MODIFIED Requirements

无

## REMOVED Requirements

无


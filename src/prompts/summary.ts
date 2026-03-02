
export const summarySystemPrompt = `你是一位记忆管理专家。请将玩家的游戏历史压缩成摘要，以便后续剧情推演使用。

摘要需要包含：
1. 关键事件（突破境界、获得重要物品、结识重要 NPC 等）
2. 人物关系变化
3. 当前目标和动机
4. 未完成的剧情线索

请保持简洁但信息完整。`

export const summaryGenerationPrompt = (logs: string[]) => `请将以下游戏历史压缩成摘要：

历史记录：
${logs.join('\n')}

请返回 JSON 格式：
{
  "summary": "摘要内容",
  "keyEvents": ["关键事件1", "关键事件2"],
  "relationships": {
    "NPC名称": "关系描述"
  },
  "unfinishedQuests": ["未完成的剧情线索"]
}`

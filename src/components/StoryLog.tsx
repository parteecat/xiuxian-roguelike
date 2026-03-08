import type { GamePhase, SceneState, TurnLog } from '@/types/run'

interface StoryLogProps {
  scene: SceneState | null
  history: TurnLog[]
  phase: GamePhase
}

export function StoryLog({ scene, history, phase }: StoryLogProps) {
  return (
    <div className="ink-card rounded-xl border border-[hsl(var(--ink-border))] overflow-hidden flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-[hsl(var(--ink-border))] flex items-center justify-between bg-white/5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
            当前人生节点
          </h3>
        </div>
        <span className="text-[10px] text-[hsl(var(--dim))] tracking-wider">
          {phase === 'game_over' ? 'ending' : `history ${history.length}`}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {scene ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-emerald-400 tracking-wider">{scene.title}</div>
                <div className="text-[10px] text-[hsl(var(--dim))] mt-1 uppercase tracking-[0.2em]">
                  {scene.sceneType}
                </div>
              </div>
            </div>

            <p className="text-sm leading-7 text-foreground/85 whitespace-pre-wrap">{scene.summary}</p>

            {scene.riskHints.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
                  风险提示
                </div>
                {scene.riskHints.map((hint, index) => (
                  <div
                    key={`${hint}-${index}`}
                    className="rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2 text-xs text-foreground/75"
                  >
                    {hint}
                  </div>
                ))}
              </div>
            )}

            {scene.resultBlocks.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
                  最近回响
                </div>
                {scene.resultBlocks.map((block, index) => (
                  <div
                    key={`${block}-${index}`}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-foreground/75"
                  >
                    {block}
                  </div>
                ))}
              </div>
            )}

            {scene.remark && <div className="text-xs text-emerald-300/70">{scene.remark}</div>}
          </div>
        ) : (
          <div className="text-center text-[hsl(var(--dim))] py-16 text-sm tracking-wider">
            正在等待当前月份生成...
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <h3 className="text-xs font-medium text-[hsl(var(--dim))] tracking-[0.2em] uppercase">
            最近月度行动
          </h3>
        </div>

        {history.length === 0 ? (
          <div className="rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 px-4 py-8 text-center text-sm text-[hsl(var(--dim))]">
            还没有形成历史记录，先做出第一步选择。
          </div>
        ) : (
          history.slice(0, 8).map((entry) => (
            <div
              key={`${entry.turn}-${entry.actionId}`}
              className="rounded-xl border border-[hsl(var(--ink-border))] bg-white/5 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm text-foreground/90 truncate">
                    第 {entry.month} 月 · {entry.actionTitle || '未知行动'}
                  </div>
                  <div className="text-xs text-[hsl(var(--dim))] mt-1 leading-6">{entry.summary}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
                  <div className="text-emerald-400 mb-1">获得</div>
                  {entry.gains.length > 0 ? (
                    entry.gains.map((gain, index) => <div key={`${gain}-${index}`}>{gain}</div>)
                  ) : (
                    <div className="text-[hsl(var(--dim))]">无</div>
                  )}
                </div>
                <div className="rounded-lg border border-red-500/15 bg-red-500/5 px-3 py-2">
                  <div className="text-red-400 mb-1">代价</div>
                  {entry.losses.length > 0 ? (
                    entry.losses.map((loss, index) => <div key={`${loss}-${index}`}>{loss}</div>)
                  ) : (
                    <div className="text-[hsl(var(--dim))]">无</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

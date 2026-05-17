import {
  Zap, Eye, Cpu, MessageSquare, Wifi, WifiOff, Shield, FileText,
} from "lucide-react";
import { parseCharacterCard } from "../../utils/characterPrompt";
import type { CharacterRow, PromptTemplateRow } from "../../types/database";

interface ContextPanelProps {
  sessionTitle: string;
  messageCount: number;
  isDemo: boolean;
  providerLabel: string;
  modelLabel: string;
  apiConfigured: boolean;
  runtimeMode: string;
  activeCharacter: CharacterRow | null;
  activeTemplate: PromptTemplateRow | null;
  systemPrompt: string | null;
}

export function ContextPanel({
  sessionTitle,
  messageCount,
  isDemo,
  providerLabel,
  modelLabel,
  apiConfigured,
  runtimeMode,
  activeCharacter,
  activeTemplate,
  systemPrompt,
}: ContextPanelProps) {
  const card = activeCharacter ? parseCharacterCard(activeCharacter) : null;

  const items = [
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: "当前会话",
      value: sessionTitle || "—",
    },
    {
      icon: <Cpu className="h-4 w-4" />,
      label: "Provider",
      value: providerLabel,
    },
    {
      icon: <Zap className="h-4 w-4" />,
      label: "模型",
      value: modelLabel,
    },
    {
      icon: apiConfigured ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />,
      label: "API 状态",
      value: isDemo ? "Demo Mock" : apiConfigured ? "已配置 BYOK" : "未配置",
    },
    {
      icon: <Shield className="h-4 w-4" />,
      label: "运行模式",
      value: runtimeMode === "demo_mock" ? "Demo Mock" : "BYOK 本地版",
    },
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: "消息数",
      value: `${messageCount} 条`,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-surface-100">
        <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wide">
          上下文控制台
        </h3>
      </div>

      {/* Character info */}
      {activeCharacter && (
        <div className="p-3 border-b border-surface-100 bg-brand-50/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center text-sm">
              {activeCharacter.avatar_emoji || activeCharacter.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-700 truncate">
                {activeCharacter.name}
              </p>
              {card?.identity && (
                <p className="text-xs text-brand-500 truncate">{card.identity}</p>
              )}
            </div>
          </div>
          {card && (
            <div className="space-y-0.5 text-xs text-ink-400">
              {card.relationship && (
                <p>关系：{card.relationship}{card.relationship_stage ? ` · ${card.relationship_stage}` : ""}</p>
              )}
              {card.personality && (
                <p className="line-clamp-2">性格：{card.personality}</p>
              )}
            </div>
          )}
          {/* Template info */}
          {activeTemplate ? (
            <div className="mt-2 pt-2 border-t border-surface-100">
              <div className="flex items-center gap-1.5 text-xs">
                <FileText className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 font-medium">模板：{activeTemplate.title}</span>
              </div>
              <p className="text-xs text-ink-300 mt-0.5 line-clamp-2">{activeTemplate.content.slice(0, 120)}</p>
            </div>
          ) : activeCharacter && (
            <div className="mt-2 pt-2 border-t border-surface-100">
              <p className="text-xs text-ink-300">未绑定模板，使用默认角色提示词</p>
            </div>
          )}

          {/* System prompt preview */}
          <details className="mt-2">
            <summary className="text-xs text-brand-500 cursor-pointer hover:text-brand-600">
              查看最终 System Prompt（发送给 AI 的完整内容）
            </summary>
            <pre className="mt-1 text-xs text-ink-400 bg-white rounded-card p-2 whitespace-pre-wrap max-h-48 overflow-y-auto border border-surface-100 leading-relaxed">
              {systemPrompt || "（无角色绑定，当前为普通聊天模式）"}
            </pre>
          </details>
        </div>
      )}

      {/* Info items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map(({ icon, label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between py-2 px-3 rounded-card hover:bg-surface-50 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`flex-shrink-0 ${!apiConfigured && label === "API 状态" ? "text-rose-400" : "text-ink-300"}`}>
                {icon}
              </span>
              <span className="text-xs text-ink-500 truncate">{label}</span>
            </div>
            <span className="text-xs font-mono text-ink-300 flex-shrink-0 ml-2 truncate max-w-[120px] text-right">
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Phase 6 placeholder */}
      <div className="p-4 border-t border-surface-100">
        <div className="rounded-card bg-surface-50 p-3">
          <p className="text-xs text-ink-300 mb-2">
            世界书 · 记忆注入 · Token 预算 · Context Preview
          </p>
          <button className="w-full btn-secondary text-xs flex items-center justify-center gap-2 opacity-60 cursor-not-allowed" disabled>
            <Eye className="h-3.5 w-3.5" />
            阶段 6 实现
          </button>
        </div>
      </div>
    </div>
  );
}

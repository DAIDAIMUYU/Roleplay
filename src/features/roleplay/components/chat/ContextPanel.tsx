import {
  Zap,
  Eye,
  Cpu,
  MessageSquare,
  Wifi,
  WifiOff,
  Shield,
} from "lucide-react";

interface ContextPanelProps {
  sessionTitle: string;
  messageCount: number;
  isDemo: boolean;
  providerLabel: string;
  modelLabel: string;
  apiConfigured: boolean;
  runtimeMode: string;
}

export function ContextPanel({
  sessionTitle,
  messageCount,
  isDemo,
  providerLabel,
  modelLabel,
  apiConfigured,
  runtimeMode,
}: ContextPanelProps) {
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
      icon: apiConfigured ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      ),
      label: "API 状态",
      value: isDemo
        ? "Demo Mock"
        : apiConfigured
          ? "已配置 BYOK"
          : "未配置",
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
        <p className="text-xs text-ink-300 mt-0.5">阶段 4 · 实时状态</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map(({ icon, label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between py-2 px-3 rounded-card hover:bg-surface-50 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`flex-shrink-0 ${
                  !apiConfigured && label === "API 状态"
                    ? "text-rose-400"
                    : "text-ink-300"
                }`}
              >
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
            世界书命中 · 记忆注入 · Token 预算 · 上下文预览
          </p>
          <button
            className="w-full btn-secondary text-xs flex items-center justify-center gap-2 opacity-60 cursor-not-allowed"
            disabled
          >
            <Eye className="h-3.5 w-3.5" />
            阶段 6 实现
          </button>
        </div>
      </div>
    </div>
  );
}

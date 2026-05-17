import {
  Drama,
  MessageCircle,
  Users,
  BookOpen,
  Brain,
  Zap,
  Eye,
  ListTree,
} from "lucide-react";
import { useIsMobile } from "../shared/hooks/useMediaQuery";
import { EmptyState } from "../shared/components/EmptyState";
import { ModeBadge } from "../shared/components/ModeBadge";

function SessionList() {
  return (
    <div className="p-3">
      <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wide px-2 mb-2">
        会话列表
      </h3>
      <EmptyState
        title="暂无会话"
        description="登录并创建角色后即可开始聊天"
      />
    </div>
  );
}

function ContextConsole() {
  const items = [
    { icon: <Users className="h-4 w-4" />, label: "当前角色", value: "—" },
    { icon: <Eye className="h-4 w-4" />, label: "当前场景", value: "—" },
    { icon: <ListTree className="h-4 w-4" />, label: "剧情摘要", value: "—" },
    { icon: <BookOpen className="h-4 w-4" />, label: "世界书命中", value: "0 条" },
    { icon: <Brain className="h-4 w-4" />, label: "记忆注入", value: "0 条" },
    { icon: <Zap className="h-4 w-4" />, label: "Token 预算", value: "— / 8000" },
  ];

  return (
    <div className="p-4 space-y-1">
      <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-3">
        上下文控制台
      </h3>
      {items.map(({ icon, label, value }) => (
        <div
          key={label}
          className="flex items-center justify-between py-2 px-3 rounded-card hover:bg-surface-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-ink-300">{icon}</span>
            <span className="text-xs text-ink-500">{label}</span>
          </div>
          <span className="text-xs font-mono text-ink-300">{value}</span>
        </div>
      ))}
      <div className="pt-3 mt-3 border-t border-surface-100">
        <button className="w-full btn-secondary text-xs flex items-center justify-center gap-2" disabled>
          <Eye className="h-3.5 w-3.5" />
          Context Preview（阶段 6）
        </button>
      </div>
    </div>
  );
}

export function ChatRoomPage() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-dvh">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-surface-100">
          <Drama className="h-5 w-5 text-brand-500" />
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-ink-900">聊天房间</h1>
          </div>
          <ModeBadge />
        </div>

        {/* Chat area placeholder */}
        <div className="flex-1 flex items-center justify-center p-4">
          <EmptyState
            icon={<MessageCircle className="h-10 w-10" />}
            title="聊天房间"
            description="阶段 4 将在此实现真实聊天。目前为 UI 壳，所有聊天功能将在后续阶段完成。"
          />
        </div>

        {/* Bottom input placeholder */}
        <div className="px-4 py-3 bg-white border-t border-surface-100">
          <div className="flex items-center gap-2 bg-surface-50 rounded-input border border-surface-200 px-3 py-2.5">
            <MessageCircle className="h-4 w-4 text-ink-300" />
            <span className="text-sm text-ink-300">输入消息（阶段 4 接入真实聊天）</span>
          </div>
        </div>
      </div>
    );
  }

  /* Desktop: 3-column layout */
  return (
    <div className="flex h-full">
      {/* Left sidebar: session list */}
      <div className="w-56 border-r border-surface-100 bg-white overflow-y-auto flex-shrink-0">
        <SessionList />
      </div>

      {/* Center: chat area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-surface-100">
          <Drama className="h-5 w-5 text-brand-500" />
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-ink-900">聊天房间</h1>
          </div>
          <ModeBadge />
        </div>

        {/* Chat area placeholder */}
        <div className="flex-1 flex items-center justify-center p-4">
          <EmptyState
            icon={<MessageCircle className="h-10 w-10" />}
            title="聊天房间"
            description="阶段 4 将在此实现真实聊天。桌面端三栏布局：会话列表（左）、消息流（中）、上下文控制台（右）。"
          />
        </div>

        {/* Bottom input placeholder */}
        <div className="px-4 py-3 bg-white border-t border-surface-100">
          <div className="flex items-center gap-2 bg-surface-50 rounded-input border border-surface-200 px-3 py-2.5">
            <MessageCircle className="h-4 w-4 text-ink-300" />
            <span className="text-sm text-ink-300">输入消息（阶段 4）</span>
          </div>
        </div>
      </div>

      {/* Right panel: context console */}
      <div className="w-64 border-l border-surface-100 bg-white overflow-y-auto flex-shrink-0">
        <ContextConsole />
      </div>
    </div>
  );
}

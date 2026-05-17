import { Copy, Trash2, RotateCcw, Edit3 } from "lucide-react";
import type { ChatMessage } from "../../providers/provider.types";

interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
  onCopy?: () => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
  isStreaming?: boolean;
}

export function MessageBubble({
  message,
  onCopy,
  onDelete,
  onRegenerate,
  onEdit,
  isStreaming,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-ink-300 bg-surface-100 rounded-full px-3 py-1 italic">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 group`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-brand-500 text-white rounded-br-md"
            : "bg-white border border-surface-100 shadow-sm rounded-bl-md"
        }`}
      >
        {/* Role indicator */}
        <p
          className={`text-xs mb-0.5 ${
            isUser ? "text-brand-100" : "text-ink-300"
          }`}
        >
          {isUser ? "你" : "AI"}
          {isStreaming && !isUser && (
            <span className="ml-1.5 inline-block h-3 w-1.5 bg-brand-400 rounded-full animate-pulse align-middle" />
          )}
        </p>

        {/* Content */}
        <p
          className={`text-sm whitespace-pre-wrap leading-relaxed break-words ${
            isUser ? "text-white" : "text-ink-700"
          }`}
        >
          {message.content}
          {isStreaming && !isUser && (
            <span className="inline-block w-1.5 h-4 bg-ink-400 ml-0.5 animate-pulse rounded-sm align-text-bottom" />
          )}
        </p>

        {/* Action menu — visible on hover */}
        {!isStreaming && (
          <div
            className={`flex items-center gap-0.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <ActionBtn
              icon={<Copy className="h-3 w-3" />}
              title="复制"
              onClick={onCopy}
              isUser={isUser}
            />
            {!isUser && onRegenerate && (
              <ActionBtn
                icon={<RotateCcw className="h-3 w-3" />}
                title="重新生成"
                onClick={onRegenerate}
                isUser={isUser}
              />
            )}
            {isUser && onEdit && (
              <ActionBtn
                icon={<Edit3 className="h-3 w-3" />}
                title="编辑"
                onClick={onEdit}
                isUser={isUser}
              />
            )}
            <ActionBtn
              icon={<Trash2 className="h-3 w-3" />}
              title="删除"
              onClick={onDelete}
              isUser={isUser}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  icon,
  title,
  onClick,
  isUser,
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  isUser: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1 rounded transition-colors ${
        isUser
          ? "text-white/60 hover:text-white hover:bg-white/10"
          : "text-ink-300 hover:text-ink-500 hover:bg-surface-100"
      }`}
    >
      {icon}
    </button>
  );
}

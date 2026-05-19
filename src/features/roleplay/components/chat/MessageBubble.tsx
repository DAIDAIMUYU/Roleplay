import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Copy, Edit3, RotateCcw, Trash2 } from "lucide-react";
import type { ChatMessage } from "../../providers/provider.types";
import type { MessageRevisionRow } from "../../types/database";

interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
  onCopy?: () => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
  isStreaming?: boolean;
  revisionCount?: number;
  revisions?: MessageRevisionRow[];
  onLoadRevisions?: () => Promise<MessageRevisionRow[]> | void;
}

export function MessageBubble({
  message,
  onCopy,
  onDelete,
  onRegenerate,
  onEdit,
  isStreaming,
  revisionCount = 0,
  revisions,
  onLoadRevisions,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  const loadedVersions = useMemo(() => {
    const sorted = [...(revisions ?? [])].sort((a, b) => a.revision_no - b.revision_no);
    return [...sorted.map((revision) => revision.content_text), message.content];
  }, [message.content, revisions]);

  const hasLoadedRevisions = revisions !== undefined;
  const totalVersions = hasLoadedRevisions ? loadedVersions.length : Math.max(1, revisionCount + 1);
  const hasVersions = !isSystem && !isStreaming && totalVersions > 1;
  const safeVersionIndex = Math.min(selectedVersionIndex, totalVersions - 1);
  const displayedContent =
    hasLoadedRevisions && safeVersionIndex < loadedVersions.length
      ? loadedVersions[safeVersionIndex]
      : message.content;
  const atFirst = safeVersionIndex <= 0;
  const atLast = safeVersionIndex >= totalVersions - 1;

  useEffect(() => {
    setSelectedVersionIndex(Math.max(0, totalVersions - 1));
  }, [message.content, revisionCount]);

  async function moveVersion(delta: number) {
    const nextIndex = Math.max(0, Math.min(totalVersions - 1, safeVersionIndex + delta));
    if (nextIndex === safeVersionIndex || loadingRevisions) return;

    if (!hasLoadedRevisions && onLoadRevisions) {
      setLoadingRevisions(true);
      try {
        await onLoadRevisions();
      } catch (error) {
        console.warn("[Chat] message revision lazy load failed:", error);
      } finally {
        setLoadingRevisions(false);
      }
    }

    setSelectedVersionIndex(nextIndex);
  }

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
        <p className={`text-xs mb-0.5 ${isUser ? "text-brand-100" : "text-ink-300"}`}>
          {isUser ? "你" : "AI"}
          {isStreaming && !isUser && (
            <span className="ml-1.5 inline-block h-3 w-1.5 bg-brand-400 rounded-full animate-pulse align-middle" />
          )}
          {hasVersions && (
            <span className="ml-1 text-[10px] opacity-70">
              {safeVersionIndex + 1} / {totalVersions}
            </span>
          )}
        </p>

        <p className={`text-sm whitespace-pre-wrap leading-relaxed break-words ${isUser ? "text-white" : "text-ink-700"}`}>
          {displayedContent}
          {isStreaming && !isUser && (
            <span className="inline-block w-1.5 h-4 bg-ink-400 ml-0.5 animate-pulse rounded-sm align-text-bottom" />
          )}
        </p>

        {!isStreaming && (
          <div
            className={`flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            {hasVersions && (
              <div className={`flex items-center gap-0.5 mr-1 ${isUser ? "text-white/70" : "text-ink-400"}`}>
                <VersionButton
                  direction="left"
                  disabled={atFirst || loadingRevisions}
                  isUser={isUser}
                  onClick={() => void moveVersion(-1)}
                />
                <span className="text-[10px] leading-none min-w-[2.75rem] text-center select-none">
                  {safeVersionIndex + 1} / {totalVersions}
                </span>
                <VersionButton
                  direction="right"
                  disabled={atLast || loadingRevisions}
                  isUser={isUser}
                  onClick={() => void moveVersion(1)}
                />
              </div>
            )}

            <ActionBtn icon={<Copy className="h-3 w-3" />} title="复制" onClick={onCopy} isUser={isUser} />
            {!isUser && onRegenerate && (
              <ActionBtn icon={<RotateCcw className="h-3 w-3" />} title="重新生成" onClick={onRegenerate} isUser={isUser} />
            )}
            {isUser && onEdit && (
              <ActionBtn icon={<Edit3 className="h-3 w-3" />} title="编辑" onClick={onEdit} isUser={isUser} />
            )}
            <ActionBtn icon={<Trash2 className="h-3 w-3" />} title="删除" onClick={onDelete} isUser={isUser} />
          </div>
        )}
      </div>
    </div>
  );
}

function VersionButton({
  direction,
  disabled,
  isUser,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  isUser: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={direction === "left" ? "上一版" : "下一版"}
      className={`p-0.5 rounded transition-colors ${
        disabled
          ? isUser
            ? "text-white/30 cursor-default"
            : "text-ink-200 cursor-default"
          : isUser
            ? "text-white/70 hover:text-white hover:bg-white/10"
            : "text-ink-400 hover:text-ink-600 hover:bg-surface-100"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ActionBtn({
  icon,
  title,
  onClick,
  isUser,
}: {
  icon: ReactNode;
  title: string;
  onClick?: () => void;
  isUser: boolean;
}) {
  return (
    <button
      type="button"
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

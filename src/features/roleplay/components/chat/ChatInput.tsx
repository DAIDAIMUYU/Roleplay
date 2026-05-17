import { Send, Square } from "lucide-react";
import { useRef, useEffect } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  disabled,
  placeholder = "输入消息...",
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && !disabled && value.trim()) {
        onSend();
      }
    }
  }

  return (
    <div className="flex items-end gap-2 p-3 bg-white border-t border-surface-100">
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-surface-200 bg-surface-50 py-2.5 px-4 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none disabled:opacity-50 max-h-40"
      />

      {isStreaming ? (
        <button
          onClick={onStop}
          className="flex-shrink-0 h-10 w-10 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
          title="停止生成"
        >
          <Square className="h-4 w-4" />
        </button>
      ) : (
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="发送 (Enter)"
        >
          <Send className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

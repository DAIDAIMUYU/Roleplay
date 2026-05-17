import { Plus, Trash2, MessageCircle } from "lucide-react";

interface SessionItem {
  id: string;
  title: string;
  mode: string;
  lastMessageAt: string | null;
}

interface SessionListProps {
  sessions: SessionItem[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete?: (id: string) => void;
  loading: boolean;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
  onDelete,
  loading,
}: SessionListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-surface-100">
        <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wide">
          会话列表
        </h3>
        <button
          onClick={onCreate}
          className="h-7 w-7 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center hover:bg-brand-100 transition-colors"
          title="新建会话"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-ink-300 text-center py-8">加载中...</p>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-ink-300 text-center py-8 px-4">
            暂无会话，点击 + 创建
          </p>
        ) : (
          sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors ${
                s.id === activeSessionId
                  ? "bg-brand-50 border-r-2 border-brand-500"
                  : "hover:bg-surface-50 border-r-2 border-transparent"
              }`}
            >
              <MessageCircle
                className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                  s.id === activeSessionId ? "text-brand-500" : "text-ink-300"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    s.id === activeSessionId ? "text-brand-700 font-medium" : "text-ink-600"
                  }`}
                >
                  {s.title}
                </p>
                <p className="text-xs text-ink-300 mt-0.5">
                  {s.mode === "demo_mock" ? "Demo" : s.mode}
                  {s.lastMessageAt && (
                    <>
                      {" · "}
                      {new Date(s.lastMessageAt).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  )}
                </p>
              </div>
              {s.id === activeSessionId && onDelete && sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(s.id);
                  }}
                  className="opacity-40 hover:opacity-100 transition-opacity p-0.5"
                  title="删除会话"
                >
                  <Trash2 className="h-3 w-3 text-rose-400" />
                </button>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

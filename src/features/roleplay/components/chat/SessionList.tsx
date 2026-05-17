import { useState } from "react";
import { Plus, Trash2, MessageCircle, Search, X } from "lucide-react";

interface SessionItem {
  id: string;
  title: string;
  mode: string;
  lastMessageAt: string | null;
  characterName: string | null;
  characterEmoji: string | null;
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
  const [search, setSearch] = useState("");

  const filtered = search
    ? sessions.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
    : sessions;

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

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索会话..."
            className="w-full rounded-input border border-surface-200 bg-surface-50 py-1.5 pl-7 pr-6 text-xs focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="h-3 w-3 text-ink-300" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="text-xs text-ink-300 text-center py-8">加载中...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-ink-300 text-center py-8 px-4">
            {search ? "无匹配会话" : "暂无会话，点击 + 创建"}
          </p>
        ) : (
          filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors ${
                s.id === activeSessionId
                  ? "bg-brand-50 border-r-2 border-brand-500"
                  : "hover:bg-surface-50 border-r-2 border-transparent"
              }`}
            >
              <div className="h-8 w-8 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0 text-sm">
                {s.characterEmoji || <MessageCircle className="h-4 w-4 text-ink-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm truncate ${
                    s.id === activeSessionId ? "text-brand-700 font-medium" : "text-ink-600"
                  }`}
                >
                  {s.title}
                </p>
                {s.characterName && (
                  <p className="text-xs text-brand-400 mt-0.5 truncate">{s.characterName}</p>
                )}
                <p className="text-xs text-ink-300">
                  {s.mode === "demo_mock" ? "Demo" : ""}
                  {s.lastMessageAt && (
                    <>
                      {" · "}
                      {new Date(s.lastMessageAt).toLocaleTimeString("zh-CN", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </>
                  )}
                </p>
              </div>
              {s.id === activeSessionId && onDelete && filtered.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
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

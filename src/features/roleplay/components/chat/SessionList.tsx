import { useState } from "react";
import { MessageCircle, Plus, Search, Trash2, X } from "lucide-react";

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
    ? sessions.filter((session) => session.title.toLowerCase().includes(search.toLowerCase()))
    : sessions;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-surface-100 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-300">会话列表</h3>
        <button
          onClick={onCreate}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-500 transition-colors hover:bg-brand-100"
          title="新建会话"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-300" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="py-8 text-center text-xs text-ink-300">加载中...</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-ink-300">
            {search ? "没有匹配的会话" : "暂无会话，点击 + 创建"}
          </p>
        ) : (
          filtered.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelect(session.id)}
              className={`flex w-full items-start gap-2.5 border-r-2 px-3 py-2.5 text-left transition-colors ${
                session.id === activeSessionId
                  ? "border-brand-500 bg-brand-50"
                  : "border-transparent hover:bg-surface-50"
              }`}
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-100 text-sm">
                {session.characterEmoji || <MessageCircle className="h-4 w-4 text-ink-300" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${session.id === activeSessionId ? "font-medium text-brand-700" : "text-ink-600"}`}>
                  {session.title}
                </p>
                {session.characterName && <p className="mt-0.5 truncate text-xs text-brand-400">{session.characterName}</p>}
                <p className="text-xs text-ink-300">
                  {session.mode === "demo_mock" ? "本地预览" : "会话"}
                  {session.lastMessageAt && (
                    <>
                      {" · "}
                      {new Date(session.lastMessageAt).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  )}
                </p>
              </div>
              {session.id === activeSessionId && onDelete && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(session.id);
                  }}
                  className="p-0.5 opacity-40 transition-opacity hover:opacity-100"
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

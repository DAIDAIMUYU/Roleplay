import { Search, Plus, Edit3, Trash2, Brain, ToggleLeft, ToggleRight } from "lucide-react";
import type { MemoryRow } from "../../types/database";

interface MemoryListProps {
  memories: MemoryRow[];
  loading: boolean;
  types: { value: string; label: string }[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterType: string | null;
  onFilterType: (t: string | null) => void;
  onEdit: (m: MemoryRow) => void;
  onDelete: (m: MemoryRow) => void;
  onToggle: (m: MemoryRow) => void;
  onCreate: () => void;
}

export function MemoryList({ memories, loading, types, searchQuery, onSearchChange, filterType, onFilterType, onEdit, onDelete, onToggle, onCreate }: MemoryListProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
          <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="搜索记忆..." className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 pl-9 pr-3 text-sm focus:border-brand-400" />
        </div>
        <button onClick={onCreate} className="btn-primary text-xs flex items-center gap-1.5 py-2"><Plus className="h-3.5 w-3.5" /> 创建</button>
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {types.map(({ value, label }) => (
          <button key={value} onClick={() => onFilterType(filterType === value ? null : value)}
            className={`text-xs rounded-full px-2.5 py-0.5 transition-colors ${filterType === value ? "bg-amber-100 text-amber-700" : "bg-surface-100 text-ink-400 hover:bg-surface-200"}`}>{label}</button>
        ))}
      </div>

      {loading ? <p className="text-xs text-ink-300 text-center py-8">加载中...</p> :
       memories.length === 0 ? (
        <div className="text-center py-10"><p className="text-sm text-ink-400">暂无记忆</p><p className="text-xs text-ink-300 mt-1">创建记忆来增强角色扮演的稳定性</p></div>
      ) : (
        <div className="space-y-2">
          {memories.map((m) => (
            <div key={m.id} className={`card flex items-start gap-3 group ${m.status !== "active" ? "opacity-50" : ""}`}>
              <button onClick={() => onToggle(m)} className={`mt-0.5 flex-shrink-0 ${m.status === "active" ? "text-emerald-500" : "text-ink-300"}`}>
                {m.status === "active" ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
              </button>
              <Brain className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-ink-700 truncate">{m.title || "未命名记忆"}</h4>
                  <span className="text-xs text-ink-300 bg-surface-50 rounded px-1.5">{types.find((t) => t.value === m.memory_type)?.label ?? m.memory_type}</span>
                  <span className="text-xs text-ink-300">重要度 {m.salience}</span>
                </div>
                <p className="text-xs text-ink-300 mt-0.5 line-clamp-2">{m.content}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                <button onClick={() => onEdit(m)} className="p-1 text-ink-300 hover:text-brand-500"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => onDelete(m)} className="p-1 text-ink-300 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

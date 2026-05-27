import { Brain, Edit3, Plus, Search, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
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

export function MemoryList({
  memories,
  loading,
  types,
  searchQuery,
  onSearchChange,
  filterType,
  onFilterType,
  onEdit,
  onDelete,
  onToggle,
  onCreate,
}: MemoryListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="搜索记忆..." className="neo-input w-full rounded-input py-2.5 pl-9 pr-3 text-sm" />
        </div>
        <button onClick={onCreate} className="neo-button-primary flex items-center gap-1.5 rounded-[20px] px-4 py-2.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          创建
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {types.map(({ value, label }) => (
          <button key={value} onClick={() => onFilterType(filterType === value ? null : value)} className={filterType === value ? "neo-button-pressed rounded-full px-3 py-1 text-xs text-amber-700" : "neo-button rounded-full px-3 py-1 text-xs text-ink-500"}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-xs text-ink-300">加载中...</p>
      ) : memories.length === 0 ? (
        <div className="neo-panel-soft py-12 text-center">
          <p className="text-sm text-ink-400">暂无记忆</p>
          <p className="mt-1 text-xs text-ink-300">创建记忆来增强角色扮演的稳定性。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map((memory) => (
            <div key={memory.id} className={`neo-panel-soft group flex items-start gap-3 rounded-[26px] p-4 ${memory.status !== "active" ? "opacity-50" : ""}`}>
              <button onClick={() => onToggle(memory)} className={`neo-button mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${memory.status === "active" ? "text-emerald-500" : "text-ink-300"}`}>
                {memory.status === "active" ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
              </button>
              <div className="neo-panel-soft mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[16px] text-amber-500">
                <Brain className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-sm font-medium text-ink-700">{memory.title || "未命名记忆"}</h4>
                  <span className="neo-pill text-[10px] text-ink-500">{types.find((item) => item.value === memory.memory_type)?.label ?? memory.memory_type}</span>
                  <span className="neo-pill text-[10px] text-ink-400">重要度 {memory.salience}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-ink-300">{memory.content}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => onEdit(memory)} className="neo-button flex h-8 w-8 items-center justify-center rounded-full text-ink-300 hover:text-brand-500">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onDelete(memory)} className="neo-button flex h-8 w-8 items-center justify-center rounded-full text-ink-300 hover:text-rose-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

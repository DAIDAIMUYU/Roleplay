import { Search, Plus, Edit3, Trash2, BookOpen, ChevronRight } from "lucide-react";
import type { WorldbookRow, WorldbookEntryRow } from "../../types/database";

interface WorldbookListProps {
  worldbooks: WorldbookRow[];
  entries: WorldbookEntryRow[];
  loading: boolean;
  activeWorldbookId: string | null;
  onSelectWb: (id: string | null) => void;
  onCreateWb: () => void;
  onEditWb: (wb: WorldbookRow) => void;
  onDeleteWb: (wb: WorldbookRow) => void;
  onCreateEntry: () => void;
  onEditEntry: (e: WorldbookEntryRow) => void;
  onDeleteEntry: (e: WorldbookEntryRow) => void;
  onToggleEntry: (e: WorldbookEntryRow) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  entrySearch: string;
  onEntrySearchChange: (q: string) => void;
}

export function WorldbookList({
  worldbooks, entries, loading, activeWorldbookId,
  onSelectWb, onCreateWb, onEditWb, onDeleteWb,
  onCreateEntry, onEditEntry, onDeleteEntry, onToggleEntry,
  searchQuery, onSearchChange, entrySearch, onEntrySearchChange,
}: WorldbookListProps) {
  const activeWb = worldbooks.find((w) => w.id === activeWorldbookId);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
          <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索世界书..." className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
        </div>
        <button onClick={onCreateWb} className="btn-primary text-xs flex items-center gap-1.5 py-2"><Plus className="h-3.5 w-3.5" /> 创建</button>
      </div>

      {loading ? <p className="text-xs text-ink-300 text-center py-8">加载中...</p> :
       worldbooks.length === 0 ? (
        <div className="text-center py-10"><p className="text-sm text-ink-400">暂无世界书</p><p className="text-xs text-ink-300 mt-1">创建世界书来组织你的世界观条目</p></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {worldbooks.map((w) => (
            <div key={w.id} className={`card cursor-pointer transition-all group ${activeWorldbookId === w.id ? "ring-2 ring-brand-300 border-brand-300" : "hover:border-brand-200"}`}
              onClick={() => onSelectWb(w.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <BookOpen className="h-4 w-4 text-sky-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-ink-700 truncate">{w.name}</h3>
                    {w.description && <p className="text-xs text-ink-300 truncate mt-0.5">{w.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {w.tags?.map((t) => <span key={t} className="text-xs bg-surface-50 rounded-full px-1.5 py-0.5 text-ink-400">{t}</span>)}
                      <span className="text-xs text-ink-300"><ChevronRight className="h-3 w-3 inline" /> 条目</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => onEditWb(w)} className="p-1 text-ink-300 hover:text-brand-500"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { onSelectWb(null); onDeleteWb(w); }} className="p-1 text-ink-300 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Entries for selected worldbook */}
      {activeWb && (
        <div className="mt-6 border-t border-surface-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ink-700">
              {activeWb.name} · 条目
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-300" />
                <input type="text" value={entrySearch} onChange={(e) => onEntrySearchChange(e.target.value)}
                  placeholder="搜索条目..." className="w-40 rounded-input border border-surface-200 bg-surface-50 py-1.5 pl-7 pr-2 text-xs focus:border-brand-400" />
              </div>
              <button onClick={onCreateEntry} className="btn-primary text-xs flex items-center gap-1 py-1.5"><Plus className="h-3 w-3" /> 新条目</button>
            </div>
          </div>

          {entries.length === 0 ? (
            <p className="text-xs text-ink-300 text-center py-6">暂无条目，点击「新条目」创建</p>
          ) : (
            <div className="space-y-1.5">
              {entries.map((e) => (
                <div key={e.id} className={`card flex items-start gap-3 group ${!e.enabled ? "opacity-50" : ""}`}>
                  <button onClick={() => onToggleEntry(e)}
                    className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${e.enabled ? "bg-emerald-400 border-emerald-400" : "border-surface-300"}`}>
                    {e.enabled && <span className="text-white text-xs">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-ink-700 truncate">{e.title}</h4>
                      <span className="text-xs text-ink-300 bg-surface-50 rounded px-1.5">P{e.priority}</span>
                      {e.category !== "general" && <span className="text-xs text-ink-300">{e.category}</span>}
                    </div>
                    {e.triggers && e.triggers.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {e.triggers.map((t) => <span key={t} className="text-xs bg-sky-50 text-sky-600 rounded-full px-1.5 py-0.5">{t}</span>)}
                      </div>
                    )}
                    <p className="text-xs text-ink-300 mt-0.5 line-clamp-1">{e.content.slice(0, 80)}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    <button onClick={() => onEditEntry(e)} className="p-1 text-ink-300 hover:text-brand-500"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => onDeleteEntry(e)} className="p-1 text-ink-300 hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

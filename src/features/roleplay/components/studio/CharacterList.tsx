import { Search, Plus, Star, Archive, Edit3, Trash2, X } from "lucide-react";
import type { CharacterRow } from "../../types/database";
import { parseCharacterCard } from "../../utils/characterPrompt";

interface CharacterListProps {
  characters: CharacterRow[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterTag: string | null;
  onFilterTag: (t: string | null) => void;
  onEdit: (c: CharacterRow) => void;
  onDelete: (c: CharacterRow) => void;
  onArchive: (c: CharacterRow) => void;
  onToggleFavorite: (c: CharacterRow) => void;
  onCreate: () => void;
  onSelect?: (c: CharacterRow) => void;
  selectable?: boolean;
}

export function CharacterList({
  characters,
  loading,
  searchQuery,
  onSearchChange,
  filterTag,
  onFilterTag,
  onEdit,
  onDelete,
  onArchive,
  onToggleFavorite,
  onCreate,
  onSelect,
  selectable,
}: CharacterListProps) {
  const allTags = [...new Set(characters.flatMap((c) => c.tags ?? []))].sort();

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索角色..."
            className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button onClick={onCreate} className="btn-primary text-xs flex items-center gap-1.5 py-2">
          <Plus className="h-3.5 w-3.5" /> 创建
        </button>
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onFilterTag(filterTag === tag ? null : tag)}
              className={`text-xs rounded-full px-2.5 py-0.5 transition-colors ${
                filterTag === tag
                  ? "bg-brand-100 text-brand-700"
                  : "bg-surface-100 text-ink-400 hover:bg-surface-200"
              }`}
            >
              {tag}
            </button>
          ))}
          {filterTag && (
            <button onClick={() => onFilterTag(null)} className="text-xs text-ink-300 hover:text-ink-500">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-xs text-ink-300 text-center py-8">加载中...</p>
      ) : characters.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-ink-400">暂无角色</p>
          <p className="text-xs text-ink-300 mt-1">点击「创建」开始打造你的第一个角色</p>
        </div>
      ) : (
        <div className="space-y-2">
          {characters.map((c) => {
            const card = parseCharacterCard(c);
            return (
              <div
                key={c.id}
                onClick={() => selectable && onSelect?.(c)}
                className={`card flex items-start gap-3 group ${
                  selectable ? "cursor-pointer hover:border-brand-200" : ""
                } ${c.archived_at ? "opacity-50" : ""}`}
              >
                <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0 text-lg">
                  {c.avatar_emoji || c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink-700 truncate">{c.name}</h3>
                    {c.is_favorite && <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                    {c.archived_at && (
                      <span className="text-xs text-ink-300 bg-surface-100 rounded px-1.5">已归档</span>
                    )}
                  </div>
                  <p className="text-xs text-ink-300 mt-0.5 line-clamp-2">
                    {card.identity || card.personality || c.summary || "未填写角色设定"}
                  </p>
                  {c.tags && c.tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {c.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-surface-50 text-ink-400 rounded-full px-2 py-0.5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(c); }} title="收藏" className="p-1 text-ink-300 hover:text-amber-400">
                    <Star className={`h-3.5 w-3.5 ${c.is_favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(c); }} title="编辑" className="p-1 text-ink-300 hover:text-brand-500">
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onArchive(c); }} title="归档" className="p-1 text-ink-300 hover:text-amber-500">
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(c); }} title="删除" className="p-1 text-ink-300 hover:text-rose-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

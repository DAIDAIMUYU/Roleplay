import { Search, Plus, Star, Edit3, Trash2 } from "lucide-react";
import type { PromptTemplateRow } from "../../types/database";

interface TemplateListProps {
  templates: PromptTemplateRow[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterCategory: string | null;
  onFilterCategory: (c: string | null) => void;
  filterTag: string | null;
  onFilterTag: (t: string | null) => void;
  onEdit: (t: PromptTemplateRow) => void;
  onDelete: (t: PromptTemplateRow) => void;
  onToggleFavorite: (t: PromptTemplateRow) => void;
  onCreate: () => void;
  categories: { value: string; label: string }[];
  onSelect?: (t: PromptTemplateRow) => void;
}

export function TemplateList({
  templates,
  loading,
  searchQuery,
  onSearchChange,
  filterCategory,
  onFilterCategory,
  filterTag,
  onFilterTag,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCreate,
  categories,
  onSelect,
}: TemplateListProps) {
  const allTags = [...new Set(templates.flatMap((t) => t.tags ?? []))].sort();

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
            placeholder="搜索模板..."
            className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button onClick={onCreate} className="btn-primary text-xs flex items-center gap-1.5 py-2">
          <Plus className="h-3.5 w-3.5" /> 创建
        </button>
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {categories.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onFilterCategory(filterCategory === value ? null : value)}
            className={`text-xs rounded-full px-2.5 py-0.5 transition-colors ${
              filterCategory === value
                ? "bg-brand-100 text-brand-700"
                : "bg-surface-100 text-ink-400 hover:bg-surface-200"
            }`}
          >
            {label}
          </button>
        ))}
        {filterCategory && (
          <button onClick={() => onFilterCategory(null)} className="text-xs text-ink-300">清除</button>
        )}
      </div>

      {/* Tag chips */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onFilterTag(filterTag === tag ? null : tag)}
              className={`text-xs rounded-full px-2 py-0.5 ${
                filterTag === tag ? "bg-emerald-100 text-emerald-700" : "bg-surface-100 text-ink-400 hover:bg-surface-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-xs text-ink-300 text-center py-8">加载中...</p>
      ) : templates.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-sm text-ink-400">暂无模板</p>
          <p className="text-xs text-ink-300 mt-1">创建标准提示词模板，让角色扮演更稳定</p>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelect?.(t)}
              className={`card flex items-start gap-3 group ${onSelect ? "cursor-pointer hover:border-brand-200" : ""}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink-700 truncate">{t.title}</h3>
                  {t.is_favorite && <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                  <span className="text-xs text-ink-300 bg-surface-50 rounded px-1.5">
                    {categories.find((c) => c.value === t.category)?.label ?? t.category}
                  </span>
                </div>
                {t.description && (
                  <p className="text-xs text-ink-300 mt-0.5 line-clamp-1">{t.description}</p>
                )}
                <p className="text-xs text-ink-200 mt-1 font-mono line-clamp-1">{t.content.slice(0, 80)}</p>
                {t.tags && t.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {t.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-surface-50 text-ink-400 rounded-full px-2 py-0.5">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(t); }} className="p-1 text-ink-300 hover:text-amber-400">
                  <Star className={`h-3.5 w-3.5 ${t.is_favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onEdit(t); }} className="p-1 text-ink-300 hover:text-brand-500">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(t); }} className="p-1 text-ink-300 hover:text-rose-500">
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

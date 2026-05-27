import { Edit3, Plus, Search, Star, Trash2 } from "lucide-react";
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="搜索模板..." className="neo-input w-full rounded-input py-2.5 pl-9 pr-3 text-sm" />
        </div>
        <button onClick={onCreate} className="neo-button-primary flex items-center gap-1.5 rounded-[20px] px-4 py-2.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          创建
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {categories.map(({ value, label }) => (
          <button key={value} onClick={() => onFilterCategory(filterCategory === value ? null : value)} className={filterCategory === value ? "neo-button-pressed rounded-full px-3 py-1 text-xs text-brand-700" : "neo-button rounded-full px-3 py-1 text-xs text-ink-500"}>
            {label}
          </button>
        ))}
      </div>

      {allTags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {allTags.map((tag) => (
            <button key={tag} onClick={() => onFilterTag(filterTag === tag ? null : tag)} className={filterTag === tag ? "neo-button-pressed rounded-full px-3 py-1 text-xs text-emerald-700" : "neo-button rounded-full px-3 py-1 text-xs text-ink-500"}>
              {tag}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-xs text-ink-300">加载中...</p>
      ) : templates.length === 0 ? (
        <div className="neo-panel-soft py-12 text-center">
          <p className="text-sm text-ink-400">暂无模板</p>
          <p className="mt-1 text-xs text-ink-300">创建标准提示词模板，让角色扮演更稳定。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} onClick={() => onSelect?.(template)} className={`neo-panel-soft group flex items-start gap-3 rounded-[26px] p-4 ${onSelect ? "cursor-pointer hover:-translate-y-0.5 hover:ring-1 hover:ring-brand-200/60" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-ink-700">{template.title}</h3>
                  {template.is_favorite ? <Star className="h-3 w-3 flex-shrink-0 fill-amber-400 text-amber-400" /> : null}
                  <span className="neo-pill text-[10px] text-ink-500">{categories.find((item) => item.value === template.category)?.label ?? template.category}</span>
                </div>
                {template.description ? <p className="mt-0.5 line-clamp-1 text-xs text-ink-300">{template.description}</p> : null}
                <p className="mt-1 line-clamp-1 font-mono text-xs text-ink-200">{template.content.slice(0, 100)}</p>
                {template.tags && template.tags.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {template.tags.map((tag) => (
                      <span key={tag} className="neo-pill text-xs text-ink-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(template); }} className="neo-button flex h-8 w-8 items-center justify-center rounded-full text-ink-300 hover:text-amber-400">
                  <Star className={`h-3.5 w-3.5 ${template.is_favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onEdit(template); }} className="neo-button flex h-8 w-8 items-center justify-center rounded-full text-ink-300 hover:text-brand-500">
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(template); }} className="neo-button flex h-8 w-8 items-center justify-center rounded-full text-ink-300 hover:text-rose-500">
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

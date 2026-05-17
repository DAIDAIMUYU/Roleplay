import { useState } from "react";
import { Palette, Users, FileText } from "lucide-react";
import { useAuth } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";
import { EmptyState } from "../shared/components/EmptyState";
import { useCharacters } from "../features/roleplay/hooks/useCharacters";
import { useTemplates } from "../features/roleplay/hooks/useTemplates";
import { CharacterList } from "../features/roleplay/components/studio/CharacterList";
import { CharacterEditor } from "../features/roleplay/components/studio/CharacterEditor";
import { TemplateList } from "../features/roleplay/components/studio/TemplateList";
import { TemplateEditor } from "../features/roleplay/components/studio/TemplateEditor";
import type { CharacterRow, PromptTemplateRow } from "../features/roleplay/types/database";

type Tab = "characters" | "templates";

export function StudioPage() {
  const { isGuestOrDemo, user } = useAuth();
  const [tab, setTab] = useState<Tab>("characters");

  // Character editor state
  const [editingChar, setEditingChar] = useState<CharacterRow | null>(null);
  const [showCharEditor, setShowCharEditor] = useState(false);

  // Template editor state
  const [editingTpl, setEditingTpl] = useState<PromptTemplateRow | null>(null);
  const [showTplEditor, setShowTplEditor] = useState(false);

  const chars = useCharacters(user?.id, isGuestOrDemo);
  const tmpls = useTemplates(user?.id, isGuestOrDemo);

  if (isGuestOrDemo) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-900">创作工坊</h1>
            <p className="text-sm text-ink-400">管理角色卡和提示词模板</p>
          </div>
          <ModeBadge />
        </div>
        <div className="card text-center py-12">
          <EmptyState
            title="登录后使用创作工坊"
            description="注册并登录后即可创建和管理你自己的角色卡与提示词模板。访客 Demo 模式不保存数据。"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
          <Palette className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink-900">创作工坊</h1>
          <p className="text-sm text-ink-400">管理角色卡、提示词模板和创作资产</p>
        </div>
        <ModeBadge />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200 mb-6">
        {([
          { key: "characters" as Tab, label: "角色卡", icon: <Users className="h-4 w-4" />, count: chars.filtered.length },
          { key: "templates" as Tab, label: "提示词模板", icon: <FileText className="h-4 w-4" />, count: tmpls.filtered.length },
        ]).map(({ key, label, icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-brand-500 text-brand-700"
                : "border-transparent text-ink-400 hover:text-ink-600"
            }`}
          >
            {icon}
            {label}
            <span className="text-xs bg-surface-100 rounded-full px-1.5 py-0.5 text-ink-400">
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "characters" && (
        <CharacterList
          characters={chars.filtered}
          loading={chars.loading}
          searchQuery={chars.searchQuery}
          onSearchChange={chars.setSearchQuery}
          filterTag={chars.filterTag}
          onFilterTag={chars.setFilterTag}
          onEdit={(c) => { setEditingChar(c); setShowCharEditor(true); }}
          onDelete={(c) => { if (confirm(`删除角色「${c.name}」？`)) chars.remove(c.id); }}
          onArchive={(c) => { chars.archive(c.id); }}
          onToggleFavorite={(c) => { chars.toggleFavorite(c.id, c.is_favorite); }}
          onCreate={() => { setEditingChar(null); setShowCharEditor(true); }}
        />
      )}

      {tab === "templates" && (
        <TemplateList
          templates={tmpls.filtered}
          loading={tmpls.loading}
          searchQuery={tmpls.searchQuery}
          onSearchChange={tmpls.setSearchQuery}
          filterCategory={tmpls.filterCategory}
          onFilterCategory={tmpls.setFilterCategory}
          filterTag={tmpls.filterTag}
          onFilterTag={tmpls.setFilterTag}
          onEdit={(t) => { setEditingTpl(t); setShowTplEditor(true); }}
          onDelete={(t) => { if (confirm(`删除模板「${t.title}」？`)) tmpls.remove(t.id); }}
          onToggleFavorite={(t) => { tmpls.toggleFavorite(t.id, t.is_favorite); }}
          onCreate={() => { setEditingTpl(null); setShowTplEditor(true); }}
          categories={tmpls.categories}
        />
      )}

      {/* Character editor drawer */}
      {showCharEditor && (
        <CharacterEditor
          character={editingChar}
          onClose={() => { setShowCharEditor(false); setEditingChar(null); }}
          onSave={async (name, card, tags) => {
            if (editingChar) {
              await chars.update(editingChar.id, name, card, tags);
            } else {
              await chars.create(name, card, tags);
            }
          }}
        />
      )}

      {/* Template editor drawer */}
      {showTplEditor && (
        <TemplateEditor
          template={editingTpl}
          categories={tmpls.categories}
          onClose={() => { setShowTplEditor(false); setEditingTpl(null); }}
          onSave={async (title, content, category, tags, description) => {
            if (editingTpl) {
              await tmpls.update(editingTpl.id, title, content, category, tags, description);
            } else {
              await tmpls.create(title, content, category, tags, description);
            }
          }}
        />
      )}
    </div>
  );
}

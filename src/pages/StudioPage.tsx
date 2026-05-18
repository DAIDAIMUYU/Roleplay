import { useState } from "react";
import { Palette, Users, FileText, BookOpen, Brain } from "lucide-react";
import { useAuth } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";
import { EmptyState } from "../shared/components/EmptyState";
import { useCharacters } from "../features/roleplay/hooks/useCharacters";
import { useTemplates } from "../features/roleplay/hooks/useTemplates";
import { useWorldbooks } from "../features/roleplay/hooks/useWorldbooks";
import { useMemories } from "../features/roleplay/hooks/useMemories";
import { CharacterList } from "../features/roleplay/components/studio/CharacterList";
import { CharacterEditor } from "../features/roleplay/components/studio/CharacterEditor";
import { TemplateList } from "../features/roleplay/components/studio/TemplateList";
import { TemplateEditor } from "../features/roleplay/components/studio/TemplateEditor";
import { WorldbookList } from "../features/roleplay/components/studio/WorldbookList";
import { WorldbookEntryEditor } from "../features/roleplay/components/studio/WorldbookEntryEditor";
import { MemoryList } from "../features/roleplay/components/studio/MemoryList";
import { MemoryEditor } from "../features/roleplay/components/studio/MemoryEditor";
import type { CharacterRow, PromptTemplateRow, WorldbookRow, WorldbookEntryRow, MemoryRow } from "../features/roleplay/types/database";

type Tab = "characters" | "templates" | "worldbooks" | "memories";

// Simple modal for worldbook name editing
function WbNameModal({ worldbook, onSave, onClose }: { worldbook: WorldbookRow | null; onSave: (name: string, desc: string) => void; onClose: () => void }) {
  const [name, setName] = useState(worldbook?.name ?? "");
  const [desc, setDesc] = useState(worldbook?.description ?? "");
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm mx-4 p-5">
        <h3 className="text-sm font-semibold mb-3">{worldbook ? "编辑世界书" : "创建世界书"}</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="世界书名称" className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm mb-2" autoFocus />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="描述（可选）" className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm mb-4" />
        <div className="flex gap-2">
          <button onClick={() => { onSave(name, desc); onClose(); }} disabled={!name.trim()} className="btn-primary text-sm flex-1 disabled:opacity-50">保存</button>
          <button onClick={onClose} className="btn-secondary text-sm">取消</button>
        </div>
      </div>
    </div>
  );
}

export function StudioPage() {
  const { isGuestOrDemo, user } = useAuth();
  const [tab, setTab] = useState<Tab>("characters");

  const chars = useCharacters(user?.id, isGuestOrDemo);
  const tmpls = useTemplates(user?.id, isGuestOrDemo);
  const wbs = useWorldbooks(user?.id, isGuestOrDemo);
  const mems = useMemories(user?.id, isGuestOrDemo);

  const [editingChar, setEditingChar] = useState<CharacterRow | null>(null);
  const [showCharEditor, setShowCharEditor] = useState(false);
  const [editingTpl, setEditingTpl] = useState<PromptTemplateRow | null>(null);
  const [showTplEditor, setShowTplEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorldbookEntryRow | null>(null);
  const [showEntryEditor, setShowEntryEditor] = useState(false);
  const [showWbModal, setShowWbModal] = useState(false);
  const [editingWb, setEditingWb] = useState<WorldbookRow | null>(null);
  const [editingMem, setEditingMem] = useState<MemoryRow | null>(null);
  const [showMemEditor, setShowMemEditor] = useState(false);

  if (isGuestOrDemo) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-3 mb-6"><div className="h-9 w-9 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center"><Palette className="h-5 w-5" /></div><div><h1 className="text-xl font-bold text-ink-900">创作工坊</h1></div><ModeBadge /></div>
        <div className="card text-center py-12"><EmptyState title="登录后使用创作工坊" description="注册并登录后即可创建和管理角色卡、提示词、世界书和记忆。访客 Demo 模式不保存数据。" /></div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "characters", label: "角色卡", icon: <Users className="h-4 w-4" />, count: chars.filtered.length },
    { key: "templates", label: "提示词", icon: <FileText className="h-4 w-4" />, count: tmpls.filtered.length },
    { key: "worldbooks", label: "世界书", icon: <BookOpen className="h-4 w-4" />, count: wbs.filteredWbs.length },
    { key: "memories", label: "记忆库", icon: <Brain className="h-4 w-4" />, count: mems.filtered.length },
  ];

  const activeWb = wbs.worldbooks.find((w) => w.id === wbs.activeWorldbookId) ?? null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center"><Palette className="h-5 w-5" /></div>
        <div><h1 className="text-xl font-bold text-ink-900">创作工坊</h1><p className="text-sm text-ink-400">管理角色卡、提示词、世界书和记忆</p></div>
        <ModeBadge />
      </div>

      <div className="flex border-b border-surface-200 mb-6 overflow-x-auto">
        {tabs.map(({ key, label, icon, count }) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${tab === key ? "border-brand-500 text-brand-700" : "border-transparent text-ink-400 hover:text-ink-600"}`}>
            {icon} {label}
            <span className="text-xs bg-surface-100 rounded-full px-1.5 py-0.5">{count}</span>
          </button>
        ))}
      </div>

      {tab === "characters" && <CharacterList characters={chars.filtered} loading={chars.loading} searchQuery={chars.searchQuery} onSearchChange={chars.setSearchQuery} filterTag={chars.filterTag} onFilterTag={chars.setFilterTag} onEdit={(c) => { setEditingChar(c); setShowCharEditor(true); }} onDelete={(c) => { if (confirm(`删除角色「${c.name}」？\n\n这会软删除/归档角色：历史会话和消息会保留，但该角色会从创作工坊和新建会话选择中隐藏。`)) chars.remove(c.id); }} onArchive={(c) => { chars.archive(c.id); }} onToggleFavorite={(c) => { chars.toggleFavorite(c.id, c.is_favorite); }} onCreate={() => { setEditingChar(null); setShowCharEditor(true); }} />}

      {tab === "templates" && <TemplateList templates={tmpls.filtered} loading={tmpls.loading} searchQuery={tmpls.searchQuery} onSearchChange={tmpls.setSearchQuery} filterCategory={tmpls.filterCategory} onFilterCategory={tmpls.setFilterCategory} filterTag={tmpls.filterTag} onFilterTag={tmpls.setFilterTag} onEdit={(t) => { setEditingTpl(t); setShowTplEditor(true); }} onDelete={(t) => { if (confirm(`删除模板「${t.title}」？`)) tmpls.remove(t.id); }} onToggleFavorite={(t) => { tmpls.toggleFavorite(t.id, t.is_favorite); }} onCreate={() => { setEditingTpl(null); setShowTplEditor(true); }} categories={tmpls.categories} />}

      {tab === "worldbooks" && (
        <WorldbookList
          worldbooks={wbs.filteredWbs} entries={wbs.filteredEntries} loading={wbs.loading}
          activeWorldbookId={wbs.activeWorldbookId} onSelectWb={wbs.setActiveWorldbookId}
          onCreateWb={() => { setEditingWb(null); setShowWbModal(true); }}
          onEditWb={(wb) => { setEditingWb(wb); setShowWbModal(true); }}
          onDeleteWb={(wb) => { if (confirm(`删除世界书「${wb.name}」及其所有条目？`)) wbs.deleteWb(wb.id); }}
          onCreateEntry={() => { setEditingEntry(null); setShowEntryEditor(true); }}
          onEditEntry={(e) => { setEditingEntry(e); setShowEntryEditor(true); }}
          onDeleteEntry={(e) => { if (confirm(`删除条目「${e.title}」？`)) wbs.deleteEntry(e.id); }}
          onToggleEntry={(e) => { wbs.toggleEntryEnabled(e.id, e.enabled); }}
          searchQuery={wbs.searchQuery} onSearchChange={wbs.setSearchQuery}
          entrySearch={wbs.entrySearch} onEntrySearchChange={wbs.setEntrySearch}
        />
      )}

      {tab === "memories" && <MemoryList memories={mems.filtered} loading={mems.loading} types={mems.types} searchQuery={mems.searchQuery} onSearchChange={mems.setSearchQuery} filterType={mems.filterType} onFilterType={mems.setFilterType} onEdit={(m) => { setEditingMem(m); setShowMemEditor(true); }} onDelete={(m) => { if (confirm("删除此记忆？")) mems.remove(m.id); }} onToggle={(m) => { mems.toggleStatus(m.id, m.status); }} onCreate={() => { setEditingMem(null); setShowMemEditor(true); }} />}

      {/* Modals */}
      {showCharEditor && <CharacterEditor character={editingChar} onClose={() => { setShowCharEditor(false); setEditingChar(null); }} onSave={async (name, card, tags) => { if (editingChar) await chars.update(editingChar.id, name, card, tags); else await chars.create(name, card, tags); }} />}
      {showTplEditor && <TemplateEditor template={editingTpl} categories={tmpls.categories} onClose={() => { setShowTplEditor(false); setEditingTpl(null); }} onSave={async (title, content, category, tags, description) => { if (editingTpl) await tmpls.update(editingTpl.id, title, content, category, tags, description); else await tmpls.create(title, content, category, tags, description); }} />}
      {showWbModal && <WbNameModal worldbook={editingWb} onClose={() => { setShowWbModal(false); setEditingWb(null); }} onSave={(name, desc) => { if (editingWb) wbs.updateWb(editingWb.id, name, desc); else wbs.createWb(name, desc); }} />}
      {showEntryEditor && activeWb && <WorldbookEntryEditor entry={editingEntry} worldbook={activeWb} onClose={() => { setShowEntryEditor(false); setEditingEntry(null); }} onSave={async (title, content, triggers, priority, category) => { if (editingEntry) await wbs.updateEntry(editingEntry.id, title, content, triggers, priority, undefined, category); else await wbs.createEntry(activeWb.id, title, content, triggers, priority, category); }} />}
      {showMemEditor && <MemoryEditor memory={editingMem} types={mems.types} onClose={() => { setShowMemEditor(false); setEditingMem(null); }} onSave={async (content, type, title, salience) => { if (editingMem) await mems.update(editingMem.id, content, type, title, salience); else await mems.create(content, type, title, salience); }} />}
    </div>
  );
}

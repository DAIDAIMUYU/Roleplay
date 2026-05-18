import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { WorldbookRow, WorldbookEntryRow } from "../../types/database";

interface WorldbookEntryEditorProps {
  entry: WorldbookEntryRow | null;
  worldbook: WorldbookRow;
  onSave: (title: string, content: string, triggers: string[], priority: number, category: string) => Promise<void>;
  onClose: () => void;
}

export function WorldbookEntryEditor({ entry, worldbook, onSave, onClose }: WorldbookEntryEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [triggers, setTriggers] = useState<string[]>([]);
  const [triggerInput, setTriggerInput] = useState("");
  const [priority, setPriority] = useState(100);
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) { setTitle(entry.title); setContent(entry.content); setTriggers(entry.triggers ?? []); setPriority(entry.priority); setCategory(entry.category); }
    else { setTitle(""); setContent(""); setTriggers([]); setPriority(100); setCategory("general"); }
  }, [entry]);

  function addTrigger() { const t = triggerInput.trim(); if (t && !triggers.includes(t)) setTriggers([...triggers, t]); setTriggerInput(""); }

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    await onSave(title.trim(), content.trim(), triggers, priority, category);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-dvh overflow-y-auto shadow-modal border-l border-surface-200">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h2 className="text-lg font-semibold text-ink-900">{entry ? "编辑条目" : "新建条目"} · {worldbook.name}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-100"><X className="h-5 w-5 text-ink-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">条目名称 *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：蝶屋" className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">分类</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm">
              {["general","location","character","faction","item","event","rule","term"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">内容 *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="世界书条目内容..." rows={5} className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm focus:border-brand-400 resize-y" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">触发关键词</label>
            <div className="flex gap-1.5">
              <input type="text" value={triggerInput} onChange={(e) => setTriggerInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTrigger(); } }} placeholder="输入后回车添加" className="flex-1 rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm" />
              <button onClick={addTrigger} className="btn-secondary text-xs px-3"><Plus className="h-3 w-3" /></button>
            </div>
            {triggers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {triggers.map((t) => (
                  <span key={t} className="inline-flex items-center gap-0.5 text-xs bg-sky-50 text-sky-600 rounded-full pl-2.5 pr-1 py-0.5">
                    {t} <button onClick={() => setTriggers(triggers.filter((x) => x !== t))} className="p-0.5 hover:text-rose-500"><Trash2 className="h-2.5 w-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-ink-300 mt-1">用户消息中出现任一关键词时触发此条目</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">优先级 ({priority})</label>
            <input type="range" min={1} max={200} value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full" />
            <p className="text-xs text-ink-300">数值越高越优先注入，Token预算紧张时低优先级可能被跳过</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving || !title.trim()} className="btn-primary text-sm flex-1 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
            <button onClick={onClose} className="btn-secondary text-sm">取消</button>
          </div>
        </div>
      </div>
    </div>
  );
}

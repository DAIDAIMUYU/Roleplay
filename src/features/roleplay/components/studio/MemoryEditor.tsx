import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { MemoryRow } from "../../types/database";

interface MemoryEditorProps {
  memory: MemoryRow | null;
  types: { value: string; label: string }[];
  onSave: (content: string, type: string, title: string, salience: number) => Promise<void>;
  onClose: () => void;
}

export function MemoryEditor({ memory, types, onSave, onClose }: MemoryEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [memType, setMemType] = useState("user_preference");
  const [salience, setSalience] = useState(50);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (memory) { setTitle(memory.title || ""); setContent(memory.content); setMemType(memory.memory_type); setSalience(memory.salience); }
    else { setTitle(""); setContent(""); setMemType("user_preference"); setSalience(50); }
  }, [memory]);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    await onSave(content.trim(), memType, title.trim(), salience);
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-dvh overflow-y-auto shadow-modal border-l border-surface-200">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h2 className="text-lg font-semibold text-ink-900">{memory ? "编辑记忆" : "创建记忆"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-100"><X className="h-5 w-5 text-ink-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">标题</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：用户偏好慢节奏" className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">类型</label>
            <select value={memType} onChange={(e) => setMemType(e.target.value)} className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm">
              {types.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">内容 *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="记忆内容..." rows={4} className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm focus:border-brand-400 resize-y" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">重要度 ({salience})</label>
            <input type="range" min={1} max={100} value={salience} onChange={(e) => setSalience(Number(e.target.value))} className="w-full" />
            <p className="text-xs text-ink-300">数值越高越优先注入，Token紧张时低重要度可能被跳过</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving || !content.trim()} className="btn-primary text-sm flex-1 disabled:opacity-50">{saving ? "保存中..." : "保存"}</button>
            <button onClick={onClose} className="btn-secondary text-sm">取消</button>
          </div>
        </div>
      </div>
    </div>
  );
}

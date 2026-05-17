import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { PromptTemplateRow } from "../../types/database";

interface TemplateEditorProps {
  template: PromptTemplateRow | null;
  categories: { value: string; label: string }[];
  onSave: (title: string, content: string, category: string, tags: string[], description: string) => Promise<void>;
  onClose: () => void;
}

const VARIABLES = [
  { key: "{{character_name}}", desc: "角色名称" },
  { key: "{{user_name}}", desc: "用户称呼" },
  { key: "{{current_scene}}", desc: "当前场景" },
  { key: "{{relationship_stage}}", desc: "关系阶段" },
  { key: "{{speaking_style}}", desc: "说话风格" },
  { key: "{{greeting}}", desc: "开场白" },
];

export function TemplateEditor({ template, categories, onSave, onClose }: TemplateEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setTitle(template.title);
      setContent(template.content);
      setCategory(template.category);
      setDescription(template.description ?? "");
      setTags(template.tags ?? []);
    } else {
      setTitle("");
      setContent("");
      setCategory("general");
      setDescription("");
      setTags([]);
    }
  }, [template]);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  function insertVariable(key: string) {
    setContent((prev) => prev + " " + key + " ");
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    await onSave(title.trim(), content.trim(), category, tags, description.trim());
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-dvh overflow-y-auto shadow-modal border-l border-surface-200">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h2 className="text-lg font-semibold text-ink-900">
            {template ? "编辑模板" : "创建模板"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-100">
            <X className="h-5 w-5 text-ink-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">模板名称 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：沉浸式角色扮演"
              className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              {categories.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">描述</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="模板用途说明"
              className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">模板内容 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="编写提示词模板..."
              rows={8}
              className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-y font-mono"
            />
          </div>

          {/* Variables */}
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">可用变量（点击插入）</label>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map(({ key, desc }) => (
                <button
                  key={key}
                  onClick={() => insertVariable(key)}
                  className="text-xs bg-brand-50 text-brand-600 rounded-full px-2.5 py-1 hover:bg-brand-100 transition-colors"
                  title={desc}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1">标签</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="输入后回车添加"
                className="flex-1 rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <button onClick={addTag} className="btn-secondary text-xs py-2 px-3"><Plus className="h-3 w-3" /></button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-0.5 text-xs bg-brand-50 text-brand-600 rounded-full pl-2.5 pr-1 py-0.5">
                    {tag}
                    <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="p-0.5 hover:text-rose-500">
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()} className="btn-primary text-sm flex-1 disabled:opacity-50">
              {saving ? "保存中..." : template ? "保存修改" : "创建模板"}
            </button>
            <button onClick={onClose} className="btn-secondary text-sm">取消</button>
          </div>
        </div>
      </div>
    </div>
  );
}

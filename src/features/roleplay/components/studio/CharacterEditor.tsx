import { useState, useEffect } from "react";
import { X, Plus, Trash2, BookOpen } from "lucide-react";
import type { CharacterRow, WorldbookRow } from "../../types/database";
import type { CharacterCardData } from "../../utils/characterPrompt";
import { parseCharacterCard, EMPTY_CARD } from "../../utils/characterPrompt";
import { supabase } from "../../../auth/supabaseClient";
import * as Repo from "../../repositories/roleplayRepository";

interface CharacterEditorProps {
  character: CharacterRow | null; // null = create new
  onSave: (name: string, card: CharacterCardData, tags: string[]) => Promise<void>;
  onClose: () => void;
}

interface FieldDef {
  key: keyof CharacterCardData;
  label: string;
  placeholder: string;
  rows?: number;
}

const FIELDS: FieldDef[] = [
  { key: "identity", label: "身份定位", placeholder: "例如：古风酒馆老板娘、赛博黑客、中世纪骑士..." },
  { key: "appearance", label: "外貌描述", placeholder: "外貌特征、穿着打扮、标志性外观...", rows: 3 },
  { key: "personality", label: "性格特质", placeholder: "核心性格、行为模式、情绪倾向...", rows: 3 },
  { key: "background", label: "背景故事", placeholder: "身世、经历、重要事件...", rows: 3 },
  { key: "speaking_style", label: "说话风格", placeholder: "语气、用词习惯、句式特点、口语化程度..." },
  { key: "relationship", label: "与用户关系", placeholder: "例如：青梅竹马、导师与学徒、雇主与佣兵..." },
  { key: "relationship_stage", label: "当前关系阶段", placeholder: "例如：刚刚相识、互相信任、有所戒备..." },
  { key: "user_nickname", label: "称呼用户", placeholder: "角色如何称呼用户？" },
  { key: "greeting", label: "开场白", placeholder: "角色首次对话的开场白...", rows: 3 },
  { key: "likes", label: "喜欢互动", placeholder: "角色喜欢的互动方式和内容" },
  { key: "forbidden_rules", label: "行为边界", placeholder: "禁止的行为、话题或表达方式...", rows: 2 },
];

export function CharacterEditor({ character, onSave, onClose }: CharacterEditorProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [card, setCard] = useState<CharacterCardData>(EMPTY_CARD);
  const [saving, setSaving] = useState(false);
  const [boundWbIds, setBoundWbIds] = useState<string[]>([]);
  const [availableWbs, setAvailableWbs] = useState<WorldbookRow[]>([]);

  useEffect(() => {
    if (character) {
      setName(character.name);
      setEmoji(character.avatar_emoji || "");
      setTags(character.tags ?? []);
      const c = parseCharacterCard(character);
      setCard(c);
      setBoundWbIds((c.extra_settings?.bound_worldbook_ids as string[]) ?? []);
    } else {
      setName(""); setEmoji(""); setTags([]); setCard(EMPTY_CARD); setBoundWbIds([]);
    }
  }, [character]);

  useEffect(() => {
    if (!supabase) return;
    // We can't get userId easily here, but we load from the character's user_id
    // For simplicity, load worldbooks on mount and when character changes
    const loadWbs = async () => {
      const uid = character?.user_id;
      if (!uid) return;
      const wbs = await Repo.listWorldbooks(supabase!, uid);
      setAvailableWbs(wbs);
    };
    loadWbs();
  }, [character]);

  function toggleWb(wbId: string) {
    setBoundWbIds((prev) => prev.includes(wbId) ? prev.filter((id) => id !== wbId) : [...prev, wbId]);
  }

  function addTag() { const t = tagInput.trim(); if (t && !tags.includes(t)) setTags([...tags, t]); setTagInput(""); }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), {
      ...card,
      extra_settings: { ...card.extra_settings, bound_worldbook_ids: boundWbIds },
    }, tags);
    setSaving(false);
    onClose();
  }

  function updateCardField(key: keyof CharacterCardData, value: string) {
    setCard((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white h-dvh overflow-y-auto shadow-modal border-l border-surface-200 animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <h2 className="text-lg font-semibold text-ink-900">
            {character ? "编辑角色" : "创建角色"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-100">
            <X className="h-5 w-5 text-ink-400" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Name + Emoji */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-ink-500 mb-1">角色名称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入角色名"
                className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs font-medium text-ink-500 mb-1">Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🎭"
                maxLength={4}
                className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm text-center focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {/* Structured fields */}
          {FIELDS.map(({ key, label, placeholder, rows }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-ink-500 mb-1">{label}</label>
              {rows && rows > 1 ? (
                <textarea
                  value={card[key] as string}
                  onChange={(e) => updateCardField(key, e.target.value)}
                  placeholder={placeholder}
                  rows={rows}
                  className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-y"
                />
              ) : (
                <input
                  type="text"
                  value={card[key] as string}
                  onChange={(e) => updateCardField(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              )}
            </div>
          ))}

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
              <button onClick={addTag} className="btn-secondary text-xs py-2 px-3 flex items-center gap-1">
                <Plus className="h-3 w-3" />
              </button>
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

          {/* Worldbook binding */}
          {availableWbs.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-ink-500 mb-2">关联世界书</label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {availableWbs.map((wb) => (
                  <label key={wb.id} className="flex items-center gap-2.5 px-3 py-2 rounded-card border border-surface-100 cursor-pointer hover:border-brand-200 transition-colors">
                    <input type="checkbox" checked={boundWbIds.includes(wb.id)} onChange={() => toggleWb(wb.id)} className="rounded" />
                    <BookOpen className="h-3.5 w-3.5 text-sky-500" />
                    <span className="text-sm text-ink-700 truncate flex-1">{wb.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-ink-300 mt-1">勾选的世界书将在聊天时参与上下文匹配</p>
            </div>
          )}

          {/* Save */}
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving || !name.trim()} className="btn-primary text-sm flex-1 disabled:opacity-50">
              {saving ? "保存中..." : character ? "保存修改" : "创建角色"}
            </button>
            <button onClick={onClose} className="btn-secondary text-sm">取消</button>
          </div>
        </div>
      </div>
    </div>
  );
}

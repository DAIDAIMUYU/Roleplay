import { BookOpen, Brain, MessageCircle, Sparkles, UserCircle } from "lucide-react";

export function ProductPreviewCard() {
  return (
    <div className="rounded-2xl border border-surface-100 bg-gradient-to-br from-brand-50/40 via-white to-amber-light/20 p-6 shadow-sm overflow-hidden">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">产品预览</span>
      </div>

      {/* Simulated chat bubble */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-600">
            <UserCircle className="h-4 w-4" />
          </div>
          <div className="rounded-2xl rounded-tl-md bg-surface-100 px-3 py-2 text-xs text-ink-600 max-w-[75%]">
            你好，我是艾琳，王都的冒险者。有什么我可以帮你的？
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <div className="rounded-2xl rounded-tr-md bg-brand-500 px-3 py-2 text-xs text-white max-w-[75%]">
            艾琳，能跟我讲讲王都最近有什么新鲜事吗？
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-600">
            <UserCircle className="h-4 w-4" />
          </div>
          <div className="rounded-2xl rounded-tl-md bg-surface-100 px-3 py-2 text-xs text-ink-600 max-w-[75%]">
            当然！最近王都的魔法学院新开了一门古代符文课…<span className="text-ink-300">▊</span>
          </div>
        </div>
      </div>

      {/* Context hints */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] text-ink-400 shadow-sm">
          <BookOpen className="h-3 w-3 text-sky-400" />
          <span>世界书命中：王都 · 魔法学院</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] text-ink-400 shadow-sm">
          <Brain className="h-3 w-3 text-amber-400" />
          <span>记忆注入：艾琳 — 友善</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] text-ink-400 shadow-sm">
          <MessageCircle className="h-3 w-3 text-emerald-400" />
          <span>模板：通用角色扮演</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] text-ink-400 shadow-sm">
          <Sparkles className="h-3 w-3 text-brand-400" />
          <span>API：DeepSeek V4 Flash</span>
        </div>
      </div>
    </div>
  );
}

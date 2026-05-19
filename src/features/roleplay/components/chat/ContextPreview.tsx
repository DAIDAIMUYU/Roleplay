import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  BookOpen,
  Brain,
  ChevronDown,
  ChevronRight,
  Cpu,
  Eye,
  FileText,
  ListTree,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import type { CharacterRow, MemoryRow, PromptTemplateRow, WorldbookRow } from "../../types/database";
import { parseCharacterCard } from "../../utils/characterPrompt";
import type { ContextBuildOutput } from "../../context/contextBuilder";
import { estimateTokens } from "../../context/tokenBudget";
import { supabase } from "../../../auth/supabaseClient";
import * as Repo from "../../repositories/roleplayRepository";
import * as LocalRepo from "../../repositories/localRoleplayRepository";

interface ContextPreviewProps {
  sessionTitle: string;
  messageCount: number;
  isDemo: boolean;
  isLocalMode: boolean;
  providerLabel: string;
  modelLabel: string;
  apiConfigured: boolean;
  runtimeMode: string;
  activeCharacter: CharacterRow | null;
  activeTemplate: PromptTemplateRow | null;
  systemPrompt: string | null;
  lastContextOutput?: ContextBuildOutput | null;
  contextPreviewError?: string | null;
  sessionSummaryText?: string;
  worldbookIds: string[];
  memoryIds: string[];
  disabledWbIds: string[];
  disabledMemIds: string[];
  summaryEnabled: boolean;
  suggestedMemories: MemoryRow[];
  isGeneratingMemorySuggestions?: boolean;
  activeBranchName?: string | null;
  contextRunSaveStatus?: "idle" | "saved" | "failed" | null;
  onAddTemplate: (id: string) => Promise<void>;
  onRemoveTemplate: () => Promise<void>;
  onAddWorldbooks: (ids: string[]) => Promise<void>;
  onRemoveWorldbook: (id: string) => Promise<void>;
  onToggleWorldbook: (id: string) => Promise<void>;
  onAddMemories: (ids: string[]) => Promise<void>;
  onRemoveMemory: (id: string) => Promise<void>;
  onToggleMemory: (id: string) => Promise<void>;
  onGenerateMemorySuggestions: () => Promise<void>;
  onUpdateSuggestedMemoryStatus: (memoryId: string, status: "active" | "disabled" | "deleted") => Promise<void>;
  onSaveSummaryText: (text: string) => Promise<void>;
  onClearSummary: () => Promise<void>;
  onGenerateSummary: () => Promise<string | null>;
}

function Collapse({
  title,
  icon,
  badge,
  defaultOpen,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="border-b border-surface-100 last:border-0">
      <button onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-2 px-3 py-2.5 text-xs hover:bg-surface-50">
        {open ? <ChevronDown className="h-3 w-3 text-ink-300" /> : <ChevronRight className="h-3 w-3 text-ink-300" />}
        <span className="text-ink-300">{icon}</span>
        <span className="flex-1 text-left font-medium text-ink-600">{title}</span>
        {badge && <span className="rounded-full bg-surface-100 px-1.5 py-0.5 text-xs text-ink-400">{badge}</span>}
      </button>
      {open && <div className="px-3 pb-2">{children}</div>}
    </div>
  );
}

function PickerModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative mx-4 flex max-h-[70vh] w-full max-w-sm flex-col rounded-2xl bg-white p-5 shadow-modal">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-surface-100">
            <X className="h-4 w-4 text-ink-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function ContextPreview(props: ContextPreviewProps) {
  const {
    sessionTitle,
    messageCount,
    isDemo,
    isLocalMode,
    providerLabel,
    modelLabel,
    apiConfigured,
    runtimeMode,
    activeCharacter,
    activeTemplate,
    systemPrompt,
    lastContextOutput,
    contextPreviewError,
    sessionSummaryText,
    worldbookIds,
    memoryIds,
    disabledWbIds,
    disabledMemIds,
    summaryEnabled,
    suggestedMemories,
    isGeneratingMemorySuggestions,
    activeBranchName,
    contextRunSaveStatus,
    onAddTemplate,
    onRemoveTemplate,
    onAddWorldbooks,
    onRemoveWorldbook,
    onToggleWorldbook,
    onAddMemories,
    onRemoveMemory,
    onToggleMemory,
    onGenerateMemorySuggestions,
    onUpdateSuggestedMemoryStatus,
    onSaveSummaryText,
    onClearSummary,
    onGenerateSummary,
  } = props;

  const card = activeCharacter ? parseCharacterCard(activeCharacter) : null;
  const finalPrompt = lastContextOutput?.systemPrompt || systemPrompt || "";
  const injectedHits = lastContextOutput?.triggerResult.triggered.filter((hit) => hit.injected) ?? [];
  const skippedEntries = lastContextOutput?.triggerResult.skipped ?? [];
  const injectedMemoryIds = new Set(lastContextOutput?.budget.memories.map((memory) => memory.id) ?? []);

  const [showTplPicker, setShowTplPicker] = useState(false);
  const [showWbPicker, setShowWbPicker] = useState(false);
  const [showMemPicker, setShowMemPicker] = useState(false);
  const [showSummaryEditor, setShowSummaryEditor] = useState(false);
  const [pickerTpls, setPickerTpls] = useState<PromptTemplateRow[]>([]);
  const [pickerWbs, setPickerWbs] = useState<WorldbookRow[]>([]);
  const [pickerMems, setPickerMems] = useState<MemoryRow[]>([]);
  const [selectedWbIds, setSelectedWbIds] = useState<Set<string>>(new Set());
  const [selectedMemIds, setSelectedMemIds] = useState<Set<string>>(new Set());
  const [wbNames, setWbNames] = useState<Map<string, string>>(new Map());
  const [memInfos, setMemInfos] = useState<Map<string, MemoryRow>>(new Map());
  const [summaryDraft, setSummaryDraft] = useState(sessionSummaryText || "");
  const [generatedPreview, setGeneratedPreview] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    setSummaryDraft(sessionSummaryText || "");
  }, [sessionSummaryText]);

  const loadPickers = useCallback(async () => {
    const [templates, worldbooks, memories] = await (isLocalMode
      ? Promise.all([
          LocalRepo.listPromptTemplates(),
          LocalRepo.listWorldbooks(),
          LocalRepo.listMemories(),
        ])
      : !supabase || !activeCharacter?.user_id
        ? Promise.resolve([[] as PromptTemplateRow[], [] as WorldbookRow[], [] as MemoryRow[]])
        : Promise.all([
            Repo.listPromptTemplates(supabase, activeCharacter.user_id),
            Repo.listWorldbooks(supabase, activeCharacter.user_id),
            Repo.listMemories(supabase, activeCharacter.user_id),
          ]));
    setPickerTpls(templates);
    setPickerWbs(worldbooks);
    setPickerMems(memories.filter((memory) => memory.status === "active"));
  }, [activeCharacter?.user_id, isLocalMode]);

  useEffect(() => {
    if (worldbookIds.length === 0) {
      setWbNames(new Map());
      return;
    }
    const loader = isLocalMode
      ? Promise.all(worldbookIds.map((id) => LocalRepo.getWorldbook(id).catch(() => null)))
      : !supabase
        ? Promise.resolve([])
        : Promise.all(worldbookIds.map((id) => Repo.getWorldbook(supabase!, id).catch(() => null)));
    loader
      .then((rows) => {
        const names = new Map<string, string>();
        rows.forEach((row) => {
          if (row) names.set(row.id, row.name);
        });
        setWbNames(names);
      })
      .catch(() => setWbNames(new Map()));
  }, [isLocalMode, worldbookIds]);

  useEffect(() => {
    if (memoryIds.length === 0) {
      setMemInfos(new Map());
      return;
    }
    const loader = isLocalMode
      ? LocalRepo.listMemories()
      : !supabase || !activeCharacter?.user_id
        ? Promise.resolve([])
        : Repo.listMemories(supabase, activeCharacter.user_id);
    loader
      .then((rows) => {
        const infos = new Map<string, MemoryRow>();
        rows.forEach((row) => {
          if (memoryIds.includes(row.id)) infos.set(row.id, row);
        });
        setMemInfos(infos);
      })
      .catch(() => setMemInfos(new Map()));
  }, [activeCharacter?.user_id, isLocalMode, memoryIds]);

  const statusRows = [
    { label: "会话", value: sessionTitle || "未选择", icon: <Cpu className="h-4 w-4" /> },
    { label: "分支", value: activeBranchName || "主线", icon: <ListTree className="h-4 w-4" /> },
    { label: "Provider", value: providerLabel, icon: <Cpu className="h-4 w-4" /> },
    { label: "模型", value: modelLabel, icon: <Zap className="h-4 w-4" /> },
    { label: "运行", value: runtimeMode, icon: <Cpu className="h-4 w-4" /> },
    { label: "API", value: isDemo ? "本地预览" : apiConfigured ? "已配置" : "未配置", icon: apiConfigured ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" /> },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-surface-100 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-300">上下文控制台</h3>
        {contextPreviewError ? (
          <p className="mt-0.5 text-xs text-amber-600">上下文预览失败，可继续聊天</p>
        ) : lastContextOutput?.debugInfo ? (
          <p className="mt-0.5 text-xs text-ink-300">
            构建 {lastContextOutput.debugInfo.buildTimeMs}ms · 估算 {lastContextOutput.estimatedTokens} / {lastContextOutput.budget.budgetLimit} tok
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-ink-300">上下文预览异步构建中</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1 px-3 py-2">
          {statusRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-card px-2 py-1.5 hover:bg-surface-50">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-ink-300">{row.icon}</span>
                <span className="truncate text-xs text-ink-500">{row.label}</span>
              </div>
              <span className="ml-2 max-w-[110px] flex-shrink-0 truncate text-right font-mono text-xs text-ink-300">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {activeCharacter && (
          <Collapse
            title={`角色: ${activeCharacter.name}${activeCharacter.deleted_at ? "（已删除角色）" : ""}`}
            icon={<Cpu className="h-3.5 w-3.5 text-brand-400" />}
            defaultOpen
          >
            <div className="space-y-0.5 pb-1 text-xs text-ink-400">
              {card?.identity && <p>身份：{card.identity}</p>}
              {card?.personality && <p className="line-clamp-2">性格：{card.personality}</p>}
              {card?.relationship && (
                <p>
                  关系：{card.relationship}
                  {card.relationship_stage ? ` · ${card.relationship_stage}` : ""}
                </p>
              )}
            </div>
          </Collapse>
        )}

        <Collapse title="提示词模板" icon={<FileText className="h-3.5 w-3.5 text-emerald-400" />} badge={activeTemplate ? activeTemplate.title : "未添加"}>
          {activeTemplate ? (
            <div className="pb-1">
              <p className="mb-1 line-clamp-2 text-xs text-ink-400">{activeTemplate.content.slice(0, 120)}</p>
              <button onClick={onRemoveTemplate} className="btn-ghost flex items-center gap-1 text-xs text-rose-500">
                <Trash2 className="h-3 w-3" />
                移除模板
              </button>
            </div>
          ) : (
            <p className="pb-1 text-xs text-ink-300">未添加模板，当前仅使用角色基础设定。</p>
          )}
          <button
            onClick={() => {
              void loadPickers();
              setShowTplPicker(true);
            }}
            className="btn-ghost flex items-center gap-1 pb-1 text-xs text-brand-500"
          >
            <Plus className="h-3 w-3" />
            添加模板
          </button>
        </Collapse>

        <Collapse title="世界书" icon={<BookOpen className="h-3.5 w-3.5 text-sky-400" />} badge={`${worldbookIds.length} 个`}>
          {worldbookIds.length === 0 ? (
            <p className="pb-1 text-xs text-ink-300">未添加世界书。</p>
          ) : (
            <div className="space-y-1 pb-1">
              {worldbookIds.map((id) => {
                const disabled = disabledWbIds.includes(id);
                const hits = injectedHits.filter((hit) => hit.entry.worldbook_id === id);
                return (
                  <div key={id} className={`rounded-card p-1.5 ${disabled ? "bg-surface-50 opacity-50" : hits.length ? "bg-sky-light/30" : "bg-surface-50"}`}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => void onToggleWorldbook(id)} className="flex-shrink-0">
                        {disabled ? <ToggleLeft className="h-4 w-4 text-ink-300" /> : <ToggleRight className="h-4 w-4 text-sky-500" />}
                      </button>
                      <span className="flex-1 truncate text-xs text-ink-600">{wbNames.get(id) || id.slice(0, 8)}</span>
                      {hits.length > 0 && <span className="text-xs text-sky-500">命中</span>}
                      <button onClick={() => void onRemoveWorldbook(id)} className="p-0.5 text-ink-300 hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    {hits.map((hit) => (
                      <p key={hit.entry.id} className="mt-1 pl-6 text-xs text-sky-700">
                        {hit.entry.title} · 关键词：{hit.matchedKeywords.join("、") || "已注入"}
                      </p>
                    ))}
                  </div>
                );
              })}
              {lastContextOutput && injectedHits.length === 0 && <p className="text-xs text-ink-300">本轮暂无命中条目。</p>}
            </div>
          )}
          <button
            onClick={() => {
              void loadPickers();
              setSelectedWbIds(new Set());
              setShowWbPicker(true);
            }}
            className="btn-ghost flex items-center gap-1 pb-1 text-xs text-brand-500"
          >
            <Plus className="h-3 w-3" />
            添加世界书
          </button>
        </Collapse>

        <Collapse title="记忆" icon={<Brain className="h-3.5 w-3.5 text-amber-400" />} badge={`${memoryIds.length} 条`}>
          {memoryIds.length === 0 ? (
            <p className="pb-1 text-xs text-ink-300">未添加记忆。</p>
          ) : (
            <div className="space-y-1 pb-1">
              {memoryIds.map((id) => {
                const info = memInfos.get(id);
                const disabled = disabledMemIds.includes(id);
                const injected = injectedMemoryIds.has(id);
                const reason = disabled ? "未启用" : injected ? "已注入本轮上下文" : "未注入，可能超出 token 预算";
                return (
                  <div key={id} className={`rounded-card p-1.5 ${disabled ? "bg-surface-50 opacity-60" : injected ? "bg-amber-light/30" : "bg-surface-50"}`}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => void onToggleMemory(id)} className="flex-shrink-0">
                        {disabled ? <ToggleLeft className="h-4 w-4 text-ink-300" /> : <ToggleRight className="h-4 w-4 text-amber-500" />}
                      </button>
                      <span className="flex-1 truncate text-xs text-ink-600">{info?.title || id.slice(0, 8)}</span>
                      <span className={`text-[11px] ${disabled ? "text-ink-300" : injected ? "text-amber-600" : "text-ink-400"}`}>
                        {disabled ? "未启用" : injected ? "已注入" : "未注入"}
                      </span>
                      <button onClick={() => void onRemoveMemory(id)} className="p-0.5 text-ink-300 hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="pl-6 pt-1 text-[11px] text-ink-400">{reason}</p>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 pb-2">
            <button
              onClick={() => {
                void loadPickers();
                setSelectedMemIds(new Set());
                setShowMemPicker(true);
              }}
              className="btn-ghost flex items-center gap-1 text-xs text-brand-500"
            >
              <Plus className="h-3 w-3" />
              添加记忆
            </button>
            <button
              onClick={() => {
                void onGenerateMemorySuggestions();
              }}
              disabled={!apiConfigured || !!isGeneratingMemorySuggestions}
              className="btn-ghost flex items-center gap-1 text-xs text-amber-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isGeneratingMemorySuggestions ? "animate-spin" : ""}`} />
              {isGeneratingMemorySuggestions ? "提炼中..." : "AI 提炼记忆"}
            </button>
          </div>
          <div className="space-y-1 pb-1">
            {suggestedMemories.length === 0 ? (
              <p className="text-xs text-ink-300">暂无待确认记忆。候选记忆不会自动注入，确认后才会启用。</p>
            ) : (
              suggestedMemories.map((memory) => (
                <div key={memory.id} className="rounded-card border border-amber-200 bg-amber-light/20 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-ink-600">{memory.title || "未命名候选记忆"}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-ink-400">{memory.content}</p>
                    </div>
                    <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-amber-700">suggested</span>
                  </div>
                  <p className="mt-1 text-[11px] text-ink-400">待确认记忆不会注入最终 System Prompt。</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button onClick={() => void onUpdateSuggestedMemoryStatus(memory.id, "active")} className="btn-primary px-2 py-1 text-[11px]">
                      接受并启用
                    </button>
                    <button onClick={() => void onUpdateSuggestedMemoryStatus(memory.id, "disabled")} className="btn-ghost text-[11px] text-ink-500">
                      忽略
                    </button>
                    <button onClick={() => void onUpdateSuggestedMemoryStatus(memory.id, "deleted")} className="btn-ghost text-[11px] text-rose-500">
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Collapse>

        <Collapse title="会话摘要" icon={<ListTree className="h-3.5 w-3.5 text-ink-400" />} badge={summaryEnabled ? "已启用" : "未启用"}>
          {showSummaryEditor ? (
            <div className="pb-2">
              <p className="mb-2 text-xs text-ink-300">
                {generatedPreview ? "AI 生成摘要预览，可编辑。点击保存后启用。" : "可以手动编辑摘要，也可以点击 AI 生成摘要。"}
              </p>
              <textarea
                value={summaryDraft}
                onChange={(event) => setSummaryDraft(event.target.value)}
                placeholder="摘要内容..."
                rows={4}
                className="mb-2 w-full resize-y rounded-input border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs"
              />
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={async () => {
                    if (!apiConfigured) {
                      alert("未配置 API Key，无法生成摘要。");
                      return;
                    }
                    setGeneratingSummary(true);
                    const result = await onGenerateSummary();
                    setGeneratingSummary(false);
                    if (result) {
                      setSummaryDraft(result);
                      setGeneratedPreview(true);
                    }
                  }}
                  disabled={generatingSummary}
                  className="btn-ghost flex items-center gap-1 text-xs text-brand-500"
                >
                  <RefreshCw className={`h-3 w-3 ${generatingSummary ? "animate-spin" : ""}`} />
                  {generatingSummary ? "生成中..." : "AI 生成摘要"}
                </button>
                <button
                  onClick={async () => {
                    await onSaveSummaryText(summaryDraft);
                    setGeneratedPreview(false);
                    setShowSummaryEditor(false);
                  }}
                  className="btn-primary px-2 py-1 text-xs"
                >
                  保存并启用
                </button>
                <button
                  onClick={async () => {
                    await onSaveSummaryText("");
                    setSummaryDraft("");
                    setGeneratedPreview(false);
                    setShowSummaryEditor(false);
                  }}
                  className="btn-ghost text-xs text-amber-600"
                >
                  关闭摘要
                </button>
                <button
                  onClick={async () => {
                    await onClearSummary();
                    setSummaryDraft("");
                    setGeneratedPreview(false);
                    setShowSummaryEditor(false);
                  }}
                  className="btn-ghost text-xs text-rose-500"
                >
                  清空摘要
                </button>
              </div>
            </div>
          ) : (
            <div className="pb-1">
              {summaryEnabled && sessionSummaryText ? (
                <>
                  <p className="mb-1 text-xs text-emerald-600">摘要已启用，将从下一条消息开始注入。</p>
                  <p className="mb-1 line-clamp-3 text-xs text-ink-400">{sessionSummaryText}</p>
                </>
              ) : (
                <p className="mb-1 text-xs text-ink-300">
                  暂无会话摘要。点击 AI 生成摘要，会根据当前聊天记录生成一段可编辑摘要；保存后将从下一轮开始注入上下文。
                </p>
              )}
              <button
                onClick={() => {
                  setSummaryDraft(sessionSummaryText || "");
                  setGeneratedPreview(false);
                  setShowSummaryEditor(true);
                }}
                className="btn-ghost flex items-center gap-1 text-xs text-brand-500"
              >
                <Plus className="h-3 w-3" />
                AI 生成摘要
              </button>
            </div>
          )}
        </Collapse>

        <Collapse title="Debug" icon={<Cpu className="h-3.5 w-3.5 text-ink-400" />} badge={lastContextOutput ? `${injectedHits.length} 命中` : "预览"}>
          <div className="space-y-2 pb-1 text-xs text-ink-400">
            {contextRunSaveStatus !== null && (
              <div>
                <p className="font-medium text-ink-500">Context Run 持久化</p>
                <p className={contextRunSaveStatus === "saved" ? "text-emerald-500" : contextRunSaveStatus === "failed" ? "text-rose-500" : "text-ink-300"}>
                  {contextRunSaveStatus === "saved" ? "已保存" : contextRunSaveStatus === "failed" ? "保存失败" : "保存中..."}
                </p>
              </div>
            )}
            <div>
              <p className="font-medium text-ink-500">已添加的世界书</p>
              <p>{worldbookIds.length ? worldbookIds.map((id) => wbNames.get(id) || id.slice(0, 8)).join("、") : "无"}</p>
            </div>
            <div>
              <p className="font-medium text-ink-500">本轮命中的条目</p>
              {injectedHits.length ? injectedHits.map((hit) => <p key={hit.entry.id}>{hit.entry.title} · 关键词：{hit.matchedKeywords.join("、") || "无"}</p>) : <p>无</p>}
            </div>
            {skippedEntries.length > 0 && (
              <details>
                <summary className="cursor-pointer text-ink-500">未注入条目 ({skippedEntries.length})</summary>
                <div className="mt-1 space-y-0.5">
                  {skippedEntries.slice(0, 12).map((item) => (
                    <p key={item.entry.id}>{item.entry.title} · {item.reason}</p>
                  ))}
                </div>
              </details>
            )}
          </div>
        </Collapse>

        <Collapse title="Token 预算" icon={<Zap className="h-3.5 w-3.5 text-ink-400" />} badge={lastContextOutput ? `${lastContextOutput.estimatedTokens}/${lastContextOutput.budget.budgetLimit}` : "预览"}>
          {lastContextOutput ? (
            <div className="space-y-0.5 pb-1 text-xs text-ink-400">
              <div className="flex justify-between"><span>角色 + 模板</span><span>{estimateTokens(lastContextOutput.budget.characterPrompt + lastContextOutput.budget.templatePrompt)}</span></div>
              <div className="flex justify-between"><span>世界书 ({lastContextOutput.budget.worldbookEntries.length})</span><span>{lastContextOutput.budget.worldbookEntries.reduce((sum, entry) => sum + entry.tokens, 0)}</span></div>
              <div className="flex justify-between"><span>记忆 ({lastContextOutput.budget.memories.length})</span><span>{lastContextOutput.budget.memories.reduce((sum, memory) => sum + memory.tokens, 0)}</span></div>
              <div className="flex justify-between"><span>摘要</span><span>{estimateTokens(lastContextOutput.budget.summary)}</span></div>
              <div className="mt-1 flex justify-between border-t border-surface-100 pt-1 font-medium text-ink-500"><span>总计</span><span>{lastContextOutput.estimatedTokens} / {lastContextOutput.budget.budgetLimit}</span></div>
            </div>
          ) : (
            <p className="pb-1 text-xs text-ink-300">{contextPreviewError ? "上下文预览失败，可继续聊天" : "上下文预览构建中。"}</p>
          )}
        </Collapse>

        <Collapse title="最终 System Prompt" icon={<Eye className="h-3.5 w-3.5 text-brand-400" />} badge={estimateTokens(finalPrompt).toString()} defaultOpen>
          <p className="mb-1 text-xs text-ink-300">
            {messageCount === 0 ? "预览构建结果，下一条消息将使用这份 system prompt。" : "最近一次上下文构建结果。"}
          </p>
          <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-card bg-surface-50 p-2 text-xs leading-relaxed text-ink-400">
            {contextPreviewError && !finalPrompt ? "上下文预览失败，可继续聊天" : finalPrompt || "上下文加载中..."}
          </pre>
        </Collapse>
      </div>

      {showTplPicker && (
        <PickerModal title="选择提示词模板" onClose={() => setShowTplPicker(false)}>
          {pickerTpls.length === 0 ? (
            <p className="py-4 text-center text-xs text-ink-300">暂无模板</p>
          ) : (
            pickerTpls.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  void onAddTemplate(template.id);
                  setShowTplPicker(false);
                }}
                className="mb-1.5 w-full rounded-card border border-surface-100 px-3 py-2 text-left transition-colors hover:border-brand-200"
              >
                <p className="truncate text-sm font-medium text-ink-700">{template.title}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-ink-300">{template.content.slice(0, 60)}</p>
              </button>
            ))
          )}
        </PickerModal>
      )}

      {showWbPicker && (
        <PickerModal title="选择世界书（可多选）" onClose={() => setShowWbPicker(false)}>
          {pickerWbs.length === 0 ? (
            <p className="py-4 text-center text-xs text-ink-300">暂无世界书</p>
          ) : (
            pickerWbs.map((worldbook) => {
              const selected = selectedWbIds.has(worldbook.id);
              return (
                <button
                  key={worldbook.id}
                  onClick={() => {
                    const next = new Set(selectedWbIds);
                    if (selected) next.delete(worldbook.id);
                    else next.add(worldbook.id);
                    setSelectedWbIds(next);
                  }}
                  className={`mb-1.5 w-full rounded-card border px-3 py-2 text-left transition-colors ${selected ? "border-brand-300 bg-brand-50" : "border-surface-100 hover:border-brand-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink-700">{worldbook.name}</p>
                    <span className={`text-xs ${selected ? "font-medium text-brand-500" : "text-ink-300"}`}>{selected ? "已选" : "点击选择"}</span>
                  </div>
                  {worldbook.description && <p className="mt-0.5 text-xs text-ink-300">{worldbook.description}</p>}
                </button>
              );
            })
          )}
          <button
            onClick={() => {
              void onAddWorldbooks([...selectedWbIds]);
              setShowWbPicker(false);
            }}
            disabled={selectedWbIds.size === 0}
            className="btn-primary mt-2 w-full text-sm disabled:opacity-50"
          >
            添加所选世界书 ({selectedWbIds.size})
          </button>
        </PickerModal>
      )}

      {showMemPicker && (
        <PickerModal title="选择记忆（可多选）" onClose={() => setShowMemPicker(false)}>
          {pickerMems.length === 0 ? (
            <p className="py-4 text-center text-xs text-ink-300">暂无 active 记忆</p>
          ) : (
            pickerMems.map((memory) => {
              const selected = selectedMemIds.has(memory.id);
              return (
                <button
                  key={memory.id}
                  onClick={() => {
                    const next = new Set(selectedMemIds);
                    if (selected) next.delete(memory.id);
                    else next.add(memory.id);
                    setSelectedMemIds(next);
                  }}
                  className={`mb-1.5 w-full rounded-card border px-3 py-2 text-left transition-colors ${selected ? "border-brand-300 bg-brand-50" : "border-surface-100 hover:border-brand-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium text-ink-700">{memory.title || "未命名记忆"}</p>
                    <span className={`text-xs ${selected ? "font-medium text-brand-500" : "text-ink-300"}`}>{selected ? "已选" : "点击选择"}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-300">{memory.content.slice(0, 60)}</p>
                </button>
              );
            })
          )}
          <button
            onClick={() => {
              void onAddMemories([...selectedMemIds]);
              setShowMemPicker(false);
            }}
            disabled={selectedMemIds.size === 0}
            className="btn-primary mt-2 w-full text-sm disabled:opacity-50"
          >
            添加所选记忆 ({selectedMemIds.size})
          </button>
        </PickerModal>
      )}
    </div>
  );
}

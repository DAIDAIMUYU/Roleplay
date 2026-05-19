import { useCallback, useEffect, useState } from "react";
import { BookOpen, Brain, ChevronDown, ChevronRight, Cpu, Eye, FileText, ListTree, Plus, RefreshCw, ToggleLeft, ToggleRight, Trash2, Wifi, WifiOff, X, Zap } from "lucide-react";
import type { CharacterRow, MemoryRow, PromptTemplateRow, WorldbookRow } from "../../types/database";
import { parseCharacterCard } from "../../utils/characterPrompt";
import type { ContextBuildOutput } from "../../context/contextBuilder";
import { estimateTokens } from "../../context/tokenBudget";
import { supabase } from "../../../auth/supabaseClient";
import * as Repo from "../../repositories/roleplayRepository";

interface ContextPreviewProps {
  sessionTitle: string;
  messageCount: number;
  isDemo: boolean;
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
  onSaveSummaryText: (text: string) => Promise<void>;
  onClearSummary: () => Promise<void>;
  onGenerateSummary: () => Promise<string | null>;
}

function Collapse({ title, icon, badge, defaultOpen, children }: { title: string; icon: React.ReactNode; badge?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border-b border-surface-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-surface-50">
        {open ? <ChevronDown className="h-3 w-3 text-ink-300" /> : <ChevronRight className="h-3 w-3 text-ink-300" />}
        <span className="text-ink-300">{icon}</span>
        <span className="flex-1 text-left text-ink-600 font-medium">{title}</span>
        {badge && <span className="text-xs bg-surface-100 rounded-full px-1.5 py-0.5 text-ink-400">{badge}</span>}
      </button>
      {open && <div className="px-3 pb-2">{children}</div>}
    </div>
  );
}

function PickerModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm mx-4 p-5 max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-100 rounded-full"><X className="h-4 w-4 text-ink-400" /></button>
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
    onSaveSummaryText,
    onClearSummary,
    onGenerateSummary,
  } = props;

  const card = activeCharacter ? parseCharacterCard(activeCharacter) : null;
  const finalPrompt = lastContextOutput?.systemPrompt || systemPrompt || "";
  const injectedHits = lastContextOutput?.triggerResult.triggered.filter((hit) => hit.injected) ?? [];
  const skipped = lastContextOutput?.triggerResult.skipped ?? [];

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
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setSummaryDraft(sessionSummaryText || "");
  }, [sessionSummaryText]);

  const loadPickers = useCallback(async () => {
    if (!supabase || !activeCharacter?.user_id) return;
    const [templates, worldbooks, memories] = await Promise.all([
      Repo.listPromptTemplates(supabase, activeCharacter.user_id),
      Repo.listWorldbooks(supabase, activeCharacter.user_id),
      Repo.listMemories(supabase, activeCharacter.user_id),
    ]);
    setPickerTpls(templates);
    setPickerWbs(worldbooks);
    setPickerMems(memories.filter((memory) => memory.status === "active"));
  }, [activeCharacter?.user_id]);

  useEffect(() => {
    if (!supabase || worldbookIds.length === 0) {
      setWbNames(new Map());
      return;
    }
    Promise.all(worldbookIds.map((id) => Repo.getWorldbook(supabase!, id).catch(() => null))).then((rows) => {
      const names = new Map<string, string>();
      rows.forEach((row) => {
        if (row) names.set(row.id, row.name);
      });
      setWbNames(names);
    });
  }, [worldbookIds]);

  useEffect(() => {
    if (!supabase || !activeCharacter?.user_id || memoryIds.length === 0) {
      setMemInfos(new Map());
      return;
    }
    Repo.listMemories(supabase, activeCharacter.user_id).then((rows) => {
      const infos = new Map<string, MemoryRow>();
      rows.forEach((row) => {
        if (memoryIds.includes(row.id)) infos.set(row.id, row);
      });
      setMemInfos(infos);
    }).catch(() => {});
  }, [activeCharacter?.user_id, memoryIds]);

  const statusRows = [
    { label: "会话", value: sessionTitle || "未选择", icon: <Cpu className="h-4 w-4" /> },
    { label: "分支", value: activeBranchName || "主线", icon: <ListTree className="h-4 w-4" /> },
    { label: "Provider", value: providerLabel, icon: <Cpu className="h-4 w-4" /> },
    { label: "模型", value: modelLabel, icon: <Zap className="h-4 w-4" /> },
    { label: "运行", value: runtimeMode, icon: <Cpu className="h-4 w-4" /> },
    { label: "API", value: isDemo ? "Mock" : apiConfigured ? "BYOK" : "未配置", icon: apiConfigured ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-surface-100">
        <h3 className="text-xs font-semibold text-ink-300 uppercase tracking-wide">上下文控制台</h3>
        {contextPreviewError ? (
          <p className="text-xs text-amber-600 mt-0.5">上下文预览失败，可继续聊天</p>
        ) : lastContextOutput?.debugInfo ? (
          <p className="text-xs text-ink-300 mt-0.5">构建 {lastContextOutput.debugInfo.buildTimeMs}ms · 估算 {lastContextOutput.estimatedTokens} / {lastContextOutput.budget.budgetLimit} tok</p>
        ) : (
          <p className="text-xs text-ink-300 mt-0.5">上下文预览异步构建中</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 space-y-1">
          {statusRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1.5 px-2 rounded-card hover:bg-surface-50">
              <div className="flex items-center gap-2 min-w-0"><span className="text-ink-300">{row.icon}</span><span className="text-xs text-ink-500 truncate">{row.label}</span></div>
              <span className="text-xs font-mono text-ink-300 flex-shrink-0 ml-2 truncate max-w-[110px] text-right">{row.value}</span>
            </div>
          ))}
        </div>

        {activeCharacter && (
          <Collapse title={`角色: ${activeCharacter.name}${activeCharacter.deleted_at ? "（已删除角色）" : ""}`} icon={<Cpu className="h-3.5 w-3.5 text-brand-400" />} defaultOpen>
            <div className="text-xs text-ink-400 space-y-0.5 pb-1">
              {card?.identity && <p>身份：{card.identity}</p>}
              {card?.personality && <p className="line-clamp-2">性格：{card.personality}</p>}
              {card?.relationship && <p>关系：{card.relationship}{card.relationship_stage ? ` · ${card.relationship_stage}` : ""}</p>}
            </div>
          </Collapse>
        )}

        <Collapse title="提示词模板" icon={<FileText className="h-3.5 w-3.5 text-emerald-400" />} badge={activeTemplate ? activeTemplate.title : "未添加"}>
          {activeTemplate ? (
            <div className="pb-1">
              <p className="text-xs text-ink-400 line-clamp-2 mb-1">{activeTemplate.content.slice(0, 120)}</p>
              <button onClick={onRemoveTemplate} className="btn-ghost text-xs text-rose-500 flex items-center gap-1"><Trash2 className="h-3 w-3" />移除模板</button>
            </div>
          ) : <p className="text-xs text-ink-300 pb-1">未添加模板，当前仅使用角色基础设定。</p>}
          <button onClick={() => { loadPickers(); setShowTplPicker(true); }} className="btn-ghost text-xs text-brand-500 flex items-center gap-1 pb-1"><Plus className="h-3 w-3" />添加模板</button>
        </Collapse>

        <Collapse title="世界书" icon={<BookOpen className="h-3.5 w-3.5 text-sky-400" />} badge={`${worldbookIds.length}个`}>
          {worldbookIds.length === 0 ? <p className="text-xs text-ink-300 pb-1">未添加世界书。</p> : (
            <div className="space-y-1 pb-1">
              {worldbookIds.map((id) => {
                const disabled = disabledWbIds.includes(id);
                const hits = injectedHits.filter((hit) => hit.entry.worldbook_id === id);
                return (
                  <div key={id} className={`rounded-card p-1.5 ${disabled ? "bg-surface-50 opacity-50" : hits.length ? "bg-sky-light/30" : "bg-surface-50"}`}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onToggleWorldbook(id)} className="flex-shrink-0">{disabled ? <ToggleLeft className="h-4 w-4 text-ink-300" /> : <ToggleRight className="h-4 w-4 text-sky-500" />}</button>
                      <span className="text-xs text-ink-600 flex-1 truncate">{wbNames.get(id) || id.slice(0, 8)}</span>
                      {hits.length > 0 && <span className="text-xs text-sky-500">命中</span>}
                      <button onClick={() => onRemoveWorldbook(id)} className="p-0.5 text-ink-300 hover:text-rose-500"><X className="h-3 w-3" /></button>
                    </div>
                    {hits.map((hit) => (
                      <p key={hit.entry.id} className="text-xs text-sky-700 mt-1 pl-6">{hit.entry.title} · {hit.matchedKeywords.join("、") || "已注入"}</p>
                    ))}
                  </div>
                );
              })}
              {lastContextOutput && injectedHits.length === 0 && <p className="text-xs text-ink-300">本轮暂无命中条目。</p>}
            </div>
          )}
          <button onClick={() => { loadPickers(); setSelectedWbIds(new Set()); setShowWbPicker(true); }} className="btn-ghost text-xs text-brand-500 flex items-center gap-1 pb-1"><Plus className="h-3 w-3" />添加世界书</button>
        </Collapse>

        <Collapse title="记忆" icon={<Brain className="h-3.5 w-3.5 text-amber-400" />} badge={`${memoryIds.length}条`}>
          {memoryIds.length === 0 ? <p className="text-xs text-ink-300 pb-1">未添加记忆。</p> : (
            <div className="space-y-1 pb-1">
              {memoryIds.map((id) => {
                const info = memInfos.get(id);
                const disabled = disabledMemIds.includes(id);
                const injected = lastContextOutput?.budget.memories.some((memory) => memory.id === id);
                return (
                  <div key={id} className={`flex items-center gap-2 rounded-card p-1.5 ${disabled ? "opacity-50" : injected ? "bg-amber-light/30" : "bg-surface-50"}`}>
                    <button onClick={() => onToggleMemory(id)} className="flex-shrink-0">{disabled ? <ToggleLeft className="h-4 w-4 text-ink-300" /> : <ToggleRight className="h-4 w-4 text-amber-500" />}</button>
                    <span className="text-xs text-ink-600 flex-1 truncate">{info?.title || id.slice(0, 8)}</span>
                    {injected && <span className="text-xs text-amber-500">注入</span>}
                    <button onClick={() => onRemoveMemory(id)} className="p-0.5 text-ink-300 hover:text-rose-500"><X className="h-3 w-3" /></button>
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={() => { loadPickers(); setSelectedMemIds(new Set()); setShowMemPicker(true); }} className="btn-ghost text-xs text-brand-500 flex items-center gap-1 pb-1"><Plus className="h-3 w-3" />添加记忆</button>
        </Collapse>

        <Collapse title="会话摘要" icon={<ListTree className="h-3.5 w-3.5 text-ink-400" />} badge={summaryEnabled ? "已启用" : "未启用"}>
          {showSummaryEditor ? (
            <div className="pb-2">
              <p className="text-xs text-ink-300 mb-2">{generatedPreview ? "AI 生成摘要预览，可编辑。点击保存后启用。" : "可以手动编辑摘要，也可以点击 AI 生成摘要。"}</p>
              <textarea value={summaryDraft} onChange={(event) => setSummaryDraft(event.target.value)} placeholder="摘要内容..." rows={4} className="w-full rounded-input border border-surface-200 bg-surface-50 py-1.5 px-3 text-xs resize-y mb-2" />
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={async () => {
                  if (!apiConfigured) {
                    alert("未配置 API Key，无法生成摘要。");
                    return;
                  }
                  setGenerating(true);
                  const result = await onGenerateSummary();
                  setGenerating(false);
                  if (result) {
                    setSummaryDraft(result);
                    setGeneratedPreview(true);
                  }
                }} disabled={generating} className="btn-ghost text-xs text-brand-500 flex items-center gap-1">
                  <RefreshCw className={`h-3 w-3 ${generating ? "animate-spin" : ""}`} />{generating ? "生成中..." : "AI 生成摘要"}
                </button>
                <button onClick={async () => { await onSaveSummaryText(summaryDraft); setGeneratedPreview(false); setShowSummaryEditor(false); }} className="btn-primary text-xs py-1 px-2">保存并启用</button>
                <button onClick={async () => { await onSaveSummaryText(""); setSummaryDraft(""); setGeneratedPreview(false); setShowSummaryEditor(false); }} className="btn-ghost text-xs text-amber-600">关闭摘要</button>
                <button onClick={async () => { await onClearSummary(); setSummaryDraft(""); setGeneratedPreview(false); setShowSummaryEditor(false); }} className="btn-ghost text-xs text-rose-500">清空摘要</button>
              </div>
            </div>
          ) : (
            <div className="pb-1">
              {summaryEnabled && sessionSummaryText ? (
                <>
                  <p className="text-xs text-emerald-600 mb-1">摘要已启用，将从下一条消息开始注入。</p>
                  <p className="text-xs text-ink-400 line-clamp-3 mb-1">{sessionSummaryText}</p>
                </>
              ) : (
                <p className="text-xs text-ink-300 mb-1">暂无会话摘要。点击 AI 生成摘要，会根据当前聊天记录生成一段可编辑摘要；保存后将从下一轮开始注入上下文。</p>
              )}
              <button onClick={() => { setSummaryDraft(sessionSummaryText || ""); setGeneratedPreview(false); setShowSummaryEditor(true); }} className="btn-ghost text-xs text-brand-500 flex items-center gap-1"><Plus className="h-3 w-3" />AI 生成摘要</button>
            </div>
          )}
        </Collapse>

        <Collapse title="Debug" icon={<Cpu className="h-3.5 w-3.5 text-ink-400" />} badge={lastContextOutput ? `${injectedHits.length}命中` : "预览"}>
          <div className="text-xs text-ink-400 space-y-2 pb-1">
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
            {skipped.length > 0 && (
              <details>
                <summary className="cursor-pointer text-ink-500">未注入条目 ({skipped.length})</summary>
                <div className="mt-1 space-y-0.5">{skipped.slice(0, 12).map((item) => <p key={item.entry.id}>{item.entry.title} · {item.reason}</p>)}</div>
              </details>
            )}
          </div>
        </Collapse>

        <Collapse title="Token 预算" icon={<Zap className="h-3.5 w-3.5 text-ink-400" />} badge={lastContextOutput ? `${lastContextOutput.estimatedTokens}/${lastContextOutput.budget.budgetLimit}` : "预览"}>
          {lastContextOutput ? (
            <div className="text-xs text-ink-400 space-y-0.5 pb-1">
              <div className="flex justify-between"><span>角色+模板</span><span>{estimateTokens(lastContextOutput.budget.characterPrompt + lastContextOutput.budget.templatePrompt)} (限2000)</span></div>
              <div className="flex justify-between"><span>世界书 ({lastContextOutput.budget.worldbookEntries.length}条)</span><span>{lastContextOutput.budget.worldbookEntries.reduce((sum, entry) => sum + entry.tokens, 0)} (限2000)</span></div>
              <div className="flex justify-between"><span>记忆 ({lastContextOutput.budget.memories.length}条)</span><span>{lastContextOutput.budget.memories.reduce((sum, memory) => sum + memory.tokens, 0)} (限1500)</span></div>
              <div className="flex justify-between"><span>摘要</span><span>{estimateTokens(lastContextOutput.budget.summary)} (限800)</span></div>
              <div className="flex justify-between font-medium text-ink-500 pt-1 border-t border-surface-100 mt-1"><span>总计</span><span>{lastContextOutput.estimatedTokens} / {lastContextOutput.budget.budgetLimit}</span></div>
            </div>
          ) : <p className="text-xs text-ink-300 pb-1">{contextPreviewError ? "上下文预览失败，可继续聊天" : "上下文预览构建中。"}</p>}
        </Collapse>

        <Collapse title="最终 System Prompt" icon={<Eye className="h-3.5 w-3.5 text-brand-400" />} badge={estimateTokens(finalPrompt).toString()} defaultOpen>
          <p className="text-xs text-ink-300 mb-1">{messageCount === 0 ? "预览构建结果，下一条消息将使用此 system prompt。" : "最近一次构建结果。"}</p>
          <pre className="text-xs text-ink-400 bg-surface-50 rounded-card p-2 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed pb-1">{contextPreviewError && !finalPrompt ? "上下文预览失败，可继续聊天" : finalPrompt || "上下文加载中..."}</pre>
        </Collapse>
      </div>

      {showTplPicker && <PickerModal title="选择提示词模板" onClose={() => setShowTplPicker(false)}>
        {pickerTpls.length === 0 ? <p className="text-xs text-ink-300 text-center py-4">暂无模板</p> : pickerTpls.map((template) => (
          <button key={template.id} onClick={() => { onAddTemplate(template.id); setShowTplPicker(false); }} className="w-full text-left px-3 py-2 rounded-card border border-surface-100 hover:border-brand-200 transition-colors mb-1.5">
            <p className="text-sm font-medium text-ink-700 truncate">{template.title}</p>
            <p className="text-xs text-ink-300 mt-0.5 line-clamp-1">{template.content.slice(0, 60)}</p>
          </button>
        ))}
      </PickerModal>}

      {showWbPicker && <PickerModal title="选择世界书（可多选）" onClose={() => setShowWbPicker(false)}>
        {pickerWbs.length === 0 ? <p className="text-xs text-ink-300 text-center py-4">暂无世界书</p> : pickerWbs.map((worldbook) => {
          const selected = selectedWbIds.has(worldbook.id);
          return (
            <button key={worldbook.id} onClick={() => { const next = new Set(selectedWbIds); if (selected) next.delete(worldbook.id); else next.add(worldbook.id); setSelectedWbIds(next); }} className={`w-full text-left px-3 py-2 rounded-card border mb-1.5 transition-colors ${selected ? "border-brand-300 bg-brand-50" : "border-surface-100 hover:border-brand-200"}`}>
              <div className="flex items-center justify-between"><p className="text-sm font-medium text-ink-700">{worldbook.name}</p><span className={`text-xs ${selected ? "text-brand-500 font-medium" : "text-ink-300"}`}>{selected ? "已选" : "点击选择"}</span></div>
              {worldbook.description && <p className="text-xs text-ink-300 mt-0.5">{worldbook.description}</p>}
            </button>
          );
        })}
        <button onClick={() => { onAddWorldbooks([...selectedWbIds]); setShowWbPicker(false); }} disabled={selectedWbIds.size === 0} className="btn-primary w-full text-sm mt-2 disabled:opacity-50">添加所选世界书 ({selectedWbIds.size})</button>
      </PickerModal>}

      {showMemPicker && <PickerModal title="选择记忆（可多选）" onClose={() => setShowMemPicker(false)}>
        {pickerMems.length === 0 ? <p className="text-xs text-ink-300 text-center py-4">暂无活跃记忆</p> : pickerMems.map((memory) => {
          const selected = selectedMemIds.has(memory.id);
          return (
            <button key={memory.id} onClick={() => { const next = new Set(selectedMemIds); if (selected) next.delete(memory.id); else next.add(memory.id); setSelectedMemIds(next); }} className={`w-full text-left px-3 py-2 rounded-card border mb-1.5 transition-colors ${selected ? "border-brand-300 bg-brand-50" : "border-surface-100 hover:border-brand-200"}`}>
              <div className="flex items-center justify-between"><p className="text-sm font-medium text-ink-700 truncate">{memory.title || "未命名记忆"}</p><span className={`text-xs ${selected ? "text-brand-500 font-medium" : "text-ink-300"}`}>{selected ? "已选" : "点击选择"}</span></div>
              <p className="text-xs text-ink-300 mt-0.5 line-clamp-1">{memory.content.slice(0, 60)}</p>
            </button>
          );
        })}
        <button onClick={() => { onAddMemories([...selectedMemIds]); setShowMemPicker(false); }} disabled={selectedMemIds.size === 0} className="btn-primary w-full text-sm mt-2 disabled:opacity-50">添加所选记忆 ({selectedMemIds.size})</button>
      </PickerModal>}
    </div>
  );
}

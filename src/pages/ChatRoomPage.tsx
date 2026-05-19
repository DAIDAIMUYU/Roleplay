import { useState, useEffect, useRef, useCallback } from "react";
import { Drama, MessageCircle, AlertTriangle, ChevronDown, WifiOff, RefreshCw, Settings, X, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth";
import { useIsMobile } from "../shared/hooks/useMediaQuery";
import { ModeBadge } from "../shared/components/ModeBadge";
import { EmptyState } from "../shared/components/EmptyState";
import { useChatSession } from "../features/roleplay/hooks/useChatSession";
import { MessageBubble } from "../features/roleplay/components/chat/MessageBubble";
import { ChatInput } from "../features/roleplay/components/chat/ChatInput";
import { SessionList } from "../features/roleplay/components/chat/SessionList";
import { ContextPreview } from "../features/roleplay/components/chat/ContextPreview";
import { supabase } from "../features/auth/supabaseClient";
import * as Repo from "../features/roleplay/repositories/roleplayRepository";
import type { CharacterRow } from "../features/roleplay/types/database";
import type { ChatMessage } from "../features/roleplay/providers/provider.types";
import type { ProviderType, ApiKeyStorageMode } from "../features/roleplay/providers";
import { loadApiKey } from "../features/roleplay/storage/apiKeyStorage";
import { getDefaultHostedCredential, loadHostedCredentialSelection, saveHostedCredentialSelection, selectionFromCredential } from "../features/roleplay/services/hostedCredentialsService";

function detectProviderConfig(): { provider: ProviderType; model: string; storageMode: ApiKeyStorageMode; credentialId?: string | null; baseURL?: string } {
  const local = loadApiKey("deepseek", "local_device"); if (local) return { provider: "deepseek", model: local.model, storageMode: "local_device" };
  const session = loadApiKey("deepseek", "session_only"); if (session) return { provider: "deepseek", model: session.model, storageMode: "session_only" };
  const oaiLocal = loadApiKey("openai_compatible", "local_device"); if (oaiLocal) return { provider: "openai_compatible", model: oaiLocal.model, storageMode: "local_device" };
  const oaiSession = loadApiKey("openai_compatible", "session_only"); if (oaiSession) return { provider: "openai_compatible", model: oaiSession.model, storageMode: "session_only" };
  const hosted = loadHostedCredentialSelection();
  if (hosted) {
    return {
      provider: hosted.provider,
      model: hosted.model,
      storageMode: "hosted_encrypted",
      credentialId: hosted.credentialId,
      baseURL: hosted.baseURL,
    };
  }
  return { provider: "deepseek", model: "deepseek-chat", storageMode: "session_only" };
}

export function ChatRoomPage() {
  const isMobile = useIsMobile();
  const { isGuestOrDemo, user } = useAuth();
  const userId = user?.id;
  const [providerConfig, setProviderConfig] = useState(detectProviderConfig);

  useEffect(() => {
    setProviderConfig(detectProviderConfig());
  }, [userId]);

  useEffect(() => {
    if (isGuestOrDemo || !userId) return;
    if (providerConfig.storageMode === "hosted_encrypted" && providerConfig.credentialId) return;
    if (
      loadApiKey("deepseek", "local_device") ||
      loadApiKey("deepseek", "session_only") ||
      loadApiKey("openai_compatible", "local_device") ||
      loadApiKey("openai_compatible", "session_only")
    ) {
      return;
    }
    let cancelled = false;
    void getDefaultHostedCredential()
      .then((credential) => {
        if (!credential || cancelled) return;
        const selection = selectionFromCredential(credential);
        saveHostedCredentialSelection(selection);
        setProviderConfig({
          provider: selection.provider,
          model: selection.model,
          storageMode: "hosted_encrypted",
          credentialId: selection.credentialId,
          baseURL: selection.baseURL,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isGuestOrDemo, providerConfig.credentialId, providerConfig.storageMode, userId]);

  const chat = useChatSession(
    isGuestOrDemo,
    userId,
    providerConfig.provider,
    providerConfig.model,
    providerConfig.storageMode,
    providerConfig.credentialId,
    providerConfig.baseURL,
  );

  const [inputValue, setInputValue] = useState("");
  const [showMobileSessions, setShowMobileSessions] = useState(false);
  const [showMobileContext, setShowMobileContext] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null); const [editText, setEditText] = useState("");

  // Simplified picker: character only
  const [showPicker, setShowPicker] = useState(false);
  const [pickerChars, setPickerChars] = useState<CharacterRow[]>([]);

  const loadPickerChars = useCallback(async () => { if (!supabase || !userId) return; const chars = await Repo.listActiveCharacters(supabase, userId); setPickerChars(chars); }, [userId]);

  function handleCreateSession() { if (isGuestOrDemo || !supabase) { chat.createSession(); return; } loadPickerChars(); setShowPicker(true); }

  const messagesEndRef = useRef<HTMLDivElement>(null); const messagesContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chat.messages]);
  const [userScrolledUp, setUserScrolledUp] = useState(false); const container = messagesContainerRef.current;
  useEffect(() => { if (!container) return; const h = () => { setUserScrolledUp(container.scrollHeight - container.scrollTop - container.clientHeight >= 80); }; container.addEventListener("scroll", h, { passive: true }); return () => container.removeEventListener("scroll", h); }, [container]);
  function scrollToBottom() { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); setUserScrolledUp(false); }
  const hasActiveSession = !!chat.activeSessionId;
  function handleSend() { if (!inputValue.trim() || !hasActiveSession || chat.isStreaming) return; chat.sendMessage(inputValue.trim()); setInputValue(""); }

  const contextProps = {
    sessionTitle: chat.sessions.find((s) => s.id === chat.activeSessionId)?.title || "",
    messageCount: chat.messageCount, isDemo: chat.isDemo, providerLabel: chat.providerLabel, modelLabel: chat.modelLabel, apiConfigured: chat.apiConfigured, runtimeMode: chat.runtimeMode,
    activeCharacter: chat.activeCharacter, activeTemplate: chat.activeTemplate, systemPrompt: chat.systemPrompt, lastContextOutput: chat.lastContextOutput,
    contextPreviewError: chat.contextPreviewError,
    sessionSummaryText: chat.summaryText, worldbookIds: chat.worldbookIds, memoryIds: chat.memoryIds, disabledWbIds: chat.disabledWbIds, disabledMemIds: chat.disabledMemIds, summaryEnabled: chat.summaryEnabled,
    onAddTemplate: chat.addTemplate, onRemoveTemplate: chat.removeTemplate,
    onAddWorldbooks: chat.addWorldbooks, onRemoveWorldbook: chat.removeWorldbook, onToggleWorldbook: chat.toggleWorldbook,
    onAddMemories: chat.addMemories, onRemoveMemory: chat.removeMemory, onToggleMemory: chat.toggleMemory,
    onSaveSummaryText: chat.saveSummary, onClearSummary: chat.clearSummary, onGenerateSummary: chat.generateSummary,
    activeBranchName: chat.activeBranchName,
    contextRunSaveStatus: chat.contextRunSaveStatus,
  };

  function renderMessageBubble(msg: ChatMessage, i: number) {
    const dbId = chat.messageDbIds.get(i);
    const revisions = dbId ? chat.messageRevisions.get(dbId) : undefined;
    const revisionCount = dbId ? (chat.messageRevisionCounts.get(dbId) ?? 0) : 0;
    return (
      <MessageBubble
        key={i}
        message={msg}
        index={i}
        isStreaming={chat.isStreaming && i === chat.messages.length - 1 && msg.role === "assistant"}
        onCopy={() => chat.copyMessage(i)}
        onDelete={() => chat.deleteMessage(i)}
        onRegenerate={msg.role === "assistant" && i === chat.messages.length - 1 && !chat.isStreaming ? chat.regenerateLast : undefined}
        onEdit={msg.role === "user" ? () => { setEditingIndex(i); setEditText(msg.content); } : undefined}
        revisionCount={revisionCount}
        revisions={revisions}
        onLoadRevisions={() => chat.loadMessageRevisions(i)}
      />
    );
  }

  // Mobile
  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh bg-surface-50">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-b border-surface-100">
          <button onClick={() => setShowMobileSessions(!showMobileSessions)} className="btn-ghost p-1.5 text-xs"><Drama className="h-4 w-4" /></button>
          <div className="flex-1 min-w-0"><p className="text-sm font-medium text-ink-900 truncate">{chat.sessions.find((s) => s.id === chat.activeSessionId)?.title || "聊天房间"}</p></div>
          <ModeBadge /><button onClick={() => setShowMobileContext(!showMobileContext)} className="btn-ghost p-1.5 text-xs"><ChevronDown className="h-4 w-4" /></button>
        </div>
        {showMobileSessions && (<div className="absolute top-0 left-0 w-72 h-dvh bg-white z-30 shadow-modal overflow-y-auto"><div className="flex items-center justify-between p-3 border-b"><span className="text-sm font-medium">会话</span><button onClick={() => setShowMobileSessions(false)} className="btn-ghost p-1 text-xs">关闭</button></div><SessionList sessions={chat.sessions} activeSessionId={chat.activeSessionId} onSelect={(id) => { chat.selectSession(id); setShowMobileSessions(false); }} onCreate={() => { handleCreateSession(); setShowMobileSessions(false); }} onDelete={chat.deleteSession} loading={false} /></div>)}
        {showMobileContext && (<div className="absolute top-0 right-0 w-80 h-dvh bg-white z-30 shadow-modal overflow-y-auto"><div className="flex items-center justify-between p-3 border-b"><span className="text-sm font-medium">上下文</span><button onClick={() => setShowMobileContext(false)} className="btn-ghost p-1 text-xs">关闭</button></div><ContextPreview {...contextProps} /></div>)}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-4">
          {chat.messages.length === 0 ? <EmptyState icon={<MessageCircle className="h-10 w-10" />} title={hasActiveSession ? "开始聊天" : "开始聊天，请先创建会话"} description={!hasActiveSession ? "点击 + 创建" : chat.isDemo ? "Demo · Mock AI" : chat.apiConfigured ? "输入消息" : "请先配置 API Key"} /> : chat.messages.map((msg, i) => renderMessageBubble(msg, i))}
          <div ref={messagesEndRef} />
          {userScrolledUp && <button onClick={scrollToBottom} className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-brand-500 text-white rounded-full px-4 py-1.5 text-xs shadow-elevated z-10 animate-bounce">↓ 新消息</button>}
        </div>
        {chat.error && (<div className="px-3 py-2 bg-rose-light/80 border-t border-rose-200 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" /><p className="text-xs text-rose-700 flex-1 truncate">{chat.error}</p><button onClick={chat.retry} className="btn-ghost text-xs text-rose-600 flex items-center gap-1"><RefreshCw className="h-3 w-3" />重试</button></div>)}
        {!chat.isDemo && !chat.apiConfigured && (<div className="px-3 py-2 bg-amber-light border-t border-amber-200 flex items-center gap-2"><WifiOff className="h-4 w-4 text-amber-500 flex-shrink-0" /><p className="text-xs text-amber-700 flex-1">请先配置 API Key</p><Link to="/settings" className="btn-ghost text-xs text-amber-700"><Settings className="h-3 w-3" />设置</Link></div>)}
        {editingIndex !== null && (<div className="px-3 py-2 bg-brand-50 border-t flex items-center gap-2"><input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 rounded-input border border-brand-200 bg-white py-1.5 px-3 text-sm" onKeyDown={(e) => { if (e.key === "Enter") { chat.editAndResend(editingIndex, editText); setEditingIndex(null); } if (e.key === "Escape") setEditingIndex(null); }} /><button onClick={() => { chat.editAndResend(editingIndex, editText); setEditingIndex(null); }} className="btn-primary text-xs py-1 px-3">重发</button><button onClick={() => setEditingIndex(null)} className="btn-ghost text-xs">取消</button></div>)}
        <ChatInput value={inputValue} onChange={setInputValue} onSend={handleSend} onStop={chat.stopGeneration} isStreaming={chat.isStreaming} disabled={!hasActiveSession || (!chat.isDemo && !chat.apiConfigured)} placeholder={!hasActiveSession ? "请先创建会话" : !chat.isDemo && !chat.apiConfigured ? "请先配置 API Key..." : "输入消息..."} />
      </div>
    );
  }

  // Desktop
  return (
    <div className="flex h-full bg-surface-50">
      <div className="w-60 border-r border-surface-100 bg-white overflow-y-auto flex-shrink-0"><SessionList sessions={chat.sessions} activeSessionId={chat.activeSessionId} onSelect={chat.selectSession} onCreate={handleCreateSession} onDelete={chat.deleteSession} loading={false} /></div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-surface-100">
          <div className="h-7 w-7 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center text-sm flex-shrink-0">{chat.activeCharacter?.avatar_emoji || <Drama className="h-4 w-4" />}</div>
          <div className="flex-1 min-w-0"><h1 className="text-sm font-semibold text-ink-900 truncate">{chat.sessions.find((s) => s.id === chat.activeSessionId)?.title || "聊天房间"}</h1>{chat.activeCharacter && <p className="text-xs text-brand-500 truncate">{chat.activeCharacter.name}</p>}</div>
          <div className="flex items-center gap-2">{chat.saveStatus === "saving" && <span className="text-xs text-ink-300">保存中...</span>}{chat.saveStatus === "saved" && <span className="text-xs text-emerald-500">已保存</span>}{chat.saveStatus === "error" && <span className="text-xs text-rose-500">保存失败</span>}<ModeBadge /></div>
        </div>
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
          {chat.messages.length === 0 ? <EmptyState icon={<MessageCircle className="h-10 w-10" />} title={hasActiveSession ? "开始聊天" : "开始聊天，请先创建会话"} description={!hasActiveSession ? "点击左侧 + 创建" : chat.isDemo ? "Demo · Mock AI" : chat.apiConfigured ? "输入消息开始角色扮演" : "请先配置 API Key"} /> : chat.messages.map((msg, i) => renderMessageBubble(msg, i))}
          <div ref={messagesEndRef} />{userScrolledUp && <button onClick={scrollToBottom} className="sticky bottom-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white rounded-full px-4 py-1.5 text-xs shadow-elevated animate-bounce">↓ 新消息</button>}
        </div>
        {chat.error && (<div className="px-4 py-2 bg-rose-light/80 border-t flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-rose-500" /><p className="text-xs text-rose-700 flex-1 truncate">{chat.error}</p><button onClick={chat.retry} className="btn-ghost text-xs text-rose-600"><RefreshCw className="h-3 w-3" />重试</button></div>)}
        {!chat.isDemo && !chat.apiConfigured && (<div className="px-4 py-2 bg-amber-light border-t flex items-center gap-2"><WifiOff className="h-4 w-4 text-amber-500" /><p className="text-xs text-amber-700 flex-1">未配置 API Key</p><Link to="/settings" className="btn-ghost text-xs text-amber-700"><Settings className="h-3 w-3" />去设置</Link></div>)}
        {editingIndex !== null && (<div className="px-4 py-2 bg-brand-50 border-t flex items-center gap-2"><input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="flex-1 rounded-input border border-brand-200 bg-white py-1.5 px-3 text-sm" onKeyDown={(e) => { if (e.key === "Enter") { chat.editAndResend(editingIndex, editText); setEditingIndex(null); } if (e.key === "Escape") setEditingIndex(null); }} autoFocus /><button onClick={() => { chat.editAndResend(editingIndex, editText); setEditingIndex(null); }} className="btn-primary text-xs py-1 px-3">编辑重发</button><button onClick={() => setEditingIndex(null)} className="btn-ghost text-xs">取消</button></div>)}
        <ChatInput value={inputValue} onChange={setInputValue} onSend={handleSend} onStop={chat.stopGeneration} isStreaming={chat.isStreaming} disabled={!hasActiveSession || (!chat.isDemo && !chat.apiConfigured)} placeholder={!hasActiveSession ? "请先创建会话" : !chat.isDemo && !chat.apiConfigured ? "请先在设置中心配置 API Key..." : "输入消息... (Enter 发送, Shift+Enter 换行)"} />
      </div>
      <div className="w-64 border-l border-surface-100 bg-white overflow-y-auto flex-shrink-0"><ContextPreview {...contextProps} /></div>

      {/* Simplified picker: character only */}
      {showPicker && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowPicker(false)} />
          <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-sm mx-4 p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold">新建会话</h3><button onClick={() => setShowPicker(false)} className="p-1 hover:bg-surface-100 rounded-full"><X className="h-4 w-4 text-ink-400" /></button></div>
            <button onClick={() => { setShowPicker(false); chat.createSession(); }} className="w-full text-left px-3 py-2.5 rounded-card border border-surface-100 hover:border-brand-200 transition-colors text-sm text-ink-500 mb-2"><UserCircle className="h-4 w-4 inline mr-2" />不绑定角色，开始空白会话</button>
            {pickerChars.map((c) => (<button key={c.id} onClick={() => { setShowPicker(false); chat.createSession(c.id); }} className="w-full text-left px-3 py-2.5 rounded-card border border-surface-100 hover:border-brand-200 transition-colors flex items-center gap-3 mb-1.5"><span className="h-8 w-8 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center text-sm flex-shrink-0">{c.avatar_emoji || c.name[0]}</span><div className="min-w-0"><p className="text-sm font-medium text-ink-700 truncate">{c.name}</p><p className="text-xs text-ink-300 truncate">{String((c.card_json as Record<string, unknown>)?.identity ?? "") || "无身份设定"}</p></div></button>))}
          </div>
        </div>
      )}
    </div>
  );
}

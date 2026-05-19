import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronDown, Drama, MessageCircle, RefreshCw, Settings, UserCircle, WifiOff, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth";
import { supabase } from "../features/auth/supabaseClient";
import { useChatSession, type MemorySuggestionDraft } from "../features/roleplay/hooks/useChatSession";
import { ContextPreview } from "../features/roleplay/components/chat/ContextPreview";
import { ChatInput } from "../features/roleplay/components/chat/ChatInput";
import { MessageBubble } from "../features/roleplay/components/chat/MessageBubble";
import { SessionList } from "../features/roleplay/components/chat/SessionList";
import { loadApiKey } from "../features/roleplay/storage/apiKeyStorage";
import { getEnabledConfig } from "../features/roleplay/storage/apiProviderConfigStorage";
import {
  getDefaultHostedCredential,
  saveHostedCredentialSelection,
  selectionFromCredential,
} from "../features/roleplay/services/hostedCredentialsService";
import { ModeBadge } from "../shared/components/ModeBadge";
import { EmptyState } from "../shared/components/EmptyState";
import { useIsMobile } from "../shared/hooks/useMediaQuery";
import * as Repo from "../features/roleplay/repositories/roleplayRepository";
import * as LocalRepo from "../features/roleplay/repositories/localRoleplayRepository";
import type { CharacterRow } from "../features/roleplay/types/database";
import type { ChatMessage } from "../features/roleplay/providers/provider.types";
import type { ApiKeyStorageMode, ProviderType } from "../features/roleplay/providers";

function detectProviderConfig(): {
  provider: ProviderType;
  model: string;
  storageMode: ApiKeyStorageMode;
  credentialId?: string | null;
  baseURL?: string;
} {
  // 1. Check new enabled config system first
  const enabled = getEnabledConfig();
  if (enabled && enabled.storageMode !== "hosted_encrypted") {
    return {
      provider: enabled.provider,
      model: enabled.model,
      storageMode: enabled.storageMode,
      baseURL: enabled.baseURL || undefined,
    };
  }
  if (enabled?.storageMode === "hosted_encrypted" && enabled.credentialId) {
    return {
      provider: enabled.provider,
      model: enabled.model,
      storageMode: "hosted_encrypted",
      credentialId: enabled.credentialId,
      baseURL: enabled.baseURL || undefined,
    };
  }

  // 2. Fallback: old direct API key checks for backward compatibility
  const local = loadApiKey("deepseek", "local_device");
  if (local) return { provider: "deepseek", model: local.model, storageMode: "local_device" };
  const session = loadApiKey("deepseek", "session_only");
  if (session) return { provider: "deepseek", model: session.model, storageMode: "session_only" };
  const oaiLocal = loadApiKey("openai_compatible", "local_device");
  if (oaiLocal) return { provider: "openai_compatible", model: oaiLocal.model, storageMode: "local_device" };
  const oaiSession = loadApiKey("openai_compatible", "session_only");
  if (oaiSession) return { provider: "openai_compatible", model: oaiSession.model, storageMode: "session_only" };

  return { provider: "deepseek", model: "deepseek-v4-flash", storageMode: "session_only" };
}

function MemorySuggestionModal({
  drafts,
  title,
  savingMode,
  onChange,
  onClose,
  onSave,
}: {
  drafts: MemorySuggestionDraft[];
  title: string;
  savingMode: "active" | "suggested" | null;
  onChange: (index: number, patch: Partial<MemorySuggestionDraft>) => void;
  onClose: () => void;
  onSave: (status: "active" | "suggested") => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-5 shadow-modal">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="mt-0.5 text-xs text-ink-300">先预览和编辑，再决定保存并启用，或放入记忆收件箱。</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-surface-100">
            <X className="h-4 w-4 text-ink-400" />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {drafts.map((draft, index) => (
            <div key={`${draft.title}-${index}`} className="rounded-card border border-surface-100 bg-surface-50 p-3">
              <div className="mb-2 grid gap-2 sm:grid-cols-[1fr_140px_90px]">
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) => onChange(index, { title: event.target.value })}
                  className="rounded-input border border-surface-200 bg-white px-3 py-1.5 text-sm"
                  placeholder="记忆标题"
                />
                <select
                  value={draft.memory_type}
                  onChange={(event) => onChange(index, { memory_type: event.target.value as MemorySuggestionDraft["memory_type"] })}
                  className="rounded-input border border-surface-200 bg-white px-3 py-1.5 text-sm"
                >
                  <option value="event">剧情事件</option>
                  <option value="relationship">角色关系</option>
                  <option value="user_preference">用户偏好</option>
                  <option value="character_preference">角色偏好</option>
                  <option value="long_term">长期记忆</option>
                  <option value="short_term">短期记忆</option>
                  <option value="summary">摘要</option>
                </select>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.salience}
                  onChange={(event) => onChange(index, { salience: Number(event.target.value) })}
                  className="rounded-input border border-surface-200 bg-white px-3 py-1.5 text-sm"
                />
              </div>
              <textarea
                value={draft.content}
                onChange={(event) => onChange(index, { content: event.target.value })}
                rows={3}
                className="w-full rounded-input border border-surface-200 bg-white px-3 py-2 text-sm"
                placeholder="记忆内容"
              />
              <p className="mt-1 text-xs text-ink-300">提炼理由：{draft.reason || "模型未提供"}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button onClick={onClose} className="btn-ghost text-xs">
            取消
          </button>
          <button onClick={() => void onSave("suggested")} disabled={savingMode !== null} className="btn-ghost text-xs text-amber-700 disabled:opacity-50">
            {savingMode === "suggested" ? "保存中..." : "保存到收件箱"}
          </button>
          <button onClick={() => void onSave("active")} disabled={savingMode !== null} className="btn-primary text-xs disabled:opacity-50">
            {savingMode === "active" ? "保存中..." : "保存并启用"}
          </button>
        </div>
      </div>
    </div>
  );
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerChars, setPickerChars] = useState<CharacterRow[]>([]);
  const [memoryDrafts, setMemoryDrafts] = useState<MemorySuggestionDraft[] | null>(null);
  const [memoryDraftTitle, setMemoryDraftTitle] = useState("AI 提炼记忆");
  const [memorySaveMode, setMemorySaveMode] = useState<"active" | "suggested" | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const prevSessionIdRef = useRef<string | null>(null);
  const olderLoadHeightRef = useRef<number | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  const loadPickerChars = useCallback(async () => {
    const chars = isGuestOrDemo || !supabase || !userId
      ? await LocalRepo.listActiveCharacters()
      : await Repo.listActiveCharacters(supabase, userId);
    setPickerChars(chars);
  }, [isGuestOrDemo, userId]);

  function handleCreateSession() {
    void loadPickerChars();
    setShowPicker(true);
  }

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      setUserScrolledUp(container.scrollHeight - container.scrollTop - container.clientHeight >= 80);
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (olderLoadHeightRef.current !== null) {
      const previousHeight = olderLoadHeightRef.current;
      olderLoadHeightRef.current = null;
      container.scrollTop = container.scrollHeight - previousHeight;
      prevMessageCountRef.current = chat.messages.length;
      prevSessionIdRef.current = chat.activeSessionId;
      return;
    }

    const sessionChanged = prevSessionIdRef.current !== chat.activeSessionId;
    const messageCountChanged = prevMessageCountRef.current !== chat.messages.length;
    if (sessionChanged) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else if (messageCountChanged && (!userScrolledUp || chat.isStreaming)) {
      messagesEndRef.current?.scrollIntoView({ behavior: chat.isStreaming ? "auto" : "smooth" });
    }

    prevMessageCountRef.current = chat.messages.length;
    prevSessionIdRef.current = chat.activeSessionId;
  }, [chat.activeSessionId, chat.isStreaming, chat.messages, userScrolledUp]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setUserScrolledUp(false);
  }

  async function handleLoadOlderMessages() {
    const container = messagesContainerRef.current;
    if (container) olderLoadHeightRef.current = container.scrollHeight;
    await chat.loadOlderMessages();
  }

  const hasActiveSession = !!chat.activeSessionId;

  function handleSend() {
    if (!inputValue.trim() || !hasActiveSession || chat.isStreaming) return;
    void chat.sendMessage(inputValue.trim());
    setInputValue("");
  }

  async function openMemorySuggestion(source?: { messageIndex?: number }) {
    if (!chat.isDemo && !chat.apiConfigured) {
      alert("请先配置 API。");
      return;
    }
    const drafts = await chat.generateMemorySuggestions(source);
    if (!drafts || drafts.length === 0) return;
    setMemoryDraftTitle(source?.messageIndex !== undefined ? "从单条消息提炼记忆" : "AI 提炼记忆");
    setMemoryDrafts(drafts);
  }

  async function saveMemoryDrafts(status: "active" | "suggested") {
    if (!memoryDrafts) return;
    setMemorySaveMode(status);
    await chat.saveMemorySuggestions(memoryDrafts, status);
    setMemorySaveMode(null);
    setMemoryDrafts(null);
  }

  const contextProps = {
    sessionTitle: chat.sessions.find((session) => session.id === chat.activeSessionId)?.title || "",
    messageCount: chat.messageCount,
    isDemo: chat.isDemo,
    providerLabel: chat.providerLabel,
    modelLabel: chat.modelLabel,
    apiConfigured: chat.apiConfigured,
    runtimeMode: chat.runtimeMode,
    isLocalMode: isGuestOrDemo,
    activeCharacter: chat.activeCharacter,
    activeTemplate: chat.activeTemplate,
    systemPrompt: chat.systemPrompt,
    lastContextOutput: chat.lastContextOutput,
    contextPreviewError: chat.contextPreviewError,
    sessionSummaryText: chat.summaryText,
    worldbookIds: chat.worldbookIds,
    memoryIds: chat.memoryIds,
    disabledWbIds: chat.disabledWbIds,
    disabledMemIds: chat.disabledMemIds,
    summaryEnabled: chat.summaryEnabled,
    suggestedMemories: chat.suggestedMemories,
    isGeneratingMemorySuggestions: chat.isGeneratingMemorySuggestions,
    activeBranchName: chat.activeBranchName,
    contextRunSaveStatus: chat.contextRunSaveStatus,
    onAddTemplate: chat.addTemplate,
    onRemoveTemplate: chat.removeTemplate,
    onAddWorldbooks: chat.addWorldbooks,
    onRemoveWorldbook: chat.removeWorldbook,
    onToggleWorldbook: chat.toggleWorldbook,
    onAddMemories: chat.addMemories,
    onRemoveMemory: chat.removeMemory,
    onToggleMemory: chat.toggleMemory,
    onGenerateMemorySuggestions: async () => {
      await openMemorySuggestion();
    },
    onUpdateSuggestedMemoryStatus: chat.updateSuggestedMemoryStatus,
    onSaveSummaryText: chat.saveSummary,
    onClearSummary: chat.clearSummary,
    onGenerateSummary: chat.generateSummary,
  };

  function renderLoadOlderButton() {
    if (!hasActiveSession) return null;
    if (!chat.hasMoreMessages && chat.messages.length === 0) return null;
    return (
      <div className="mb-3 flex justify-center">
        {chat.hasMoreMessages ? (
          <button
            type="button"
            onClick={() => void handleLoadOlderMessages()}
            disabled={chat.isLoadingOlderMessages}
            className="btn-ghost text-xs disabled:opacity-50"
          >
            {chat.isLoadingOlderMessages ? "加载中..." : "加载更早消息"}
          </button>
        ) : (
          <span className="text-xs text-ink-300">已加载到最早消息</span>
        )}
      </div>
    );
  }

  function renderMessageBubble(message: ChatMessage, index: number) {
    const dbId = chat.messageDbIds.get(index);
    const revisions = dbId ? chat.messageRevisions.get(dbId) : undefined;
    const revisionCount = dbId ? (chat.messageRevisionCounts.get(dbId) ?? 0) : 0;
    return (
      <MessageBubble
        key={dbId ?? `${message.role}-${index}`}
        message={message}
        index={index}
        isStreaming={chat.isStreaming && index === chat.messages.length - 1 && message.role === "assistant"}
        onCopy={() => chat.copyMessage(index)}
        onDelete={() => void chat.deleteMessage(index)}
        onRegenerate={message.role === "assistant" && index === chat.messages.length - 1 && !chat.isStreaming ? chat.regenerateLast : undefined}
        onEdit={message.role === "user" ? () => { setEditingIndex(index); setEditText(message.content); } : undefined}
        onExtractMemory={() => void openMemorySuggestion({ messageIndex: index })}
        revisionCount={revisionCount}
        revisions={revisions}
        onLoadRevisions={() => chat.loadMessageRevisions(index)}
      />
    );
  }

  const messageList = (
    <>
      {renderLoadOlderButton()}
      {chat.messages.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-10 w-10" />}
          title={hasActiveSession ? "开始聊天" : "开始聊天，请先创建会话"}
          description={!hasActiveSession ? "点击 + 创建" : chat.isDemo ? "本地模式 · 使用本地预览回复" : chat.apiConfigured ? "输入消息开始角色扮演" : "请先在设置中心启用 API 配置"}
        />
      ) : (
        chat.messages.map((message, index) => renderMessageBubble(message, index))
      )}
      <div ref={messagesEndRef} />
    </>
  );

  if (isMobile) {
    return (
      <div className="flex h-dvh flex-col bg-surface-50 pb-safe-bottom">
        <div className="flex items-center gap-2 border-b border-surface-100 bg-white px-3 py-2.5">
          <button onClick={() => setShowMobileSessions((value) => !value)} className="btn-ghost p-1.5 text-xs">
            <Drama className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900">{chat.sessions.find((session) => session.id === chat.activeSessionId)?.title || "聊天室"}</p>
          </div>
          {providerConfig.storageMode === "hosted_encrypted" && (
            <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] text-sky-700">托管·非流式</span>
          )}
          <ModeBadge />
          <button onClick={() => setShowMobileContext((value) => !value)} className="btn-ghost p-1.5 text-xs">
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {showMobileSessions && (
          <div className="absolute left-0 top-0 z-30 h-dvh w-72 overflow-y-auto bg-white shadow-modal">
            <div className="flex items-center justify-between border-b p-3">
              <span className="text-sm font-medium">会话</span>
              <button onClick={() => setShowMobileSessions(false)} className="btn-ghost p-1 text-xs">关闭</button>
            </div>
            <SessionList
              sessions={chat.sessions}
              activeSessionId={chat.activeSessionId}
              onSelect={(id) => {
                void chat.selectSession(id);
                setShowMobileSessions(false);
              }}
              onCreate={() => {
                handleCreateSession();
                setShowMobileSessions(false);
              }}
              onDelete={chat.deleteSession}
              loading={false}
            />
          </div>
        )}

        {showMobileContext && (
          <div className="absolute right-0 top-0 z-30 h-dvh w-80 overflow-y-auto bg-white shadow-modal">
            <div className="flex items-center justify-between border-b p-3">
              <span className="text-sm font-medium">上下文</span>
              <button onClick={() => setShowMobileContext(false)} className="btn-ghost p-1 text-xs">关闭</button>
            </div>
            <ContextPreview {...contextProps} />
          </div>
        )}

        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-4">
          {messageList}
          {userScrolledUp && (
            <button onClick={scrollToBottom} className="fixed bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1.5 text-xs text-white shadow-elevated">
              回到底部
            </button>
          )}
        </div>

        {chat.error && (
          <div className="flex items-center gap-2 border-t border-rose-200 bg-rose-light/80 px-3 py-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-500" />
            <p className="flex-1 truncate text-xs text-rose-700">{chat.error}</p>
            <button onClick={() => void chat.retry()} className="btn-ghost flex items-center gap-1 text-xs text-rose-600">
              <RefreshCw className="h-3 w-3" />
              重试
            </button>
          </div>
        )}

        {!chat.isDemo && !chat.apiConfigured && (
          <div className="flex items-center gap-2 border-t border-amber-200 bg-amber-light px-3 py-2">
            <WifiOff className="h-4 w-4 flex-shrink-0 text-amber-500" />
            <p className="flex-1 text-xs text-amber-700">请先配置 API Key</p>
            <Link to="/settings" className="btn-ghost text-xs text-amber-700">
              <Settings className="h-3 w-3" />
              设置
            </Link>
          </div>
        )}

        {editingIndex !== null && (
          <div className="flex items-center gap-2 border-t bg-brand-50 px-3 py-2">
            <input
              type="text"
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              className="flex-1 rounded-input border border-brand-200 bg-white px-3 py-1.5 text-sm"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void chat.editAndResend(editingIndex, editText);
                  setEditingIndex(null);
                }
                if (event.key === "Escape") setEditingIndex(null);
              }}
            />
            <button onClick={() => { void chat.editAndResend(editingIndex, editText); setEditingIndex(null); }} className="btn-primary px-3 py-1 text-xs">重发</button>
            <button onClick={() => setEditingIndex(null)} className="btn-ghost text-xs">取消</button>
          </div>
        )}

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          onStop={chat.stopGeneration}
          isStreaming={chat.isStreaming}
          disabled={!hasActiveSession || (!chat.isDemo && !chat.apiConfigured)}
          placeholder={!hasActiveSession ? "请先创建会话" : !chat.isDemo && !chat.apiConfigured ? "请先在设置中心启用 API 配置..." : "输入消息..."}
        />

        {memoryDrafts && (
          <MemorySuggestionModal
            drafts={memoryDrafts}
            title={memoryDraftTitle}
            savingMode={memorySaveMode}
            onClose={() => setMemoryDrafts(null)}
            onSave={saveMemoryDrafts}
            onChange={(index, patch) => {
              setMemoryDrafts((current) => {
                if (!current) return current;
                const next = [...current];
                next[index] = { ...next[index], ...patch };
                return next;
              });
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full bg-surface-50">
      <div className="w-60 flex-shrink-0 overflow-y-auto border-r border-surface-100 bg-white">
        <SessionList
          sessions={chat.sessions}
          activeSessionId={chat.activeSessionId}
          onSelect={chat.selectSession}
          onCreate={handleCreateSession}
          onDelete={chat.deleteSession}
          loading={false}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-surface-100 bg-white px-4 py-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm text-brand-500">
            {chat.activeCharacter?.avatar_emoji || <Drama className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-ink-900">{chat.sessions.find((session) => session.id === chat.activeSessionId)?.title || "聊天室"}</h1>
            {chat.activeCharacter && <p className="truncate text-xs text-brand-500">{chat.activeCharacter.name}</p>}
          </div>
          <div className="flex items-center gap-2">
            {providerConfig.storageMode === "hosted_encrypted" && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] text-sky-700">托管模式 · 非流式</span>
            )}
            {chat.saveStatus === "saving" && <span className="text-xs text-ink-300">保存中...</span>}
            {chat.saveStatus === "saved" && <span className="text-xs text-emerald-500">已保存</span>}
            {chat.saveStatus === "error" && <span className="text-xs text-rose-500">保存失败</span>}
            <ModeBadge />
          </div>
        </div>

        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
          {messageList}
          {userScrolledUp && (
            <button onClick={scrollToBottom} className="sticky bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1.5 text-xs text-white shadow-elevated">
              回到底部
            </button>
          )}
        </div>

        {chat.error && (
          <div className="flex items-center gap-2 border-t bg-rose-light/80 px-4 py-2">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            <p className="flex-1 truncate text-xs text-rose-700">{chat.error}</p>
            <button onClick={() => void chat.retry()} className="btn-ghost text-xs text-rose-600">
              <RefreshCw className="h-3 w-3" />
              重试
            </button>
          </div>
        )}

        {!chat.isDemo && !chat.apiConfigured && (
          <div className="flex items-center gap-2 border-t bg-amber-light px-4 py-2">
            <WifiOff className="h-4 w-4 text-amber-500" />
            <p className="flex-1 text-xs text-amber-700">请先在设置中心启用 API 配置</p>
            <Link to="/settings" className="btn-ghost text-xs text-amber-700">
              <Settings className="h-3 w-3" />
              去设置
            </Link>
          </div>
        )}

        {editingIndex !== null && (
          <div className="flex items-center gap-2 border-t bg-brand-50 px-4 py-2">
            <input
              type="text"
              value={editText}
              onChange={(event) => setEditText(event.target.value)}
              className="flex-1 rounded-input border border-brand-200 bg-white px-3 py-1.5 text-sm"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void chat.editAndResend(editingIndex, editText);
                  setEditingIndex(null);
                }
                if (event.key === "Escape") setEditingIndex(null);
              }}
              autoFocus
            />
            <button onClick={() => { void chat.editAndResend(editingIndex, editText); setEditingIndex(null); }} className="btn-primary px-3 py-1 text-xs">编辑重发</button>
            <button onClick={() => setEditingIndex(null)} className="btn-ghost text-xs">取消</button>
          </div>
        )}

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          onStop={chat.stopGeneration}
          isStreaming={chat.isStreaming}
          disabled={!hasActiveSession || (!chat.isDemo && !chat.apiConfigured)}
          placeholder={!hasActiveSession ? "请先创建会话" : !chat.isDemo && !chat.apiConfigured ? "请先在设置中心启用 API 配置..." : "输入消息... (Enter 发送，Shift+Enter 换行)"}
        />
      </div>

      <div className="w-72 flex-shrink-0 overflow-y-auto border-l border-surface-100 bg-white">
        <ContextPreview {...contextProps} />
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowPicker(false)} />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-5 shadow-modal">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">新建会话</h3>
              <button onClick={() => setShowPicker(false)} className="rounded-full p-1 hover:bg-surface-100">
                <X className="h-4 w-4 text-ink-400" />
              </button>
            </div>
            <button
              onClick={() => {
                setShowPicker(false);
                void chat.createSession();
              }}
              className="mb-2 w-full rounded-card border border-surface-100 px-3 py-2.5 text-left text-sm text-ink-500 transition-colors hover:border-brand-200"
            >
              <UserCircle className="mr-2 inline h-4 w-4" />
              不绑定角色，开始空白会话
            </button>
            {pickerChars.map((character) => (
              <button
                key={character.id}
                onClick={() => {
                  setShowPicker(false);
                  void chat.createSession(character.id);
                }}
                className="mb-1.5 flex w-full items-center gap-3 rounded-card border border-surface-100 px-3 py-2.5 text-left transition-colors hover:border-brand-200"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm text-brand-500">
                  {character.avatar_emoji || character.name[0]}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-700">{character.name}</p>
                  <p className="truncate text-xs text-ink-300">{String((character.card_json as Record<string, unknown>)?.identity ?? "") || "无身份设定"}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {memoryDrafts && (
        <MemorySuggestionModal
          drafts={memoryDrafts}
          title={memoryDraftTitle}
          savingMode={memorySaveMode}
          onClose={() => setMemoryDrafts(null)}
          onSave={saveMemoryDrafts}
          onChange={(index, patch) => {
            setMemoryDrafts((current) => {
              if (!current) return current;
              const next = [...current];
              next[index] = { ...next[index], ...patch };
              return next;
            });
          }}
        />
      )}
    </div>
  );
}

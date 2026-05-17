import { useState, useEffect, useRef } from "react";
import {
  Drama,
  MessageCircle,
  AlertTriangle,
  ChevronDown,
  WifiOff,
  RefreshCw,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth";
import { useIsMobile } from "../shared/hooks/useMediaQuery";
import { ModeBadge } from "../shared/components/ModeBadge";
import { EmptyState } from "../shared/components/EmptyState";
import { useChatSession } from "../features/roleplay/hooks/useChatSession";
import { MessageBubble } from "../features/roleplay/components/chat/MessageBubble";
import { ChatInput } from "../features/roleplay/components/chat/ChatInput";
import { SessionList } from "../features/roleplay/components/chat/SessionList";
import { ContextPanel } from "../features/roleplay/components/chat/ContextPanel";
import type { ProviderType, ApiKeyStorageMode } from "../features/roleplay/providers";
import { loadApiKey } from "../features/roleplay/storage/apiKeyStorage";

// Detect what provider/keys the user has configured
function detectProviderConfig(): {
  provider: ProviderType;
  model: string;
  storageMode: ApiKeyStorageMode;
} {
  // Check local device first, then session
  const local = loadApiKey("deepseek", "local_device");
  if (local) return { provider: "deepseek", model: local.model, storageMode: "local_device" };

  const session = loadApiKey("deepseek", "session_only");
  if (session) return { provider: "deepseek", model: session.model, storageMode: "session_only" };

  const oaiLocal = loadApiKey("openai_compatible", "local_device");
  if (oaiLocal) return { provider: "openai_compatible", model: oaiLocal.model, storageMode: "local_device" };

  const oaiSession = loadApiKey("openai_compatible", "session_only");
  if (oaiSession) return { provider: "openai_compatible", model: oaiSession.model, storageMode: "session_only" };

  return { provider: "deepseek", model: "deepseek-chat", storageMode: "session_only" };
}

export function ChatRoomPage() {
  const isMobile = useIsMobile();
  const { isGuestOrDemo, user } = useAuth();
  const userId = user?.id;
  const { provider, model, storageMode } = detectProviderConfig();

  const chat = useChatSession(isGuestOrDemo, userId, provider, model, storageMode);

  const [inputValue, setInputValue] = useState("");
  const [showMobileSessions, setShowMobileSessions] = useState(false);
  const [showMobileContext, setShowMobileContext] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  // Show "new messages" indicator if user scrolled up
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const container = messagesContainerRef.current;

  useEffect(() => {
    if (!container) return;
    const handler = () => {
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 80;
      setUserScrolledUp(!atBottom);
    };
    container.addEventListener("scroll", handler, { passive: true });
    return () => container.removeEventListener("scroll", handler);
  }, [container]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setUserScrolledUp(false);
  }

  function handleSend() {
    if (!inputValue.trim() || chat.isStreaming) return;
    chat.sendMessage(inputValue.trim());
    setInputValue("");
  }

  // ---------- Mobile layout ----------

  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh bg-surface-50">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-b border-surface-100">
          <button
            onClick={() => setShowMobileSessions(!showMobileSessions)}
            className="btn-ghost p-1.5 text-xs"
          >
            <Drama className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-900 truncate">
              {chat.sessions.find((s) => s.id === chat.activeSessionId)?.title || "聊天房间"}
            </p>
          </div>
          <ModeBadge />
          <button
            onClick={() => setShowMobileContext(!showMobileContext)}
            className="btn-ghost p-1.5 text-xs"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile session drawer */}
        {showMobileSessions && (
          <div className="absolute top-0 left-0 w-72 h-dvh bg-white z-30 shadow-modal border-r border-surface-200 overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-surface-100">
              <span className="text-sm font-medium">会话</span>
              <button onClick={() => setShowMobileSessions(false)} className="btn-ghost p-1 text-xs">
                关闭
              </button>
            </div>
            <SessionList
              sessions={chat.sessions}
              activeSessionId={chat.activeSessionId}
              onSelect={(id) => {
                chat.selectSession(id);
                setShowMobileSessions(false);
              }}
              onCreate={() => {
                chat.createSession();
                setShowMobileSessions(false);
              }}
              onDelete={chat.deleteSession}
              loading={false}
            />
          </div>
        )}

        {/* Mobile context drawer */}
        {showMobileContext && (
          <div className="absolute top-0 right-0 w-80 h-dvh bg-white z-30 shadow-modal border-l border-surface-200 overflow-y-auto">
            <div className="flex items-center justify-between p-3 border-b border-surface-100">
              <span className="text-sm font-medium">上下文</span>
              <button onClick={() => setShowMobileContext(false)} className="btn-ghost p-1 text-xs">
                关闭
              </button>
            </div>
            <ContextPanel
              sessionTitle={
                chat.sessions.find((s) => s.id === chat.activeSessionId)?.title || ""
              }
              messageCount={chat.messageCount}
              isDemo={chat.isDemo}
              providerLabel={chat.providerLabel}
              modelLabel={chat.modelLabel}
              apiConfigured={chat.apiConfigured}
              runtimeMode={chat.runtimeMode}
            />
          </div>
        )}

        {/* Message area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 py-4">
          {chat.messages.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-10 w-10" />}
              title="开始聊天"
              description={
                chat.isDemo
                  ? "Demo 模式 · Mock AI 回复 · 不消耗 API"
                  : chat.apiConfigured
                    ? "输入消息开始角色扮演"
                    : "请先在设置中心配置 API Key"
              }
            />
          ) : (
            chat.messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                index={i}
                isStreaming={
                  chat.isStreaming &&
                  i === chat.messages.length - 1 &&
                  msg.role === "assistant"
                }
                onCopy={() => chat.copyMessage(i)}
                onDelete={() => chat.deleteMessage(i)}
                onRegenerate={
                  msg.role === "assistant" &&
                  i === chat.messages.length - 1 &&
                  !chat.isStreaming
                    ? chat.regenerateLast
                    : undefined
                }
                onEdit={
                  msg.role === "user"
                    ? () => {
                        setEditingIndex(i);
                        setEditText(msg.content);
                      }
                    : undefined
                }
              />
            ))
          )}
          <div ref={messagesEndRef} />

          {/* New messages indicator */}
          {userScrolledUp && (
            <button
              onClick={scrollToBottom}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-brand-500 text-white rounded-full px-4 py-1.5 text-xs shadow-elevated z-10 animate-bounce"
            >
              ↓ 新消息
            </button>
          )}
        </div>

        {/* Error bar */}
        {chat.error && (
          <div className="px-3 py-2 bg-rose-light/80 border-t border-rose-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
            <p className="text-xs text-rose-700 flex-1 truncate">{chat.error}</p>
            <button onClick={chat.retry} className="btn-ghost text-xs text-rose-600 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> 重试
            </button>
          </div>
        )}

        {/* No API warning */}
        {!chat.isDemo && !chat.apiConfigured && (
          <div className="px-3 py-2 bg-amber-light border-t border-amber-200 flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 flex-1">请先配置 API Key</p>
            <Link to="/settings" className="btn-ghost text-xs text-amber-700 flex items-center gap-1">
              <Settings className="h-3 w-3" /> 设置
            </Link>
          </div>
        )}

        {/* Save status */}
        <div className="px-3 py-1 bg-white border-t border-surface-100 flex items-center justify-between text-xs text-ink-300">
          <span>{chat.saveStatus === "saving" ? "保存中..." : chat.saveStatus === "saved" ? "已保存" : ""}</span>
          <span>
            {chat.messageCount} 条消息
            {chat.isDemo && " · Demo"}
          </span>
        </div>

        {/* Edit bar */}
        {editingIndex !== null && (
          <div className="px-3 py-2 bg-brand-50 border-t border-brand-100 flex items-center gap-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 rounded-input border border-brand-200 bg-white py-1.5 px-3 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  chat.editAndResend(editingIndex, editText);
                  setEditingIndex(null);
                }
                if (e.key === "Escape") setEditingIndex(null);
              }}
            />
            <button
              onClick={() => {
                chat.editAndResend(editingIndex, editText);
                setEditingIndex(null);
              }}
              className="btn-primary text-xs py-1 px-3"
            >
              重发
            </button>
            <button onClick={() => setEditingIndex(null)} className="btn-ghost text-xs">
              取消
            </button>
          </div>
        )}

        {/* Input */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          onStop={chat.stopGeneration}
          isStreaming={chat.isStreaming}
          disabled={!chat.isDemo && !chat.apiConfigured}
          placeholder={
            !chat.isDemo && !chat.apiConfigured
              ? "请先在设置中心配置 API Key..."
              : "输入消息..."
          }
        />
      </div>
    );
  }

  // ---------- Desktop layout: 3-column ----------

  return (
    <div className="flex h-full bg-surface-50">
      {/* Left: session list */}
      <div className="w-60 border-r border-surface-100 bg-white overflow-y-auto flex-shrink-0">
        <SessionList
          sessions={chat.sessions}
          activeSessionId={chat.activeSessionId}
          onSelect={chat.selectSession}
          onCreate={chat.createSession}
          onDelete={chat.deleteSession}
          loading={false}
        />
      </div>

      {/* Center: chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-surface-100">
          <Drama className="h-5 w-5 text-brand-500" />
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-ink-900 truncate">
              {chat.sessions.find((s) => s.id === chat.activeSessionId)?.title || "聊天房间"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {chat.saveStatus === "saving" && (
              <span className="text-xs text-ink-300">保存中...</span>
            )}
            {chat.saveStatus === "saved" && (
              <span className="text-xs text-emerald-500">已保存</span>
            )}
            {chat.saveStatus === "error" && (
              <span className="text-xs text-rose-500">保存失败</span>
            )}
            <ModeBadge />
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4">
          {chat.messages.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-10 w-10" />}
              title="开始聊天"
              description={
                chat.isDemo
                  ? "Demo 模式 · Mock AI · 不消耗 API · 不写数据库"
                  : chat.apiConfigured
                    ? "输入消息开始角色扮演"
                    : "请先在设置中心配置你的 API Key"
              }
            />
          ) : (
            chat.messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                index={i}
                isStreaming={
                  chat.isStreaming &&
                  i === chat.messages.length - 1 &&
                  msg.role === "assistant"
                }
                onCopy={() => chat.copyMessage(i)}
                onDelete={() => chat.deleteMessage(i)}
                onRegenerate={
                  msg.role === "assistant" &&
                  i === chat.messages.length - 1 &&
                  !chat.isStreaming
                    ? chat.regenerateLast
                    : undefined
                }
                onEdit={
                  msg.role === "user"
                    ? () => {
                        setEditingIndex(i);
                        setEditText(msg.content);
                      }
                    : undefined
                }
              />
            ))
          )}
          <div ref={messagesEndRef} />

          {userScrolledUp && (
            <button
              onClick={scrollToBottom}
              className="sticky bottom-4 left-1/2 -translate-x-1/2 bg-brand-500 text-white rounded-full px-4 py-1.5 text-xs shadow-elevated animate-bounce"
            >
              ↓ 新消息
            </button>
          )}
        </div>

        {/* Error */}
        {chat.error && (
          <div className="px-4 py-2 bg-rose-light/80 border-t border-rose-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
            <p className="text-xs text-rose-700 flex-1 truncate">{chat.error}</p>
            <button onClick={chat.retry} className="btn-ghost text-xs text-rose-600 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> 重试
            </button>
          </div>
        )}

        {/* No API */}
        {!chat.isDemo && !chat.apiConfigured && (
          <div className="px-4 py-2 bg-amber-light border-t border-amber-200 flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 flex-1">
              未配置 API Key，无法调用真实模型。请在设置中心配置。
            </p>
            <Link to="/settings" className="btn-ghost text-xs text-amber-700 flex items-center gap-1">
              <Settings className="h-3 w-3" /> 去设置
            </Link>
          </div>
        )}

        {/* Edit bar */}
        {editingIndex !== null && (
          <div className="px-4 py-2 bg-brand-50 border-t border-brand-100 flex items-center gap-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1 rounded-input border border-brand-200 bg-white py-1.5 px-3 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  chat.editAndResend(editingIndex, editText);
                  setEditingIndex(null);
                }
                if (e.key === "Escape") setEditingIndex(null);
              }}
              autoFocus
            />
            <button
              onClick={() => {
                chat.editAndResend(editingIndex, editText);
                setEditingIndex(null);
              }}
              className="btn-primary text-xs py-1 px-3"
            >
              编辑重发
            </button>
            <button onClick={() => setEditingIndex(null)} className="btn-ghost text-xs">
              取消
            </button>
          </div>
        )}

        {/* Input */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          onStop={chat.stopGeneration}
          isStreaming={chat.isStreaming}
          disabled={!chat.isDemo && !chat.apiConfigured}
          placeholder={
            !chat.isDemo && !chat.apiConfigured
              ? "请先在设置中心配置 API Key..."
              : !chat.apiConfigured && !chat.isDemo
                ? "未配置 API Key"
                : "输入消息... (Enter 发送, Shift+Enter 换行)"
          }
        />
      </div>

      {/* Right: context panel */}
      <div className="w-64 border-l border-surface-100 bg-white overflow-y-auto flex-shrink-0">
        <ContextPanel
          sessionTitle={chat.sessions.find((s) => s.id === chat.activeSessionId)?.title || ""}
          messageCount={chat.messageCount}
          isDemo={chat.isDemo}
          providerLabel={chat.providerLabel}
          modelLabel={chat.modelLabel}
          apiConfigured={chat.apiConfigured}
          runtimeMode={chat.runtimeMode}
        />
      </div>
    </div>
  );
}

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "../../auth/supabaseClient";
import type { ChatMessage } from "../providers/provider.types";
import type { ProviderType, ApiKeyStorageMode, ModelProviderConfig } from "../providers/provider.types";
import { DEFAULT_PROVIDER_CONFIG } from "../providers/provider.types";
import { sendProviderStreamRequest, buildConfigFromStorage } from "../providers/providerGateway";
import { loadApiKey } from "../storage/apiKeyStorage";
import * as Repo from "../repositories/roleplayRepository";
import { createDemoSession } from "../mock/demoData";

// ---------- types ----------

export interface SessionLike {
  id: string;
  title: string;
  mode: string;
  lastMessageAt: string | null;
}

export interface ChatState {
  sessions: SessionLike[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  isSending: boolean;
  error: string | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
  provider: ProviderType;
  model: string;
}

export interface ChatActions {
  // Session
  createSession: () => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  // Messages
  sendMessage: (text: string) => Promise<void>;
  stopGeneration: () => void;
  regenerateLast: () => Promise<void>;
  editAndResend: (messageIndex: number, newText: string) => Promise<void>;
  deleteMessage: (messageIndex: number) => void;
  copyMessage: (messageIndex: number) => void;
  retry: () => Promise<void>;

  // Info
  isDemo: boolean;
  apiConfigured: boolean;
  providerLabel: string;
  modelLabel: string;
  runtimeMode: string;
  messageCount: number;
}

// ---------- hook ----------

export function useChatSession(
  isGuestOrDemo: boolean,
  userId: string | undefined,
  storedProvider: ProviderType,
  storedModel: string,
  storageMode: ApiKeyStorageMode,
): ChatState & ChatActions {
  const [state, setState] = useState<ChatState>({
    sessions: [],
    activeSessionId: null,
    messages: [],
    isStreaming: false,
    isSending: false,
    error: null,
    saveStatus: "idle",
    provider: storedProvider,
    model: storedModel || DEFAULT_PROVIDER_CONFIG.model,
  });

  const abortRef = useRef<AbortController | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const isDemo = isGuestOrDemo || !supabase;

  // ---------- helpers ----------

  const getApiKey = useCallback((): string | null => {
    if (isDemo) return "mock-no-key-needed";
    const key = loadApiKey(storedProvider, storageMode)?.apiKey;
    return key || null;
  }, [isDemo, storedProvider, storageMode]);

  const apiConfigured = !isDemo && getApiKey() !== null;

  const buildConfig = useCallback((): ModelProviderConfig => {
    const key = getApiKey() || "";
    return buildConfigFromStorage(
      isDemo ? "mock" : storedProvider,
      key,
      storageMode,
      stateRef.current.model,
      undefined,
    );
  }, [isDemo, storedProvider, storageMode, getApiKey]);

  // ---------- session management ----------

  const loadSessions = useCallback(async () => {
    if (isDemo) {
      const demo = getDefaultDemoSession();
      setState((s) => ({
        ...s,
        sessions: [{ id: demo.id, title: demo.title, mode: "demo_mock", lastMessageAt: demo.lastMessageAt }],
        activeSessionId: s.activeSessionId || demo.id,
        messages: s.activeSessionId ? s.messages : demo.messages,
      }));
      return;
    }
    if (!supabase) return;

    const rows = await Repo.listSessions(supabase, userId!);
    const sessions: SessionLike[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      mode: r.mode,
      lastMessageAt: r.last_message_at,
    }));

    setState((s) => ({
      ...s,
      sessions,
      activeSessionId: s.activeSessionId || sessions[0]?.id || null,
    }));
  }, [isDemo, userId]);

  const createSession = useCallback(async () => {
    if (isDemo) {
      const demo = createDemoSession();
      setState((s) => ({
        ...s,
        sessions: [
          { id: demo.id, title: demo.title, mode: "demo_mock", lastMessageAt: demo.lastMessageAt },
          ...s.sessions,
        ],
        activeSessionId: demo.id,
        messages: demo.messages,
        error: null,
      }));
      return;
    }
    if (!supabase || !userId) return;

    try {
      const row = await Repo.createSession(supabase, userId, { title: `新会话 ${new Date().toLocaleTimeString("zh-CN")}` });
      if (!row) throw new Error("创建会话失败");
      const session: SessionLike = { id: row.id, title: row.title, mode: row.mode, lastMessageAt: null };
      setState((s) => ({
        ...s,
        sessions: [session, ...s.sessions],
        activeSessionId: session.id,
        messages: [],
        error: null,
      }));
    } catch (e) {
      setState((s) => ({ ...s, error: `创建会话失败: ${String(e)}` }));
    }
  }, [isDemo, userId]);

  const selectSession = useCallback(
    async (id: string) => {
      if (isDemo) {
        const demo = getDefaultDemoSession();
        setState((s) => ({ ...s, activeSessionId: id, messages: demo.messages, error: null }));
        return;
      }
      if (!supabase) return;

      setState((s) => ({ ...s, activeSessionId: id, error: null }));

      try {
        const rows = await Repo.listMessages(supabase, id);
        const messages: ChatMessage[] = rows.map((r) => ({
          role: r.role as ChatMessage["role"],
          content: r.content_text,
        }));
        setState((s) => ({ ...s, messages }));
      } catch {
        setState((s) => ({ ...s, messages: [] }));
      }
    },
    [isDemo],
  );

  const deleteSession = useCallback(
    async (id: string) => {
      if (isDemo) {
        setState((s) => ({
          ...s,
          sessions: s.sessions.filter((ses) => ses.id !== id),
          activeSessionId: s.activeSessionId === id ? s.sessions[0]?.id ?? null : s.activeSessionId,
        }));
        return;
      }
      if (!supabase || !userId) return;

      try {
        await Repo.clearSessionMessages(supabase, id, userId);
        await Repo.deleteSession(supabase, id, userId);
        setState((s) => {
          const updated = s.sessions.filter((ses) => ses.id !== id);
          return {
            ...s,
            sessions: updated,
            activeSessionId: s.activeSessionId === id ? updated[0]?.id ?? null : s.activeSessionId,
          };
        });
      } catch (e) {
        setState((s) => ({ ...s, error: `删除失败: ${String(e)}` }));
      }
    },
    [isDemo, userId],
  );

  // ---------- message operations ----------

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((s) => ({ ...s, isStreaming: false, isSending: false }));
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (stateRef.current.isStreaming) return;

      const userMsg: ChatMessage = { role: "user", content: text };
      const prevMessages = stateRef.current.messages;

      setState((s) => ({
        ...s,
        messages: [...s.messages, userMsg],
        isSending: true,
        isStreaming: true,
        error: null,
        saveStatus: "idle",
      }));

      const allMessages = [...prevMessages, userMsg];
      const controller = new AbortController();
      abortRef.current = controller;
      let aiContent = "";

      try {
        const config = buildConfig();
        const stream = sendProviderStreamRequest(isDemo, config, allMessages, controller.signal);

        for await (const chunk of stream) {
          if (controller.signal.aborted) break;
          if (chunk.content) {
            aiContent += chunk.content;
            setState((s) => {
              const msgs = [...s.messages];
              const lastIdx = msgs.length - 1;
              if (msgs[lastIdx]?.role === "assistant") {
                msgs[lastIdx] = { ...msgs[lastIdx], content: aiContent };
              } else {
                msgs.push({ role: "assistant", content: aiContent });
              }
              return { ...s, messages: msgs };
            });
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          const msg = String(err);
          if (aiContent) {
            aiContent += `\n\n[错误: ${msg}]`;
          } else {
            aiContent = `[错误: ${msg}]`;
          }
          setState((s) => ({
            ...s,
            error: msg,
            messages: [...s.messages, { role: "assistant", content: aiContent }],
          }));
        }
      }

      abortRef.current = null;

      // Persist to repository (authenticated only)
      if (!isDemo && supabase && userId && stateRef.current.activeSessionId) {
        setState((s) => ({ ...s, saveStatus: "saving" }));
        try {
          const sessionId = stateRef.current.activeSessionId!;
          // Ensure branch exists
          const branches = await Repo.listBranches(supabase, sessionId);
          let branchId = branches[0]?.id;
          if (!branchId) {
            // Create a default branch via raw insert (branches not in Repo create)
            const { data: br } = await supabase
              .from("branches")
              .insert({ session_id: sessionId, user_id: userId, name: "主线" })
              .select()
              .single();
            branchId = (br as { id: string })?.id;
          }

          if (branchId) {
            await Repo.createMessage(supabase, userId, {
              session_id: sessionId,
              branch_id: branchId,
              role: "user",
              content_text: text,
            });
            if (aiContent) {
              await Repo.createMessage(supabase, userId, {
                session_id: sessionId,
                branch_id: branchId,
                role: "assistant",
                content_text: aiContent,
              });
            }
            await Repo.updateSession(supabase, sessionId, userId, { last_message_at: new Date().toISOString() });
          }
          setState((s) => ({ ...s, saveStatus: "saved" }));
        } catch {
          setState((s) => ({ ...s, saveStatus: "error" }));
        }
      } else {
        // Demo: just mark saved
        setState((s) => ({ ...s, saveStatus: "saved" }));
      }

      setState((s) => ({ ...s, isStreaming: false, isSending: false }));

      // Refresh session list for updated lastMessageAt
      if (!isDemo) loadSessions();
    },
    [isDemo, userId, buildConfig, loadSessions],
  );

  const regenerateLast = useCallback(async () => {
    const msgs = stateRef.current.messages;
    // Find last user message
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "user") {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx < 0) return;

    // Remove everything after the last user message
    const trimmed = msgs.slice(0, lastUserIdx + 1);
    setState((s) => ({ ...s, messages: trimmed }));

    // Trigger same as send
    const userText = msgs[lastUserIdx].content;
    await new Promise((r) => setTimeout(r, 50)); // let state settle
    await sendMessage(userText);
  }, [sendMessage]);

  const editAndResend = useCallback(
    async (messageIndex: number, newText: string) => {
      const msgs = stateRef.current.messages;
      if (messageIndex >= msgs.length || msgs[messageIndex].role !== "user") return;

      const trimmed = msgs.slice(0, messageIndex);
      const editedMsg: ChatMessage = { role: "user", content: newText };
      setState((s) => ({ ...s, messages: [...trimmed, editedMsg] }));
      await new Promise((r) => setTimeout(r, 50));
      await sendMessage(newText);
    },
    [sendMessage],
  );

  const deleteMessage = useCallback(
    (messageIndex: number) => {
      setState((s) => {
        const msgs = [...s.messages];
        msgs.splice(messageIndex, 1);
        return { ...s, messages: msgs };
      });
    },
    [],
  );

  const copyMessage = useCallback((messageIndex: number) => {
    const text = stateRef.current.messages[messageIndex]?.content;
    if (text) navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  const retry = useCallback(async () => {
    // Find last user message and resend
    const msgs = stateRef.current.messages;
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "user") {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx < 0) return;

    setState((s) => ({ ...s, error: null }));
    await sendMessage(msgs[lastUserIdx].content);
  }, [sendMessage]);

  // ---------- provider info ----------

  const providerLabel = isDemo ? "Mock (Demo)" : storedProvider === "deepseek" ? "DeepSeek" : "OpenAI Compatible";
  const modelLabel = isDemo ? "mock" : state.model;
  const runtimeMode = isDemo ? "demo_mock" : "byok_local_device";

  // ---------- init ----------

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    ...state,
    createSession,
    selectSession,
    deleteSession,
    sendMessage,
    stopGeneration,
    regenerateLast,
    editAndResend,
    deleteMessage,
    copyMessage,
    retry,
    isDemo,
    apiConfigured,
    providerLabel,
    modelLabel,
    runtimeMode,
    messageCount: state.messages.length,
  };
}

// Standalone import for demo init
import { getDefaultDemoSession } from "../mock/demoData";

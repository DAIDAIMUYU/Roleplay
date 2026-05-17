import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "../../auth/supabaseClient";
import type { ChatMessage } from "../providers/provider.types";
import type { ProviderType, ApiKeyStorageMode, ModelProviderConfig } from "../providers/provider.types";
import { DEFAULT_PROVIDER_CONFIG } from "../providers/provider.types";
import { sendProviderStreamRequest, buildConfigFromStorage } from "../providers/providerGateway";
import { loadApiKey } from "../storage/apiKeyStorage";
import * as Repo from "../repositories/roleplayRepository";
import { createDemoSession, getDefaultDemoSession } from "../mock/demoData";
import type { CharacterRow, PromptTemplateRow } from "../types/database";
import { buildCharacterSystemPrompt, parseSessionMeta, buildSessionMeta } from "../utils/characterPrompt";

// ---------- types ----------

export interface SessionLike {
  id: string;
  title: string;
  mode: string;
  lastMessageAt: string | null;
  characterId: string | null;
  characterName: string | null;
  characterEmoji: string | null;
  templateId: string | null;
  templateTitle: string | null;
}

export interface ChatState {
  sessions: SessionLike[];
  activeSessionId: string | null;
  activeCharacter: CharacterRow | null;
  activeTemplate: PromptTemplateRow | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  isSending: boolean;
  error: string | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
  provider: ProviderType;
  model: string;
}

export interface ChatActions {
  createSession: (characterId?: string, templateId?: string) => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  stopGeneration: () => void;
  regenerateLast: () => Promise<void>;
  editAndResend: (messageIndex: number, newText: string) => Promise<void>;
  deleteMessage: (messageIndex: number) => void;
  copyMessage: (messageIndex: number) => void;
  retry: () => Promise<void>;
  isDemo: boolean;
  apiConfigured: boolean;
  providerLabel: string;
  modelLabel: string;
  runtimeMode: string;
  messageCount: number;
  systemPrompt: string | null;
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
    activeCharacter: null,
    activeTemplate: null,
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

  const getApiKey = useCallback((): string | null => {
    if (isDemo) return "mock-no-key-needed";
    return loadApiKey(storedProvider, storageMode)?.apiKey ?? null;
  }, [isDemo, storedProvider, storageMode]);

  const apiConfigured = !isDemo && getApiKey() !== null;

  const buildConfig = useCallback((): ModelProviderConfig => {
    const key = getApiKey() || "";
    return buildConfigFromStorage(isDemo ? "mock" : storedProvider, key, storageMode, stateRef.current.model, undefined);
  }, [isDemo, storedProvider, storageMode, getApiKey]);

  // Build the FULL system prompt (character + template merged)
  const buildSystemPrompt = useCallback((): string | null => {
    const char = stateRef.current.activeCharacter;
    const tpl = stateRef.current.activeTemplate;
    if (!char) return null;
    return buildCharacterSystemPrompt(char, tpl?.content);
  }, []);

  // ---------- session management ----------

  const loadSessions = useCallback(async () => {
    if (isDemo) {
      const demo = getDefaultDemoSession();
      setState((s) => ({
        ...s,
        sessions: [{ id: demo.id, title: demo.title, mode: "demo_mock", lastMessageAt: demo.lastMessageAt, characterId: null, characterName: null, characterEmoji: null, templateId: null, templateTitle: null }],
        activeSessionId: s.activeSessionId || demo.id,
        messages: s.activeSessionId ? s.messages : demo.messages,
      }));
      return;
    }
    if (!supabase) return;

    const rows = await Repo.listSessions(supabase, userId!);
    const sessions: SessionLike[] = await Promise.all(
      rows.map(async (r) => {
        let charName: string | null = null;
        let charEmoji: string | null = null;
        let tplTitle: string | null = null;

        // Load character from session_participants first, then fallback to primary_character_id
        const parts = await Repo.listSessionParticipants(supabase!, r.id);
        const charPart = parts.find((p) => p.participant_type === "character" && p.character_id);
        const boundCharId = charPart?.character_id || r.primary_character_id;

        if (boundCharId) {
          const char = await Repo.getCharacter(supabase!, boundCharId);
          if (char) { charName = char.name; charEmoji = char.avatar_emoji; }
        }

        // Load template from session metadata
        const meta = parseSessionMeta(r.system_prompt);
        const tplId = meta._template_id;
        if (tplId) {
          const tpl = await Repo.getPromptTemplate(supabase!, tplId);
          if (tpl) tplTitle = tpl.title;
        }

        return {
          id: r.id, title: r.title, mode: r.mode,
          lastMessageAt: r.last_message_at,
          characterId: boundCharId, characterName: charName, characterEmoji: charEmoji,
          templateId: tplId ?? null, templateTitle: tplTitle,
        };
      }),
    );

    setState((s) => ({ ...s, sessions, activeSessionId: s.activeSessionId || sessions[0]?.id || null }));
  }, [isDemo, userId]);

  const createSession = useCallback(async (characterId?: string, templateId?: string) => {
    if (isDemo) {
      const demo = createDemoSession();
      setState((s) => ({
        ...s,
        sessions: [{ id: demo.id, title: demo.title, mode: "demo_mock", lastMessageAt: demo.lastMessageAt, characterId: null, characterName: null, characterEmoji: null, templateId: null, templateTitle: null }, ...s.sessions],
        activeSessionId: demo.id, activeCharacter: null, activeTemplate: null,
        messages: demo.messages, error: null,
      }));
      return;
    }
    if (!supabase || !userId) return;

    try {
      let character: CharacterRow | null = null;
      let template: PromptTemplateRow | null = null;

      if (characterId) character = await Repo.getCharacter(supabase, characterId);
      if (templateId) template = await Repo.getPromptTemplate(supabase, templateId);

      const title = character ? `${character.name} · 新会话` : `新会话 ${new Date().toLocaleTimeString("zh-CN")}`;

      // Build session metadata with template binding
      const systemPrompt = buildSessionMeta(templateId ?? null);

      const row = await Repo.createSession(supabase, userId, {
        title,
        primary_character_id: characterId ?? undefined,
        system_prompt: systemPrompt,
      });
      if (!row) throw new Error("创建会话失败");

      // Write session_participants
      if (characterId) {
        await Repo.ensureSessionParticipant(supabase, userId, row.id, characterId).catch(() => {});
      }

      // Auto-greeting
      let msgs: ChatMessage[] = [];
      if (character) {
        const card = character.card_json as Record<string, unknown>;
        const greet = String(card?.greeting ?? "");
        if (greet) {
          msgs.push({ role: "assistant", content: greet });
          // Ensure branch exists
          const branches = await Repo.listBranches(supabase, row.id);
          let branchId = branches[0]?.id;
          if (!branchId) {
            const { data: br } = await supabase.from("branches").insert({ session_id: row.id, user_id: userId, name: "主线" }).select().single();
            branchId = (br as { id: string })?.id;
          }
          if (branchId) {
            await Repo.createMessage(supabase, userId, {
              session_id: row.id, branch_id: branchId,
              role: "assistant", content_text: greet,
              character_id: characterId,
            });
          }
        }
        // Build system prompt and add as invisible system message
        const sp = buildCharacterSystemPrompt(character, template?.content);
        if (sp) msgs.unshift({ role: "system", content: sp });
      }

      const session: SessionLike = {
        id: row.id, title: row.title, mode: row.mode,
        lastMessageAt: null, characterId: characterId ?? null,
        characterName: character?.name ?? null, characterEmoji: character?.avatar_emoji ?? null,
        templateId: templateId ?? null, templateTitle: template?.title ?? null,
      };

      setState((s) => ({
        ...s,
        sessions: [session, ...s.sessions],
        activeSessionId: session.id,
        activeCharacter: character,
        activeTemplate: template,
        messages: msgs,
        error: null,
      }));
    } catch (e) {
      setState((s) => ({ ...s, error: `创建会话失败: ${String(e)}` }));
    }
  }, [isDemo, userId]);

  const selectSession = useCallback(async (id: string) => {
    if (isDemo) {
      const demo = getDefaultDemoSession();
      setState((s) => ({ ...s, activeSessionId: id, activeCharacter: null, activeTemplate: null, messages: demo.messages, error: null }));
      return;
    }
    if (!supabase) return;

    setState((s) => ({ ...s, activeSessionId: id, error: null }));

    try {
      const session = await Repo.getSession(supabase, id);

      // Load character from session_participants
      let character: CharacterRow | null = null;
      const parts = await Repo.listSessionParticipants(supabase, id);
      const charPart = parts.find((p) => p.participant_type === "character" && p.character_id);
      const charId = charPart?.character_id || session?.primary_character_id;
      if (charId) character = await Repo.getCharacter(supabase, charId);

      // Load template from session metadata
      let template: PromptTemplateRow | null = null;
      const meta = parseSessionMeta(session?.system_prompt ?? null);
      if (meta._template_id) {
        template = await Repo.getPromptTemplate(supabase, meta._template_id);
      }

      // Build system prompt
      let systemMsgs: ChatMessage[] = [];
      if (character) {
        const sp = buildCharacterSystemPrompt(character, template?.content);
        if (sp) systemMsgs.push({ role: "system", content: sp });
      }

      const rows = await Repo.listMessages(supabase, id);
      const messages: ChatMessage[] = [...systemMsgs, ...rows.map((r) => ({
        role: r.role as ChatMessage["role"],
        content: r.content_text,
      }))];

      setState((s) => ({ ...s, activeCharacter: character, activeTemplate: template, messages }));
    } catch {
      setState((s) => ({ ...s, messages: [], activeCharacter: null, activeTemplate: null }));
    }
  }, [isDemo]);

  const deleteSession = useCallback(async (id: string) => {
    if (isDemo) {
      setState((s) => ({
        ...s,
        sessions: s.sessions.filter((ses) => ses.id !== id),
        activeSessionId: s.activeSessionId === id ? (s.sessions[0]?.id ?? null) : s.activeSessionId,
      }));
      return;
    }
    if (!supabase || !userId) return;
    try {
      await Repo.clearSessionMessages(supabase, id, userId);
      await Repo.deleteSession(supabase, id, userId);
      setState((s) => {
        const updated = s.sessions.filter((ses) => ses.id !== id);
        return { ...s, sessions: updated, activeSessionId: s.activeSessionId === id ? (updated[0]?.id ?? null) : s.activeSessionId, activeCharacter: s.activeSessionId === id ? null : s.activeCharacter };
      });
    } catch (e) {
      setState((s) => ({ ...s, error: `删除失败: ${String(e)}` }));
    }
  }, [isDemo, userId]);

  // ---------- message operations ----------

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((s) => ({ ...s, isStreaming: false, isSending: false }));
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (stateRef.current.isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const prevMessages = stateRef.current.messages;

    // Build provider messages with system prompt
    const systemPrompt = buildSystemPrompt();
    const providerMessages: ChatMessage[] = [];
    if (systemPrompt) providerMessages.push({ role: "system", content: systemPrompt });
    const chatMsgs = prevMessages.filter((m) => m.role !== "system");
    providerMessages.push(...chatMsgs, userMsg);

    setState((s) => ({ ...s, messages: [...s.messages, userMsg], isSending: true, isStreaming: true, error: null, saveStatus: "idle" }));

    const controller = new AbortController();
    abortRef.current = controller;
    let aiContent = "";

    try {
      const config = buildConfig();
      const stream = sendProviderStreamRequest(isDemo, config, providerMessages, controller.signal);
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
        aiContent = aiContent ? `${aiContent}\n\n[错误: ${msg}]` : `[错误: ${msg}]`;
        setState((s) => ({ ...s, error: msg, messages: [...s.messages, { role: "assistant", content: aiContent }] }));
      }
    }

    abortRef.current = null;

    // Persist
    if (!isDemo && supabase && userId && stateRef.current.activeSessionId) {
      setState((s) => ({ ...s, saveStatus: "saving" }));
      try {
        const sessionId = stateRef.current.activeSessionId!;
        const charId = stateRef.current.activeCharacter?.id ?? null;

        const branches = await Repo.listBranches(supabase, sessionId);
        let branchId = branches[0]?.id;
        if (!branchId) {
          const { data: br } = await supabase.from("branches").insert({ session_id: sessionId, user_id: userId, name: "主线" }).select().single();
          branchId = (br as { id: string })?.id;
        }

        if (branchId) {
          await Repo.createMessage(supabase, userId, {
            session_id: sessionId, branch_id: branchId, role: "user", content_text: text,
          });
          if (aiContent) {
            await Repo.createMessage(supabase, userId, {
              session_id: sessionId, branch_id: branchId, role: "assistant", content_text: aiContent,
              character_id: charId ?? undefined,
            });
          }
          await Repo.updateSession(supabase, sessionId, userId, { last_message_at: new Date().toISOString() });
        }
        setState((s) => ({ ...s, saveStatus: "saved" }));
      } catch {
        setState((s) => ({ ...s, saveStatus: "error" }));
      }
    } else {
      setState((s) => ({ ...s, saveStatus: "saved" }));
    }

    setState((s) => ({ ...s, isStreaming: false, isSending: false }));
    if (!isDemo) loadSessions();
  }, [isDemo, userId, buildConfig, loadSessions, buildSystemPrompt]);

  const regenerateLast = useCallback(async () => {
    const msgs = stateRef.current.messages.filter((m) => m.role !== "system");
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) { if (msgs[i].role === "user") { lastUserIdx = i; break; } }
    if (lastUserIdx < 0) return;
    const trimmed = msgs.slice(0, lastUserIdx + 1);
    setState((s) => { const sys = s.messages.filter((m) => m.role === "system"); return { ...s, messages: [...sys, ...trimmed] }; });
    await new Promise((r) => setTimeout(r, 50));
    await sendMessage(msgs[lastUserIdx].content);
  }, [sendMessage]);

  const editAndResend = useCallback(async (messageIndex: number, newText: string) => {
    const msgs = stateRef.current.messages;
    if (messageIndex >= msgs.length || msgs[messageIndex].role !== "user") return;
    const trimmed = msgs.slice(0, messageIndex);
    setState((s) => ({ ...s, messages: [...trimmed, { role: "user", content: newText }] }));
    await new Promise((r) => setTimeout(r, 50));
    await sendMessage(newText);
  }, [sendMessage]);

  const deleteMessage = useCallback((messageIndex: number) => {
    setState((s) => { const msgs = [...s.messages]; msgs.splice(messageIndex, 1); return { ...s, messages: msgs }; });
  }, []);

  const copyMessage = useCallback((messageIndex: number) => {
    const text = stateRef.current.messages[messageIndex]?.content;
    if (text) navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  const retry = useCallback(async () => {
    const msgs = stateRef.current.messages.filter((m) => m.role !== "system");
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) { if (msgs[i].role === "user") { lastUserIdx = i; break; } }
    if (lastUserIdx < 0) return;
    setState((s) => ({ ...s, error: null }));
    await sendMessage(msgs[lastUserIdx].content);
  }, [sendMessage]);

  // ---------- info ----------
  const providerLabel = isDemo ? "Mock (Demo)" : storedProvider === "deepseek" ? "DeepSeek" : "OpenAI Compatible";
  const modelLabel = isDemo ? "mock" : state.model;
  const runtimeMode = isDemo ? "demo_mock" : "byok_local_device";
  const systemPrompt = buildSystemPrompt();

  useEffect(() => { loadSessions(); }, [loadSessions]);

  return {
    ...state,
    createSession, selectSession, deleteSession,
    sendMessage, stopGeneration, regenerateLast, editAndResend, deleteMessage, copyMessage, retry,
    isDemo, apiConfigured, providerLabel, modelLabel, runtimeMode,
    messageCount: state.messages.filter((m) => m.role !== "system").length,
    systemPrompt,
  };
}

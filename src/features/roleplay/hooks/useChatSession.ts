import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../auth/supabaseClient";
import type { ApiKeyStorageMode, ChatMessage, ModelProviderConfig, ProviderType } from "../providers/provider.types";
import { DEFAULT_PROVIDER_CONFIG } from "../providers/provider.types";
import { buildConfigFromStorage, sendProviderStreamRequest } from "../providers/providerGateway";
import { loadApiKey } from "../storage/apiKeyStorage";
import * as Repo from "../repositories/roleplayRepository";
import { createDemoSession, getDefaultDemoSession } from "../mock/demoData";
import type { CharacterRow, MessageRevisionRow, PromptTemplateRow, SessionRow } from "../types/database";
import { buildCharacterSystemPrompt, buildSessionMeta, parseSessionMeta, SESSION_META_VERSION, type SessionMeta } from "../utils/characterPrompt";
import { buildContext, type ContextBuildOutput } from "../context/contextBuilder";

export interface SessionLike {
  id: string;
  title: string;
  mode: string;
  lastMessageAt: string | null;
  characterId: string | null;
  characterName: string | null;
  characterEmoji: string | null;
}

export interface ChatState {
  sessions: SessionLike[];
  activeSessionId: string | null;
  activeCharacter: CharacterRow | null;
  activeTemplate: PromptTemplateRow | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  isSending: boolean;
  isContextLoading: boolean;
  error: string | null;
  saveStatus: "idle" | "saving" | "saved" | "error";
  provider: ProviderType;
  model: string;
  lastContextOutput: ContextBuildOutput | null;
  contextPreviewError: string | null;
  worldbookIds: string[];
  memoryIds: string[];
  disabledWbIds: string[];
  disabledMemIds: string[];
  summaryEnabled: boolean;
  summaryText: string;
  activeBranchId: string | null;
  activeBranchName: string | null;
  contextRunSaveStatus: "idle" | "saved" | "failed" | null;
  messageDbIds: Map<number, string>;
  messageRevisions: Map<string, MessageRevisionRow[]>;
  messageRevisionCounts: Map<string, number>;
  editedIndices: Set<number>;
}

export interface ChatActions {
  createSession: (characterId?: string) => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  stopGeneration: () => void;
  regenerateLast: () => Promise<void>;
  editAndResend: (mi: number, nt: string) => Promise<void>;
  deleteMessage: (mi: number) => Promise<void>;
  copyMessage: (mi: number) => void;
  retry: () => Promise<void>;
  addTemplate: (id: string) => Promise<void>;
  removeTemplate: () => Promise<void>;
  addWorldbooks: (ids: string[]) => Promise<void>;
  removeWorldbook: (id: string) => Promise<void>;
  toggleWorldbook: (id: string) => Promise<void>;
  addMemories: (ids: string[]) => Promise<void>;
  removeMemory: (id: string) => Promise<void>;
  toggleMemory: (id: string) => Promise<void>;
  saveSummary: (text: string) => Promise<void>;
  clearSummary: () => Promise<void>;
  generateSummary: () => Promise<string | null>;
  loadMessageRevisions: (messageIndex: number) => Promise<MessageRevisionRow[]>;
  isDemo: boolean;
  apiConfigured: boolean;
  providerLabel: string;
  modelLabel: string;
  runtimeMode: string;
  messageCount: number;
  systemPrompt: string | null;
}

interface BuiltContext {
  output: ContextBuildOutput | null;
  session: SessionRow | null;
  character: CharacterRow | null;
  template: PromptTemplateRow | null;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function toChatMessages(rows: Awaited<ReturnType<typeof Repo.listMessages>>): ChatMessage[] {
  return rows.map((row) => ({ role: row.role as ChatMessage["role"], content: row.content_text }));
}

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
    isContextLoading: false,
    error: null,
    saveStatus: "idle",
    provider: storedProvider,
    model: storedModel || DEFAULT_PROVIDER_CONFIG.model,
    lastContextOutput: null,
    contextPreviewError: null,
    worldbookIds: [],
    memoryIds: [],
    disabledWbIds: [],
    disabledMemIds: [],
    summaryEnabled: false,
    summaryText: "",
    activeBranchId: null,
    activeBranchName: null,
    contextRunSaveStatus: null,
    messageDbIds: new Map(),
    messageRevisions: new Map(),
    messageRevisionCounts: new Map(),
    editedIndices: new Set(),
  });

  const abortRef = useRef<AbortController | null>(null);
  const previewSeqRef = useRef(0);
  const loadedSessionRef = useRef<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const isDemo = isGuestOrDemo || !supabase;

  const getApiKey = useCallback((): string | null => {
    if (isDemo) return "mock-no-key-needed";
    return loadApiKey(storedProvider, storageMode)?.apiKey ?? null;
  }, [isDemo, storedProvider, storageMode]);

  const apiConfigured = !isDemo && getApiKey() !== null;

  const buildConfig = useCallback((): ModelProviderConfig => {
    return buildConfigFromStorage(
      isDemo ? "mock" : storedProvider,
      getApiKey() || "",
      storageMode,
      stateRef.current.model,
      undefined,
    );
  }, [getApiKey, isDemo, storageMode, storedProvider]);

  const syncMeta = useCallback(async (updates: Partial<SessionMeta>) => {
    if (isDemo || !supabase || !userId || !stateRef.current.activeSessionId) return;
    const s = stateRef.current;
    const activeSessionId = s.activeSessionId;
    if (!activeSessionId) return;
    const merged: SessionMeta = {
      _meta_version: SESSION_META_VERSION,
      _template_id: s.activeTemplate?.id,
      _worldbook_ids: s.worldbookIds,
      _memory_ids: s.memoryIds,
      _disabled_worldbook_ids: s.disabledWbIds,
      _disabled_memory_ids: s.disabledMemIds,
      _summary_enabled: s.summaryEnabled,
      ...updates,
    };
    await Repo.updateSession(supabase, activeSessionId, userId, { system_prompt: JSON.stringify(merged) }).catch(() => {});
  }, [isDemo, userId]);

  const loadSessions = useCallback(async () => {
    if (isDemo) {
      const demo = getDefaultDemoSession();
      setState((s) => ({
        ...s,
        sessions: [{ id: demo.id, title: demo.title, mode: "demo_mock", lastMessageAt: demo.lastMessageAt, characterId: null, characterName: null, characterEmoji: null }],
        activeSessionId: s.activeSessionId || demo.id,
        messages: s.activeSessionId ? s.messages : demo.messages,
      }));
      return;
    }
    if (!supabase || !userId) return;

    const rows = await Repo.listSessions(supabase, userId);
    const sessionIds = rows.map((row) => row.id);
    const participants = await Repo.listSessionParticipantsForSessions(supabase, sessionIds);
    const characterIds = unique(participants.filter((p) => p.participant_type === "character" && p.character_id).map((p) => p.character_id as string));
    const characters = await Repo.listCharactersByIds(supabase, characterIds);
    const characterById = new Map(characters.map((character) => [character.id, character]));

    const sessions: SessionLike[] = rows.map((row) => {
      const participant = participants.find((p) => p.session_id === row.id && p.participant_type === "character" && p.character_id);
      const character = participant?.character_id ? characterById.get(participant.character_id) : null;
      return {
        id: row.id,
        title: row.title,
        mode: row.mode,
        lastMessageAt: row.last_message_at,
        characterId: participant?.character_id ?? null,
        characterName: character?.name ?? (participant?.character_id ? "Deleted character" : null),
        characterEmoji: character?.avatar_emoji ?? null,
      };
    });

    setState((s) => {
      const activeStillExists = !!s.activeSessionId && sessions.some((session) => session.id === s.activeSessionId);
      const activeSessionId = activeStillExists ? s.activeSessionId : (sessions[0]?.id ?? null);
      if (!activeSessionId) loadedSessionRef.current = null;
      return {
        ...s,
        sessions,
        activeSessionId,
        activeCharacter: activeSessionId ? s.activeCharacter : null,
        activeTemplate: activeSessionId ? s.activeTemplate : null,
        messages: activeSessionId ? s.messages : [],
        worldbookIds: activeSessionId ? s.worldbookIds : [],
        memoryIds: activeSessionId ? s.memoryIds : [],
        disabledWbIds: activeSessionId ? s.disabledWbIds : [],
        disabledMemIds: activeSessionId ? s.disabledMemIds : [],
        summaryEnabled: activeSessionId ? s.summaryEnabled : false,
        summaryText: activeSessionId ? s.summaryText : "",
        lastContextOutput: activeSessionId ? s.lastContextOutput : null,
        activeBranchId: activeSessionId ? s.activeBranchId : null,
        activeBranchName: activeSessionId ? s.activeBranchName : null,
        contextRunSaveStatus: activeSessionId ? s.contextRunSaveStatus : null,
        messageDbIds: activeSessionId ? s.messageDbIds : new Map(),
        messageRevisions: activeSessionId ? s.messageRevisions : new Map(),
        messageRevisionCounts: activeSessionId ? s.messageRevisionCounts : new Map(),
        editedIndices: activeSessionId ? s.editedIndices : new Set(),
      };
    });
  }, [isDemo, userId]);

  const buildCurrentContext = useCallback(async (userMessage: string, messagesOverride?: ChatMessage[]): Promise<BuiltContext> => {
    const s = stateRef.current;
    if (isDemo || !supabase || !userId || !s.activeSessionId) {
      return { output: null, session: null, character: s.activeCharacter, template: s.activeTemplate };
    }

    const sessionId = s.activeSessionId;
    const [session, participants, allEntries, allMems] = await withTimeout(
      Promise.all([
        Repo.getSession(supabase, sessionId),
        Repo.listSessionParticipants(supabase, sessionId),
        Repo.listAllWorldbookEntries(supabase, userId),
        Repo.listAllActiveMemories(supabase, userId),
      ]),
      5000,
      "context data load timed out",
    );

    const meta = parseSessionMeta(session?.system_prompt ?? null);
    const participant = participants.find((p) => p.participant_type === "character" && p.character_id);
    const characterId = participant?.character_id ?? session?.primary_character_id ?? null;
    const [character, template] = await withTimeout(
      Promise.all([
        characterId ? Repo.getCharacter(supabase, characterId).catch(() => null) : Promise.resolve(null),
        meta._template_id ? Repo.getPromptTemplate(supabase, meta._template_id).catch(() => null) : Promise.resolve(s.activeTemplate),
      ]),
      5000,
      "context character load timed out",
    );

    const activeWbIds = s.worldbookIds.filter((id) => !s.disabledWbIds.includes(id));
    const boundEntries = allEntries.filter((entry) => activeWbIds.includes(entry.worldbook_id));
    const globalEntries = allEntries.filter((entry) => entry.scope === "global" && !activeWbIds.includes(entry.worldbook_id));
    const activeMemIds = s.memoryIds.filter((id) => !s.disabledMemIds.includes(id));
    const relevantMems = allMems.filter((memory) => activeMemIds.includes(memory.id));
    const recentMessages = (messagesOverride ?? s.messages).filter((message) => message.role !== "system");

    const output = buildContext({
      character,
      template,
      worldbookEntries: [...boundEntries, ...globalEntries],
      memories: relevantMems,
      sessionSummary: s.summaryEnabled ? (session?.story_summary || s.summaryText) : null,
      userMessage,
      recentMessages,
      activeSessionId: sessionId,
    });

    return { output, session, character, template };
  }, [isDemo, userId]);

  const createSession = useCallback(async (characterId?: string) => {
    if (isDemo) {
      const demo = createDemoSession();
      loadedSessionRef.current = demo.id;
      setState((s) => ({
        ...s,
        sessions: [{ id: demo.id, title: demo.title, mode: "demo_mock", lastMessageAt: demo.lastMessageAt, characterId: null, characterName: null, characterEmoji: null }, ...s.sessions],
        activeSessionId: demo.id,
        activeCharacter: null,
        activeTemplate: null,
        messages: demo.messages,
        lastContextOutput: null,
        contextPreviewError: null,
        activeBranchId: null,
        activeBranchName: null,
        contextRunSaveStatus: null,
        messageDbIds: new Map(),
        messageRevisions: new Map(),
        messageRevisionCounts: new Map(),
      }));
      return;
    }
    if (!supabase || !userId) return;

    setState((s) => ({ ...s, isContextLoading: true, error: null }));
    try {
      const character = characterId ? await Repo.getCharacter(supabase, characterId) : null;
      const title = character ? `${character.name} - new chat` : `New chat ${new Date().toLocaleTimeString("zh-CN")}`;
      const row = await Repo.createSession(supabase, userId, { title, primary_character_id: characterId ?? undefined, system_prompt: buildSessionMeta({ _meta_version: SESSION_META_VERSION }) });
      if (!row) throw new Error("create session failed");
      if (characterId) await Repo.ensureSessionParticipant(supabase, userId, row.id, characterId).catch(() => {});

      const branch = await Repo.ensureDefaultBranch(supabase, row.id, userId);
      const branchId = branch?.id;
      const branchName = branch?.title || branch?.name || "主线";

      const messages: ChatMessage[] = [];
      const greeting = character ? String((character.card_json as Record<string, unknown>)?.greeting ?? "") : "";
      const dbIdMap = new Map<number, string>();
      if (character && greeting) {
        messages.push({ role: "assistant", content: greeting });
        if (branchId) {
          const saved = await Repo.createMessage(supabase, userId, { session_id: row.id, branch_id: branchId, role: "assistant", content_text: greeting, character_id: characterId });
          if (saved) dbIdMap.set(0, saved.id);
        }
      }

      const preview = buildContext({ character, template: null, worldbookEntries: [], memories: [], sessionSummary: null, userMessage: "", recentMessages: messages, activeSessionId: row.id });
      loadedSessionRef.current = row.id;
      setState((s) => ({
        ...s,
        sessions: [{ id: row.id, title: row.title, mode: row.mode, lastMessageAt: null, characterId: characterId ?? null, characterName: character?.name ?? null, characterEmoji: character?.avatar_emoji ?? null }, ...s.sessions],
        activeSessionId: row.id,
        activeCharacter: character,
        activeTemplate: null,
        messages,
        worldbookIds: [],
        memoryIds: [],
        disabledWbIds: [],
        disabledMemIds: [],
        summaryEnabled: false,
        summaryText: "",
        lastContextOutput: preview,
        contextPreviewError: null,
        isContextLoading: false,
        activeBranchId: branchId ?? null,
        activeBranchName: branchName,
        contextRunSaveStatus: null,
        messageDbIds: dbIdMap,
        messageRevisions: new Map(),
        messageRevisionCounts: new Map(),
        editedIndices: new Set(),
      }));
    } catch (error) {
      setState((s) => ({ ...s, error: String(error), isContextLoading: false }));
    }
  }, [isDemo, userId]);

  const selectSession = useCallback(async (id: string) => {
    if (isDemo) {
      const demo = getDefaultDemoSession();
      loadedSessionRef.current = id;
      setState((s) => ({ ...s, activeSessionId: id, messages: demo.messages, activeCharacter: null, activeTemplate: null, isContextLoading: false, activeBranchId: null, activeBranchName: null, contextRunSaveStatus: null, messageDbIds: new Map(), messageRevisions: new Map(), messageRevisionCounts: new Map() }));
      return;
    }
    if (!supabase) return;

    setState((s) => ({ ...s, activeSessionId: id, error: null, isContextLoading: true, lastContextOutput: null, contextPreviewError: null }));
    try {
      const [session, participants, branch, rows] = await withTimeout(
        Promise.all([
          Repo.getSession(supabase, id),
          Repo.listSessionParticipants(supabase, id),
          Repo.ensureDefaultBranch(supabase, id, userId!),
          Repo.listMessages(supabase, id),
        ]),
        5000,
        "session load timed out",
      );
      const participant = participants.find((p) => p.participant_type === "character" && p.character_id);
      const characterId = participant?.character_id ?? session?.primary_character_id ?? null;
      const meta = parseSessionMeta(session?.system_prompt ?? null);
      const [character, template] = await withTimeout(
        Promise.all([
          characterId ? Repo.getCharacter(supabase, characterId).catch(() => null) : Promise.resolve(null),
          meta._template_id ? Repo.getPromptTemplate(supabase, meta._template_id).catch(() => null) : Promise.resolve(null),
        ]),
        5000,
        "session character load timed out",
      );

      const dbIdMap = new Map<number, string>();
      const editedIdxSet = new Set<number>();
      rows.forEach((row, i) => {
        dbIdMap.set(i, row.id);
        if ((row.revision_no ?? 1) > 1) editedIdxSet.add(i);
      });
      const revisionCounts = await withTimeout(
        Repo.getMessageRevisionCounts(supabase, rows.map((row) => row.id)).catch((error) => {
          console.warn("[Chat] message revision count load failed:", error);
          return new Map<string, number>();
        }),
        5000,
        "message revision count load timed out",
      ).catch((error) => {
        console.warn("[Chat] message revision count load failed:", error);
        return new Map<string, number>();
      });
      rows.forEach((row, i) => {
        if ((revisionCounts.get(row.id) ?? 0) > 0) editedIdxSet.add(i);
      });

      loadedSessionRef.current = id;
      setState((s) => ({
        ...s,
        activeCharacter: character,
        activeTemplate: template,
        messages: toChatMessages(rows),
        worldbookIds: meta._worldbook_ids ?? [],
        memoryIds: meta._memory_ids ?? [],
        disabledWbIds: meta._disabled_worldbook_ids ?? [],
        disabledMemIds: meta._disabled_memory_ids ?? [],
        summaryEnabled: meta._summary_enabled ?? false,
        summaryText: session?.story_summary || "",
        isContextLoading: false,
        contextPreviewError: null,
        activeBranchId: branch?.id ?? null,
        activeBranchName: branch?.title || branch?.name || "主线",
        contextRunSaveStatus: null,
        messageDbIds: dbIdMap,
        messageRevisions: new Map(),
        messageRevisionCounts: revisionCounts,
        editedIndices: editedIdxSet,
      }));
    } catch (error) {
      loadedSessionRef.current = id;
      setState((s) => ({ ...s, error: String(error), isContextLoading: false, contextPreviewError: "Context preview failed, chat is still available" }));
    }
  }, [isDemo]);

  const deleteSession = useCallback(async (id: string) => {
    if (isDemo) {
      setState((s) => {
        const sessions = s.sessions.filter((session) => session.id !== id);
        const deletingActive = s.activeSessionId === id;
        return deletingActive ? { ...s, sessions, activeSessionId: sessions[0]?.id ?? null, messages: [], activeCharacter: null, activeTemplate: null, lastContextOutput: null, activeBranchId: null, activeBranchName: null, contextRunSaveStatus: null, messageDbIds: new Map(), messageRevisions: new Map(), messageRevisionCounts: new Map(), editedIndices: new Set() } : { ...s, sessions };
      });
      return;
    }
    if (!supabase || !userId) return;
    try {
      await Repo.deleteSession(supabase, id, userId);
      setState((s) => {
        const sessions = s.sessions.filter((session) => session.id !== id);
        const deletingActive = s.activeSessionId === id;
        const nextSessionId = deletingActive ? (sessions[0]?.id ?? null) : s.activeSessionId;
        if (deletingActive) loadedSessionRef.current = null;
        return {
          ...s,
          sessions,
          activeSessionId: nextSessionId,
          activeCharacter: deletingActive ? null : s.activeCharacter,
          activeTemplate: deletingActive ? null : s.activeTemplate,
          messages: deletingActive ? [] : s.messages,
          worldbookIds: deletingActive ? [] : s.worldbookIds,
          memoryIds: deletingActive ? [] : s.memoryIds,
          disabledWbIds: deletingActive ? [] : s.disabledWbIds,
          disabledMemIds: deletingActive ? [] : s.disabledMemIds,
          summaryEnabled: deletingActive ? false : s.summaryEnabled,
          summaryText: deletingActive ? "" : s.summaryText,
          lastContextOutput: deletingActive ? null : s.lastContextOutput,
          contextPreviewError: deletingActive ? null : s.contextPreviewError,
          isContextLoading: false,
          activeBranchId: deletingActive ? null : s.activeBranchId,
          activeBranchName: deletingActive ? null : s.activeBranchName,
          contextRunSaveStatus: deletingActive ? null : s.contextRunSaveStatus,
          messageDbIds: deletingActive ? new Map() : s.messageDbIds,
          messageRevisions: deletingActive ? new Map() : s.messageRevisions,
          messageRevisionCounts: deletingActive ? new Map() : s.messageRevisionCounts,
          editedIndices: deletingActive ? new Set() : s.editedIndices,
        };
      });
    } catch (error) {
      setState((s) => ({ ...s, error: String(error) }));
    }
  }, [isDemo, userId]);

  const addTemplate = useCallback(async (templateId: string) => {
    if (isDemo || !supabase || !userId) return;
    const template = await Repo.getPromptTemplate(supabase, templateId);
    if (!template) return;
    setState((s) => ({ ...s, activeTemplate: template }));
    await syncMeta({ _template_id: templateId });
  }, [isDemo, syncMeta, userId]);

  const removeTemplate = useCallback(async () => {
    setState((s) => ({ ...s, activeTemplate: null }));
    await syncMeta({ _template_id: undefined });
  }, [syncMeta]);

  const addWorldbooks = useCallback(async (ids: string[]) => {
    const worldbookIds = unique([...stateRef.current.worldbookIds, ...ids]);
    setState((s) => ({ ...s, worldbookIds, disabledWbIds: s.disabledWbIds.filter((id) => worldbookIds.includes(id)) }));
    await syncMeta({ _worldbook_ids: worldbookIds });
  }, [syncMeta]);

  const removeWorldbook = useCallback(async (id: string) => {
    const worldbookIds = stateRef.current.worldbookIds.filter((worldbookId) => worldbookId !== id);
    const disabledWbIds = stateRef.current.disabledWbIds.filter((worldbookId) => worldbookId !== id);
    setState((s) => ({ ...s, worldbookIds, disabledWbIds }));
    await syncMeta({ _worldbook_ids: worldbookIds, _disabled_worldbook_ids: disabledWbIds });
  }, [syncMeta]);

  const toggleWorldbook = useCallback(async (id: string) => {
    const disabled = stateRef.current.disabledWbIds.includes(id);
    const disabledWbIds = disabled ? stateRef.current.disabledWbIds.filter((worldbookId) => worldbookId !== id) : [...stateRef.current.disabledWbIds, id];
    setState((s) => ({ ...s, disabledWbIds }));
    await syncMeta({ _disabled_worldbook_ids: disabledWbIds });
  }, [syncMeta]);

  const addMemories = useCallback(async (ids: string[]) => {
    const memoryIds = unique([...stateRef.current.memoryIds, ...ids]);
    setState((s) => ({ ...s, memoryIds, disabledMemIds: s.disabledMemIds.filter((id) => memoryIds.includes(id)) }));
    await syncMeta({ _memory_ids: memoryIds });
  }, [syncMeta]);

  const removeMemory = useCallback(async (id: string) => {
    const memoryIds = stateRef.current.memoryIds.filter((memoryId) => memoryId !== id);
    const disabledMemIds = stateRef.current.disabledMemIds.filter((memoryId) => memoryId !== id);
    setState((s) => ({ ...s, memoryIds, disabledMemIds }));
    await syncMeta({ _memory_ids: memoryIds, _disabled_memory_ids: disabledMemIds });
  }, [syncMeta]);

  const toggleMemory = useCallback(async (id: string) => {
    const disabled = stateRef.current.disabledMemIds.includes(id);
    const disabledMemIds = disabled ? stateRef.current.disabledMemIds.filter((memoryId) => memoryId !== id) : [...stateRef.current.disabledMemIds, id];
    setState((s) => ({ ...s, disabledMemIds }));
    await syncMeta({ _disabled_memory_ids: disabledMemIds });
  }, [syncMeta]);

  const saveSummary = useCallback(async (text: string) => {
    setState((s) => ({ ...s, summaryText: text, summaryEnabled: !!text }));
    if (!isDemo && supabase && userId && stateRef.current.activeSessionId) {
      await Repo.updateSession(supabase, stateRef.current.activeSessionId, userId, { story_summary: text || null }).catch(() => {});
    }
    await syncMeta({ _summary_enabled: !!text });
  }, [isDemo, syncMeta, userId]);

  const clearSummary = useCallback(async () => {
    setState((s) => ({ ...s, summaryText: "", summaryEnabled: false }));
    if (!isDemo && supabase && userId && stateRef.current.activeSessionId) {
      await Repo.updateSession(supabase, stateRef.current.activeSessionId, userId, { story_summary: null }).catch(() => {});
    }
    await syncMeta({ _summary_enabled: false });
  }, [isDemo, syncMeta, userId]);

  const generateSummary = useCallback(async (): Promise<string | null> => {
    if (isDemo || !apiConfigured) return null;
    const messages = stateRef.current.messages.filter((message) => message.role !== "system").slice(-20);
    if (messages.length < 2) return null;
    try {
      const prompt: ChatMessage[] = [
        { role: "system", content: "Summarize the roleplay conversation in 100-200 Chinese characters. Output only the summary." },
        ...messages,
      ];
      let text = "";
      for await (const chunk of sendProviderStreamRequest(false, buildConfig(), prompt, undefined)) {
        text += chunk.content;
      }
      return text.trim();
    } catch {
      return null;
    }
  }, [apiConfigured, buildConfig, isDemo]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState((s) => ({ ...s, isStreaming: false, isSending: false }));
  }, []);

  const sendMessage = useCallback(async (text: string, opts?: { editMessageIndex?: number; oldAssistantContentForRevision?: string | null }) => {
    const current = stateRef.current;
    const editIndex = opts?.editMessageIndex;
    if (current.isStreaming || !current.activeSessionId) return;
    if (editIndex !== undefined && (editIndex >= current.messages.length || current.messages[editIndex].role !== "user")) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    // For edit mode, context is built from messages BEFORE the edit point
    const prevMessages = editIndex !== undefined ? current.messages.slice(0, editIndex) : current.messages;
    const isEdit = editIndex !== undefined;
    let contextOutput: ContextBuildOutput | null = null;
    let contextCharacter: CharacterRow | null = current.activeCharacter;
    let providerMessages: ChatMessage[] = [];

    try {
      const built = await buildCurrentContext(text, prevMessages);
      contextOutput = built.output;
      contextCharacter = built.character ?? current.activeCharacter;
      if (built.character !== current.activeCharacter || built.template !== current.activeTemplate) {
        setState((s) => ({ ...s, activeCharacter: built.character, activeTemplate: built.template }));
      }
    } catch (error) {
      setState((s) => ({ ...s, error: String(error) }));
      return;
    }

    if (contextOutput) {
      providerMessages = contextOutput.providerMessages;
    } else {
      const systemPrompt = current.activeCharacter ? buildCharacterSystemPrompt(current.activeCharacter, current.activeTemplate?.content) : "";
      providerMessages = systemPrompt ? [{ role: "system", content: systemPrompt }] : [];
      providerMessages.push(...prevMessages.filter((message) => message.role !== "system"), userMsg);
    }

    const hasRoleSession = !!(contextCharacter ?? current.activeCharacter);
    if (hasRoleSession && (providerMessages[0]?.role !== "system" || !providerMessages[0].content.trim())) {
      setState((s) => ({ ...s, error: "Role context is not ready." }));
      return;
    }

    // Build the correct UI message list:
    // - Normal mode: append user message to current messages
    // - Edit mode: replace message at editIndex, remove all subsequent messages, append edited user message
    let messagesAfterUser: ChatMessage[];
    if (isEdit) {
      messagesAfterUser = [...current.messages.slice(0, editIndex), userMsg];
    } else {
      messagesAfterUser = [...current.messages, userMsg];
    }
    setState((s) => ({ ...s, messages: messagesAfterUser, isSending: true, isStreaming: true, error: null, saveStatus: "idle", lastContextOutput: contextOutput }));

    const controller = new AbortController();
    abortRef.current = controller;
    let aiContent = "";
    try {
      for await (const chunk of sendProviderStreamRequest(isDemo, buildConfig(), providerMessages, controller.signal)) {
        if (controller.signal.aborted) break;
        if (!chunk.content) continue;
        aiContent += chunk.content;
        setState((s) => {
          const messages = [...s.messages];
          const last = messages[messages.length - 1];
          if (last?.role === "assistant") messages[messages.length - 1] = { ...last, content: aiContent };
          else messages.push({ role: "assistant", content: aiContent });
          return { ...s, messages };
        });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        aiContent = aiContent || `[Error: ${String(error)}]`;
        setState((s) => ({ ...s, error: String(error), messages: [...s.messages, { role: "assistant", content: aiContent }] }));
      }
    } finally {
      abortRef.current = null;
    }

    if (!isDemo && supabase && userId && stateRef.current.activeSessionId) {
      setState((s) => ({ ...s, saveStatus: "saving" }));
      let userDbId: string | null = null;
      let assistantDbId: string | null = null;
      try {
        const sessionId = stateRef.current.activeSessionId;
        const characterId = contextCharacter?.id ?? stateRef.current.activeCharacter?.id ?? null;
        const branch = await Repo.ensureDefaultBranch(supabase, sessionId, userId);
        const branchId = branch?.id;
        if (branchId) {
          // Only create new user message in DB if NOT editing (edit already updated the existing row)
          if (!isEdit) {
            const savedUser = await Repo.createMessage(supabase, userId, { session_id: sessionId, branch_id: branchId, role: "user", content_text: text });
            userDbId = savedUser?.id ?? null;
          } else {
            // For edit mode, reuse the existing DB id for dbIdMap
            userDbId = current.messageDbIds.get(editIndex) ?? null;
          }
          if (aiContent) {
            if (hasRoleSession && !characterId) {
              console.warn("[Chat] refusing to save role assistant message without character_id", { sessionId });
            } else {
              const asstMsg = await Repo.createMessage(supabase, userId, { session_id: sessionId, branch_id: branchId, role: "assistant", content_text: aiContent, character_id: characterId ?? undefined });
              assistantDbId = asstMsg?.id ?? null;
              // Persist old assistant content as a revision of the new assistant message
              if (assistantDbId && opts?.oldAssistantContentForRevision?.trim()) {
                console.debug("[Chat] writing assistant revision: newMsgId=%s oldContent=%s",
                  assistantDbId, opts.oldAssistantContentForRevision.slice(0, 30));
                await Repo.createMessageRevision(supabase, userId, {
                  message_id: assistantDbId,
                  revision_no: 1,
                  content_text: opts.oldAssistantContentForRevision,
                }).catch((e) => {
                  console.warn("[Chat] assistant revision save failed:", e);
                });
              }
            }
          }
          if (assistantDbId && opts?.oldAssistantContentForRevision?.trim()) {
            try {
              await Repo.createMessageRevision(supabase, userId, {
                message_id: assistantDbId,
                revision_no: 1,
                content_text: opts.oldAssistantContentForRevision,
              });
            } catch (error) {
              console.warn("[Chat] assistant revision save failed:", error);
            }
          }
          await Repo.updateSession(supabase, sessionId, userId, { last_message_at: new Date().toISOString() });
        }

        // Persist context_run (with message_id bound to assistant reply)
        if (contextOutput && branchId) {
          Repo.saveContextRun(supabase, userId, {
            session_id: sessionId,
            branch_id: branchId,
            trigger_message_id: userDbId,
            message_id: assistantDbId,
            provider: storedProvider,
            model: stateRef.current.model,
            system_prompt: contextOutput.systemPrompt,
            provider_messages_json: providerMessages,
            worldbook_hits_json: contextOutput.triggerResult.triggered.filter((h) => h.injected).map((h) => ({ id: h.entry.id, title: h.entry.title, keywords: h.matchedKeywords })),
            skipped_entries_json: contextOutput.triggerResult.skipped.map((s) => ({ id: s.entry.id, title: s.entry.title, reason: s.reason })),
            injected_memories_json: contextOutput.budget.memories.map((m) => ({ id: m.id, title: m.title })),
            summary_text: contextOutput.sessionSummaryInjected ? (stateRef.current.summaryText || null) : null,
            token_budget: contextOutput.budget.budgetLimit,
            estimated_tokens: contextOutput.estimatedTokens,
            debug_enabled: false,
          }).then(() => {
            setState((s) => ({ ...s, contextRunSaveStatus: "saved" }));
          }).catch((e) => {
            console.warn("[Chat] context_run save failed:", e);
            setState((s) => ({ ...s, contextRunSaveStatus: "failed" }));
          });
        }

        // Update dbIdMap
        if (userDbId || assistantDbId) {
          setState((s) => {
            const newMap = new Map(s.messageDbIds);
            const newCounts = new Map(s.messageRevisionCounts);
            const msgIdx = s.messages.length - (aiContent ? 2 : 1);
            if (userDbId) newMap.set(msgIdx, userDbId);
            if (assistantDbId) {
              newMap.set(msgIdx + 1, assistantDbId);
              if (opts?.oldAssistantContentForRevision?.trim()) newCounts.set(assistantDbId, 1);
            }
            return { ...s, messageDbIds: newMap, messageRevisionCounts: newCounts };
          });
        }

        setState((s) => ({ ...s, saveStatus: "saved" }));
      } catch {
        setState((s) => ({ ...s, saveStatus: "error" }));
      }
    } else {
      setState((s) => ({ ...s, saveStatus: "saved" }));
    }

    setState((s) => ({ ...s, isStreaming: false, isSending: false }));
    if (!isDemo) void loadSessions();
  }, [buildConfig, buildCurrentContext, isDemo, loadSessions, userId]);

  const regenerateLast = useCallback(async () => {
    const messages = stateRef.current.messages.filter((message) => message.role !== "system");
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    if (!lastUser) return;
    setState((s) => ({ ...s, messages: messages.slice(0, messages.lastIndexOf(lastUser) + 1) }));
    await sendMessage(lastUser.content);
  }, [sendMessage]);

  const editAndResend = useCallback(async (messageIndex: number, newText: string) => {
    const s = stateRef.current;
    const messages = s.messages;
    if (messageIndex >= messages.length || messages[messageIndex].role !== "user") return;
    const oldAssistantContent = messages
      .slice(messageIndex + 1)
      .find((message) => message.role === "assistant")?.content ?? null;
    console.debug("[Chat] editAndResend: oldAssistantContent=%s",
      oldAssistantContent ? oldAssistantContent.slice(0, 30) : "(none)");

    // Save old version as revision in DB
    if (!isDemo && supabase && userId && s.activeSessionId) {
      const dbId = s.messageDbIds.get(messageIndex);
      if (dbId) {
        const oldContent = messages[messageIndex].content;
        try {
          // Fetch current revision_no from DB
          const { data: currentMsg } = await supabase.from("messages").select("revision_no").eq("id", dbId).single();
          const currentRev = (currentMsg as { revision_no?: number } | null)?.revision_no ?? 1;

          // Save revision of old content
          await Repo.createMessageRevision(supabase, userId, {
            message_id: dbId,
            revision_no: currentRev,
            content_text: oldContent,
          });
          setState((prev) => {
            const nextCounts = new Map(prev.messageRevisionCounts);
            nextCounts.set(dbId, (nextCounts.get(dbId) ?? 0) + 1);
            const nextRevisions = new Map(prev.messageRevisions);
            nextRevisions.delete(dbId);
            return { ...prev, messageRevisionCounts: nextCounts, messageRevisions: nextRevisions };
          });
          // Update message content and increment revision
          await Repo.updateMessage(supabase, dbId, userId, {
            content_text: newText,
            edited_at: new Date().toISOString(),
            revision_no: currentRev + 1,
          });

          // Soft-delete subsequent assistant messages (keep them in DB but hidden)
          const subsequentIds: string[] = [];
          for (let i = messageIndex + 1; i < messages.length; i++) {
            const mid = s.messageDbIds.get(i);
            if (mid) subsequentIds.push(mid);
          }
          for (const mid of subsequentIds) {
            await Repo.deleteMessage(supabase, mid, userId, "superseded_by_edit").catch(() => {});
          }
          if (subsequentIds.length > 0) {
            await Repo.supersedeMessages(supabase, subsequentIds, dbId, userId).catch(() => {});
          }

          // Create a new branch if editing historical (not last) message
          if (messageIndex < messages.length - 1) {
            const branch = await Repo.createBranch(supabase, userId, {
              session_id: s.activeSessionId,
              name: `branch-${Date.now()}`,
              title: `分支 ${(currentRev + 1)}`,
              parent_branch_id: s.activeBranchId ?? undefined,
              forked_from_message_id: dbId,
            });
            if (branch) {
              await Repo.setActiveBranch(supabase, s.activeSessionId, branch.id, userId);
              setState((prev) => ({ ...prev, activeBranchId: branch.id, activeBranchName: branch.title || branch.name }));
            }
          }
        } catch (e) {
          console.warn("[Chat] editAndResend DB sync failed:", e);
        }
      }
    }

    // Mark this index as edited so version arrows show up
    setState((prev) => {
      const next = new Set(prev.editedIndices);
      next.add(messageIndex);
      return { ...prev, editedIndices: next };
    });

    // Delegate to sendMessage in edit mode — it handles UI truncation, streaming, and saving the new AI reply
    await sendMessage(newText, { editMessageIndex: messageIndex, oldAssistantContentForRevision: oldAssistantContent });
  }, [sendMessage, isDemo, userId]);

  const deleteMessage = useCallback(async (messageIndex: number) => {
    const s = stateRef.current;
    // Sync delete to DB first — don't remove from UI until DB confirms
    if (!isDemo && supabase && userId && s.activeSessionId) {
      const dbId = s.messageDbIds.get(messageIndex);
      if (dbId) {
        try {
          await Repo.deleteMessage(supabase, dbId, userId, "user_deleted");
        } catch (e) {
          console.warn("[Chat] deleteMessage DB sync failed:", e);
          setState((prev) => ({ ...prev, error: "删除消息失败，请重试" }));
          return; // Block UI removal on DB failure
        }
      } else {
        console.warn("[Chat] deleteMessage: no dbId for message index", messageIndex);
        // Still remove from UI for consistency (e.g. demo messages, or transient state)
      }
    }
    setState((prev) => {
      const messages = [...prev.messages];
      messages.splice(messageIndex, 1);
      return { ...prev, messages };
    });
  }, [isDemo, userId]);

  const copyMessage = useCallback((messageIndex: number) => {
    const text = stateRef.current.messages[messageIndex]?.content;
    if (text) navigator.clipboard.writeText(text).catch(() => {});
  }, []);

  const loadMessageRevisions = useCallback(async (messageIndex: number): Promise<MessageRevisionRow[]> => {
    const dbId = stateRef.current.messageDbIds.get(messageIndex);
    if (!dbId || !supabase) return [];
    try {
      const revisions = await Repo.loadMessageRevisions(supabase, dbId);
      setState((s) => {
        const newRevisions = new Map(s.messageRevisions);
        const newCounts = new Map(s.messageRevisionCounts);
        newRevisions.set(dbId, revisions);
        newCounts.set(dbId, revisions.length);
        return { ...s, messageRevisions: newRevisions, messageRevisionCounts: newCounts };
      });
      return revisions;
    } catch (error) {
      console.warn("[Chat] message revisions load failed:", error);
      return [];
    }
  }, []);

  const retry = useCallback(async () => {
    const lastUser = [...stateRef.current.messages].reverse().find((message) => message.role === "user");
    if (lastUser) await sendMessage(lastUser.content);
  }, [sendMessage]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (isDemo || !state.activeSessionId || state.isContextLoading) return;
    if (loadedSessionRef.current === state.activeSessionId) return;
    void selectSession(state.activeSessionId);
  }, [isDemo, selectSession, state.activeSessionId, state.isContextLoading]);

  useEffect(() => {
    if (isDemo || !state.activeSessionId || state.isStreaming) return;
    if (loadedSessionRef.current !== state.activeSessionId) return;
    const seq = ++previewSeqRef.current;
    setState((s) => ({ ...s, contextPreviewError: null }));
    withTimeout(buildCurrentContext(""), 5000, "context preview timed out")
      .then((built) => {
        if (previewSeqRef.current !== seq) return;
        setState((s) => ({ ...s, activeCharacter: built.character ?? s.activeCharacter, activeTemplate: built.template ?? s.activeTemplate, lastContextOutput: built.output, summaryText: built.session?.story_summary ?? s.summaryText, contextPreviewError: null }));
      })
      .catch(() => {
        if (previewSeqRef.current !== seq) return;
        setState((s) => ({ ...s, contextPreviewError: "Context preview failed, chat is still available" }));
      });
  }, [
    buildCurrentContext,
    isDemo,
    state.activeCharacter?.id,
    state.activeSessionId,
    state.activeTemplate?.id,
    state.disabledMemIds.join("|"),
    state.disabledWbIds.join("|"),
    state.isStreaming,
    state.memoryIds.join("|"),
    state.summaryEnabled,
    state.summaryText,
    state.worldbookIds.join("|"),
  ]);

  const providerLabel = isDemo ? "Mock (Demo)" : storedProvider === "deepseek" ? "DeepSeek" : "OpenAI Compatible";
  const modelLabel = isDemo ? "mock" : state.model;
  const runtimeMode = isDemo ? "demo_mock" : storageMode === "local_device" ? "byok_local_device" : "byok_session_only";
  const systemPrompt = state.lastContextOutput?.systemPrompt || (state.activeCharacter ? buildCharacterSystemPrompt(state.activeCharacter, state.activeTemplate?.content) : null);

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
    addTemplate,
    removeTemplate,
    addWorldbooks,
    removeWorldbook,
    toggleWorldbook,
    addMemories,
    removeMemory,
    toggleMemory,
    saveSummary,
    clearSummary,
    generateSummary,
    loadMessageRevisions,
    isDemo,
    apiConfigured,
    providerLabel,
    modelLabel,
    runtimeMode,
    messageCount: state.messages.filter((message) => message.role !== "system").length,
    systemPrompt,
  };
}

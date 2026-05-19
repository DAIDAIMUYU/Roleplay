import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../auth/supabaseClient";
import type { MemoryRow } from "../types/database";
import * as Repo from "../repositories/roleplayRepository";
import * as LocalRepo from "../repositories/localRoleplayRepository";
import * as LocalMirror from "../repositories/localMirror";

interface UseMemoriesReturn {
  memories: MemoryRow[];
  loading: boolean;
  create: (content: string, type: string, title?: string, salience?: number, sessionId?: string, characterId?: string) => Promise<void>;
  update: (id: string, content: string, type?: string, title?: string, salience?: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleStatus: (id: string, current: string) => Promise<void>;
  refresh: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterType: string | null;
  setFilterType: (t: string | null) => void;
  filtered: MemoryRow[];
  types: { value: string; label: string }[];
}

const MEMORY_TYPES = [
  { value: "user_preference", label: "用户偏好" },
  { value: "relationship", label: "角色关系" },
  { value: "event", label: "剧情事实" },
  { value: "long_term", label: "长期记忆" },
  { value: "short_term", label: "短期记忆" },
  { value: "summary", label: "摘要" },
  { value: "character_preference", label: "角色偏好" },
];

export function useMemories(userId: string | undefined, isDemo: boolean): UseMemoriesReturn {
  const [memories, setMemories] = useState<MemoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = isDemo || !supabase || !userId
        ? await LocalRepo.listMemories()
        : await Repo.listMemories(supabase, userId);
      setMemories(rows);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [isDemo, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (content: string, type: string, title?: string, salience?: number, sessionId?: string, characterId?: string) => {
    const payload = {
      content,
      memory_type: type as MemoryRow["memory_type"],
      title,
      salience: salience ?? 50,
      status: "active" as const,
      session_id: sessionId ?? undefined,
      character_id: characterId ?? undefined,
    };
    if (isDemo || !supabase || !userId) await LocalRepo.createMemory(payload);
    else {
      const row = await Repo.createMemory(supabase, userId, payload);
      if (row) LocalMirror.mirrorMemory(row);
    }
    await refresh();
  }, [isDemo, userId, refresh]);

  const update = useCallback(async (id: string, content: string, type?: string, title?: string, salience?: number) => {
    const payload = { content, memory_type: type as MemoryRow["memory_type"], title, salience };
    if (isDemo || !supabase || !userId) await LocalRepo.updateMemory(id, payload);
    else {
      const row = await Repo.updateMemory(supabase, id, userId, payload);
      if (row) LocalMirror.mirrorMemory(row);
    }
    await refresh();
  }, [isDemo, userId, refresh]);

  const remove = useCallback(async (id: string) => {
    if (isDemo || !supabase || !userId) await LocalRepo.deleteMemory(id);
    else {
      await Repo.deleteMemory(supabase, id, userId);
      const mem = memories.find((m) => m.id === id);
      if (mem) LocalMirror.mirrorMemory({ ...mem, status: "deleted", deleted_at: new Date().toISOString(), deleted_reason: "user_deleted", updated_at: new Date().toISOString() });
    }
    await refresh();
  }, [isDemo, userId, refresh]);

  const toggleStatus = useCallback(async (id: string, current: string) => {
    const newStatus = current === "active" ? "disabled" : "active";
    if (isDemo || !supabase || !userId) await LocalRepo.updateMemory(id, { status: newStatus as MemoryRow["status"] });
    else {
      const row = await Repo.updateMemory(supabase, id, userId, { status: newStatus as MemoryRow["status"] });
      if (row) LocalMirror.mirrorMemory(row);
    }
    await refresh();
  }, [isDemo, userId, refresh]);

  const filtered = memories.filter((m) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(m.title || "").toLowerCase().includes(q) && !m.content.toLowerCase().includes(q)) return false;
    }
    if (filterType && m.memory_type !== filterType) return false;
    return true;
  });

  return {
    memories, loading, create, update, remove, toggleStatus, refresh,
    searchQuery, setSearchQuery, filterType, setFilterType, filtered,
    types: MEMORY_TYPES,
  };
}

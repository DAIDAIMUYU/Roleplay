import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../auth/supabaseClient";
import type { WorldbookRow, WorldbookEntryRow } from "../types/database";
import * as Repo from "../repositories/roleplayRepository";

interface UseWorldbooksReturn {
  worldbooks: WorldbookRow[];
  entries: WorldbookEntryRow[];
  loading: boolean;
  activeWorldbookId: string | null;
  setActiveWorldbookId: (id: string | null) => void;
  createWb: (name: string, desc?: string, tags?: string[]) => Promise<WorldbookRow | null>;
  updateWb: (id: string, name: string, desc?: string, tags?: string[]) => Promise<void>;
  deleteWb: (id: string) => Promise<void>;
  createEntry: (wbId: string, title: string, content: string, triggers?: string[], priority?: number, category?: string) => Promise<void>;
  updateEntry: (id: string, title: string, content: string, triggers?: string[], priority?: number, enabled?: boolean, category?: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  toggleEntryEnabled: (id: string, current: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  entrySearch: string;
  setEntrySearch: (q: string) => void;
  filteredWbs: WorldbookRow[];
  filteredEntries: WorldbookEntryRow[];
}

export function useWorldbooks(userId: string | undefined, isDemo: boolean): UseWorldbooksReturn {
  const [worldbooks, setWorldbooks] = useState<WorldbookRow[]>([]);
  const [entries, setEntries] = useState<WorldbookEntryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeWorldbookId, setActiveWorldbookId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [entrySearch, setEntrySearch] = useState("");

  const refresh = useCallback(async () => {
    if (isDemo || !supabase || !userId) return;
    setLoading(true);
    try {
      const wbs = await Repo.listWorldbooks(supabase, userId);
      setWorldbooks(wbs);
      if (activeWorldbookId) {
        const ents = await Repo.listWorldbookEntries(supabase, activeWorldbookId);
        setEntries(ents);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [isDemo, userId, activeWorldbookId]);

  useEffect(() => { refresh(); }, [refresh]);

  const createWb = useCallback(async (name: string, desc?: string, tags?: string[]) => {
    if (isDemo || !supabase || !userId) return null;
    const row = await Repo.createWorldbook(supabase, userId, { name, description: desc, tags: tags ?? [] });
    if (row) setWorldbooks((prev) => [row, ...prev]);
    return row;
  }, [isDemo, userId]);

  const updateWb = useCallback(async (id: string, name: string, desc?: string, tags?: string[]) => {
    if (isDemo || !supabase || !userId) return;
    const row = await Repo.updateWorldbook(supabase, id, { name, description: desc, tags });
    if (row) setWorldbooks((prev) => prev.map((w) => (w.id === id ? row : w)));
  }, [isDemo, userId]);

  const deleteWb = useCallback(async (id: string) => {
    if (isDemo || !supabase || !userId) return;
    await Repo.deleteWorldbook(supabase, id);
    setWorldbooks((prev) => prev.filter((w) => w.id !== id));
    if (activeWorldbookId === id) { setActiveWorldbookId(null); setEntries([]); }
  }, [isDemo, userId, activeWorldbookId]);

  const loadEntries = useCallback(async (wbId: string) => {
    if (!supabase) return;
    const ents = await Repo.listWorldbookEntries(supabase, wbId);
    setEntries(ents);
  }, []);

  const createEntry = useCallback(async (wbId: string, title: string, content: string, triggers?: string[], priority?: number, category?: string) => {
    if (isDemo || !supabase || !userId) return;
    await Repo.createWorldbookEntry(supabase, userId, { worldbook_id: wbId, title, content, triggers: triggers ?? [], priority: priority ?? 100, category });
    await loadEntries(wbId);
  }, [isDemo, userId, loadEntries]);

  const updateEntry = useCallback(async (id: string, title: string, content: string, triggers?: string[], priority?: number, enabled?: boolean, category?: string) => {
    if (isDemo || !supabase || !userId) return;
    await Repo.updateWorldbookEntry(supabase, id, { title, content, triggers: triggers ?? [], priority, enabled, category });
    if (activeWorldbookId) await loadEntries(activeWorldbookId);
  }, [isDemo, userId, activeWorldbookId, loadEntries]);

  const deleteEntry = useCallback(async (id: string) => {
    if (isDemo || !supabase || !userId) return;
    await Repo.deleteWorldbookEntry(supabase, id);
    if (activeWorldbookId) await loadEntries(activeWorldbookId);
  }, [isDemo, userId, activeWorldbookId, loadEntries]);

  const toggleEntryEnabled = useCallback(async (id: string, current: boolean) => {
    if (isDemo || !supabase || !userId) return;
    await Repo.updateWorldbookEntry(supabase, id, { enabled: !current });
    if (activeWorldbookId) await loadEntries(activeWorldbookId);
  }, [isDemo, userId, activeWorldbookId, loadEntries]);

  const filteredWbs = worldbooks.filter((w) =>
    !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredEntries = entries.filter((e) =>
    !entrySearch ||
    e.title.toLowerCase().includes(entrySearch.toLowerCase()) ||
    e.content.toLowerCase().includes(entrySearch.toLowerCase()),
  );

  return {
    worldbooks, entries, loading, activeWorldbookId, setActiveWorldbookId: (id) => { setActiveWorldbookId(id); if (id) loadEntries(id); else setEntries([]); },
    createWb, updateWb, deleteWb, createEntry, updateEntry, deleteEntry, toggleEntryEnabled, refresh,
    searchQuery, setSearchQuery, entrySearch, setEntrySearch,
    filteredWbs, filteredEntries,
  };
}

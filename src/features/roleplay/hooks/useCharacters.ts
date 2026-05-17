import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../auth/supabaseClient";
import type { CharacterRow } from "../types/database";
import { packCharacterCard, type CharacterCardData } from "../utils/characterPrompt";
import * as Repo from "../repositories/roleplayRepository";

interface UseCharactersReturn {
  characters: CharacterRow[];
  loading: boolean;
  error: string | null;
  create: (name: string, card: CharacterCardData, tags?: string[]) => Promise<CharacterRow | null>;
  update: (id: string, name: string, card: CharacterCardData, tags?: string[]) => Promise<CharacterRow | null>;
  remove: (id: string) => Promise<void>;
  archive: (id: string) => Promise<void>;
  toggleFavorite: (id: string, current: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterTag: string | null;
  setFilterTag: (t: string | null) => void;
  filtered: CharacterRow[];
}

export function useCharacters(userId: string | undefined, isDemo: boolean): UseCharactersReturn {
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isDemo || !supabase || !userId) return;
    setLoading(true);
    try {
      const rows = await Repo.listCharacters(supabase, userId);
      setCharacters(rows);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [isDemo, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (name: string, card: CharacterCardData, tags?: string[]) => {
    if (isDemo || !supabase || !userId) return null;
    try {
      const row = await Repo.createCharacter(supabase, userId, {
        name,
        card_json: packCharacterCard(card),
        tags: tags ?? [],
      });
      if (row) setCharacters((prev) => [row, ...prev]);
      return row;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, [isDemo, userId]);

  const update = useCallback(async (id: string, name: string, card: CharacterCardData, tags?: string[]) => {
    if (isDemo || !supabase || !userId) return null;
    try {
      const row = await Repo.updateCharacter(supabase, id, userId, {
        name,
        card_json: packCharacterCard(card),
        tags: tags ?? [],
      });
      if (row) setCharacters((prev) => prev.map((c) => (c.id === id ? row : c)));
      return row;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, [isDemo, userId]);

  const remove = useCallback(async (id: string) => {
    if (isDemo || !supabase || !userId) return;
    try {
      await Repo.deleteCharacter(supabase, id, userId);
      setCharacters((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(String(e));
    }
  }, [isDemo, userId]);

  const archive = useCallback(async (id: string) => {
    if (isDemo || !supabase || !userId) return;
    try {
      await Repo.archiveCharacter(supabase, id, userId);
      setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, archived_at: new Date().toISOString() } : c)));
    } catch (e) {
      setError(String(e));
    }
  }, [isDemo, userId]);

  const toggleFavorite = useCallback(async (id: string, current: boolean) => {
    if (isDemo || !supabase || !userId) return;
    try {
      const row = await Repo.updateCharacter(supabase, id, userId, { is_favorite: !current });
      if (row) setCharacters((prev) => prev.map((c) => (c.id === id ? row : c)));
    } catch (e) {
      setError(String(e));
    }
  }, [isDemo, userId]);

  // Filtering
  const filtered = characters.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = c.name.toLowerCase().includes(q);
      const matchesSummary = c.summary?.toLowerCase().includes(q);
      if (!matchesName && !matchesSummary) return false;
    }
    if (filterTag && !c.tags?.includes(filterTag)) return false;
    return true;
  });

  return {
    characters, loading, error,
    create, update, remove, archive, toggleFavorite, refresh,
    searchQuery, setSearchQuery,
    filterTag, setFilterTag,
    filtered,
  };
}

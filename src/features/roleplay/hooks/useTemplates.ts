import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../auth/supabaseClient";
import type { PromptTemplateRow } from "../types/database";
import * as Repo from "../repositories/roleplayRepository";

const CATEGORIES = [
  { value: "general", label: "通用角色扮演" },
  { value: "daily", label: "日常聊天" },
  { value: "plot", label: "剧情推进" },
  { value: "narration", label: "旁白模式" },
  { value: "style", label: "风格控制" },
  { value: "rules", label: "禁止规则" },
  { value: "group", label: "群聊（预留）" },
];

interface UseTemplatesReturn {
  templates: PromptTemplateRow[];
  loading: boolean;
  error: string | null;
  create: (title: string, content: string, category?: string, tags?: string[], description?: string) => Promise<PromptTemplateRow | null>;
  update: (id: string, title: string, content: string, category?: string, tags?: string[], description?: string) => Promise<PromptTemplateRow | null>;
  remove: (id: string) => Promise<void>;
  toggleFavorite: (id: string, current: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterCategory: string | null;
  setFilterCategory: (c: string | null) => void;
  filterTag: string | null;
  setFilterTag: (t: string | null) => void;
  filtered: PromptTemplateRow[];
  categories: typeof CATEGORIES;
}

export function useTemplates(userId: string | undefined, isDemo: boolean): UseTemplatesReturn {
  const [templates, setTemplates] = useState<PromptTemplateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isDemo || !supabase || !userId) return;
    setLoading(true);
    try {
      const rows = await Repo.listPromptTemplates(supabase, userId);
      setTemplates(rows);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [isDemo, userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const create = useCallback(async (
    title: string, content: string,
    category?: string, tags?: string[], description?: string,
  ) => {
    if (isDemo || !supabase || !userId) return null;
    try {
      const row = await Repo.createPromptTemplate(supabase, userId, {
        title, content, category: category ?? "general", tags: tags ?? [], description,
      });
      if (row) setTemplates((prev) => [row, ...prev]);
      return row;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, [isDemo, userId]);

  const update = useCallback(async (
    id: string, title: string, content: string,
    category?: string, tags?: string[], description?: string,
  ) => {
    if (isDemo || !supabase || !userId) return null;
    try {
      const row = await Repo.updatePromptTemplate(supabase, id, {
        title, content, category: category ?? "general", tags: tags ?? [], description,
      });
      if (row) setTemplates((prev) => prev.map((t) => (t.id === id ? row : t)));
      return row;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, [isDemo, userId]);

  const remove = useCallback(async (id: string) => {
    if (isDemo || !supabase || !userId) return;
    try {
      await Repo.deletePromptTemplate(supabase, id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(String(e));
    }
  }, [isDemo, userId]);

  const toggleFavorite = useCallback(async (id: string, current: boolean) => {
    if (isDemo || !supabase || !userId) return;
    try {
      const row = await Repo.updatePromptTemplate(supabase, id, { is_favorite: !current });
      if (row) setTemplates((prev) => prev.map((t) => (t.id === id ? row : t)));
    } catch (e) {
      setError(String(e));
    }
  }, [isDemo, userId]);

  const filtered = templates.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) return false;
    }
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterTag && !t.tags?.includes(filterTag)) return false;
    return true;
  });

  return {
    templates, loading, error,
    create, update, remove, toggleFavorite, refresh,
    searchQuery, setSearchQuery,
    filterCategory, setFilterCategory,
    filterTag, setFilterTag,
    filtered, categories: CATEGORIES,
  };
}

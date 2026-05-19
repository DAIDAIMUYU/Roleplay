import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../auth/supabaseClient";
import type { PromptTemplateRow } from "../types/database";
import * as Repo from "../repositories/roleplayRepository";
import * as LocalRepo from "../repositories/localRoleplayRepository";
import * as LocalMirror from "../repositories/localMirror";

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
    setLoading(true);
    try {
      const rows = isDemo || !supabase || !userId
        ? await LocalRepo.listPromptTemplates()
        : await Repo.listPromptTemplates(supabase, userId);
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
    try {
      const payload = { title, content, category: category ?? "general", tags: tags ?? [], description };
      const row = isDemo || !supabase || !userId
        ? await LocalRepo.createPromptTemplate(payload)
        : await Repo.createPromptTemplate(supabase, userId, payload);
      if (row) {
        setTemplates((prev) => [row, ...prev]);
        if (!isDemo && supabase && userId) LocalMirror.mirrorTemplate(row);
      }
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
    try {
      const payload = { title, content, category: category ?? "general", tags: tags ?? [], description };
      const row = isDemo || !supabase || !userId
        ? await LocalRepo.updatePromptTemplate(id, payload)
        : await Repo.updatePromptTemplate(supabase, id, payload);
      if (row) {
        setTemplates((prev) => prev.map((t) => (t.id === id ? row : t)));
        if (!isDemo && supabase && userId) LocalMirror.mirrorTemplate(row);
      }
      return row;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, [isDemo, userId]);

  const remove = useCallback(async (id: string) => {
    try {
      if (isDemo || !supabase || !userId) await LocalRepo.deletePromptTemplate(id);
      else {
        await Repo.deletePromptTemplate(supabase, id);
        const tpl = templates.find((t) => t.id === id);
        if (tpl) LocalMirror.mirrorTemplate({ ...tpl, deleted_at: new Date().toISOString(), deleted_reason: "user_deleted", updated_at: new Date().toISOString() });
      }
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(String(e));
    }
  }, [isDemo, userId]);

  const toggleFavorite = useCallback(async (id: string, current: boolean) => {
    try {
      const row = isDemo || !supabase || !userId
        ? await LocalRepo.updatePromptTemplate(id, { is_favorite: !current })
        : await Repo.updatePromptTemplate(supabase, id, { is_favorite: !current });
      if (row) {
        setTemplates((prev) => prev.map((t) => (t.id === id ? row : t)));
        if (!isDemo && supabase && userId) LocalMirror.mirrorTemplate(row);
      }
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

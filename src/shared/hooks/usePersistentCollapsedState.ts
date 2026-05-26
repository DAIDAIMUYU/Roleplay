import { useState, useCallback } from "react";

export function usePersistentCollapsedState(key: string, defaultValue: boolean = false): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return defaultValue;
      return stored === "true";
    } catch {
      return defaultValue;
    }
  });

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(key, String(next));
      } catch {
        // localStorage not available
      }
      return next;
    });
  }, [key]);

  return [collapsed, toggle];
}
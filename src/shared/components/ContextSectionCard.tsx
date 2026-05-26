import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ContextSectionCardProps {
  title: string;
  icon: ReactNode;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  level?: 1 | 2 | 3;
}

export function ContextSectionCard({
  title,
  icon,
  badge,
  defaultOpen = false,
  children,
  level = 1,
}: ContextSectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const levelStyles = {
    1: "border-b border-surface-100/60",
    2: "mx-2 mb-1 rounded-lg border border-surface-100/40 bg-white/40",
    3: "mx-3 mb-1 rounded-lg border border-surface-100/30 bg-surface-50/50",
  };

  return (
    <div className={levelStyles[level]}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-surface-50/50"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 flex-shrink-0 text-ink-300" />
        ) : (
          <ChevronRight className="h-3 w-3 flex-shrink-0 text-ink-300" />
        )}
        <span className="flex-shrink-0 text-ink-400">{icon}</span>
        <span className="flex-1 text-left font-medium text-ink-600">{title}</span>
        {badge && (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-600">
            {badge}
          </span>
        )}
      </button>
      {open && <div className="px-3 pb-2">{children}</div>}
    </div>
  );
}
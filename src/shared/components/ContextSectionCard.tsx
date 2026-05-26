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
  variant?: "default" | "active" | "muted" | "debug";
}

export function ContextSectionCard({
  title,
  icon,
  badge,
  defaultOpen = false,
  children,
  level = 1,
  variant = "default",
}: ContextSectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const levelStyles = {
    1: "border-b border-sky-100/60",
    2: "mx-2 mb-1.5 rounded-xl border border-sky-100/50 bg-white/60 shadow-sm",
    3: "mx-2 mb-1.5 rounded-xl border border-slate-100/50 bg-slate-50/50",
  };

  const variantStyles = {
    default: "",
    active: "ring-1 ring-brand-200/50",
    muted: "opacity-70",
    debug: "bg-slate-50/80",
  };

  return (
    <div className={`${levelStyles[level]} ${variantStyles[variant]}`}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-xs transition-colors hover:bg-sky-50/30"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 flex-shrink-0 text-sky-400" />
        ) : (
          <ChevronRight className="h-3 w-3 flex-shrink-0 text-sky-400" />
        )}
        <span className="flex-shrink-0 text-sky-500">{icon}</span>
        <span className="flex-1 text-left font-medium text-ink-700">{title}</span>
        {badge && (
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-600">
            {badge}
          </span>
        )}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
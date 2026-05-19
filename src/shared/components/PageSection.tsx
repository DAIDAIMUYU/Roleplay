import type { ReactNode } from "react";

interface PageSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  /** Visual variant */
  variant?: "default" | "warm" | "info" | "highlight";
  /** Collapsible on mobile */
  collapsible?: boolean;
  className?: string;
}

export function PageSection({
  title,
  description,
  icon,
  children,
  variant = "default",
  className = "",
}: PageSectionProps) {
  const variantStyles = {
    default: "border-surface-100 bg-white",
    warm: "border-amber-100 bg-amber-light/10",
    info: "border-sky-100 bg-sky-50/30",
    highlight: "border-brand-100 bg-brand-50/20",
  };

  return (
    <section className={`rounded-2xl border p-5 shadow-sm ${variantStyles[variant]} ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-50 text-brand-500">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-ink-700">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-ink-400">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

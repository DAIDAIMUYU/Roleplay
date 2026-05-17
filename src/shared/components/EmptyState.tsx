import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 text-ink-200">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-ink-700">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-sm text-ink-300">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

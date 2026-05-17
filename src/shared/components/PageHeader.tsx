import { ModeBadge } from "./ModeBadge";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-ink-900">{title}</h1>
        <ModeBadge />
      </div>
      <div className="flex items-center gap-2">
        {action}
      </div>
      {description && (
        <p className="mt-1 text-sm text-ink-300">{description}</p>
      )}
    </div>
  );
}

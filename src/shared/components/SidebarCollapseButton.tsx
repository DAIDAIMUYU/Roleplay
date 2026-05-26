import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarCollapseButtonProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarCollapseButton({ collapsed, onToggle }: SidebarCollapseButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-100 text-ink-400 transition-colors hover:bg-surface-200 hover:text-ink-600"
      title={collapsed ? "展开侧栏" : "折叠侧栏"}
    >
      {collapsed ? (
        <ChevronRight className="h-3.5 w-3.5" />
      ) : (
        <ChevronLeft className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
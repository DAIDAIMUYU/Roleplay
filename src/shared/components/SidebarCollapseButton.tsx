import { ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarCollapseButtonProps {
  collapsed: boolean;
  onToggle: () => void;
  side?: "left" | "right";
  ariaLabel?: string;
  floating?: boolean;
}

export function SidebarCollapseButton({ 
  collapsed, 
  onToggle, 
  side = "left",
  ariaLabel,
  floating = false,
}: SidebarCollapseButtonProps) {
  // Arrow direction logic:
  // Left side: expanded -> arrow left (collapse to left), collapsed -> arrow right (expand to right)
  // Right side: expanded -> arrow right (collapse to right), collapsed -> arrow left (expand to left)
  const showRightArrow = side === "left" ? collapsed : !collapsed;

  const baseClasses = floating
    ? "flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-ink-400 shadow-md backdrop-blur-sm transition-all duration-150 ease-out hover:bg-white hover:text-ink-600 hover:shadow-lg active:scale-95 border border-sky-100/60"
    : "flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50/80 text-sky-500 transition-all duration-150 ease-out hover:bg-sky-100 hover:text-sky-600 active:scale-95";

  return (
    <button
      onClick={onToggle}
      className={baseClasses}
      title={ariaLabel || (collapsed ? "展开面板" : "折叠面板")}
      aria-label={ariaLabel || (collapsed ? "展开面板" : "折叠面板")}
    >
      {showRightArrow ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </button>
  );
}
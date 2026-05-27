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
    ? "neo-button flex h-9 w-9 items-center justify-center rounded-full border border-white/75 bg-white/78 text-ink-500 shadow-[0_12px_24px_rgba(148,163,184,0.14)] transition-all duration-[320ms] hover:-translate-y-0.5 hover:text-brand-600 active:translate-y-0"
    : "neo-button flex h-9 w-9 items-center justify-center rounded-2xl text-sky-500 transition-all duration-[320ms] hover:-translate-y-0.5 hover:text-brand-600 active:translate-y-0";

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

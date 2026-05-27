import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface AppModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "wide";
  closeOnOverlayClick?: boolean;
  bodyClassName?: string;
  contentClassName?: string;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  wide: "max-w-[880px]",
};

export function AppModal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
  closeOnOverlayClick = true,
  bodyClassName = "",
  contentClassName = "",
}: AppModalProps) {
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 md:px-8 md:py-10">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(191,219,254,0.22),_rgba(255,255,255,0.08)_52%,_rgba(255,255,255,0.02)_100%)] backdrop-blur-sm fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal */}
      <div
        className={`neo-panel relative my-auto flex max-h-[80vh] w-full flex-col self-center overflow-hidden rounded-[36px] border border-white/80 bg-white/74 shadow-[0_30px_90px_rgba(96,165,250,0.20)] backdrop-blur-xl modal-enter ${sizeClasses[size]} ${bodyClassName}`}
        style={size === "wide" ? { width: "min(860px, calc(100vw - 88px))" } : undefined}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/22 via-white/10 to-sky-100/18" />
        {/* Header */}
        <div className="relative flex flex-shrink-0 items-start justify-between border-b border-white/45 bg-white/56 px-6 py-5 backdrop-blur-sm">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-ink-400">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="neo-button flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-all duration-[280ms] hover:text-brand-600 active:scale-[0.98]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className={`scrollbar-none relative flex-1 overflow-y-auto px-6 py-5 ${contentClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="relative sticky bottom-0 flex-shrink-0 rounded-b-[36px] border-t border-white/45 bg-white/78 px-6 py-4 backdrop-blur-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

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
  sm: "max-w-none md:max-w-sm",
  md: "max-w-none md:max-w-lg",
  lg: "max-w-none md:max-w-2xl",
  xl: "max-w-none md:max-w-4xl",
  wide: "max-w-none md:max-w-[880px]",
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

    const body = document.body;
    const currentCount = Number(body.dataset.modalOpenCount ?? "0");
    body.dataset.modalOpenCount = String(currentCount + 1);
    body.classList.add("app-modal-open");

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const nextCount = Math.max(0, Number(body.dataset.modalOpenCount ?? "1") - 1);
      if (nextCount === 0) {
        body.classList.remove("app-modal-open");
        delete body.dataset.modalOpenCount;
        return;
      }
      body.dataset.modalOpenCount = String(nextCount);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-3 py-3 md:px-8 md:py-10">
      {/* Overlay */}
      <div 
        className="absolute inset-0 z-[100] bg-[radial-gradient(circle_at_center,_rgba(191,219,254,0.22),_rgba(255,255,255,0.08)_52%,_rgba(255,255,255,0.02)_100%)] backdrop-blur-sm fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal */}
      <div
        className={`neo-panel relative z-[110] my-auto flex w-[calc(100vw-24px)] flex-col self-center overflow-hidden rounded-[30px] border border-white/80 bg-white/74 shadow-[0_30px_90px_rgba(96,165,250,0.20)] backdrop-blur-xl modal-enter md:w-full md:rounded-[36px] ${sizeClasses[size]} ${bodyClassName}`}
        style={{
          maxHeight: "calc(100dvh - 24px)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/22 via-white/10 to-sky-100/18" />
        {/* Header */}
        <div className="relative z-[120] flex flex-shrink-0 items-start justify-between border-b border-white/45 bg-white/56 px-5 py-4 backdrop-blur-sm md:px-6 md:py-5">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-ink-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neo-button flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-all duration-[280ms] hover:text-brand-600 active:scale-[0.98]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className={`scrollbar-none mobile-modal-safe-content relative z-[110] flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5 ${contentClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="mobile-modal-safe-footer relative z-[120] sticky bottom-0 flex-shrink-0 rounded-b-[30px] border-t border-white/45 bg-white/82 px-4 py-3 backdrop-blur-sm md:rounded-b-[36px] md:px-6 md:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

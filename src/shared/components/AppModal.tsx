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
  wide: "max-w-[920px]",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm fade-in"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className={`relative w-full ${sizeClasses[size]} max-h-[86vh] flex flex-col rounded-[28px] neo-surface modal-enter ${bodyClassName}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/40 px-6 py-4 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-ink-400">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-all hover:bg-surface-100 hover:text-ink-600 active:scale-95"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className={`flex-1 overflow-y-auto scrollbar-none px-6 py-4 ${contentClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-white/40 px-6 py-4 bg-white/80 backdrop-blur-sm rounded-b-[28px] flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
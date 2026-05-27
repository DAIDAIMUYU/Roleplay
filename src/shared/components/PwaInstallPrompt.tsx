import { useState, useEffect } from "react";
import { Download, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: boolean }).MSStream;
    setIsIOS(ios);

    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches || 
                      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Don't show if already installed
    if (standalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstall(false);
  };

  // Don't show if already standalone or no prompt available and not iOS
  if (isStandalone || (!showInstall && !isIOS)) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4">
      <div 
        className="neo-surface p-4"
        style={{ borderRadius: '20px' }}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 flex-shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-900">安装角色酒馆</p>
            <p className="text-xs text-ink-400 mt-1">
              {isIOS 
                ? "点击分享按钮，然后选择「添加到主屏幕」"
                : "将应用添加到桌面，获得更好的使用体验"
              }
            </p>
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="btn-primary mt-3 px-4 py-2 text-xs w-full"
                style={{ borderRadius: '12px' }}
              >
                <Smartphone className="h-4 w-4 mr-2 inline" />
                安装应用
              </button>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-ink-300 hover:text-ink-500 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
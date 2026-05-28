import { useState, useEffect } from "react";
import { Download, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "rp_pwa_install_dismissed_at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream: boolean }).MSStream
  );
}

function wasDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const timestamp = parseInt(raw, 10);
    if (isNaN(timestamp)) return false;
    return Date.now() - timestamp < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function persistDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore storage failures
  }
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start true, set false after check

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ios = isIOSDevice();
    const standalone = isStandaloneMode();
    setIsIOS(ios);
    setIsStandalone(standalone);

    // Don't show if already installed
    if (standalone) {
      setDismissed(true);
      return;
    }

    // Check dismiss state
    if (wasDismissed()) {
      setDismissed(true);
    } else {
      setDismissed(false);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!wasDismissed()) {
        setShowInstall(true);
      }
    };

    // On iOS, beforeinstallprompt doesn't fire, so we show manual prompt
    if (ios && !standalone && !wasDismissed()) {
      setShowInstall(true);
    }

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
      setDismissed(true);
      // Permanent dismiss on successful install
      persistDismissed();
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    setDismissed(true);
    persistDismissed();
  };

  // Don't show if standalone, dismissed, or nothing to show
  if (isStandalone || dismissed) return null;

  // On non-iOS, only show if we have a prompt available
  if (!isIOS && !deferredPrompt) return null;

  // On iOS, show manual prompt; on non-iOS, show if deferredPrompt is available
  const shouldShow = (isIOS && !isStandalone) || (!isIOS && deferredPrompt !== null);
  if (!shouldShow || !showInstall) return null;

  return (
    <div className="mobile-bottom-nav-floating-offset md:bottom-4 fixed left-1/2 z-40 mx-4 w-full max-w-sm -translate-x-1/2 pointer-events-auto">
      <div
        className="neo-surface p-4"
        style={{ borderRadius: "20px" }}
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
                : "将应用添加到桌面，获得更好的使用体验"}
            </p>
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                type="button"
                className="btn-primary mt-3 px-4 py-2 text-xs w-full"
                style={{ borderRadius: "12px" }}
              >
                <Smartphone className="h-4 w-4 mr-2 inline" />
                安装应用
              </button>
            )}
          </div>
          <button
            onClick={handleDismiss}
            type="button"
            aria-label="关闭安装提示"
            className="p-2 text-ink-300 hover:text-ink-500 flex-shrink-0"
            style={{ minWidth: "44px", minHeight: "44px" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

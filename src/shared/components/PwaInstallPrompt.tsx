import { useState, useEffect, useCallback } from "react";
import { Download, Smartphone, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "roleplay:pwa-install-dismissed-at";
const DISMISS_DAYS = 30;
const DISMISS_MS = DISMISS_DAYS * 24 * 60 * 60 * 1000;

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}

function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream: boolean }).MSStream
    );
  } catch {
    return false;
  }
}

function wasDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const timestamp = parseInt(raw, 10);
    if (isNaN(timestamp) || timestamp <= 0) return false;
    const elapsed = Date.now() - timestamp;
    if (import.meta.env.DEV) {
      console.log("[PWA] wasDismissed check: elapsed=", Math.round(elapsed / 86400000), "days, limit=", DISMISS_DAYS, "days");
    }
    return elapsed < DISMISS_MS;
  } catch {
    return false;
  }
}

function persistDismissed(): void {
  try {
    const now = Date.now();
    localStorage.setItem(DISMISS_KEY, String(now));
    if (import.meta.env.DEV) {
      console.log("[PWA] persistDismissed: saved timestamp=", now);
    }
  } catch {
    if (import.meta.env.DEV) {
      console.warn("[PWA] persistDismissed: localStorage write failed");
    }
  }
}

export function PwaInstallPrompt() {
  // ── Disabled: PWA install prompt card removed from UI (2026-06-19) ──
  // PWA itself remains active (manifest, service worker, browser menu install).
  // See docs/roleplay-tavern/产品界面优化与体验重构记录.md phase 18.6.2
  return null;

  /* eslint-disable no-unreachable */
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // ── Dismiss handler (multiple event bindings for mobile safety) ──
  const handleDismiss = useCallback((e?: React.MouseEvent | React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (import.meta.env.DEV) {
      console.log("[PWA] handleDismiss called, hiding and persisting");
    }
    setVisible(false);
    setDismissed(true);
    persistDismissed();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ios = isIOSDevice();
    const standalone = isStandaloneMode();
    setIsIOS(ios);
    setIsStandalone(standalone);

    if (import.meta.env.DEV) {
      console.log("[PWA] init: ios=", ios, "standalone=", standalone);
    }

    // Standalone → never show
    if (standalone) {
      setDismissed(true);
      setVisible(false);
      return;
    }

    // Check localStorage dismiss
    const alreadyDismissed = wasDismissed();
    if (alreadyDismissed) {
      if (import.meta.env.DEV) {
        console.log("[PWA] init: already dismissed, hiding");
      }
      setDismissed(true);
      setVisible(false);
      return;
    }

    // Not dismissed → show
    setDismissed(false);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      if (import.meta.env.DEV) {
        console.log("[PWA] beforeinstallprompt fired");
      }
      // Re-check dismiss state at event time
      if (wasDismissed()) {
        if (import.meta.env.DEV) {
          console.log("[PWA] beforeinstallprompt: already dismissed, ignoring");
        }
        return;
      }
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    // iOS: show manual prompt immediately (beforeinstallprompt won't fire)
    if (ios) {
      if (import.meta.env.DEV) {
        console.log("[PWA] iOS: showing manual install prompt");
      }
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Also hide when app is actually installed
    const handleAppInstalled = () => {
      if (import.meta.env.DEV) {
        console.log("[PWA] appinstalled event fired");
      }
      setVisible(false);
      setDismissed(true);
      persistDismissed();
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
        setDismissed(true);
        persistDismissed();
      }
    } catch {
      // prompt may fail on some browsers
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // ── Render guards (ordered by priority) ──
  if (isStandalone) return null;
  if (dismissed) return null;
  if (!visible) return null;
  if (!isIOS && !deferredPrompt) return null;

  return (
    <div className="pwa-install-prompt-root mobile-bottom-nav-floating-offset md:bottom-4 fixed left-1/2 z-30 mx-4 w-full max-w-sm -translate-x-1/2 pointer-events-auto">
      <div
        className="neo-surface p-4 relative"
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
          {/* X close button — multi-binding for mobile safety */}
          <button
            onClick={handleDismiss}
            onPointerDown={(e) => {
              // Capture pointer early on mobile
              e.preventDefault();
              handleDismiss(e);
            }}
            type="button"
            aria-label="关闭安装提示"
            className="relative z-10 p-2 text-ink-300 hover:text-ink-500 active:text-ink-700 flex-shrink-0"
            style={{
              minWidth: "44px",
              minHeight: "44px",
              touchAction: "manipulation",
            }}
          >
            <X className="h-4 w-4 pointer-events-none" />
          </button>
        </div>
      </div>
    </div>
  );
}

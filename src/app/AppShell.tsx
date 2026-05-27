import { Outlet } from "react-router-dom";
import { useIsMobile } from "../shared/hooks/useMediaQuery";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppShell() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex min-h-dvh flex-col overflow-x-hidden pb-safe-bottom">
        <main className="app-scrollbar-clean flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="flex h-dvh gap-3 overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 p-3">
      <DesktopSidebar />
      <main className="app-scrollbar-clean glass-page-shell min-w-0 flex-1 overflow-y-auto rounded-[44px] border border-white/70 bg-white/36">
        <Outlet />
      </main>
    </div>
  );
}

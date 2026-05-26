import { Outlet } from "react-router-dom";
import { useIsMobile } from "../shared/hooks/useMediaQuery";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

export function AppShell() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-dvh pb-safe-bottom">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-50 p-3 gap-3">
      <DesktopSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

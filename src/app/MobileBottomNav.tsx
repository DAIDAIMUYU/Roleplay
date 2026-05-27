import { NavLink } from "react-router-dom";
import { Drama, Home, Palette, Settings } from "lucide-react";
import { useAuth, canAccessAdminPanel } from "../features/auth";

const tabs = [
  { to: "/", label: "首页", icon: Home },
  { to: "/roleplay", label: "聊天", icon: Drama },
  { to: "/studio", label: "工坊", icon: Palette },
  { to: "/settings", label: "设置", icon: Settings },
];

export function MobileBottomNav() {
  const { role } = useAuth();
  const showAdmin = canAccessAdminPanel(role);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/78 via-white/42 to-transparent backdrop-blur-xl" />
      <div className="relative mx-3 mb-3 rounded-[26px] border border-white/70 bg-white/78 px-2 py-2 shadow-[0_-10px_28px_rgba(148,163,184,0.16)] backdrop-blur-2xl">
        <div className="mobile-safe-bottom flex items-center gap-1.5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `neo-button flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-medium transition-all duration-[220ms] ${
                  isActive
                    ? "neo-button-pressed text-brand-600"
                    : "text-ink-300 hover:text-ink-500"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
          {showAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `neo-button flex min-h-[52px] flex-1 flex-col items-center justify-center gap-1 rounded-[18px] px-2 py-2 text-[11px] font-medium transition-all duration-[220ms] ${
                  isActive
                    ? "neo-button-pressed text-brand-600"
                    : "text-ink-300 hover:text-ink-500"
                }`
              }
            >
              <Settings className="h-5 w-5" />
              <span>后台</span>
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}

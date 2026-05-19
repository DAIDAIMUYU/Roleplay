import { NavLink } from "react-router-dom";
import { Home, Drama, Palette, Settings } from "lucide-react";
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
    <nav className="flex items-center bg-white border-t border-surface-100 pt-safe-bottom pb-2 px-1">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-1.5 text-xs font-medium transition-colors ${
              isActive ? "text-brand-600" : "text-ink-300"
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
            `flex-1 flex flex-col items-center gap-0.5 py-1.5 text-xs font-medium transition-colors ${
              isActive ? "text-brand-600" : "text-ink-300"
            }`
          }
        >
          <Settings className="h-5 w-5" />
          <span>后台</span>
        </NavLink>
      )}
    </nav>
  );
}

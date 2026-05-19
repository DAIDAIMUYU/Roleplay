import { NavLink, Link } from "react-router-dom";
import { Drama, Home, Palette, Settings, Shield } from "lucide-react";
import { useAuth, canAccessAdminPanel } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";

const navItems = [
  { to: "/", label: "酒馆首页", icon: <Home className="h-5 w-5" /> },
  { to: "/roleplay", label: "聊天房间", icon: <Drama className="h-5 w-5" /> },
  { to: "/studio", label: "创作工坊", icon: <Palette className="h-5 w-5" /> },
  { to: "/settings", label: "设置中心", icon: <Settings className="h-5 w-5" /> },
];

export function DesktopSidebar() {
  const { isOwner, isAdmin, isGuestOrDemo, role } = useAuth();
  const showAdmin = canAccessAdminPanel(role);

  return (
    <aside className="flex h-full w-56 flex-shrink-0 flex-col border-r border-surface-100 bg-white">
      <div className="px-4 py-5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <Drama className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold text-ink-900">角色酒馆</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-2">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-app px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-500 hover:bg-surface-50 hover:text-ink-700"
              }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}

        {showAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-app px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-500 hover:bg-surface-50 hover:text-ink-700"
              }`
            }
          >
            <Shield className="h-5 w-5" />
            管理后台
          </NavLink>
        )}
      </nav>

      <div className="border-t border-surface-100 px-3 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-300">
            {isGuestOrDemo ? "网页本地模式" : isOwner ? "站主" : isAdmin ? "管理员" : "云端账号"}
          </span>
          <ModeBadge />
        </div>
        {isGuestOrDemo && (
          <p className="mt-1.5 text-xs leading-relaxed text-ink-300">
            未登录时你仍可继续使用本地模式。登录只是为了开启云端同步和多设备互通。
          </p>
        )}
      </div>
    </aside>
  );
}

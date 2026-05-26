import { NavLink, Link } from "react-router-dom";
import { Drama, Home, Palette, Settings, Shield } from "lucide-react";
import { useAuth, canAccessAdminPanel } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";
import { SidebarCollapseButton } from "../shared/components/SidebarCollapseButton";
import { usePersistentCollapsedState } from "../shared/hooks/usePersistentCollapsedState";

const navItems = [
  { to: "/", label: "酒馆首页", icon: <Home className="h-5 w-5" /> },
  { to: "/roleplay", label: "聊天房间", icon: <Drama className="h-5 w-5" /> },
  { to: "/studio", label: "创作工坊", icon: <Palette className="h-5 w-5" /> },
  { to: "/settings", label: "设置中心", icon: <Settings className="h-5 w-5" /> },
];

export function DesktopSidebar() {
  const { isOwner, isAdmin, isGuestOrDemo, role } = useAuth();
  const showAdmin = canAccessAdminPanel(role);
  const [collapsed, toggleCollapsed] = usePersistentCollapsedState("roleplay.sidebar.collapsed", false);

  return (
    <aside className={`flex h-full flex-shrink-0 flex-col rounded-2xl border border-white/70 bg-white/75 shadow-sm backdrop-blur-xl transition-all duration-200 ${collapsed ? "w-16" : "w-56"}`}>
      <div className={`px-4 py-5 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm">
            <Drama className="h-4 w-4 text-white" />
          </Link>
        ) : (
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm">
                <Drama className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-semibold text-ink-900">角色酒馆</span>
            </Link>
            <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} side="left" />
          </div>
        )}
      </div>

      <nav className={`flex-1 space-y-1 ${collapsed ? "px-2" : "px-2"}`}>
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gradient-to-r from-brand-50 to-sky-50 text-brand-700 shadow-sm"
                  : "text-ink-500 hover:bg-sky-50/50 hover:text-ink-700"
              } ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? label : undefined}
          >
            {icon}
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {showAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-gradient-to-r from-brand-50 to-sky-50 text-brand-700 shadow-sm"
                  : "text-ink-500 hover:bg-sky-50/50 hover:text-ink-700"
              } ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? "管理后台" : undefined}
          >
            <Shield className="h-5 w-5" />
            {!collapsed && <span>管理后台</span>}
          </NavLink>
        )}
      </nav>

      <div className={`border-t border-sky-100/60 px-3 py-4 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} side="left" floating />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-400">
                {isGuestOrDemo ? "网页本地模式" : isOwner ? "站主" : isAdmin ? "管理员" : "云端账号"}
              </span>
              <ModeBadge />
            </div>
            {isGuestOrDemo && (
              <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
                未登录时你仍可继续使用本地模式。登录只是为了开启云端同步和多设备互通。
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

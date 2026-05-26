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
    <aside className={`flex h-full flex-shrink-0 flex-col neo-surface transition-all duration-200 ${collapsed ? "w-16" : "w-56"}`}
      style={{ borderRadius: '28px' }}
    >
      <div className={`px-4 py-5 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <Link to="/" className="neo-button flex h-9 w-9 items-center justify-center"
            style={{ borderRadius: '14px', background: 'linear-gradient(135deg, rgb(99, 102, 241), rgb(79, 70, 229))' }}
          >
            <Drama className="h-4 w-4 text-white" />
          </Link>
        ) : (
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center shadow-sm"
                style={{ borderRadius: '14px', background: 'linear-gradient(135deg, rgb(99, 102, 241), rgb(79, 70, 229))' }}
              >
                <Drama className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-semibold text-ink-900">角色酒馆</span>
            </Link>
            <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} side="left" />
          </div>
        )}
      </div>

      <nav className={`flex-1 space-y-1 scrollbar-none overflow-y-auto ${collapsed ? "px-2" : "px-2"}`}>
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "neo-pressed text-brand-700"
                  : "neo-button text-ink-500 hover:text-ink-700"
              } ${collapsed ? "justify-center" : ""}`
            }
            style={{ borderRadius: '16px' }}
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
              `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "neo-pressed text-brand-700"
                  : "neo-button text-ink-500 hover:text-ink-700"
              } ${collapsed ? "justify-center" : ""}`
            }
            style={{ borderRadius: '16px' }}
            title={collapsed ? "管理后台" : undefined}
          >
            <Shield className="h-5 w-5" />
            {!collapsed && <span>管理后台</span>}
          </NavLink>
        )}
      </nav>

      <div className={`border-t border-white/40 px-3 py-4 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} side="left" floating />
        ) : (
          <div className="neo-surface-soft p-3" style={{ borderRadius: '18px' }}>
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
          </div>
        )}
      </div>
    </aside>
  );
}

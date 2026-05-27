import { useState, useCallback } from "react";
import { NavLink, Link } from "react-router-dom";
import { Drama, Home, LogOut, Palette, Settings, Shield, User } from "lucide-react";
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
  const { isOwner, isAdmin, isGuestOrDemo, role, user, signOut } = useAuth();
  const showAdmin = canAccessAdminPanel(role);
  const [collapsed, toggleCollapsed] = usePersistentCollapsedState("roleplay.sidebar.collapsed", false);
  const [signOutConfirm, setSignOutConfirm] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);

  const handleSignOut = useCallback(async () => {
    setSignOutBusy(true);
    try {
      await signOut();
    } catch {
      // signOut handles internally
    } finally {
      setSignOutBusy(false);
      setSignOutConfirm(false);
    }
  }, [signOut]);

  return (
    <aside className={`flex h-full flex-shrink-0 flex-col neo-surface transition-all duration-200 ${collapsed ? "w-16" : "w-60"}`}
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

      <nav className="scrollbar-none flex-1 space-y-2 overflow-y-auto px-2.5 pb-2 pt-2">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex h-11 items-center gap-3 px-3 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "neo-button-pressed text-brand-700"
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
              `flex h-11 items-center gap-3 px-3 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "neo-button-pressed text-brand-700"
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

      <div className={`border-t border-white/40 px-3 py-4 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
        {collapsed ? (
          <>
            {user ? (
              <button
                onClick={() => { if (signOutConfirm) handleSignOut(); else setSignOutConfirm(true); }}
                disabled={signOutBusy}
                className="neo-button flex h-9 w-9 items-center justify-center text-ink-400 hover:text-rose-500"
                title={signOutConfirm ? "确认退出" : "退出登录"}
                style={{ borderRadius: '14px' }}
              >
                <LogOut className="h-4 w-4" />
              </button>
            ) : (
              <SidebarCollapseButton collapsed={collapsed} onToggle={toggleCollapsed} side="left" floating />
            )}
            {signOutConfirm && user && (
              <span className="text-[10px] text-rose-400">再点退出</span>
            )}
          </>
        ) : (
          <div className="neo-surface-soft flex flex-col gap-2.5 p-3.5" style={{ borderRadius: '20px' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-400">
                {isGuestOrDemo ? "网页本地模式" : isOwner ? "站主" : isAdmin ? "管理员" : "云端账号"}
              </span>
              <ModeBadge />
            </div>
            {user ? (
              <>
                <p className="text-[11px] text-ink-500 truncate" title={user.email}>
                  {user.email}
                </p>
                {!signOutConfirm ? (
                  <button
                    onClick={() => setSignOutConfirm(true)}
                    className="neo-button flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-rose-500 hover:text-rose-600"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    退出登录
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setSignOutConfirm(false)}
                      disabled={signOutBusy}
                      className="neo-button flex-1 px-2 py-1.5 text-[11px] font-medium text-ink-500"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSignOut}
                      disabled={signOutBusy}
                      className="neo-button-primary flex flex-1 items-center justify-center px-2 py-1.5 text-[11px] font-semibold"
                      style={{
                        background: "linear-gradient(135deg, rgba(225, 29, 72, 0.85), rgba(244, 63, 94, 0.82))",
                      }}
                    >
                      {signOutBusy ? "..." : "确认退出"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {isGuestOrDemo && (
                  <p className="text-xs leading-relaxed text-ink-400">
                    未登录时你仍可继续使用本地模式。登录只是为了开启云端同步和多设备互通。
                  </p>
                )}
                <Link
                  to="/login"
                  className="neo-button flex items-center justify-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-brand-600 hover:text-brand-700"
                >
                  <User className="h-3.5 w-3.5" />
                  登录 / 注册
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

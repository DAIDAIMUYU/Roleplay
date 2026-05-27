import { type ReactNode, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Database, HardDrive, LogOut, Settings, Shield, User } from "lucide-react";
import { useAuth } from "../features/auth";
import { DataSyncPanel } from "../features/roleplay/components/settings/DataSyncPanel";
import { ProviderPresetSelector } from "../features/roleplay/components/settings/ProviderPresetSelector";
import { getEnabledConfig } from "../features/roleplay/storage/apiProviderConfigStorage";
import { getPresetName } from "../features/roleplay/providers/providerPresets";
import { getStorageModeLabel } from "../features/roleplay/storage/apiKeyStorage";
import { ModeBadge } from "../shared/components/ModeBadge";

function getCurrentCredentialSummary() {
  const enabled = getEnabledConfig();
  if (!enabled) {
    return {
      title: "未配置",
      detail: "尚未启用 API 配置，当前无法调用真实模型。",
    };
  }

  const providerName = getPresetName(enabled.provider);
  const storageLabel = getStorageModeLabel(enabled.storageMode);
  const testLabel =
    enabled.testStatus === "ok"
      ? " · 测试通过"
      : enabled.testStatus === "failed"
        ? " · 测试失败"
        : " · 未测试";

  return {
    title: `${providerName} / ${enabled.model || "未选择模型"}`,
    detail: `${storageLabel}${testLabel}${enabled.lastTestedAt ? ` · ${new Date(enabled.lastTestedAt).toLocaleString()}` : ""}`,
  };
}

function SectionCard({
  icon,
  title,
  description,
  status,
  to,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  status?: string;
  to?: string | null;
}) {
  const content = (
    <>
      <div className="neo-panel-soft flex h-10 w-10 flex-shrink-0 items-center justify-center text-ink-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-ink-700">{title}</h3>
          {status ? (
            <span className="neo-pill bg-surface-100 px-2 py-0.5 text-[11px] text-ink-500">
              {status}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink-400">{description}</p>
      </div>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="neo-panel-soft flex items-start gap-4 rounded-[28px] p-5 transition-all duration-[240ms] hover:-translate-y-0.5 hover:ring-1 hover:ring-brand-200/60"
      >
        {content}
      </Link>
    );
  }

  return <div className="neo-panel-soft flex items-start gap-4 rounded-[28px] p-5">{content}</div>;
}

export function SettingsPage() {
  const { isGuestOrDemo, user, signOut } = useAuth();
  const currentCredential = getCurrentCredentialSummary();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);

  const handleSignOut = useCallback(async () => {
    setSignOutBusy(true);
    try {
      await signOut();
    } catch {
      // signOut handles errors internally
    } finally {
      setSignOutBusy(false);
      setShowSignOutConfirm(false);
    }
  }, [signOut]);

  return (
    <div className="page-container px-7 py-8 md:px-10 md:py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="neo-panel-soft flex h-11 w-11 items-center justify-center text-ink-500">
          <Settings className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] font-bold tracking-tight text-ink-900">设置中心</h1>
          <p className="mt-1 text-sm text-ink-400">
            在这里管理 API 凭据、数据备份、本地存储风险与同步状态。
          </p>
        </div>
        <ModeBadge />
      </div>

      <section className="mb-8">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
          当前状态
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="neo-surface-raised rounded-[32px] px-5 py-5">
            <p className="text-xs text-ink-400">当前客户端</p>
            <p className="mt-1 text-base font-semibold text-ink-800">网页模式</p>
          </div>
          <div className="neo-surface-raised rounded-[32px] px-5 py-5">
            <p className="text-xs text-ink-400">数据保存位置</p>
            <p className="mt-1 text-base font-semibold text-ink-800">
              {user ? "云端同步" : "本地数据模式"}
            </p>
          </div>
          <div className="neo-surface-raised rounded-[32px] px-5 py-5">
            <p className="text-xs text-ink-400">API 凭据</p>
            <p className="mt-1 truncate text-base font-semibold text-ink-800">
              {currentCredential.title}
            </p>
            <p className="mt-1 text-[11px] text-ink-300">{currentCredential.detail}</p>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
          API 与模型
        </h3>
        <ProviderPresetSelector />
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
          数据与同步
        </h3>
        <div className="space-y-4">
          <DataSyncPanel userId={user?.id ?? null} isLoggedIn={!!user} />
          <SectionCard
            icon={<Database className="h-5 w-5" />}
            title="数据管理"
            description="导出备份、导入恢复、回收站。导出内容不包含 API Key。"
            status="可用"
            to="/settings/data"
          />
        </div>
      </section>

      <section className="mb-8">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
          存储与账号
        </h3>
        <div className="space-y-3">
          <SectionCard
            icon={<HardDrive className="h-5 w-5" />}
            title="本地存储说明"
            description="数据保存在浏览器 IndexedDB 中。清除站点数据或更换设备后可能丢失，建议定期备份。"
            status="风险已说明"
          />
          {user ? (
            <div className="neo-panel-soft flex flex-col gap-4 rounded-[28px] p-5">
              <div className="flex items-start gap-4">
                <div className="neo-panel-soft flex h-10 w-10 flex-shrink-0 items-center justify-center text-ink-500">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-ink-700">账号</h3>
                    <span className="neo-pill bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-600">
                      已登录
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-400 truncate">{user.email}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-400">
                    退出后将回到网页本地模式，本地浏览器中的角色、会话等数据不会被删除。
                  </p>
                </div>
              </div>

              {!showSignOutConfirm ? (
                <button
                  onClick={() => setShowSignOutConfirm(true)}
                  className="neo-button flex items-center justify-center gap-2 self-start px-5 py-2.5 text-xs font-medium text-rose-600 transition-all hover:bg-rose-50/60 hover:text-rose-700"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              ) : (
                <div className="neo-panel space-y-3 rounded-[20px] border border-rose-100/50 p-4">
                  <p className="text-sm font-medium text-ink-800">退出登录？</p>
                  <p className="text-xs leading-relaxed text-ink-500">
                    退出后将停止使用当前云端账号。本地浏览器中的角色、会话、世界书、记忆等数据不会被删除。
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSignOutConfirm(false)}
                      disabled={signOutBusy}
                      className="neo-button flex-1 px-4 py-2 text-xs font-medium text-ink-600"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSignOut}
                      disabled={signOutBusy}
                      className="neo-button-primary flex flex-1 items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold"
                      style={{
                        background: "linear-gradient(135deg, rgba(225, 29, 72, 0.88), rgba(244, 63, 94, 0.86))",
                      }}
                    >
                      {signOutBusy ? "退出中..." : "确认退出"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="neo-panel-soft flex items-start gap-4 rounded-[28px] p-5 transition-all duration-[240ms] hover:-translate-y-0.5 hover:ring-1 hover:ring-brand-200/60"
            >
              <div className="neo-panel-soft flex h-10 w-10 flex-shrink-0 items-center justify-center text-ink-500">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-ink-700">账号</h3>
                  <span className="neo-pill bg-surface-100 px-2 py-0.5 text-[11px] text-ink-500">
                    未登录
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-ink-400">
                  登录后可开启云端同步和托管加密凭据，跨设备继续角色扮演。
                </p>
              </div>
            </Link>
          )}
          <SectionCard
            icon={<Shield className="h-5 w-5" />}
            title="安全与隐私"
            description="API Key 不进入导出和同步数据。详细规则已合并到凭据与同步说明中。"
            status="已整合"
          />
        </div>
      </section>

      <details className="mb-6 text-xs text-ink-400">
        <summary className="cursor-pointer font-medium text-ink-500 hover:text-ink-600">
          暂未推出的功能
        </summary>
        <p className="mt-2">桌面模式、移动 App、更多外观主题会在后续版本继续补齐。</p>
      </details>

      {isGuestOrDemo ? (
        <div className="mb-20 rounded-[24px] border border-amber-100/80 bg-amber-light/10 px-4 py-3 text-xs text-amber-700 md:mb-0">
          当前处于网页本地模式。登录后可以开启云端同步与托管加密凭据。
        </div>
      ) : null}
    </div>
  );
}

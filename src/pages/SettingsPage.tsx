import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  HardDrive,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { useAuth } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";
import { DataSyncPanel } from "../features/roleplay/components/settings/DataSyncPanel";
import { ProviderPresetSelector } from "../features/roleplay/components/settings/ProviderPresetSelector";
import { getEnabledConfig } from "../features/roleplay/storage/apiProviderConfigStorage";
import { getPresetName } from "../features/roleplay/providers/providerPresets";
import { getStorageModeLabel } from "../features/roleplay/storage/apiKeyStorage";

function getCurrentCredentialSummary() {
  const enabled = getEnabledConfig();
  if (!enabled) {
    return { title: "未配置", detail: "尚未启用 API 配置，当前无法调用真实模型。" };
  }
  const providerName = getPresetName(enabled.provider);
  const storageLabel = getStorageModeLabel(enabled.storageMode);
  const testLabel = enabled.testStatus === "ok" ? " · 测试通过" : enabled.testStatus === "failed" ? " · 测试失败" : " · 未测试";
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
      <div className="h-10 w-10 rounded-xl bg-surface-50 text-ink-500 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold text-ink-700">{title}</h3>
          {status ? (
            <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
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
      <Link to={to} className="card flex items-start gap-4 transition-colors hover:bg-surface-50">
        {content}
      </Link>
    );
  }

  return <div className="card flex items-start gap-4">{content}</div>;
}

export function SettingsPage() {
  const { isGuestOrDemo, user } = useAuth();
  const currentCredential = getCurrentCredentialSummary();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24 md:py-12 md:pb-12">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
          <Settings className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-ink-900">设置中心</h1>
          <p className="mt-1 text-sm text-ink-400">
            在这里管理 API 凭据、数据备份、本地存储风险与同步状态。
          </p>
        </div>
        <ModeBadge />
      </div>

      {/* ─── Current Status ─── */}
      <div className="card-soft mb-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">当前状态</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-surface-50/80 px-3 py-3">
            <p className="text-xs text-ink-400">客户端</p>
            <p className="mt-1 text-sm font-medium text-ink-700">网页模式</p>
          </div>
          <div className="rounded-xl bg-surface-50/80 px-3 py-3">
            <p className="text-xs text-ink-400">数据</p>
            <p className="mt-1 text-sm font-medium text-ink-700">{user ? "云端同步" : "本地模式"}</p>
          </div>
          <div className="rounded-xl bg-surface-50/80 px-3 py-3">
            <p className="text-xs text-ink-400">API</p>
            <p className="mt-1 truncate text-sm font-medium text-ink-700">{currentCredential.title}</p>
          </div>
        </div>
      </div>

      {/* ─── API & Provider ─── */}
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">API 与模型</h3>
        <ProviderPresetSelector />
      </div>

      {/* ─── Data & Sync ─── */}
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">数据与同步</h3>
        <div className="space-y-4">
          <DataSyncPanel userId={user?.id ?? null} isLoggedIn={!!user} />
          <SectionCard
            icon={<Database className="h-5 w-5" />}
            title="数据管理"
            description="导出备份、导入恢复、回收站。导出不含 API Key。"
            status="可用"
            to="/settings/data"
          />
        </div>
      </div>

      {/* ─── Storage & Account ─── */}
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">存储与账号</h3>
        <div className="space-y-3">
          <SectionCard
            icon={<HardDrive className="h-5 w-5" />}
            title="本地存储说明"
            description="数据保存在浏览器 IndexedDB 中。清除网站数据或换设备可能丢失。建议定期备份。"
            status="风险已说明"
          />
          <SectionCard
            icon={<User className="h-5 w-5" />}
            title="账号"
            description={user ? "已登录 · 云端同步可用" : "登录后可开启云端同步和托管加密凭据。"}
            status={user ? "已登录" : "可选"}
          />
          <SectionCard
            icon={<Shield className="h-5 w-5" />}
            title="安全与隐私"
            description="API Key 不进入导出和同步数据。详细见安全说明文档。"
            status="已整合"
          />
        </div>
      </div>

      {/* ─── Future ─── */}
      <details className="mb-6 text-xs text-ink-400">
        <summary className="cursor-pointer font-medium text-ink-500 hover:text-ink-600">暂未推出的功能</summary>
        <p className="mt-2">桌面模式、移动 App、外观主题等更多设备形态和能力会在后续版本补齐。</p>
      </details>

      {isGuestOrDemo ? (
        <div className="mb-20 rounded-2xl border border-amber-100/80 bg-amber-light/10 px-4 py-3 text-xs text-amber-700 md:mb-0">
          当前处于网页本地模式。登录后可开启云端同步与托管加密凭据。
        </div>
      ) : null}
    </div>
  );
}

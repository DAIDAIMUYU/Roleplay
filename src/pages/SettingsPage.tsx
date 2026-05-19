import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  HardDrive,
  Info,
  Laptop,
  Paintbrush,
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
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
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

      <div className="card mb-6">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 text-ink-300" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-ink-700">当前状态</h3>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <div className="rounded-card bg-surface-50 px-3 py-3">
                <p className="text-xs text-ink-400">当前客户端</p>
                <p className="mt-1 text-sm font-medium text-ink-700">网页模式</p>
                <p className="mt-1 text-xs text-ink-400">当前 MVP 默认通过浏览器访问。桌面模式与移动 App 模式暂未推出。</p>
              </div>
              <div className="rounded-card bg-surface-50 px-3 py-3">
                <p className="text-xs text-ink-400">数据保存位置</p>
                <p className="mt-1 text-sm font-medium text-ink-700">{user ? "云端同步模式" : "本地数据模式"}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {user
                    ? "云端数据库保存主数据，当前设备会保留本地镜像。"
                    : "数据仅保存在当前浏览器中，不会上传云端。"}
                </p>
              </div>
              <div className="rounded-card bg-surface-50 px-3 py-3">
                <p className="text-xs text-ink-400">API 凭据状态</p>
                <p className="mt-1 text-sm font-medium text-ink-700">{currentCredential.title}</p>
                <p className="mt-1 text-xs text-ink-400">{currentCredential.detail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <ProviderPresetSelector />
      </div>

      <div className="space-y-3">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-ink-500">其他设置</h2>
        <SectionCard
          icon={<Database className="h-5 w-5" />}
          title="数据管理"
          description="查看本地备份、导入恢复、回收站和数据统计。导出文件不会包含 API Key、密文、IV 或其他 Secrets。"
          status="本地可用"
          to="/settings/data"
        />
        <DataSyncPanel userId={user?.id ?? null} isLoggedIn={!!user} />
        <SectionCard
          icon={<HardDrive className="h-5 w-5" />}
          title="本地存储"
          description="网页模式下，角色、会话、世界书、记忆等数据默认保存在当前浏览器的本地数据库中。清除浏览器网站数据、无痕模式结束、更换浏览器或更换设备后，本地数据可能无法恢复。"
          status="风险已说明"
        />
        <SectionCard
          icon={<User className="h-5 w-5" />}
          title="账号设置"
          description={user ? "查看当前登录账号，并准备后续的同步、个人资料和设备管理。" : "登录后可以启用云端同步；如果你不想上传本地数据，也可以继续只使用本地模式。"}
          status={user ? "已登录" : "可选"}
        />
        <SectionCard
          icon={<Paintbrush className="h-5 w-5" />}
          title="外观设置"
          description="准备承接后续的主题、字号、卡片密度和移动端展示优化。"
          status="暂未推出"
        />
        <SectionCard
          icon={<Shield className="h-5 w-5" />}
          title="安全与备份说明"
          description="安全状态已经融入 API 凭据保存位置、数据同步方式和数据备份规则中，不再单独放一个空泛的安全入口。"
          status="已整合"
        />
        <SectionCard
          icon={<Laptop className="h-5 w-5" />}
          title="暂未推出功能"
          description="桌面模式、移动 App 模式和更多设备形态会在后续版本补齐；当前手机浏览器访问仍然属于网页模式。"
          status="暂未推出"
        />
      </div>

      {isGuestOrDemo ? (
        <div className="mt-6 rounded-card border border-amber-100 bg-amber-light/20 px-4 py-3 text-xs leading-relaxed text-amber-800">
          你当前处于网页本地模式。现在就可以继续浏览、预览和配置本地 API；登录后才会开启云端同步与托管加密凭据。
        </div>
      ) : null}
    </div>
  );
}

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Cloud,
  Database,
  Drama,
  HardDrive,
  KeyRound,
  Laptop,
  LockKeyhole,
  ShieldAlert,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";
import { useIsMobile } from "../shared/hooks/useMediaQuery";
import { getEnabledConfig } from "../features/roleplay/storage/apiProviderConfigStorage";
import { getPresetName } from "../features/roleplay/providers/providerPresets";
import { getStorageModeLabel } from "../features/roleplay/storage/apiKeyStorage";

type ApiCredentialState =
  | { mode: "unconfigured"; title: string; detail: string }
  | { mode: "configured"; title: string; detail: string; provider: string; model: string; testStatus: string };

function getApiCredentialState(): ApiCredentialState {
  const enabled = getEnabledConfig();
  if (!enabled) {
    return { mode: "unconfigured", title: "未配置", detail: "尚未启用 API 配置，当前无法调用真实模型。" };
  }
  const providerName = getPresetName(enabled.provider);
  const storageLabel = getStorageModeLabel(enabled.storageMode);
  const testLabel = enabled.testStatus === "ok" ? "测试成功" : enabled.testStatus === "failed" ? "测试失败" : "未测试";
  return {
    mode: "configured",
    title: `${providerName} / ${enabled.model || "未选择模型"}`,
    detail: `${storageLabel} · ${testLabel}${enabled.lastTestedAt ? ` · ${new Date(enabled.lastTestedAt).toLocaleString()}` : ""}`,
    provider: providerName,
    model: enabled.model,
    testStatus: enabled.testStatus,
  };
}

function StatusCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-surface-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-50 text-brand-500">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-ink-800">{title}</h2>
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-ink-500">{children}</div>
    </section>
  );
}

export function LandingPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const apiState = getApiCredentialState();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:py-14 md:pb-14">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
            <Drama className="h-5 w-5 text-white" />
          </div>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-sm font-medium text-brand-600">角色酒馆</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-ink-900 md:text-4xl">本地优先，随时可用的角色扮演工作台</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-ink-400 md:text-base">
          你可以一直只用网页本地模式，也可以在需要时登录，开启云端同步和多设备互通。
          角色、模板、世界书、记忆、会话和上下文链路都会围绕这个本地优先思路继续演进。
        </p>
        <div className="mt-3 flex justify-center">
          <ModeBadge />
        </div>
      </div>

      <div className="mb-10 grid gap-4 lg:grid-cols-3">
        <StatusCard title="当前客户端" icon={<Laptop className="h-4 w-4" />}>
          <p className="font-medium text-ink-700">网页模式</p>
          <p>
            当前正在使用网页模式。
            {isMobile ? " 你正在通过手机浏览器访问。" : " 你正在通过桌面浏览器访问。"}
          </p>
          <p>
            数据默认保存在当前浏览器的本地数据库中。刷新网页、关闭浏览器后重新打开，一般仍会保留。
          </p>
          <div className="rounded-card bg-amber-light/30 p-3 text-xs text-amber-800">
            如果你清除浏览器网站数据、Cookie/站点数据、IndexedDB、使用无痕模式、更换浏览器、更换设备或格式化设备，本地数据可能无法恢复。
          </div>
          <div className="grid gap-2 text-xs text-ink-400 sm:grid-cols-3">
            <div className="rounded-card bg-surface-50 p-2">
              <span className="font-medium text-ink-600">网页模式</span>
              <br />
              当前可用
            </div>
            <div className="rounded-card bg-surface-50 p-2">
              <span className="font-medium text-ink-600">桌面模式</span>
              <br />
              暂未推出
            </div>
            <div className="rounded-card bg-surface-50 p-2">
              <span className="font-medium text-ink-600">移动 App</span>
              <br />
              暂未推出
            </div>
          </div>
        </StatusCard>

        <StatusCard title="数据保存位置" icon={user ? <Cloud className="h-4 w-4" /> : <Database className="h-4 w-4" />}>
          {user ? (
            <>
              <p className="font-medium text-ink-700">云端同步模式</p>
              <p>角色、会话、世界书、记忆等数据会保存到云端数据库，并可在多设备之间同步。</p>
              <p>当前设备也会保留一份本地镜像，用于提升访问速度，并降低云端异常时的数据风险。</p>
              <p className="text-xs text-ink-400">
                如果云端与本地数据不一致，可在设置中的数据同步中心手动检查、上传本地数据或下载云端数据。
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-ink-700">本地数据模式</p>
              <p>角色、会话、世界书、记忆、设置等数据仅保存在当前设备的当前浏览器中，不会上传到云端。</p>
              <p>刷新、关闭浏览器、重启设备后通常仍会保留；清除浏览器网站数据、换浏览器、换设备、无痕模式关闭或格式化设备后，数据可能无法恢复。</p>
              <p className="text-xs text-ink-400">
                你可以继续完整使用本地功能；登录只是为了开启云端同步和多设备互通。
              </p>
            </>
          )}
        </StatusCard>

        <StatusCard title="API 凭据状态" icon={<KeyRound className="h-4 w-4" />}>
          <p className="font-medium text-ink-700">{apiState.title}</p>
          {"provider" in apiState ? (
            <>
              <p className="text-xs text-ink-400">
                当前配置：{apiState.provider} / {apiState.model || "未选择模型"}
              </p>
              {"testStatus" in apiState ? (
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <span className={`inline-block h-2 w-2 rounded-full ${
                    apiState.testStatus === "ok" ? "bg-emerald-500" : apiState.testStatus === "failed" ? "bg-rose-500" : "bg-ink-300"
                  }`} />
                  {apiState.testStatus === "ok" ? "测试通过" : apiState.testStatus === "failed" ? "测试失败" : "未测试"}
                </span>
              ) : null}
            </>
          ) : null}
          <p className="text-xs text-ink-400">{apiState.detail}</p>
          <div className="rounded-card bg-surface-50 p-3 text-xs text-ink-400">
            数据导出备份不会包含 API Key、密文、IV 或任何 Secrets。
          </div>
        </StatusCard>
      </div>

      <div className="mb-10 grid gap-3 md:grid-cols-4">
        <Link to="/roleplay" className="card-hover flex flex-col items-center p-4 text-center">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-ink-700">进入聊天</span>
          <span className="mt-0.5 text-xs text-ink-300">无需登录即可开始</span>
        </Link>

        <Link to="/studio" className="card-hover flex flex-col items-center p-4 text-center">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-500">
            <HardDrive className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-ink-700">进入创作工坊</span>
          <span className="mt-0.5 text-xs text-ink-300">角色、模板、世界书、记忆</span>
        </Link>

        <Link to="/settings" className="card-hover flex flex-col items-center p-4 text-center">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <LockKeyhole className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-ink-700">查看设置中心</span>
          <span className="mt-0.5 text-xs text-ink-300">API、本地存储、备份状态</span>
        </Link>

        <Link to="/login" className="card-hover flex flex-col items-center p-4 text-center">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <Cloud className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-ink-700">登录开启同步</span>
          <span className="mt-0.5 text-xs text-ink-300">多设备互通，可选上传本地数据</span>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-surface-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-500">当前状态</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-card bg-surface-50 p-4">
              <p className="text-sm font-medium text-ink-700">本地优先</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-400">
                未登录也可以继续使用网页本地模式。登录不是门槛，只是为了云端同步和多设备访问。
              </p>
            </div>
            <div className="rounded-card bg-surface-50 p-4">
              <p className="text-sm font-medium text-ink-700">同步可选</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-400">
                登录后不会静默上传本地数据。后续同步中心会明确提示你上传本地、下载云端，或暂不同步。
              </p>
            </div>
            <div className="rounded-card bg-surface-50 p-4">
              <p className="text-sm font-medium text-ink-700">API 凭据分层</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-400">
                session_only、local_device、hosted_encrypted 会分别标注保存位置和风险，不再混成一团。
              </p>
            </div>
            <div className="rounded-card bg-surface-50 p-4">
              <p className="text-sm font-medium text-ink-700">建议备份</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-400">
                如果你长期只用本地模式，建议定期导出备份，避免清站点数据或换设备时丢失内容。
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-100 bg-amber-light/20 p-5 shadow-sm">
          <div className="mb-3 flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div>
              <h2 className="text-sm font-semibold text-ink-700">本地数据风险提示</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-400">
                网页模式不会在你的电脑里静默创建真实文件夹，数据主要保存在当前浏览器的本地数据库中。
              </p>
            </div>
          </div>
          <ul className="space-y-2 text-xs leading-relaxed text-ink-500">
            <li>清除浏览器网站数据、Cookie/站点数据或 IndexedDB 后，本地数据可能无法恢复。</li>
            <li>无痕模式关闭、换浏览器、换设备或格式化设备，也不会自动带走本地数据。</li>
            <li>如果你需要长期保存和多设备访问，建议登录后开启云端同步。</li>
          </ul>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link to="/settings/data" className="btn-secondary text-center text-sm">
              去做本地备份
            </Link>
            <Link to="/login" className="btn-primary text-center text-sm">
              登录了解同步
            </Link>
          </div>
          <div className="mt-4 rounded-card bg-white p-3 text-xs text-ink-400">
            <p className="font-medium text-ink-600">客户端模式说明</p>
            <p className="mt-1 flex items-center gap-1"><Laptop className="h-3.5 w-3.5" /> 网页模式：当前可用</p>
            <p className="mt-1 flex items-center gap-1"><Laptop className="h-3.5 w-3.5" /> 桌面模式：暂未推出</p>
            <p className="mt-1 flex items-center gap-1"><Smartphone className="h-3.5 w-3.5" /> 移动 App 模式：暂未推出</p>
          </div>
        </section>
      </div>
    </div>
  );
}

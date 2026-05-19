import { Link } from "react-router-dom";
import {
  BookOpen,
  Brain,
  Cloud,
  Database,
  Drama,
  HardDrive,
  History,
  KeyRound,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";
import { useAuth } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";
import { FeatureCard } from "../shared/components/FeatureCard";
import { ProductPreviewCard } from "../shared/components/ProductPreviewCard";
import { getEnabledConfig } from "../features/roleplay/storage/apiProviderConfigStorage";
import { getPresetName } from "../features/roleplay/providers/providerPresets";
import { getStorageModeLabel } from "../features/roleplay/storage/apiKeyStorage";

function getApiSummary() {
  const enabled = getEnabledConfig();
  if (!enabled) return { title: "未配置 API", status: "untested" as const };
  return {
    title: `${getPresetName(enabled.provider)} / ${enabled.model}`,
    status: enabled.testStatus,
  };
}

export function LandingPage() {
  const { user } = useAuth();
  const api = getApiSummary();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24 md:py-14 md:pb-14">

      {/* ─── Hero ─── */}
      <div className="mb-10 text-center">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50/80 px-4 py-1.5 text-sm font-medium text-brand-600 backdrop-blur-sm">
          <Drama className="h-4 w-4" />
          角色酒馆
          <span className="mx-1 text-brand-300">·</span>
          <ModeBadge />
        </div>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-ink-900 md:text-5xl">
          本地优先的<br className="md:hidden" /> AI 角色酒馆
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-400 md:text-base">
          不登录也能创建角色、保存数据、开始聊天。<br className="hidden md:block" />
          登录后可选云端同步。
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/roleplay" className="btn-primary px-8 py-3 text-base font-semibold shadow-lg shadow-brand-200/50">
            <Sparkles className="mr-1.5 h-5 w-5" />
            开始本地使用
          </Link>
          {!user && (
            <Link to="/login" className="btn-secondary px-6 py-3 text-sm">
              <Cloud className="mr-1.5 h-4 w-4" />
              登录开启同步
            </Link>
          )}
          {user && (
            <Link to="/settings" className="btn-secondary px-6 py-3 text-sm">
              管理设置
            </Link>
          )}
        </div>
      </div>

      {/* ─── Product Preview + Quick Status ─── */}
      <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <ProductPreviewCard />

        <div className="space-y-3">
          {/* Compact status cards */}
          <div className="rounded-2xl border border-surface-100/80 bg-white/80 backdrop-blur-sm p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-ink-300" />
                <span className="text-xs font-medium text-ink-500">数据模式</span>
              </div>
              <span className="rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-ink-600">
                {user ? "云端同步" : "本地优先"}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-ink-400">
              {user
                ? "数据保存在云端，当前设备保留本地镜像。"
                : "数据保存在当前浏览器，刷新/重启后通常保留。"}
            </p>
          </div>

          <div className="rounded-2xl border border-surface-100/80 bg-white/80 backdrop-blur-sm p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-ink-300" />
                <span className="text-xs font-medium text-ink-500">API 状态</span>
              </div>
              <span className="inline-flex items-center gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full ${
                  api.status === "ok" ? "bg-emerald-500" : api.status === "failed" ? "bg-rose-500" : "bg-ink-300"
                }`} />
                <span className="text-xs text-ink-500">{api.title}</span>
              </span>
            </div>
            <p className="mt-1.5 text-xs text-ink-400">
              {api.status === "untested" ? "在设置中启用 API 配置后可调用真实模型。" : getStorageModeLabel(getEnabledConfig()?.storageMode || "session_only")}
            </p>
          </div>

          <div className="rounded-2xl border border-surface-100/80 bg-white/80 backdrop-blur-sm p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-medium text-ink-500">数据保护提示</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
              本地数据建议定期导出备份。清除浏览器数据、换设备或无痕模式可能导致数据丢失。
            </p>
            <div className="mt-2 flex gap-2">
              <Link to="/settings/data" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                去备份 →
              </Link>
              <Link to="/settings" className="text-xs text-ink-400 hover:text-ink-500">
                同步中心 →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Feature Cards ─── */}
      <div className="mb-10">
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-ink-400">核心能力</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <FeatureCard icon={<Sparkles className="h-5 w-5" />} title="AI 聊天" description="多 Provider · 角色扮演" to="/roleplay" color="amber" />
          <FeatureCard icon={<HardDrive className="h-5 w-5" />} title="创作工坊" description="角色 · 模板 · 世界书" to="/studio" color="sky" />
          <FeatureCard icon={<BookOpen className="h-5 w-5" />} title="世界书" description="世界观设定 · 关键词" to="/studio" color="violet" />
          <FeatureCard icon={<Brain className="h-5 w-5" />} title="记忆系统" description="AI 提炼 · 自动注入" to="/studio" color="emerald" />
          <FeatureCard icon={<History className="h-5 w-5" />} title="版本历史" description="编辑消息 · 版本切换" to="/roleplay" color="rose" />
          <FeatureCard icon={<Upload className="h-5 w-5" />} title="数据备份" description="导出备份 · 导入恢复" to="/settings/data" color="brand" />
          <FeatureCard icon={<Cloud className="h-5 w-5" />} title="云端同步" description="多设备 · 手动同步" to="/settings" color="sky" />
          <FeatureCard icon={<KeyRound className="h-5 w-5" />} title="Provider 预设" description="DeepSeek · OpenAI 等" to="/settings" color="amber" />
        </div>
      </div>

      {/* ─── Page Footer ─── */}
      <div className="text-center">
        <p className="text-xs text-ink-300">
          当前客户端：网页模式 · 桌面模式与移动 App 暂未推出
        </p>
      </div>
    </div>
  );
}

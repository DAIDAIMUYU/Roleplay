import { Link } from "react-router-dom";
import {
  BookOpen,
  Brain,
  Cloud,
  Database,
  Drama,
  ExternalLink,
  FileText,
  Github,
  HardDrive,
  HelpCircle,
  History,
  KeyRound,
  MessageCircle,
  Palette,
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
          创建角色、配置世界书与记忆，在本地保存你的角色扮演数据。<br className="hidden md:block" />
          不登录也能使用本地模式；想体验真实 AI 聊天，通常需要先配置 API。
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/roleplay" className="btn-primary px-8 py-3 text-base font-semibold shadow-lg shadow-brand-200/50">
            <Sparkles className="mr-1.5 h-5 w-5" />
            开始本地使用
          </Link>
          <Link to="/settings" className="btn-secondary px-6 py-3 text-sm">
            <KeyRound className="mr-1.5 h-4 w-4" />
            配置 API
          </Link>
          {!user && (
            <Link to="/login" className="btn-ghost px-6 py-3 text-sm">
              <Cloud className="mr-1.5 h-4 w-4" />
              登录开启同步
            </Link>
          )}
        </div>
      </div>

      {/* ─── How to Start ─── */}
      <div className="mb-10">
        <h2 className="mb-2 text-center text-lg font-bold text-ink-900">如何快速开始聊天？</h2>
        <p className="mb-6 text-center text-sm text-ink-400">只需三步，即可开始你的角色扮演之旅</p>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Step 1 */}
          <div className="group relative rounded-2xl border border-surface-100/80 bg-white/80 p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-brand-500">步骤 1</span>
                <h3 className="text-sm font-semibold text-ink-900">配置 API</h3>
              </div>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-ink-400">
              选择 DeepSeek、OpenAI-compatible 或其他 Provider，填入你的 API Key。未配置 API 时仍可使用本地预览模式。
            </p>
            <Link to="/settings" className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
              去配置 API
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Step 2 */}
          <div className="group relative rounded-2xl border border-surface-100/80 bg-white/80 p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-500">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-sky-500">步骤 2</span>
                <h3 className="text-sm font-semibold text-ink-900">创建角色</h3>
              </div>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-ink-400">
              在创作工坊创建角色卡，设置身份、性格、说话风格和基础规则。
            </p>
            <Link to="/studio" className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
              去创作工坊
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Step 3 */}
          <div className="group relative rounded-2xl border border-surface-100/80 bg-white/80 p-5 shadow-sm transition-all hover:border-brand-200 hover:shadow-md">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-medium text-emerald-500">步骤 3</span>
                <h3 className="text-sm font-semibold text-ink-900">开始聊天</h3>
              </div>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-ink-400">
              进入聊天室，选择角色并创建会话后即可开始角色扮演。
            </p>
            <Link to="/roleplay" className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
              去聊天室
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Need Help ─── */}
      <div className="mb-10 rounded-2xl border border-surface-100/80 bg-gradient-to-r from-brand-50/30 to-amber-light/20 p-5">
        <div className="mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-brand-400" />
          <h3 className="text-sm font-semibold text-ink-900">需要帮助？</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Link to="/settings/data" className="flex items-center gap-2 rounded-xl bg-white/80 p-3 text-xs text-ink-600 transition-colors hover:bg-white hover:text-brand-600">
            <Upload className="h-4 w-4 text-ink-400" />
            数据备份与恢复
          </Link>
          <Link to="/settings" className="flex items-center gap-2 rounded-xl bg-white/80 p-3 text-xs text-ink-600 transition-colors hover:bg-white hover:text-brand-600">
            <KeyRound className="h-4 w-4 text-ink-400" />
            API 配置说明
          </Link>
          <a href="https://github.com/anomalyco/opencode" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-white/80 p-3 text-xs text-ink-600 transition-colors hover:bg-white hover:text-brand-600">
            <Github className="h-4 w-4 text-ink-400" />
            GitHub
          </a>
          <a href="https://opencode.ai/docs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl bg-white/80 p-3 text-xs text-ink-600 transition-colors hover:bg-white hover:text-brand-600">
            <FileText className="h-4 w-4 text-ink-400" />
            用户文档
          </a>
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

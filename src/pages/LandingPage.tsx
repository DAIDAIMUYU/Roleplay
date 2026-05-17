import { Link } from "react-router-dom";
import {
  Sparkles,
  LogIn,
  Drama,
  Palette,
  Shield,
  Eye,
  Key,
} from "lucide-react";
import { useAuth } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";
import { OnboardingSteps } from "../shared/components/OnboardingSteps";

export function LandingPage() {
  const { isGuestOrDemo } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-14">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <Drama className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-medium text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full">
            角色酒馆
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-ink-900 leading-tight">
          每个人都有属于自己的
          <span className="text-brand-500">角色与故事</span>
        </h1>
        <p className="mt-3 text-sm md:text-base text-ink-400 max-w-lg mx-auto leading-relaxed">
          连接你自己的 AI，创造角色、编织世界、展开长篇故事。
          你的数据、你的 API、你的酒馆。
        </p>
        <div className="mt-2 flex justify-center">
          <ModeBadge />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <Link
          to="/demo"
          className="card-hover flex flex-col items-center text-center p-4"
        >
          <div className="h-9 w-9 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-2">
            <Eye className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-ink-700">体验 Demo</span>
          <span className="text-xs text-ink-300 mt-0.5">Mock AI · 不烧钱</span>
        </Link>

        <Link
          to="/login"
          className="card-hover flex flex-col items-center text-center p-4"
        >
          <div className="h-9 w-9 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center mb-2">
            <LogIn className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-ink-700">登录使用</span>
          <span className="text-xs text-ink-300 mt-0.5">连接自己的 API</span>
        </Link>

        <Link
          to="/roleplay"
          className="card-hover flex flex-col items-center text-center p-4"
        >
          <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2">
            <Drama className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-ink-700">进入聊天</span>
          <span className="text-xs text-ink-300 mt-0.5">角色扮演空间</span>
        </Link>

        <Link
          to="/studio"
          className="card-hover flex flex-col items-center text-center p-4"
        >
          <div className="h-9 w-9 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mb-2">
            <Palette className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-ink-700">创作工坊</span>
          <span className="text-xs text-ink-300 mt-0.5">角色 · 世界书</span>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {/* Feature highlights */}
        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-sm font-semibold text-ink-500 uppercase tracking-wide mb-4">
              功能亮点
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Drama className="h-4 w-4" />, label: "结构化角色卡", desc: "身份、外貌、性格、背景故事" },
                { icon: <Sparkles className="h-4 w-4" />, label: "世界书 & 记忆", desc: "长篇剧情稳定运行" },
                { icon: <Shield className="h-4 w-4" />, label: "多角色群聊", desc: "分支剧情 · 回收站保护" },
                { icon: <Key className="h-4 w-4" />, label: "自带 API Key", desc: "BYOK · 数据完全私有" },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="flex items-start gap-2.5 p-2">
                  <span className="mt-0.5 text-brand-400">{icon}</span>
                  <div>
                    <p className="text-sm font-medium text-ink-700">{label}</p>
                    <p className="text-xs text-ink-300 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security notice */}
          <div className="card bg-amber-light/30 border-amber-100">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-ink-700">
                  数据安全说明
                </h3>
                <ul className="mt-2 space-y-1 text-xs text-ink-400">
                  <li>· 访客 Demo 使用 Mock AI，不消耗站主 API</li>
                  <li>· 访客不写入正式数据库</li>
                  <li>· 登录用户自带 API Key，数据完全私有</li>
                  <li>· Admin 默认不读取用户私聊、记忆、API Key</li>
                  <li>· 所有数据受 Auth + RLS + Repository 三层保护</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Placeholder sections */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-ink-500 mb-3">
                最近会话
              </h3>
              <p className="text-xs text-ink-300">
                登录后可查看和管理你的最近会话
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-semibold text-ink-500 mb-3">
                我的角色
              </h3>
              <p className="text-xs text-ink-300">
                登录后可在创作工坊中管理角色卡
              </p>
            </div>
          </div>
        </div>

        {/* Onboarding sidebar */}
        <div className="card">
          <OnboardingSteps />
          {isGuestOrDemo && (
            <div className="mt-4 pt-4 border-t border-surface-100">
              <Link to="/login" className="btn-primary w-full text-center block text-sm">
                登录或注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import {
  Eye,
  Drama,
  Sparkles,
  LogIn,
  Shield,
  Zap,
} from "lucide-react";
import { useAuth } from "../features/auth";
import { EmptyState } from "../shared/components/EmptyState";
import { ModeBadge } from "../shared/components/ModeBadge";

export function DemoPage() {
  const { isGuestOrDemo } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Banner */}
      <div className="card bg-amber-light/30 border-amber-200 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ink-900">Demo 体验模式</h1>
              <ModeBadge />
            </div>
            <p className="text-sm text-ink-400">模拟体验，不调用真实 AI</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/60 rounded-card p-3 text-center">
            <Zap className="h-4 w-4 text-amber-500 mx-auto mb-1" />
            <p className="text-xs font-medium text-ink-700">Mock AI 回复</p>
            <p className="text-xs text-ink-300">不消耗站主 API</p>
          </div>
          <div className="bg-white/60 rounded-card p-3 text-center">
            <Shield className="h-4 w-4 text-amber-500 mx-auto mb-1" />
            <p className="text-xs font-medium text-ink-700">不写数据库</p>
            <p className="text-xs text-ink-300">访客体验保护</p>
          </div>
          <div className="bg-white/60 rounded-card p-3 text-center">
            <LogIn className="h-4 w-4 text-amber-500 mx-auto mb-1" />
            <p className="text-xs font-medium text-ink-700">登录解锁</p>
            <p className="text-xs text-ink-300">使用自己的 API</p>
          </div>
        </div>
      </div>

      {/* Demo content placeholders */}
      <h2 className="text-sm font-semibold text-ink-500 uppercase tracking-wide mb-4">
        探索 Demo 内容
      </h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="card">
          <h3 className="text-sm font-semibold text-ink-700 mb-2 flex items-center gap-2">
            <Drama className="h-4 w-4 text-brand-400" />
            Demo 角色
          </h3>
          <EmptyState
            title="暂无 Demo 角色"
            description="阶段 3 将提供预设 Demo 角色供体验"
          />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-ink-700 mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-400" />
            Demo 会话
          </h3>
          <EmptyState
            title="暂无 Demo 会话"
            description="阶段 3 将提供预设对话演示"
          />
        </div>
      </div>

      {/* Enter Demo Chat */}
      <div className="card text-center">
        <p className="text-sm text-ink-500 mb-3">
          在聊天房间中体验 Mock AI 角色扮演
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/roleplay" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Drama className="h-4 w-4" />
            进入 Demo Chat
          </Link>
          {isGuestOrDemo && (
            <Link to="/login" className="btn-secondary inline-flex items-center gap-2 text-sm">
              <LogIn className="h-4 w-4" />
              登录使用自己的 API
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LogIn, Mail, Lock, UserPlus, AlertTriangle, Check } from "lucide-react";
import { useAuth, isSupabaseConfigured } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";

export function LoginPage() {
  const { loading, user, profile, mode, isGuestOrDemo, isOwner, isAdmin, signIn, signUp } = useAuth();
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("请输入邮箱和密码");
      return;
    }
    setBusy(true);
    setError(null);
    const result = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);
    if (result.error) {
      setError(result.error);
    }
    setBusy(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-50">
        <p className="text-ink-300 text-sm">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-brand-500 items-center justify-center mb-3">
            <LogIn className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">
            {isSignUp ? "注册" : "登录"}
          </h1>
          <div className="mt-2">
            <ModeBadge />
          </div>
        </div>

        {/* Supabase not configured */}
        {!configured ? (
          <div className="card bg-amber-light/30 border-amber-200 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-ink-700">
                  Supabase 未配置
                </h3>
                <p className="mt-1 text-xs text-ink-400">
                  请设置环境变量 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
                </p>
                <p className="text-xs text-ink-300 mt-1">
                  在 Supabase SQL Editor 中执行
                  supabase/migrations/ 目录下的迁移文件
                </p>
              </div>
            </div>
          </div>
        ) : user ? (
          /* Already logged in */
          <div className="card mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-700">已登录</p>
                <p className="text-xs text-ink-300">
                  {profile?.display_name ?? user.email}
                </p>
                <p className="text-xs text-ink-300">
                  模式：{mode}
                  {isOwner && " · Owner"}
                  {isAdmin && " · Admin"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Login form */
          <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
            {error && (
              <div className="rounded-input bg-rose-light/50 text-rose-600 text-xs px-3 py-2 border border-rose-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-input border border-surface-200 bg-surface-50 py-2.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-input border border-surface-200 bg-surface-50 py-2.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            >
              {busy ? (
                "处理中..."
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  注册
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  登录
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="w-full text-xs text-ink-400 hover:text-brand-600 transition-colors"
            >
              {isSignUp ? "已有账号？去登录" : "没有账号？去注册"}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center space-y-2">
          {isGuestOrDemo && (
            <p className="text-xs text-ink-300">
              访客 Demo 模式 — 不调用真实 AI，不写正式数据库
            </p>
          )}
          <Link
            to="/"
            className="btn-ghost text-xs inline-block"
          >
            返回大厅
          </Link>
        </div>
      </div>
    </div>
  );
}

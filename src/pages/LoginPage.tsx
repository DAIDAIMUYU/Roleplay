import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogIn, Mail, Lock, UserPlus, AlertTriangle, Check,
  LogOut, Drama, Settings,
} from "lucide-react";
import { useAuth, isSupabaseConfigured } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";

function translateError(raw: string): string {
  if (!raw) return "";
  if (raw.includes("Invalid login credentials")) return "邮箱或密码错误";
  if (raw.includes("Email not confirmed")) return "邮箱未确认，请检查验证邮件";
  if (raw.includes("network") || raw.includes("fetch") || raw.includes("Network")) return "网络连接失败，请检查网络";
  return raw;
}

export function LoginPage() {
  const { loading, user, profile, isGuestOrDemo, isOwner, isAdmin, signIn, signUp, signOut } =
    useAuth();
  const configured = isSupabaseConfigured();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);

  // Local loading guard: max 3s, then show content anyway
  const [localTimeout, setLocalTimeout] = useState(false);
  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => setLocalTimeout(true), 3000);
      return () => clearTimeout(t);
    } else {
      setLocalTimeout(false);
    }
  }, [loading]);

  const showLoading = loading && !localTimeout;

  // After login, redirect to /roleplay
  useEffect(() => {
    if (user && !loading) {
      navigate("/roleplay", { replace: true });
    }
  }, [user, loading, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("请输入邮箱和密码");
      return;
    }

    setBusy(true);
    setError(null);

    // 10-second timeout guard
    const timeoutId = setTimeout(() => {
      setBusy(false);
      setError("登录请求超时，请检查网络后重试");
      console.warn("[login] submit timeout after 10s");
    }, 10000);

    try {
      const result = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      clearTimeout(timeoutId);

      if (result.error) {
        setError(translateError(result.error));
      }
      // On success: useEffect above will redirect to /roleplay
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn("[login] submit exception:", err);
      setError(translateError(String(err)));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setSignOutBusy(true);
    try {
      await signOut();
    } catch {
      // ignore
    } finally {
      setSignOutBusy(false);
    }
  }

  if (showLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-50">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-ink-300 text-sm">加载中...</p>
        </div>
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
            {user ? "我的账号" : isSignUp ? "注册" : "登录"}
          </h1>
          <div className="mt-2">
            <ModeBadge />
          </div>
        </div>

        {/* Supabase not configured */}
        {!configured && (
          <div className="card bg-amber-light/30 border-amber-200 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-ink-700">Supabase 未配置</h3>
                <p className="mt-1 text-xs text-ink-400">
                  请设置环境变量 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Already logged in */}
        {user && (
          <div className="card mb-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
                {profile?.display_name?.[0] || user.email?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-700 truncate">
                  {profile?.display_name || user.email}
                </p>
                <p className="text-xs text-ink-400 truncate">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600">
                    已登录
                    {isOwner ? " · Owner" : isAdmin ? " · Admin" : " · User"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link to="/roleplay" className="btn-primary text-sm flex-1 flex items-center justify-center gap-2">
                <Drama className="h-4 w-4" />
                进入聊天
              </Link>
              <Link to="/settings" className="btn-secondary text-sm flex items-center justify-center gap-1.5 px-3">
                <Settings className="h-4 w-4" />
              </Link>
            </div>

            <button
              onClick={handleSignOut}
              disabled={signOutBusy}
              className="w-full btn-ghost text-sm text-rose-600 hover:bg-rose-light/30 flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {signOutBusy ? "退出中..." : "退出登录"}
            </button>
          </div>
        )}

        {/* Login/Signup form */}
        {!user && configured && (
          <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
            {error && (
              <div className="rounded-input bg-rose-light/50 text-rose-600 text-xs px-3 py-2 border border-rose-100">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-ink-500 mb-1.5">邮箱</label>
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
              <label className="block text-xs font-medium text-ink-500 mb-1.5">密码</label>
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
              className="btn-primary w-full text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? (
                "处理中..."
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4" /> 注册
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> 登录
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

        {/* Guest mode notice */}
        {isGuestOrDemo && !user && (
          <div className="card bg-surface-50 border-surface-100 mb-4">
            <p className="text-xs text-ink-400 text-center">
              当前为 Demo 访客模式 · 不调用真实 AI · 不写正式数据库
            </p>
          </div>
        )}

        {/* Back link */}
        <div className="text-center">
          <Link to="/" className="btn-ghost text-xs inline-block">
            返回大厅
          </Link>
        </div>
      </div>
    </div>
  );
}

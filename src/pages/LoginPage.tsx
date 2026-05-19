import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  Cloud,
  LogIn,
  LogOut,
  Lock,
  Mail,
  Settings,
  UserPlus,
} from "lucide-react";
import { useAuth, isSupabaseConfigured } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";

function translateError(raw: string): string {
  if (!raw) return "";
  if (raw.includes("Invalid login credentials")) return "邮箱或密码错误。";
  if (raw.includes("Email not confirmed")) return "邮箱尚未确认，请先查收验证邮件。";
  if (raw.includes("network") || raw.includes("fetch") || raw.includes("Network")) {
    return "网络连接失败，请检查网络后重试。";
  }
  return raw;
}

export function LoginPage() {
  const { loading, user, profile, isGuestOrDemo, signIn, signUp, signOut } = useAuth();
  const configured = isSupabaseConfigured();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signOutBusy, setSignOutBusy] = useState(false);
  const [localTimeout, setLocalTimeout] = useState(false);

  useEffect(() => {
    if (!loading) {
      setLocalTimeout(false);
      return;
    }
    const timer = window.setTimeout(() => setLocalTimeout(true), 3000);
    return () => window.clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (user && !loading) {
      navigate("/roleplay", { replace: true });
    }
  }, [user, loading, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email || !password) {
      setError("请输入邮箱和密码。");
      return;
    }

    setBusy(true);
    setError(null);

    const timeoutId = window.setTimeout(() => {
      setBusy(false);
      setError("登录请求超时，请检查网络后重试。");
      console.warn("[login] submit timeout after 10s");
    }, 10000);

    try {
      const result = isSignUp ? await signUp(email, password) : await signIn(email, password);
      window.clearTimeout(timeoutId);
      if (result.error) {
        setError(translateError(result.error));
      }
    } catch (submitError) {
      window.clearTimeout(timeoutId);
      console.warn("[login] submit exception:", submitError);
      setError(translateError(String(submitError)));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setSignOutBusy(true);
    try {
      await signOut();
    } finally {
      setSignOutBusy(false);
    }
  }

  if (loading && !localTimeout) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          <p className="text-sm text-ink-300">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500">
            <LogIn className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900">{user ? "账号状态" : isSignUp ? "注册账号" : "登录账号"}</h1>
          <div className="mt-2 flex justify-center">
            <ModeBadge />
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex items-start gap-3">
            <Cloud className="mt-0.5 h-5 w-5 text-brand-500" />
            <div className="space-y-2 text-sm leading-relaxed text-ink-500">
              <h2 className="text-sm font-semibold text-ink-700">登录是为了开启云端同步，不是强制门槛</h2>
              <p>
                你可以一直只使用网页本地模式。登录后，角色、会话、世界书、记忆等数据才可以同步到云端，并在多设备之间互通。
              </p>
              <p className="text-xs text-ink-400">
                如果当前浏览器里已经有本地数据，后续同步中心会明确询问你是否上传本地数据到云端。系统不会在注册或登录后静默上传。
              </p>
            </div>
          </div>
        </div>

        {!configured ? (
          <div className="card mb-6 border-amber-200 bg-amber-light/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-semibold text-ink-700">云端服务未配置</h3>
                <p className="mt-1 text-xs text-ink-400">
                  请先配置 <code>VITE_SUPABASE_URL</code> 和 <code>VITE_SUPABASE_ANON_KEY</code>。在此之前，你仍然可以继续使用网页本地模式。
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {user ? (
          <div className="card mb-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg text-emerald-600">
                {profile?.display_name?.[0] || user.email?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-700">{profile?.display_name || user.email}</p>
                <p className="truncate text-xs text-ink-400">{user.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600">已登录，可使用云端同步</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Link to="/roleplay" className="btn-primary text-sm text-center">
                进入聊天
              </Link>
              <Link to="/settings" className="btn-secondary px-3 text-sm">
                <Settings className="h-4 w-4" />
              </Link>
            </div>

            <button
              onClick={handleSignOut}
              disabled={signOutBusy}
              className="btn-ghost w-full text-sm text-rose-600 hover:bg-rose-light/30"
            >
              <LogOut className="h-4 w-4" />
              {signOutBusy ? "退出中..." : "退出登录"}
            </button>
          </div>
        ) : null}

        {!user && configured ? (
          <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
            {error ? (
              <div className="rounded-input border border-rose-100 bg-rose-light/50 px-3 py-2 text-xs text-rose-600">
                {error}
              </div>
            ) : null}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-500">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-input border border-surface-200 bg-surface-50 py-2.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-500">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入密码"
                  className="w-full rounded-input border border-surface-200 bg-surface-50 py-2.5 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full text-sm disabled:opacity-60"
            >
              {busy ? "处理中..." : isSignUp ? <><UserPlus className="h-4 w-4" /> 注册</> : <><LogIn className="h-4 w-4" /> 登录</>}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp((current) => !current);
                setError(null);
              }}
              className="w-full text-xs text-ink-400 transition-colors hover:text-brand-600"
            >
              {isSignUp ? "已有账号？去登录" : "还没有账号？去注册"}
            </button>
          </form>
        ) : null}

        {isGuestOrDemo && !user ? (
          <div className="card mb-4 bg-surface-50">
            <p className="text-center text-xs leading-relaxed text-ink-400">
              当前正在使用网页本地模式。登录后可以开启云端同步；如果你不想上传本地数据，也可以继续只使用本地模式。
            </p>
          </div>
        ) : null}

        <div className="text-center">
          <Link to="/" className="btn-ghost inline-block text-xs">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}

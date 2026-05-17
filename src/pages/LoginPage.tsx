import { Link } from "react-router-dom";
import { useAuth, isSupabaseConfigured } from "../features/auth";

export function LoginPage() {
  const { loading, mode, isGuestOrDemo } = useAuth();
  const configured = isSupabaseConfigured();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100">
        <p className="text-base-content/50">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-base-content">登录</h1>

        {!configured ? (
          <>
            <p className="mt-2 text-sm text-yellow-400">
              阶段 1 · Supabase 未配置
            </p>
            <p className="mt-1 text-xs text-base-content/30">
              请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量
            </p>
            <p className="mt-1 text-xs text-base-content/30">
              在 Supabase SQL Editor 中执行 supabase/migrations/ 目录下的迁移文件
            </p>
          </>
        ) : isGuestOrDemo ? (
          <>
            <p className="mt-2 text-sm text-base-content/50">
              阶段 1 · Auth 已就绪
            </p>
            <p className="mt-1 text-xs text-base-content/30">
              当前为访客 Demo 模式（{mode}）
            </p>
            {/* 阶段 2 将实现登录表单 */}
          </>
        ) : (
          <p className="mt-2 text-sm text-base-content/50">
            已登录（{mode}）
          </p>
        )}

        <Link
          to="/"
          className="mt-4 inline-block rounded bg-base-200 px-3 py-1.5 text-sm text-base-content hover:bg-base-300"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

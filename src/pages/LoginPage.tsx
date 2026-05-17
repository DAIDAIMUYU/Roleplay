import { Link } from "react-router-dom";

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-base-content">登录</h1>
        <p className="mt-2 text-sm text-base-content/50">阶段 0 · 占位页面</p>
        <p className="mt-1 text-xs text-base-content/30">
          阶段 1 将接入 Supabase Auth
        </p>
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

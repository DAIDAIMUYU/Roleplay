import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-base-content">角色酒馆</h1>
        <p className="mt-2 text-sm text-base-content/50">阶段 0 · 项目底座</p>
        <p className="mt-1 text-xs text-base-content/30">
          后续阶段将在此构建完整角色扮演体验
        </p>
        <nav className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            to="/demo"
            className="rounded bg-base-200 px-3 py-1.5 text-sm text-base-content hover:bg-base-300"
          >
            Demo
          </Link>
          <Link
            to="/login"
            className="rounded bg-base-200 px-3 py-1.5 text-sm text-base-content hover:bg-base-300"
          >
            登录
          </Link>
          <Link
            to="/roleplay"
            className="rounded bg-base-200 px-3 py-1.5 text-sm text-base-content hover:bg-base-300"
          >
            角色扮演
          </Link>
          <Link
            to="/studio"
            className="rounded bg-base-200 px-3 py-1.5 text-sm text-base-content hover:bg-base-300"
          >
            创作工坊
          </Link>
          <Link
            to="/settings"
            className="rounded bg-base-200 px-3 py-1.5 text-sm text-base-content hover:bg-base-300"
          >
            设置
          </Link>
          <Link
            to="/admin"
            className="rounded bg-base-200 px-3 py-1.5 text-sm text-base-content hover:bg-base-300"
          >
            管理
          </Link>
        </nav>
      </div>
    </div>
  );
}

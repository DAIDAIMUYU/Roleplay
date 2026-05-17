import { Link } from "react-router-dom";

export function DemoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-base-content">Demo 体验</h1>
        <p className="mt-2 text-sm text-base-content/50">阶段 0 · 占位页面</p>
        <p className="mt-1 text-xs text-base-content/30">
          后续阶段将实现模拟对话体验，不调用真实 AI
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

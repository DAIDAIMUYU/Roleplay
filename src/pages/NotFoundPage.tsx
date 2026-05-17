import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-50 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-ink-200">404</p>
        <p className="mt-3 text-sm text-ink-400">页面未找到</p>
        <Link
          to="/"
          className="btn-ghost mt-4 inline-block text-sm"
        >
          返回大厅
        </Link>
      </div>
    </div>
  );
}

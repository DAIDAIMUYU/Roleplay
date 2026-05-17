import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-base-content/20">404</h1>
        <p className="mt-2 text-sm text-base-content/50">页面未找到</p>
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

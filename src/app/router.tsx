import { Routes, Route } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { DemoPage } from "../pages/DemoPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-base-content">{title}</h1>
        <p className="mt-2 text-sm text-base-content/50">阶段 0 · 占位页面</p>
        <p className="mt-1 text-xs text-base-content/30">后续阶段将实现完整功能</p>
      </div>
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/demo" element={<DemoPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/roleplay" element={<PlaceholderPage title="角色扮演" />} />
      <Route path="/studio" element={<PlaceholderPage title="创作工坊" />} />
      <Route path="/settings" element={<PlaceholderPage title="设置中心" />} />
      <Route path="/admin" element={<PlaceholderPage title="管理后台" />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

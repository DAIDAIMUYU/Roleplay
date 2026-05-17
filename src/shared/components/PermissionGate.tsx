import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";

interface PermissionGateProps {
  requiredRole: "owner" | "admin";
  hasAccess: boolean;
  children: ReactNode;
}

export function PermissionGate({ requiredRole, hasAccess, children }: PermissionGateProps) {
  if (hasAccess) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="mb-4 rounded-full bg-rose-light p-3 text-rose-500">
        <ShieldX className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-ink-700">无访问权限</h3>
      <p className="mt-2 max-w-sm text-sm text-ink-300">
        此区域需要 {requiredRole === "owner" ? "Owner" : "Owner 或 Admin"}{" "}
        权限。Admin 默认不读取普通用户的 private 聊天、记忆、context_runs 和
        API credentials。
      </p>
      <Link to="/" className="btn-secondary mt-6 inline-block">
        返回大厅
      </Link>
    </div>
  );
}

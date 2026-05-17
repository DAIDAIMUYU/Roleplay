import {
  Shield,
  Eye,
  FileText,
  Megaphone,
  Users,
  Bug,
  Server,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { useAuth, canAccessAdminPanel } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";
import { PermissionGate } from "../shared/components/PermissionGate";

const modules = [
  {
    icon: <Eye className="h-5 w-5" />,
    title: "Demo 内容管理",
    description: "管理 Demo 角色、Demo 世界书、Demo 脚本",
    stage: "阶段 8",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "系统模板管理",
    description: "管理默认提示词模板、模型预设",
    stage: "阶段 8",
  },
  {
    icon: <Megaphone className="h-5 w-5" />,
    title: "公告与更新日志",
    description: "发布系统公告和版本更新日志",
    stage: "阶段 8",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "用户管理",
    description: "查看用户列表、禁用异常用户（不读取私聊）",
    stage: "阶段 8",
  },
  {
    icon: <Bug className="h-5 w-5" />,
    title: "反馈与错误日志",
    description: "查看用户反馈、系统错误聚合",
    stage: "阶段 8-9",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "成本与限流",
    description: "Demo 使用统计、Provider 错误率、成本健康",
    stage: "阶段 8",
  },
  {
    icon: <Server className="h-5 w-5" />,
    title: "系统设置",
    description: "全局配置、RLS 审计、健康检查",
    stage: "Owner 专属",
  },
];

export function AdminPage() {
  const { role, isOwner } = useAuth();
  const hasAccess = canAccessAdminPanel(role);

  return (
    <PermissionGate requiredRole="admin" hasAccess={hasAccess}>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 rounded-lg bg-ink-800 text-white flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-900">管理后台</h1>
            <p className="text-sm text-ink-400">
              {isOwner ? "Owner 最高权限" : "Admin 运营管理"}
            </p>
          </div>
          <ModeBadge />
        </div>

        {/* Privacy notice */}
        <div className="card bg-brand-50/50 border-brand-100 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-brand-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-ink-700">
                权限说明
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-ink-400">
                <li>
                  · Admin 默认管理 <strong>demo / system / admin</strong> 分区内容
                </li>
                <li>
                  · Admin <strong>默认不读取</strong>普通用户 private 聊天、记忆、context_runs、API credentials
                </li>
                <li>
                  · 如需排障查看敏感数据，必须走 break-glass 流程并写入 audit_events
                </li>
                <li>· Owner 拥有最高权限，敏感访问均有审计记录</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modules grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {modules.map(({ icon, title, description, stage }) => (
            <div key={title} className="card hover:shadow-elevated transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-lg bg-surface-100 text-ink-400 flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-ink-700">{title}</h3>
                  <p className="text-xs text-ink-300 mt-0.5">{description}</p>
                  <span className="inline-block mt-2 text-xs text-ink-200 bg-surface-50 rounded-full px-2 py-0.5">
                    {stage}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PermissionGate>
  );
}

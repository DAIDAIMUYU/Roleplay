import {
  Settings,
  User,
  Key,
  Database,
  Eye,
  Shield,
  Smartphone,
  Info,
} from "lucide-react";
import { useAuth } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";

const sections = [
  {
    icon: <User className="h-5 w-5" />,
    title: "账号设置",
    description: "个人信息、显示名称、头像",
    stage: "阶段 2 预留",
  },
  {
    icon: <Key className="h-5 w-5" />,
    title: "API Provider",
    description: "配置自己的 DeepSeek 或 OpenAI 兼容 API Key",
    stage: "阶段 3 实现",
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "数据管理",
    description: "备份、恢复、导入、导出你的角色和会话数据",
    stage: "阶段 7 实现",
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: "外观设置",
    description: "夜间模式、字体大小、气泡宽度、头像显示",
    stage: "阶段 9 实现",
  },
  {
    icon: <Smartphone className="h-5 w-5" />,
    title: "移动端设置",
    description: "离线草稿、离线查看历史、PWA 安装",
    stage: "阶段 8-9",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "安全设置",
    description: "API Key 管理、设备管理、访问日志",
    stage: "阶段 8 实现",
  },
];

export function SettingsPage() {
  const { isGuestOrDemo } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-lg bg-ink-100 text-ink-500 flex items-center justify-center">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink-900">设置中心</h1>
          <p className="text-sm text-ink-400">管理账号、API、数据、外观和安全</p>
        </div>
        <ModeBadge />
      </div>

      {/* API Status */}
      <div className="card mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-ink-300 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-ink-700">
              当前 API 状态
            </h3>
            <p className="text-xs text-ink-300 mt-1">
              {isGuestOrDemo
                ? "Demo 模式 — 使用 Mock AI，不消耗真实 API"
                : "已登录 — 可在「API Provider」中配置自己的 Key"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-600 font-medium">
                {isGuestOrDemo ? "Demo / Mock" : "BYOK 本地版"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="space-y-3">
        {sections.map(({ icon, title, description, stage }) => (
          <div
            key={title}
            className="card flex items-start gap-4 hover:bg-surface-50 transition-colors cursor-pointer"
          >
            <div className="h-9 w-9 rounded-lg bg-surface-100 text-ink-400 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-ink-700">{title}</h3>
              <p className="text-xs text-ink-300 mt-0.5">{description}</p>
            </div>
            <span className="text-xs text-ink-200 bg-surface-50 rounded-full px-2 py-0.5 flex-shrink-0">
              {stage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

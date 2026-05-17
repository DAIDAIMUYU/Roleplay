import {
  Palette,
  Users,
  FileText,
  BookOpen,
  Brain,
  Tag,
  Download,
} from "lucide-react";
import { ModeBadge } from "../shared/components/ModeBadge";

const cards = [
  {
    icon: <Users className="h-5 w-5" />,
    title: "角色卡管理",
    description: "创建、编辑、导入导出角色卡。结构化字段：身份、外貌、性格、背景故事。",
    stage: "阶段 5",
    color: "brand",
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "提示词模板",
    description: "通用、角色扮演、剧情、旁白、群聊。支持模板变量和套用。",
    stage: "阶段 5",
    color: "emerald",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "世界书",
    description: "地点、人物、势力、事件。关键词触发、优先级、作用范围。",
    stage: "阶段 6",
    color: "sky",
  },
  {
    icon: <Brain className="h-5 w-5" />,
    title: "记忆库",
    description: "短期/长期/摘要/关系记忆。AI 建议 → 用户确认 → 注入上下文。",
    stage: "阶段 6",
    color: "amber",
  },
  {
    icon: <Tag className="h-5 w-5" />,
    title: "标签管理",
    description: "角色、会话、模板统一标签系统。颜色、合并、重命名。",
    stage: "阶段 9",
    color: "rose",
  },
  {
    icon: <Download className="h-5 w-5" />,
    title: "导入导出",
    description: "角色、世界书、会话备份。JSON 格式，导入前预览。",
    stage: "阶段 7",
    color: "ink",
  },
];

const colorMap: Record<string, string> = {
  brand: "bg-brand-50 text-brand-600",
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  ink: "bg-surface-100 text-ink-500",
};

export function StudioPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center">
          <Palette className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink-900">创作工坊</h1>
          <p className="text-sm text-ink-400">管理角色卡、世界书、记忆和提示词</p>
        </div>
        <ModeBadge />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ icon, title, description, stage, color }) => (
          <div key={title} className="card-hover">
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${
                colorMap[color] ?? colorMap.ink
              }`}
            >
              {icon}
            </div>
            <h3 className="text-sm font-semibold text-ink-700">{title}</h3>
            <p className="mt-1 text-xs text-ink-300 leading-relaxed">
              {description}
            </p>
            <span className="inline-block mt-3 text-xs text-ink-200 bg-surface-50 rounded-full px-2 py-0.5">
              {stage} 实现
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 card text-center">
        <p className="text-sm text-ink-400">
          创作工坊功能将在阶段 5-9 逐步实现。
          <br className="hidden md:block" />
          阶段 2 当前为信息架构预览。
        </p>
      </div>
    </div>
  );
}

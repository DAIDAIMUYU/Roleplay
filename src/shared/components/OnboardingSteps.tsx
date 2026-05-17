import { Sparkles, LogIn, Key, UserRound, MessageCircle } from "lucide-react";

const steps = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "体验 Demo",
    description: "无需登录，使用 Mock AI 探索角色酒馆的核心体验",
    done: true,
  },
  {
    icon: <LogIn className="h-5 w-5" />,
    title: "登录账号",
    description: "创建属于你自己的角色酒馆身份",
    done: false,
  },
  {
    icon: <Key className="h-5 w-5" />,
    title: "配置 API",
    description: "连接你自己的 DeepSeek 或 OpenAI 兼容 API Key",
    done: false,
  },
  {
    icon: <UserRound className="h-5 w-5" />,
    title: "创建角色",
    description: "在创作工坊中打造你的第一个角色卡",
    done: false,
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    title: "开始聊天",
    description: "进入聊天房间，开始你的角色扮演之旅",
    done: false,
  },
];

export function OnboardingSteps() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wide">
        入门引导
      </h3>
      {steps.map((step, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 rounded-card p-3 transition-colors ${
            step.done
              ? "bg-emerald-light/40 border border-emerald-100"
              : "bg-surface-50 border border-surface-100"
          }`}
        >
          <div
            className={`mt-0.5 rounded-full p-1.5 ${
              step.done
                ? "bg-emerald-100 text-emerald-600"
                : "bg-brand-50 text-brand-400"
            }`}
          >
            {step.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink-700">
              {step.title}
              {step.done && (
                <span className="ml-2 text-xs text-emerald-600 font-normal">
                  当前阶段
                </span>
              )}
            </p>
            <p className="text-xs text-ink-300 mt-0.5">{step.description}</p>
          </div>
          <div
            className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              step.done
                ? "border-emerald-300 bg-emerald-100"
                : "border-surface-200"
            }`}
          >
            {step.done && (
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

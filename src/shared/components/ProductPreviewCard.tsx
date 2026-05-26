import { useState, useEffect } from "react";
import { BookOpen, Brain, MessageCircle, Sparkles, UserCircle, Zap } from "lucide-react";

const STEPS = [
  {
    messages: [
      { role: "user" as const, content: "艾琳，能跟我讲讲王都最近有什么新鲜事吗？" },
      { role: "assistant" as const, content: "当然！最近王都的魔法学院新开了一门古代符文课…" },
    ],
    hints: [
      { icon: BookOpen, color: "text-sky-400", text: "世界书命中：王都 · 魔法学院" },
    ],
  },
  {
    messages: [
      { role: "assistant" as const, content: "听说是由大魔导师亲自授课，很多贵族子弟都报名了呢。" },
    ],
    hints: [
      { icon: Brain, color: "text-amber-400", text: "记忆注入：艾琳 — 友善" },
    ],
  },
  {
    messages: [
      { role: "user" as const, content: "那我们能去旁听吗？" },
    ],
    hints: [
      { icon: MessageCircle, color: "text-emerald-400", text: "模板：通用角色扮演" },
      { icon: Sparkles, color: "text-brand-400", text: "API：DeepSeek V4 Flash" },
    ],
  },
  {
    messages: [
      { role: "assistant" as const, content: "当然可以！不过需要先去学院报名。我明天带你去吧？" },
    ],
    hints: [
      { icon: Zap, color: "text-violet-400", text: "Token 预算：1,247 / 8,192" },
    ],
  },
];

export function ProductPreviewCard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [visibleHints, setVisibleHints] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STEPS.length);
      setVisibleMessages(0);
      setVisibleHints(0);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const step = STEPS[currentStep];
    
    // Show messages one by one (faster)
    const messageTimers = step.messages.map((_, index) => 
      setTimeout(() => setVisibleMessages(index + 1), 150 * (index + 1))
    );
    
    // Show hints after messages (faster)
    const hintTimer = setTimeout(() => {
      const hintTimers = step.hints.map((_, index) =>
        setTimeout(() => setVisibleHints(index + 1), 120 * (index + 1))
      );
      return () => hintTimers.forEach(clearTimeout);
    }, 150 * step.messages.length + 100);

    return () => {
      messageTimers.forEach(clearTimeout);
      clearTimeout(hintTimer);
    };
  }, [currentStep]);

  const step = STEPS[currentStep];

  return (
    <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-brand-50/40 via-white to-sky-light/20 p-6 shadow-sm backdrop-blur-md overflow-hidden">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-400" />
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">产品预览</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                index === currentStep ? "bg-brand-500" : "bg-surface-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Simulated chat bubble */}
      <div className="mb-4 space-y-3 min-h-[120px]">
        {/* Static first message */}
        <div className="flex gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-600">
            <UserCircle className="h-4 w-4" />
          </div>
          <div className="rounded-2xl rounded-tl-md bg-surface-100 px-3 py-2 text-xs text-ink-600 max-w-[75%]">
            你好，我是艾琳，王都的冒险者。有什么我可以帮你的？
          </div>
        </div>

        {/* Dynamic messages */}
        {step.messages.map((msg, index) => (
          <div
            key={`${currentStep}-${index}`}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""} transition-all duration-300 ${
              index < visibleMessages ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-600">
                <UserCircle className="h-4 w-4" />
              </div>
            )}
            <div
              className={`rounded-2xl px-3 py-2 text-xs max-w-[75%] ${
                msg.role === "user"
                  ? "rounded-tr-md bg-brand-500 text-white"
                  : "rounded-tl-md bg-surface-100 text-ink-600"
              }`}
            >
              {msg.content}
              {msg.role === "assistant" && index === step.messages.length - 1 && index < visibleMessages && (
                <span className="text-ink-300 animate-pulse">▊</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Context hints */}
      <div className="grid grid-cols-2 gap-2">
        {step.hints.map((hint, index) => {
          const Icon = hint.icon;
          return (
            <div
              key={`${currentStep}-hint-${index}`}
              className={`flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1.5 text-[11px] text-ink-400 shadow-sm transition-all duration-300 ${
                index < visibleHints ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <Icon className={`h-3 w-3 ${hint.color}`} />
              <span>{hint.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

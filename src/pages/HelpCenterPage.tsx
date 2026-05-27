import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Brain,
  ChevronDown,

  Cloud,
  Database,
  ExternalLink,
  HelpCircle,
  KeyRound,
  MessageCircle,
  Palette,
  Sparkles,
  Upload,
  Zap,
  Globe,
} from "lucide-react";

/* ── Navigation sections ── */
interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navSections: NavSection[] = [
  { id: "welcome", label: "欢迎", icon: <Sparkles className="h-4 w-4" /> },
  { id: "quickstart", label: "快速开始", icon: <Zap className="h-4 w-4" /> },
  { id: "api", label: "API 连接", icon: <KeyRound className="h-4 w-4" /> },
  { id: "studio", label: "角色与创作工坊", icon: <Palette className="h-4 w-4" /> },
  { id: "chat", label: "聊天室", icon: <MessageCircle className="h-4 w-4" /> },
  { id: "worldbook", label: "世界书", icon: <Globe className="h-4 w-4" /> },
  { id: "memory", label: "记忆", icon: <Brain className="h-4 w-4" /> },
  { id: "local-cloud", label: "本地模式与云端同步", icon: <Cloud className="h-4 w-4" /> },
  { id: "backup", label: "数据备份与恢复", icon: <Database className="h-4 w-4" /> },
  { id: "faq", label: "常见问题", icon: <HelpCircle className="h-4 w-4" /> },
  { id: "next-steps", label: "下一步建议", icon: <ExternalLink className="h-4 w-4" /> },
];

/* ── FAQ item ── */
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="neo-panel-soft overflow-hidden transition-all duration-[240ms]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="text-sm font-medium text-ink-700">{question}</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-ink-400 transition-transform duration-[240ms] ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm leading-relaxed text-ink-500">{answer}</p>
        </div>
      )}
    </div>
  );
}

/* ── Section card ── */
function SectionBlock({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="neo-panel p-5 md:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="neo-panel-soft flex h-10 w-10 items-center justify-center text-brand-500">
            {icon}
          </div>
          <h2 className="text-lg font-bold text-ink-900">{title}</h2>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-ink-600">{children}</div>
      </div>
    </section>
  );
}

/* ── Step card ── */
function StepCard({
  step,
  title,
  description,
  actionLabel,
  actionTo,
  color,
}: {
  step: number;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
  color: "brand" | "sky" | "emerald";
}) {
  const colorMap = {
    brand: { bg: "bg-brand-50", text: "text-brand-500", ring: "ring-brand-200/60" },
    sky: { bg: "bg-sky-50", text: "text-sky-500", ring: "ring-sky-200/60" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-500", ring: "ring-emerald-200/60" },
  };
  const c = colorMap[color];
  return (
    <div
      className={`neo-panel-soft group flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:ring-1 ${c.ring} hover:shadow-lg hover:shadow-blue-100/25`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${c.bg} ${c.text} text-sm font-bold`}
        >
          {step}
        </div>
        <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      </div>
      <p className="mb-4 flex-1 text-xs leading-relaxed text-ink-400">{description}</p>
      <Link
        to={actionTo}
        className="neo-button inline-flex items-center gap-1.5 self-start px-4 py-2 text-xs font-medium text-brand-600 hover:text-brand-700"
      >
        {actionLabel}
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}

/* ── Quick entry button ── */
function QuickEntry({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="neo-button flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-ink-600 transition-all hover:-translate-y-0.5 hover:text-brand-600"
    >
      <span className="text-ink-400">{icon}</span>
      {label}
    </Link>
  );
}

/* ── Main page ── */
export function HelpCenterPage() {
  const [activeSection, setActiveSection] = useState<string>("welcome");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const scrollToSection = useCallback((id: string) => {
    setActiveSection(id);
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-sky-200/50 to-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-tr from-blue-200/40 to-sky-100/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-100/30 to-purple-100/20 blur-2xl" />

      <div className="page-container-wide relative px-5 py-8 md:px-8 md:py-10">
        {/* ── Header ── */}
        <div className="mb-8">
          <div className="neo-pill mb-3 inline-flex items-center gap-2 bg-brand-50/80 text-sm text-brand-600">
            <BookOpen className="h-4 w-4" />
            帮助中心
          </div>
          <h1 className="text-3xl font-bold leading-tight text-ink-900 md:text-4xl">
            帮助中心
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-400 md:text-base">
            从配置 API、创建角色到开始聊天，快速了解 Roleplay Tavern 的核心用法。
          </p>
        </div>

        <div className="neo-panel-soft mb-6 rounded-[24px] px-4 py-3 text-sm text-ink-500">
          提示：`local_device` 只保存在当前设备，`hosted_encrypted` 登录后可跨设备加载。已保存的 API 配置现在支持编辑；编辑时 API Key 留空表示保持旧 Key 不变。
        </div>

        {/* ── Quick entry buttons ── */}
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <QuickEntry to="/settings" icon={<KeyRound className="h-4 w-4" />} label="去配置 API" />
          <QuickEntry to="/studio" icon={<Palette className="h-4 w-4" />} label="去创作工坊" />
          <QuickEntry to="/roleplay" icon={<MessageCircle className="h-4 w-4" />} label="去聊天室" />
          <QuickEntry to="/settings/data" icon={<Database className="h-4 w-4" />} label="数据管理" />
        </div>

        {/* ── Layout: sidebar + content ── */}
        <div className="flex gap-6">
          {/* Desktop sidebar nav */}
          <aside className="hidden w-56 flex-shrink-0 lg:block">
            <nav className="neo-surface sticky top-8 space-y-1 p-3" style={{ borderRadius: "24px" }}>
              <p className="mb-2 px-3 pt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                目录
              </p>
              {navSections.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-left text-sm font-medium transition-all duration-[200ms] ${
                    activeSection === id
                      ? "neo-button-pressed text-brand-700"
                      : "neo-button text-ink-500 hover:text-ink-700"
                  }`}
                >
                  {icon}
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Mobile nav — horizontal scroll pills */}
          <div className="mb-5 lg:hidden">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="neo-button mb-2 flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-ink-600"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-brand-400" />
                目录导航
              </span>
              <ChevronDown
                className={`h-4 w-4 text-ink-400 transition-transform duration-[240ms] ${
                  mobileNavOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {mobileNavOpen && (
              <div className="neo-panel-soft flex flex-wrap gap-1.5 p-3">
                {navSections.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`neo-pill text-xs transition-all ${
                      activeSection === id
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-500 hover:text-ink-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content area */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* ── 1. Welcome ── */}
            <SectionBlock id="welcome" title="欢迎使用 Roleplay Tavern" icon={<Sparkles className="h-5 w-5" />}>
              <p>
                Roleplay Tavern 是一个<strong>本地优先</strong>的 AI 角色酒馆。你可以在这里创建角色、配置世界书和记忆，并与角色进行连续对话。
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>不登录也能使用网页本地模式，所有数据保存在当前浏览器。</li>
                <li>登录后可以选择开启云端同步，跨设备继续你的角色扮演。</li>
                <li>真实 AI 回复通常需要先配置 API（如 DeepSeek 或 OpenAI-compatible Provider）。</li>
              </ul>
              <p>
                如果只是想先熟悉界面和流程，你也可以不配置 API，直接使用本地预览模式来体验角色和会话的创建流程。
              </p>
            </SectionBlock>

            {/* ── 2. Quick Start ── */}
            <SectionBlock id="quickstart" title="三步快速开始" icon={<Zap className="h-5 w-5" />}>
              <p className="mb-4">只需三步，就能从零开始进入角色扮演的世界：</p>
              <div className="grid gap-4 md:grid-cols-3">
                <StepCard
                  step={1}
                  title="配置 API"
                  color="brand"
                  description="进入设置中心，选择 Provider（如 DeepSeek 或 OpenAI-compatible），填入自己的 API Key，点击测试连接。未配置 API 时也可以先用本地预览模式。"
                  actionLabel="去配置 API"
                  actionTo="/settings"
                />
                <StepCard
                  step={2}
                  title="创建角色"
                  color="sky"
                  description="进入创作工坊，创建角色卡。填写角色名称、身份、性格、说话风格和规则。角色卡写得越清晰，AI 回复就越稳定。"
                  actionLabel="去创作工坊"
                  actionTo="/studio"
                />
                <StepCard
                  step={3}
                  title="开始聊天"
                  color="emerald"
                  description="进入聊天室，点击会话入口，选择角色并创建会话后就可以开始对话了。"
                  actionLabel="去聊天室"
                  actionTo="/roleplay"
                />
              </div>
            </SectionBlock>

            {/* ── 3. API ── */}
            <SectionBlock id="api" title="API 连接说明" icon={<KeyRound className="h-5 w-5" />}>
              <p>
                Roleplay Tavern 支持多种 API Key 存储模式，你可以根据自己的使用习惯选择：
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="neo-panel-soft p-4">
                  <h4 className="text-sm font-semibold text-ink-800">session_only</h4>
                  <p className="mt-1 text-xs text-ink-500">
                    临时会话模式。关闭页面后 Key 不保留，适合在公用设备上临时使用。
                  </p>
                </div>
                <div className="neo-panel-soft p-4">
                  <h4 className="text-sm font-semibold text-ink-800">local_device</h4>
                  <p className="mt-1 text-xs text-ink-500">
                    本地设备模式。Key 加密后只保存在当前浏览器，不会同步到云端。
                  </p>
                </div>
                <div className="neo-panel-soft p-4">
                  <h4 className="text-sm font-semibold text-ink-800">hosted_encrypted</h4>
                  <p className="mt-1 text-xs text-ink-500">
                    托管加密模式。适合登录用户跨设备使用，前端不显示明文 Key。
                  </p>
                </div>
              </div>
              <ul className="list-disc space-y-1 pl-5">
                <li>API Key 不会出现在导出数据中。</li>
                <li>托管模式下前端不显示明文 Key。</li>
                <li>没有 API 时，只能使用本地预览或 Mock 流程。</li>
              </ul>
            </SectionBlock>

            {/* ── 4. Studio ── */}
            <SectionBlock id="studio" title="角色与创作工坊" icon={<Palette className="h-5 w-5" />}>
              <p>创作工坊是你管理和创作角色的地方。以下是几个核心概念：</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="neo-panel-soft p-4">
                  <h4 className="text-sm font-semibold text-ink-800">角色卡</h4>
                  <p className="mt-1 text-xs text-ink-500">
                    角色卡是聊天体验的核心。你可以为每个角色设置身份、背景、性格、语气和行为规则。
                  </p>
                </div>
                <div className="neo-panel-soft p-4">
                  <h4 className="text-sm font-semibold text-ink-800">提示词模板</h4>
                  <p className="mt-1 text-xs text-ink-500">
                    提示词模板可以复用常用的系统设定，方便在不同角色之间快速切换基础规则。
                  </p>
                </div>
                <div className="neo-panel-soft p-4">
                  <h4 className="text-sm font-semibold text-ink-800">世界书</h4>
                  <p className="mt-1 text-xs text-ink-500">
                    世界书用于补充世界观、地点、组织、人物关系等背景设定，可以通过关键词触发。
                  </p>
                </div>
                <div className="neo-panel-soft p-4">
                  <h4 className="text-sm font-semibold text-ink-800">记忆</h4>
                  <p className="mt-1 text-xs text-ink-500">
                    记忆用于保存长期偏好和重要事实，AI 可以在对话中自动提炼候选记忆供你确认。
                  </p>
                </div>
              </div>
            </SectionBlock>

            {/* ── 5. Chat ── */}
            <SectionBlock id="chat" title="聊天室说明" icon={<MessageCircle className="h-5 w-5" />}>
              <p>聊天室是你与角色互动的主界面。开始对话前需要先创建会话并绑定角色。</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>右侧上下文控制台</strong>可以查看当前注入给模型的内容，包括角色设定、世界书条目、记忆、摘要和上下文窗口用量。
                </li>
                <li>你可以随时查看模板、世界书、记忆和摘要的注入情况。</li>
                <li>消息支持<strong>复制、编辑、重新生成、版本切换</strong>和提炼记忆。</li>
                <li>如果使用 DeepSeek，上下文控制台还会显示本次 token 用量、缓存命中和费用估算。</li>
              </ul>
            </SectionBlock>

            {/* ── 6. World Book ── */}
            <SectionBlock id="worldbook" title="世界书说明" icon={<Globe className="h-5 w-5" />}>
              <p>世界书是存放背景设定的地方，非常适合管理复杂的虚构世界。</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>世界书条目可以通过关键词触发——当聊天内容匹配到关键词时，对应条目会自动注入上下文。</li>
                <li>不建议把所有设定一次性塞进角色卡，这样会让上下文变得臃肿。</li>
                <li>把常用的世界观设定放到世界书里，结构更清晰，AI 也能更准确地匹配相关内容。</li>
              </ul>
            </SectionBlock>

            {/* ── 7. Memory ── */}
            <SectionBlock id="memory" title="记忆说明" icon={<Brain className="h-5 w-5" />}>
              <p>记忆系统帮助 AI 记住跨越多次对话的重要信息。</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>记忆分为<strong>候选</strong>和<strong>已启用</strong>两种状态。</li>
                <li>AI 在对话中提炼出的记忆会先进入候选列表，需要你手动确认才会启用。</li>
                <li>已启用的记忆会在后续对话中自动进入上下文。</li>
                <li>被你忽略或删除的记忆不会再被注入。</li>
              </ul>
            </SectionBlock>

            {/* ── 8. Local & Cloud ── */}
            <SectionBlock id="local-cloud" title="本地模式与云端同步" icon={<Cloud className="h-5 w-5" />}>
              <p>Roleplay Tavern 采用本地优先的设计理念，你的数据默认保存在自己的设备上。</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="neo-panel-soft p-4">
                  <h4 className="text-sm font-semibold text-ink-800">网页本地模式</h4>
                  <p className="mt-1 text-xs text-ink-500">
                    数据保存在当前浏览器本地数据库中。清除浏览器数据、换设备或格式化设备会导致本地数据丢失，建议定期导出备份。
                  </p>
                </div>
                <div className="neo-panel-soft p-4">
                  <h4 className="text-sm font-semibold text-ink-800">云端同步</h4>
                  <p className="mt-1 text-xs text-ink-500">
                    登录后可以选择开启云端同步。系统不会在未确认的情况下静默上传本地数据，同步操作需要你手动触发。
                  </p>
                </div>
              </div>
            </SectionBlock>

            {/* ── 9. Backup ── */}
            <SectionBlock id="backup" title="数据备份与恢复" icon={<Database className="h-5 w-5" />}>
              <p>保护好你的创作成果非常重要，以下是备份相关的关键信息：</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>进入<strong>设置中心 → 数据管理</strong>，可以导出本地 JSON 备份文件。</li>
                <li>你可以随时导入备份作为副本恢复数据。</li>
                <li>API Key 不会包含在备份文件里，确保你的凭据安全。</li>
                <li>回收站可以恢复部分软删除的数据。</li>
              </ul>
              <div className="mt-3">
                <Link
                  to="/settings/data"
                  className="neo-button-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
                >
                  <Upload className="h-4 w-4" />
                  去数据管理
                </Link>
              </div>
            </SectionBlock>

            {/* ── 10. FAQ ── */}
            <SectionBlock id="faq" title="常见问题" icon={<HelpCircle className="h-5 w-5" />}>
              <div className="space-y-2">
                <FaqItem
                  question="不登录能不能用？"
                  answer="可以。本地模式下可以创建角色、世界书、记忆和会话，数据保存在当前浏览器。"
                />
                <FaqItem
                  question="为什么不能直接聊天？"
                  answer="真实 AI 聊天通常需要先配置 API，并创建角色和会话。未配置 API 时可以使用本地预览模式熟悉流程。"
                />
                <FaqItem
                  question="我的数据存在你服务器吗？"
                  answer="未登录的本地模式下，数据主要保存在当前浏览器。登录并手动开启同步后，角色、会话等数据才会同步到云端。"
                />
                <FaqItem
                  question="API Key 会不会被导出？"
                  answer="不会。导出备份不包含 API Key，保障你的凭据安全。"
                />
                <FaqItem
                  question="换手机后数据还在吗？"
                  answer="本地模式不会跨设备保留数据。需要登录并手动同步，或者通过导出/导入备份来迁移数据。"
                />
                <FaqItem
                  question="右侧的上下文控制台有什么用？"
                  answer="它用于查看当前会话中会注入给模型的角色设定、世界书条目、记忆、摘要和用量信息，帮助你了解 AI 看到了什么。"
                />
                <FaqItem
                  question="缓存命中和费用估算是什么？"
                  answer="如果使用 DeepSeek，系统会尽量展示本次 token 用量、缓存命中和费用估算。实际扣费以 Provider 官方账单为准。"
                />
              </div>
            </SectionBlock>

            {/* ── 11. Next Steps ── */}
            <SectionBlock id="next-steps" title="下一步建议" icon={<ExternalLink className="h-5 w-5" />}>
              <p>如果你想获得完整的角色扮演体验，建议按以下顺序操作：</p>
              <div className="mt-3 space-y-3">
                <div className="neo-panel-soft flex items-center gap-4 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-500 text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-800">先配置 API</p>
                    <p className="text-xs text-ink-400">进入设置中心，填入你的 API Key 并测试连接。</p>
                  </div>
                  <Link to="/settings" className="neo-button flex-shrink-0 px-4 py-2 text-xs font-medium text-brand-600">
                    前往 →
                  </Link>
                </div>
                <div className="neo-panel-soft flex items-center gap-4 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-500 text-sm font-bold">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-800">创建第一个角色</p>
                    <p className="text-xs text-ink-400">在创作工坊中设计你的角色卡，填写身份、性格和说话风格。</p>
                  </div>
                  <Link to="/studio" className="neo-button flex-shrink-0 px-4 py-2 text-xs font-medium text-brand-600">
                    前往 →
                  </Link>
                </div>
                <div className="neo-panel-soft flex items-center gap-4 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 text-sm font-bold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-800">进入聊天室创建会话</p>
                    <p className="text-xs text-ink-400">选择角色，创建会话，开始你的第一次 AI 角色扮演对话。</p>
                  </div>
                  <Link to="/roleplay" className="neo-button flex-shrink-0 px-4 py-2 text-xs font-medium text-brand-600">
                    前往 →
                  </Link>
                </div>
                <div className="neo-panel-soft flex items-center gap-4 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-500 text-sm font-bold">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink-800">定期备份数据</p>
                    <p className="text-xs text-ink-400">如果长期使用，建议定期导出备份，防止数据丢失。</p>
                  </div>
                  <Link to="/settings/data" className="neo-button flex-shrink-0 px-4 py-2 text-xs font-medium text-brand-600">
                    前往 →
                  </Link>
                </div>
              </div>
            </SectionBlock>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="mt-10 text-center">
          <p className="text-xs text-ink-300">
            当前客户端：网页模式 · 桌面模式与移动 App 暂未推出
          </p>
        </div>
      </div>
    </div>
  );
}

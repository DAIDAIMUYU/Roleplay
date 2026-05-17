import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  Drama,
  Sparkles,
  LogIn,
  Shield,
  Zap,
  MessageCircle,
  Send,
} from "lucide-react";
import { useAuth } from "../features/auth";
import { ModeBadge } from "../shared/components/ModeBadge";
import { mockProvider } from "../features/roleplay/providers/mockProvider";
import type { ChatMessage } from "../features/roleplay/providers/provider.types";
import { DEFAULT_PROVIDER_CONFIG } from "../features/roleplay/providers/provider.types";

export function DemoPage() {
  const { isGuestOrDemo } = useAuth();
  const [mockInput, setMockInput] = useState("");
  const [mockReply, setMockReply] = useState<string | null>(null);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockMessages, setMockMessages] = useState<ChatMessage[]>([]);

  async function handleMockSend() {
    if (!mockInput.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: mockInput.trim() };
    const newMessages = [...mockMessages, userMsg];
    setMockMessages(newMessages);
    setMockInput("");
    setMockLoading(true);

    try {
      const result = await mockProvider.chat(DEFAULT_PROVIDER_CONFIG as never, newMessages);
      setMockReply(result.content);
      setMockMessages([...newMessages, { role: "assistant", content: result.content }]);
    } catch {
      setMockReply("Mock 回复生成失败");
    } finally {
      setMockLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      {/* Banner */}
      <div className="card bg-amber-light/30 border-amber-200 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ink-900">Demo 体验模式</h1>
              <ModeBadge />
            </div>
            <p className="text-sm text-ink-400">模拟体验 · 不调用真实 AI · 不消耗任何 API</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { icon: <Zap className="h-4 w-4" />, label: "Mock AI 回复", sub: "不消耗站主 API" },
            { icon: <Shield className="h-4 w-4" />, label: "不写数据库", sub: "访客体验保护" },
            { icon: <LogIn className="h-4 w-4" />, label: "登录解锁", sub: "使用真实 AI" },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="bg-white/60 rounded-card p-3 text-center">
              <span className="text-amber-500">{icon}</span>
              <p className="text-xs font-medium text-ink-700 mt-1">{label}</p>
              <p className="text-xs text-ink-300">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mock chat preview */}
      <h2 className="text-sm font-semibold text-ink-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4" />
        Mock 回复预览
      </h2>
      <div className="card mb-8">
        {mockMessages.length === 0 && mockReply === null ? (
          <p className="text-xs text-ink-300 text-center py-6">
            输入一段话，体验 Mock AI 的模拟回复。
            <br />
            所有回复均为演示模式预置文本，不调用真实模型。
          </p>
        ) : (
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {mockMessages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-card p-3 max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-brand-50 ml-auto text-right"
                    : "bg-surface-50 border border-surface-100"
                }`}
              >
                <p className="text-xs text-ink-300 mb-0.5">
                  {msg.role === "user" ? "你" : "Mock AI"}
                </p>
                <p className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </div>
            ))}
            {mockLoading && (
              <div className="bg-surface-50 border border-surface-100 rounded-card p-3 max-w-[85%]">
                <p className="text-xs text-ink-300">Mock AI 正在生成...</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={mockInput}
            onChange={(e) => setMockInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleMockSend()}
            placeholder="输入任意内容测试 Mock 回复..."
            className="flex-1 rounded-input border border-surface-200 bg-surface-50 py-2 px-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <button
            onClick={handleMockSend}
            disabled={mockLoading || !mockInput.trim()}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            发送
          </button>
        </div>
        <p className="text-xs text-amber-600 mt-2 text-center">
          Mock 回复仅为演示效果，不代表真实模型表现。
        </p>
      </div>

      {/* Demo content placeholders */}
      <h2 className="text-sm font-semibold text-ink-500 uppercase tracking-wide mb-4">
        Demo 内容（后续阶段提供）
      </h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="card">
          <h3 className="text-sm font-semibold text-ink-700 mb-2 flex items-center gap-2">
            <Drama className="h-4 w-4 text-brand-400" />
            Demo 角色
          </h3>
          <p className="text-xs text-ink-300">阶段 5-8 将提供预设 Demo 角色供体验。</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-ink-700 mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-400" />
            Demo 世界书
          </h3>
          <p className="text-xs text-ink-300">阶段 6 将提供预设世界观设定供体验。</p>
        </div>
      </div>

      {/* CTA */}
      {isGuestOrDemo && (
        <div className="card text-center">
          <p className="text-sm text-ink-500 mb-3">
            登录并配置自己的 API Key 后，即可使用真实 AI 进行角色扮演
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/login" className="btn-primary inline-flex items-center gap-2 text-sm">
              <LogIn className="h-4 w-4" />
              登录使用自己的 API
            </Link>
            <Link to="/roleplay" className="btn-secondary inline-flex items-center gap-2 text-sm">
              <Drama className="h-4 w-4" />
              进入聊天房间
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

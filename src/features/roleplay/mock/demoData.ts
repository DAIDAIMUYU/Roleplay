import type { ChatMessage } from "../providers/provider.types";

export interface DemoSession {
  id: string;
  title: string;
  mode: string;
  lastMessageAt: string | null;
  messages: ChatMessage[];
}

let idCounter = 1;
function uid(): string {
  return `demo_${Date.now()}_${idCounter++}`;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "[Demo Mock] 欢迎来到角色酒馆 Demo 体验！我是模拟 AI，不调用真实模型，不消耗任何 API。你可以输入任意内容，我会返回演示回复。登录并配置自己的 API Key 后可以开始真实角色扮演。",
};

export function createDemoSession(title?: string): DemoSession {
  return {
    id: uid(),
    title: title || `Demo 会话 ${idCounter}`,
    mode: "demo_mock",
    lastMessageAt: new Date().toISOString(),
    messages: [WELCOME_MESSAGE],
  };
}

export function getDefaultDemoSession(): DemoSession {
  return {
    id: "demo_default_1",
    title: "Demo 体验会话",
    mode: "demo_mock",
    lastMessageAt: new Date().toISOString(),
    messages: [WELCOME_MESSAGE],
  };
}

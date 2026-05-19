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
    "[本地预览] 欢迎来到角色酒馆的网页本地模式预览。当前未登录状态下，你可以先体验界面与对话流程。真实 AI 调用仍需要你配置自己的 API 凭据；登录只是为了开启云端同步和多设备互通。",
};

export function createDemoSession(title?: string): DemoSession {
  return {
    id: uid(),
    title: title || `本地预览会话 ${idCounter}`,
    mode: "demo_mock",
    lastMessageAt: new Date().toISOString(),
    messages: [WELCOME_MESSAGE],
  };
}

export function getDefaultDemoSession(): DemoSession {
  return {
    id: "demo_default_1",
    title: "本地预览会话",
    mode: "demo_mock",
    lastMessageAt: new Date().toISOString(),
    messages: [WELCOME_MESSAGE],
  };
}

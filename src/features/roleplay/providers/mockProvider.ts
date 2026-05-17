import type {
  ProviderAdapter,
  ProviderType,
  ModelProviderConfig,
  TestResult,
  ChatMessage,
  ChatResult,
  ChatStreamChunk,
  AppProblem,
} from "./provider.types";

const MOCK_REPLIES = [
  "（这是 Demo 模式下的模拟回复。登录并配置自己的 API Key 后，可以开始真实的角色扮演体验。）",
  "（Demo 模拟 — 角色酒馆支持 DeepSeek 和 OpenAI 兼容 API。连接你自己的 API Key 后，AI 将真正理解你的角色设定并给出自然回复。）",
  "（Mock 模式 — 当前不使用任何真实 AI 模型。你的数据不会被发送到任何外部服务。）",
  "（Demo 体验 — 在正式版中，角色会根据你设定的身份、性格、背景故事和当前场景给出连贯、沉浸的回复。）",
];

let replyIndex = 0;

function getMockReply(userInput?: string): string {
  const base = MOCK_REPLIES[replyIndex % MOCK_REPLIES.length];
  replyIndex++;
  if (userInput && userInput.length > 0) {
    const echo = userInput.length > 40 ? userInput.slice(0, 40) + "..." : userInput;
    return `[Demo Mock] 收到你的消息：「${echo}」\n\n${base}`;
  }
  return `[Demo Mock] ${base}`;
}

export const mockProvider: ProviderAdapter = {
  id: "mock" as ProviderType,

  async testConnection(_config: ModelProviderConfig): Promise<TestResult> {
    return { ok: true, latencyMs: 0 };
  },

  async chat(
    _config: ModelProviderConfig,
    messages: ChatMessage[],
  ): Promise<ChatResult> {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return {
      content: getMockReply(lastUser?.content),
      inputTokens: 0,
      outputTokens: 0,
    };
  },

  async *chatStream(
    _config: ModelProviderConfig,
    messages: ChatMessage[],
    signal?: AbortSignal,
  ): AsyncIterable<ChatStreamChunk> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const text = getMockReply(lastUser?.content);
    const chars = [...text];

    for (let i = 0; i < chars.length; i++) {
      if (signal?.aborted) {
        yield { content: "", done: true };
        return;
      }
      // Simulate ~30ms per character for streaming feel
      await new Promise((r) => setTimeout(r, 20 + Math.random() * 30));
      yield { content: chars[i], done: false };
    }

    yield { content: "", done: true, inputTokens: 0, outputTokens: 0 };
  },

  normalizeError(_err: unknown, provider: string): AppProblem {
    return {
      type: "https://roleplay-tavern/errors/mock",
      title: "Mock Provider 错误",
      status: 0,
      detail: "Mock Provider 不应产生真实错误",
      provider,
      retryable: false,
    };
  },
};

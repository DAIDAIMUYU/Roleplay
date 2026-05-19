import type {
  AppProblem,
  ChatMessage,
  ChatResult,
  ChatStreamChunk,
  ModelProviderConfig,
  ProviderAdapter,
  ProviderType,
  TestResult,
} from "./provider.types";

const MOCK_REPLIES = [
  "（当前是网页本地模式预览回复。配置自己的 API Key 后，角色才会进入真实模型对话流程。）",
  "（本地预览模式下，这段回复由 Mock Provider 生成，不会把内容发送到外部模型服务。）",
  "（登录不是强制项；只有当你需要云端同步和多设备互通时，才需要登录账号。）",
  "（正式聊天时，角色会结合你设定的身份、性格、世界书、记忆和摘要给出更连贯的回复。）",
];

let replyIndex = 0;

function getMockReply(userInput?: string): string {
  const base = MOCK_REPLIES[replyIndex % MOCK_REPLIES.length];
  replyIndex += 1;
  if (userInput && userInput.length > 0) {
    const echo = userInput.length > 40 ? `${userInput.slice(0, 40)}...` : userInput;
    return `[本地预览] 收到你的消息：「${echo}」\n\n${base}`;
  }
  return `[本地预览] ${base}`;
}

export const mockProvider: ProviderAdapter = {
  id: "mock" as ProviderType,

  async testConnection(_config: ModelProviderConfig): Promise<TestResult> {
    return { ok: true, latencyMs: 0 };
  },

  async chat(_config: ModelProviderConfig, messages: ChatMessage[]): Promise<ChatResult> {
    await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 400));
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
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
    const lastUser = [...messages].reverse().find((message) => message.role === "user");
    const text = getMockReply(lastUser?.content);
    const chars = [...text];

    for (let index = 0; index < chars.length; index += 1) {
      if (signal?.aborted) {
        yield { content: "", done: true };
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 30));
      yield { content: chars[index], done: false };
    }

    yield { content: "", done: true, inputTokens: 0, outputTokens: 0 };
  },

  normalizeError(_err: unknown, provider: string): AppProblem {
    return {
      type: "https://roleplay-tavern/errors/mock",
      title: "本地预览 Provider 错误",
      status: 0,
      detail: "本地预览 Provider 不应该产生真实错误",
      provider,
      retryable: false,
    };
  },
};

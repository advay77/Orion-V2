import OpenAI from 'openai';

// Production: 8192 tokens minimum for code generation tasks
// The previous 512 limit was silently truncating all agent output
const DEFAULT_MAX_TOKENS = 8192;
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 90_000; // 90s — model inference can be slow

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type AllMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type ChatResult = { content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } };

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OpenRouterClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 0, // We handle retries ourselves with backoff
      defaultHeaders: {
        'HTTP-Referer': 'https://orion-ai.vercel.app',
        'X-Title': 'Orion AI OS',
      },
    });
  }

  private buildMessages(messages: ChatMessage[], systemPrompt?: string): AllMessage[] {
    const allMessages: AllMessage[] = [];
    if (systemPrompt) {
      allMessages.push({ role: 'system', content: systemPrompt });
    }
    allMessages.push(...(messages as AllMessage[]));
    return allMessages;
  }

  async chat(
    model: string,
    messages: ChatMessage[],
    systemPrompt?: string,
    maxTokens: number = DEFAULT_MAX_TOKENS,
  ): Promise<ChatResult> {
    const allMessages = this.buildMessages(messages, systemPrompt);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model,
          max_tokens: maxTokens,
          messages: allMessages,
          temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content ?? '';
        return {
          content,
          usage: response.usage
            ? {
                prompt_tokens: response.usage.prompt_tokens,
                completion_tokens: response.usage.completion_tokens,
                total_tokens: response.usage.total_tokens,
              }
            : undefined,
        };
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isRetryable =
          lastError.message.includes('429') ||
          lastError.message.includes('503') ||
          lastError.message.includes('timeout') ||
          lastError.message.includes('network');

        if (!isRetryable || attempt === MAX_RETRIES - 1) break;

        // Exponential backoff: 1s, 2s, 4s
        const backoff = Math.pow(2, attempt) * 1000;
        console.warn(`[OpenRouterClient] Retry ${attempt + 1}/${MAX_RETRIES} after ${backoff}ms — ${lastError.message}`);
        await sleep(backoff);
      }
    }

    throw lastError ?? new Error('OpenRouterClient: unknown error after retries');
  }

  async stream(
    model: string,
    messages: ChatMessage[],
    systemPrompt?: string,
    maxTokens: number = DEFAULT_MAX_TOKENS,
  ): Promise<AsyncIterable<string>> {
    const allMessages = this.buildMessages(messages, systemPrompt);

    const stream = await this.client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: allMessages,
      stream: true,
    });

    return (async function* () {
      for await (const event of stream) {
        const delta = event.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    })();
  }
}

export function getOpenRouterClient(): OpenRouterClient {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }
  return new OpenRouterClient(apiKey);
}

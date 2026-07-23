import OpenAI from 'openai';

const DEFAULT_MAX_TOKENS = 8192;
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 90_000;

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type AllMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type ChatResult = {
  content: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  modelUsed?: string;
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Dead / redirected OpenRouter free slugs → current paid (or working) IDs */
const SLUG_ALIASES: Record<string, string> = {
  'deepseek/deepseek-r1:free': 'deepseek/deepseek-r1',
  'deepseek/deepseek-chat-v3.1:free': 'deepseek/deepseek-chat',
  'deepseek/deepseek-chat:free': 'deepseek/deepseek-chat',
  'qwen/qwen3-coder:free': 'qwen/qwen3-coder',
  'qwen/qwen3.6-plus:free': 'google/gemini-2.5-flash',
  'minimax/minimax-m2.5:free': 'google/gemini-2.5-flash',
  'glm-5-2': 'google/gemini-2.5-pro',
  'kimi/kimi-k2.7': 'google/gemini-2.5-flash',
};

export function normalizeModelSlug(model: string): string {
  const trimmed = model.trim();
  if (SLUG_ALIASES[trimmed]) return SLUG_ALIASES[trimmed];
  // Generic: deepseek/deepseek-r1:free → deepseek/deepseek-r1
  if (trimmed.endsWith(':free')) {
    return trimmed.replace(/:free$/, '');
  }
  return trimmed;
}

function extractSuggestedSlug(errorMessage: string): string | null {
  // "use this slug instead: deepseek/deepseek-r1"
  const match = errorMessage.match(/use this slug instead:\s*([a-z0-9_./:-]+)/i);
  return match ? normalizeModelSlug(match[1]) : null;
}

export class OpenRouterClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      timeout: REQUEST_TIMEOUT_MS,
      maxRetries: 0,
      defaultHeaders: {
        'HTTP-Referer': 'https://orion-ai.vercel.app',
        'X-Title': 'Orion',
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
    temperature: number = 0.4,
  ): Promise<ChatResult> {
    let activeModel = normalizeModelSlug(model);
    const allMessages = this.buildMessages(messages, systemPrompt);
    let lastError: Error | null = null;
    const tried = new Set<string>();

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      tried.add(activeModel);
      try {
        const response = await this.client.chat.completions.create({
          model: activeModel,
          max_tokens: maxTokens,
          messages: allMessages,
          temperature,
        });

        const content = response.choices[0]?.message?.content ?? '';
        return {
          content,
          modelUsed: activeModel,
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
        const msg = lastError.message;

        // OpenRouter often returns: free slug dead → use paid slug
        const suggested = extractSuggestedSlug(msg);
        if (suggested && !tried.has(suggested)) {
          console.warn(`[OpenRouterClient] ${activeModel} unavailable → switching to ${suggested}`);
          activeModel = suggested;
          continue;
        }

        const isRetryable =
          msg.includes('429') ||
          msg.includes('503') ||
          msg.includes('timeout') ||
          msg.includes('network') ||
          msg.includes('404');

        if (!isRetryable || attempt === MAX_RETRIES - 1) break;

        // On 404 without suggestion, try openrouter/auto once
        if (msg.includes('404') && !tried.has('openrouter/auto')) {
          activeModel = 'openrouter/auto';
          continue;
        }

        const backoff = Math.pow(2, attempt) * 1000;
        console.warn(
          `[OpenRouterClient] Retry ${attempt + 1}/${MAX_RETRIES} after ${backoff}ms — ${msg}`,
        );
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
    temperature: number = 0.4,
  ): Promise<AsyncIterable<string>> {
    const activeModel = normalizeModelSlug(model);
    const allMessages = this.buildMessages(messages, systemPrompt);

    const stream = await this.client.chat.completions.create({
      model: activeModel,
      max_tokens: maxTokens,
      messages: allMessages,
      temperature,
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

// Multi-provider LLM abstraction
// Supports: OpenAI, Anthropic, Gemini, Groq, OpenRouter, Ollama

export interface LLMConfig {
  provider: ProviderType;
  apiKey?: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter' | 'ollama' | 'custom';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

const PROVIDER_DEFAULTS: Record<ProviderType, { baseUrl: string; defaultModel: string }> = {
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  anthropic: { baseUrl: 'https://api.anthropic.com', defaultModel: 'claude-sonnet-4-20250514' },
  gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.5-flash' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'anthropic/claude-sonnet-4-20250514' },
  ollama: { baseUrl: 'http://localhost:11434', defaultModel: 'llama3.1' },
  custom: { baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
};

export function getProviderDefaults(provider: ProviderType) {
  return PROVIDER_DEFAULTS[provider];
}

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  groq: 'Groq',
  openrouter: 'OpenRouter',
  ollama: 'Ollama (Local)',
  custom: 'Custom (OpenAI-Compatible)',
};

export const PROVIDER_MODELS: Record<ProviderType, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o1-mini', 'o3-mini'],
  anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
  openrouter: ['anthropic/claude-sonnet-4-20250514', 'openai/gpt-4o', 'google/gemini-2.5-flash', 'meta-llama/llama-3.3-70b-instruct'],
  ollama: ['llama3.1', 'llama3.2', 'mistral', 'codellama', 'deepseek-coder-v2'],
  custom: ['deepseek-chat', 'deepseek-reasoner', 'qwen-2.5-72b-instruct', 'llama-3.3-70b-versatile', 'gpt-4o'],
};

// ─── OpenAI-compatible streaming (works for OpenAI, Groq, OpenRouter) ───

async function* streamOpenAICompatible(
  messages: ChatMessage[],
  config: LLMConfig,
): AsyncGenerator<StreamChunk> {
  const defaults = PROVIDER_DEFAULTS[config.provider];
  const baseUrl = config.baseUrl || defaults.baseUrl;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }
  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'http://localhost:3000';
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model || defaults.defaultModel,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 8192,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${config.provider} API error (${response.status}): ${error}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') {
        yield { content: '', done: true };
        return;
      }
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || '';
        if (content) {
          yield { content, done: false };
        }
      } catch { /* skip malformed chunks */ }
    }
  }
  yield { content: '', done: true };
}

// ─── Anthropic streaming ───

async function* streamAnthropic(
  messages: ChatMessage[],
  config: LLMConfig,
): AsyncGenerator<StreamChunk> {
  const defaults = PROVIDER_DEFAULTS.anthropic;
  const baseUrl = config.baseUrl || defaults.baseUrl;

  const systemMsg = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || defaults.defaultModel,
      max_tokens: config.maxTokens ?? 8192,
      temperature: config.temperature ?? 0.7,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: chatMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      try {
        const parsed = JSON.parse(trimmed.slice(6));
        if (parsed.type === 'content_block_delta') {
          yield { content: parsed.delta?.text || '', done: false };
        }
        if (parsed.type === 'message_stop') {
          yield { content: '', done: true };
          return;
        }
      } catch { /* skip */ }
    }
  }
  yield { content: '', done: true };
}

// ─── Google Gemini streaming ───

async function* streamGemini(
  messages: ChatMessage[],
  config: LLMConfig,
): AsyncGenerator<StreamChunk> {
  const defaults = PROVIDER_DEFAULTS.gemini;
  const baseUrl = config.baseUrl || defaults.baseUrl;
  const model = config.model || defaults.defaultModel;

  const systemMsg = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const contents = chatMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `${baseUrl}/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(systemMsg ? { systemInstruction: { parts: [{ text: systemMsg.content }] } } : {}),
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 8192,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      try {
        const parsed = JSON.parse(trimmed.slice(6));
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) yield { content: text, done: false };
      } catch { /* skip */ }
    }
  }
  yield { content: '', done: true };
}

// ─── Ollama streaming ───

async function* streamOllama(
  messages: ChatMessage[],
  config: LLMConfig,
): AsyncGenerator<StreamChunk> {
  const defaults = PROVIDER_DEFAULTS.ollama;
  const baseUrl = config.baseUrl || defaults.baseUrl;

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model || defaults.defaultModel,
      messages,
      stream: true,
      options: {
        temperature: config.temperature ?? 0.7,
        num_predict: config.maxTokens ?? 8192,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ollama error (${response.status}): ${error}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          yield { content: parsed.message.content, done: false };
        }
        if (parsed.done) {
          yield { content: '', done: true };
          return;
        }
      } catch { /* skip */ }
    }
  }
  yield { content: '', done: true };
}

// ─── Unified streaming interface ───

export function streamChat(
  messages: ChatMessage[],
  config: LLMConfig,
): AsyncGenerator<StreamChunk> {
  switch (config.provider) {
    case 'openai':
    case 'groq':
    case 'openrouter':
    case 'custom':
      return streamOpenAICompatible(messages, config);
    case 'anthropic':
      return streamAnthropic(messages, config);
    case 'gemini':
      return streamGemini(messages, config);
    case 'ollama':
      return streamOllama(messages, config);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

// ─── Non-streaming (for interview questions, short responses) ───

export async function chatCompletion(
  messages: ChatMessage[],
  config: LLMConfig,
): Promise<string> {
  let result = '';
  for await (const chunk of streamChat(messages, { ...config, maxTokens: config.maxTokens ?? 4096 })) {
    result += chunk.content;
  }
  return result;
}

// Local config storage (reads/writes .env.local and in-memory for runtime)
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ProviderType, LLMConfig, getProviderDefaults } from './llm/provider';

const ENV_PATH = join(process.cwd(), '.env.local');

export interface AppConfig {
  activeProvider: ProviderType;
  providers: Partial<Record<ProviderType, {
    apiKey: string;
    model: string;
    baseUrl?: string;
  }>>;
}

function readEnv(): Record<string, string> {
  if (!existsSync(ENV_PATH)) return {};
  const content = readFileSync(ENV_PATH, 'utf-8');
  const env: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function writeEnv(env: Record<string, string>): void {
  const lines = ['# Spec Engine — Auto-generated config', ''];
  for (const [key, val] of Object.entries(env)) {
    lines.push(`${key}="${val}"`);
  }
  writeFileSync(ENV_PATH, lines.join('\n') + '\n', 'utf-8');
}

const PROVIDER_KEY_MAP: Record<ProviderType, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  gemini: 'GEMINI_API_KEY',
  groq: 'GROQ_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
  ollama: 'OLLAMA_BASE_URL',
  custom: 'CUSTOM_API_KEY',
};

export function loadConfig(): AppConfig {
  const env = readEnv();
  const activeProvider = (env.ACTIVE_PROVIDER as ProviderType) || 'openai';

  const providers: AppConfig['providers'] = {};
  for (const provider of Object.keys(PROVIDER_KEY_MAP) as ProviderType[]) {
    const keyEnv = PROVIDER_KEY_MAP[provider];
    const apiKey = env[keyEnv] || '';
    const model = env[`${provider.toUpperCase()}_MODEL`] || '';
    const baseUrl = env[`${provider.toUpperCase()}_BASE_URL`] || '';
    if (apiKey || provider === 'ollama' || provider === 'custom') {
      providers[provider] = {
        apiKey,
        model: model || getProviderDefaults(provider).defaultModel,
        ...(baseUrl ? { baseUrl } : {}),
      };
    }
  }

  return { activeProvider, providers };
}

export function saveConfig(config: AppConfig): void {
  const env: Record<string, string> = {
    ACTIVE_PROVIDER: config.activeProvider,
  };

  for (const [provider, settings] of Object.entries(config.providers)) {
    const p = provider as ProviderType;
    const keyEnv = PROVIDER_KEY_MAP[p];
    if (settings) {
      env[keyEnv] = settings.apiKey || '';
      env[`${p.toUpperCase()}_MODEL`] = settings.model || '';
      if (settings.baseUrl) {
        env[`${p.toUpperCase()}_BASE_URL`] = settings.baseUrl;
      }
    }
  }

  writeEnv(env);
}

export function getActiveLLMConfig(): LLMConfig {
  const config = loadConfig();
  const providerSettings = config.providers[config.activeProvider];
  const defaults = getProviderDefaults(config.activeProvider);

  return {
    provider: config.activeProvider,
    apiKey: providerSettings?.apiKey || '',
    model: providerSettings?.model || defaults.defaultModel,
    baseUrl: providerSettings?.baseUrl || defaults.baseUrl,
    temperature: 0.7,
    maxTokens: 8192,
  };
}

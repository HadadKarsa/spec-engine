// GET /api/providers — list available providers and current config
// POST /api/providers — save provider config

import { NextRequest, NextResponse } from 'next/server';
import { loadConfig, saveConfig, AppConfig } from '@/lib/store';
import { PROVIDER_LABELS, PROVIDER_MODELS, ProviderType } from '@/lib/llm/provider';

export async function GET() {
  const config = loadConfig();

  const providers = (Object.keys(PROVIDER_LABELS) as ProviderType[]).map(id => ({
    id,
    label: PROVIDER_LABELS[id],
    models: PROVIDER_MODELS[id],
    configured: !!config.providers[id]?.apiKey || id === 'ollama' || (id === 'custom' && !!config.providers[id]?.baseUrl),
    activeModel: config.providers[id]?.model || '',
    baseUrl: config.providers[id]?.baseUrl || '',
  }));

  return NextResponse.json({
    activeProvider: config.activeProvider,
    providers,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const config: AppConfig = {
      activeProvider: body.activeProvider,
      providers: body.providers || {},
    };
    saveConfig(config);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 400 },
    );
  }
}

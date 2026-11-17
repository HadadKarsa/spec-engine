// POST /api/generate — streaming spec generation
// Generates one spec document at a time, streaming the response

import { NextRequest } from 'next/server';
import { getActiveLLMConfig } from '@/lib/store';
import { streamChat, ChatMessage } from '@/lib/llm/provider';
import { SPEC_SYSTEM_PROMPT, SPEC_PROMPTS, SpecContext } from '@/lib/prompts/specs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { specName, idea, interviewHistory, summary, previousSpecs } = body as {
      specName: string;
      idea: string;
      interviewHistory: string;
      summary: string;
      previousSpecs?: Record<string, string>;
    };

    const config = getActiveLLMConfig();

    if (!config.apiKey && config.provider !== 'ollama' && config.provider !== 'custom') {
      return new Response(
        JSON.stringify({ error: `No API key configured for ${config.provider}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const promptFn = SPEC_PROMPTS[specName];
    if (!promptFn) {
      return new Response(
        JSON.stringify({ error: `Unknown spec: ${specName}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const ctx: SpecContext = { idea, interviewHistory, summary, previousSpecs };
    const userPrompt = promptFn(ctx);

    const messages: ChatMessage[] = [
      { role: 'system', content: SPEC_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    // Use higher token limit for spec generation
    const streamConfig = { ...config, maxTokens: 16384 };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChat(messages, streamConfig)) {
            if (chunk.content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`));
            }
            if (chunk.done) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            }
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Generate error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

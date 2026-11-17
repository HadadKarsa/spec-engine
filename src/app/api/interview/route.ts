// POST /api/interview — adaptive interview endpoint
// Handles both starting and continuing the interview

import { NextRequest, NextResponse } from 'next/server';
import { getActiveLLMConfig } from '@/lib/store';
import { chatCompletion, ChatMessage } from '@/lib/llm/provider';
import {
  INTERVIEW_SYSTEM_PROMPT,
  INTERVIEW_START_PROMPT,
  INTERVIEW_CONTINUE_PROMPT,
} from '@/lib/prompts/interview';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, answer, history } = body as {
      idea?: string;
      answer?: string;
      history?: Array<{ role: string; content: string }>;
    };

    const config = getActiveLLMConfig();

    if (!config.apiKey && config.provider !== 'ollama' && config.provider !== 'custom') {
      return NextResponse.json(
        { error: `No API key configured for ${config.provider}. Go to Settings to add one.` },
        { status: 400 },
      );
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: INTERVIEW_SYSTEM_PROMPT },
    ];

    if (!history || history.length === 0) {
      // Starting a new interview
      messages.push({
        role: 'user',
        content: INTERVIEW_START_PROMPT.replace('{idea}', idea || ''),
      });
    } else {
      // Continuing an existing interview
      const historyText = history
        .map(h => `${h.role === 'user' ? 'User' : 'Architect'}: ${h.content}`)
        .join('\n\n');

      // Rebuild the conversation as proper message turns
      for (const h of history) {
        messages.push({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        });
      }

      messages.push({
        role: 'user',
        content: answer || '',
      });
    }

    const response = await chatCompletion(messages, config);
    const isComplete = response.includes('[INTERVIEW_COMPLETE]');

    return NextResponse.json({
      message: response,
      isComplete,
    });
  } catch (err) {
    console.error('Interview error:', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 },
    );
  }
}

'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface InterviewWizardProps {
  onComplete: (data: { idea: string; history: Message[]; summary: string }) => void;
}

export default function InterviewWizard({ onComplete }: InterviewWizardProps) {
  const [idea, setIdea] = useState('');
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (started && !loading) {
      inputRef.current?.focus();
    }
  }, [started, loading]);

  const startInterview = async () => {
    if (!idea.trim()) return;
    setStarted(true);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setStarted(false);
        setLoading(false);
        return;
      }

      setMessages([{ role: 'assistant', content: data.message }]);

      if (data.isComplete) {
        extractSummaryAndComplete(data.message, [{ role: 'assistant', content: data.message }]);
      }
    } catch (err) {
      setError(String(err));
      setStarted(false);
    }
    setLoading(false);
  };

  const sendAnswer = async () => {
    if (!input.trim() || loading) return;
    const answer = input.trim();
    setInput('');
    setLoading(true);
    setError('');

    const newMessages: Message[] = [...messages, { role: 'user', content: answer }];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          answer,
          history: newMessages,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      const updatedMessages: Message[] = [...newMessages, { role: 'assistant', content: data.message }];
      setMessages(updatedMessages);

      if (data.isComplete) {
        extractSummaryAndComplete(data.message, updatedMessages);
      }
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
  };

  const extractSummaryAndComplete = (lastMessage: string, allMessages: Message[]) => {
    const summaryMatch = lastMessage.match(/\*\*Summary:\*\*\s*([\s\S]*?)$/);
    const summary = summaryMatch ? summaryMatch[1].trim() : lastMessage;

    setTimeout(() => {
      onComplete({
        idea,
        history: allMessages,
        summary,
      });
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!started) startInterview();
      else sendAnswer();
    }
  };

  // ─── Initial idea input ───
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto mt-16 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            SE
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">What are we building?</h1>
          <p className="text-[var(--text-muted)]">
            Describe your app idea and I'll interview you to build complete technical specs.
          </p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
          <textarea
            value={idea}
            onChange={e => setIdea(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. A marketplace for freelance developers where clients can post projects, devs can bid, and payments are handled through escrow..."
            className="w-full bg-transparent border-none outline-none resize-none text-lg leading-relaxed h-32 placeholder:text-[var(--text-muted)]/50"
            autoFocus
          />
          {error && (
            <p className="text-[var(--danger)] text-sm mt-2">{error}</p>
          )}
          <div className="flex justify-end mt-4">
            <button
              onClick={startInterview}
              disabled={!idea.trim()}
              className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start Interview →
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            'SaaS project management tool with Kanban boards',
            'E-commerce marketplace with vendor dashboard',
            'Real-time chat app with channels and file sharing',
          ].map(example => (
            <button
              key={example}
              onClick={() => setIdea(example)}
              className="text-left p-3 rounded-xl border border-[var(--border)] text-sm text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-white transition-all"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Chat interview ───
  return (
    <div className="max-w-3xl mx-auto mt-8 animate-fade-in">
      <div className="mb-4 px-4">
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
          Adaptive Interview in Progress
        </div>
      </div>

      {/* Chat messages */}
      <div className="space-y-4 mb-4 max-h-[60vh] overflow-y-auto px-4">
        {/* Show the idea as first user message */}
        <div className="flex justify-end">
          <div className="bg-[var(--accent)]/20 border border-[var(--accent)]/30 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
            <p className="text-sm">{idea}</p>
          </div>
        </div>

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div
              className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-[var(--accent)]/20 border border-[var(--accent)]/30 rounded-br-md'
                  : 'bg-[var(--bg-card)] border border-[var(--border)] rounded-bl-md'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content.includes('[INTERVIEW_COMPLETE]') ? (
                  <div>
                    <div className="flex items-center gap-2 text-[var(--success)] font-medium mb-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Interview Complete!
                    </div>
                    {msg.content.replace('[INTERVIEW_COMPLETE]', '').trim()}
                    <div className="mt-3 text-[var(--accent)] text-xs font-medium">
                      Generating specifications...
                    </div>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      {!messages.some(m => m.content.includes('[INTERVIEW_COMPLETE]')) && (
        <div className="px-4 pb-4">
          {error && <p className="text-[var(--danger)] text-sm mb-2">{error}</p>}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-3 flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer..."
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed min-h-[40px] max-h-[120px]"
              disabled={loading}
              rows={1}
            />
            <button
              onClick={sendAnswer}
              disabled={!input.trim() || loading}
              className="self-end px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-all disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

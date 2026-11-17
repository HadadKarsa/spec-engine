'use client';

import { useState } from 'react';
import SettingsModal from '@/components/SettingsModal';

export default function HomePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto mt-20 px-4">
      <div className="text-center mb-12">
        <div className="w-20 h-20 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 animate-pulse-glow">
          SE
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">
          Spec Engine
        </h1>
        <p className="text-lg text-[var(--text-muted)] max-w-xl mx-auto">
          Transform your app ideas into production-ready technical specifications
          through an adaptive AI interview. Zero subscription — runs locally with your own API keys.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <a
          href="/new"
          className="group p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)] transition-all"
        >
          <div className="text-3xl mb-3">🚀</div>
          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[var(--accent)] transition-colors">
            New Project
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Start an adaptive interview to capture your idea and generate full specs
          </p>
        </a>

        <button
          onClick={() => setSettingsOpen(true)}
          className="text-left group p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)] transition-all"
        >
          <div className="text-3xl mb-3">⚙️</div>
          <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[var(--accent)] transition-colors">
            Settings
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Configure your LLM provider — OpenAI, Anthropic, Gemini, Groq, OpenRouter, Ollama, or Custom OpenAI-compatible endpoints
          </p>
        </button>
      </div>

      {/* What gets generated */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-4 text-center">What Gets Generated</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '📋', name: 'PRD', desc: 'Product requirements, personas, user stories' },
            { icon: '🏗️', name: 'Architecture & Diagrams', desc: 'Tech stack, folder structure & Mermaid flowchart' },
            { icon: '🗄️', name: 'Database & ERD', desc: 'Entity schemas, constraints & interactive ERD' },
            { icon: '🔌', name: 'API Specs', desc: 'Endpoints, contracts, auth flows' },
            { icon: '✅', name: 'Task Checklist', desc: 'Step-by-step build plan for AI agents' },
            { icon: '🧠', name: 'Project Memory', desc: 'Context file for session continuity' },
            { icon: '🎨', name: 'UI Wireframes', desc: 'Interactive HTML+Tailwind live sandbox prototype' },
            { icon: '📊', name: 'Mermaid Diagrams', desc: 'Visual interactive graphs for system and flows' },
          ].map(item => (
            <div key={item.name} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-medium text-white text-sm">{item.name}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-[var(--text-muted)] pb-8">
        Built with Next.js • Runs 100% locally • Your keys, your data
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

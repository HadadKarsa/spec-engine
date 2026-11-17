'use client';

import { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import WireframePreview from './WireframePreview';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SpecGeneratorProps {
  idea: string;
  history: Message[];
  summary: string;
}

const SPECS = [
  { key: '01_PRD.md', label: 'Product Requirements', icon: '📋', color: '#6c5ce7' },
  { key: '02_ARCHITECTURE.md', label: 'Architecture & Diagrams', icon: '🏗️', color: '#00b894' },
  { key: '03_DATABASE.md', label: 'Database & ERD', icon: '🗄️', color: '#fdcb6e' },
  { key: '04_API_SPECS.md', label: 'API Specifications', icon: '🔌', color: '#e17055' },
  { key: '05_TASKS_CHECKLIST.md', label: 'Tasks Checklist', icon: '✅', color: '#74b9ff' },
  { key: 'PROJECT_MEMORY.md', label: 'Project Memory', icon: '🧠', color: '#a29bfe' },
  { key: '06_UI_WIREFRAMES.html', label: 'UI Wireframes', icon: '🎨', color: '#ff7675' },
];

type SpecStatus = 'pending' | 'generating' | 'done' | 'error';

export default function SpecGenerator({ idea, history, summary }: SpecGeneratorProps) {
  const [specContents, setSpecContents] = useState<Record<string, string>>({});
  const [specStatuses, setSpecStatuses] = useState<Record<string, SpecStatus>>({});
  const [activeSpec, setActiveSpec] = useState(SPECS[0].key);
  const [generating, setGenerating] = useState(false);
  const [currentSpec, setCurrentSpec] = useState('');
  const [overallProgress, setOverallProgress] = useState(0);
  const [viewFormat, setViewFormat] = useState<'visual' | 'raw'>('visual');
  const contentRef = useRef<HTMLDivElement>(null);

  const generateSpec = async (specKey: string, previousSpecs: Record<string, string>) => {
    setSpecStatuses(prev => ({ ...prev, [specKey]: 'generating' }));
    setCurrentSpec(specKey);
    setActiveSpec(specKey);

    const interviewHistory = history
      .map(h => `${h.role === 'user' ? 'User' : 'Architect'}: ${h.content}`)
      .join('\n\n');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specName: specKey,
          idea,
          interviewHistory,
          summary,
          previousSpecs,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';

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
            const data = JSON.parse(trimmed.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.content) {
              content += data.content;
              setSpecContents(prev => ({ ...prev, [specKey]: content }));
            }
          } catch (e) {
            if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
              // Only throw real errors, not partial JSON parse errors
              if (!String(e).includes('JSON')) throw e;
            }
          }
        }
      }

      setSpecStatuses(prev => ({ ...prev, [specKey]: 'done' }));
      return content;
    } catch (err) {
      console.error(`Error generating ${specKey}:`, err);
      setSpecStatuses(prev => ({ ...prev, [specKey]: 'error' }));
      setSpecContents(prev => ({ ...prev, [specKey]: `Error: ${err}` }));
      return '';
    }
  };

  const generateAll = async () => {
    setGenerating(true);
    const previousSpecs: Record<string, string> = {};

    for (let i = 0; i < SPECS.length; i++) {
      const spec = SPECS[i];
      setOverallProgress(Math.round(((i) / SPECS.length) * 100));
      const content = await generateSpec(spec.key, { ...previousSpecs });
      if (content) {
        previousSpecs[spec.key] = content;
      }
    }

    setOverallProgress(100);
    setGenerating(false);
    setCurrentSpec('');
  };

  const downloadAll = async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const folderName = idea.slice(0, 40).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const folder = zip.folder(folderName)!;

    for (const [name, content] of Object.entries(specContents)) {
      if (content && !content.startsWith('Error:')) {
        folder.file(name, content);
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}-specs.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySpec = (key: string) => {
    navigator.clipboard.writeText(specContents[key] || '');
  };

  // Auto-scroll content when generating
  useEffect(() => {
    if (specStatuses[activeSpec] === 'generating' && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [specContents, activeSpec, specStatuses]);

  // Auto-start generation
  useEffect(() => {
    const timer = setTimeout(() => generateAll(), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doneCount = Object.values(specStatuses).filter(s => s === 'done').length;

  return (
    <div className="max-w-7xl mx-auto mt-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Generating Specifications</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{summary}</p>
        </div>
        <div className="flex gap-3">
          {doneCount > 0 && (
            <button
              onClick={downloadAll}
              className="px-4 py-2 rounded-xl bg-[var(--success)] hover:opacity-90 text-white text-sm font-medium transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download ZIP
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {generating && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span>Progress</span>
            <span>{overallProgress}% — {SPECS.find(s => s.key === currentSpec)?.label || 'Starting...'}</span>
          </div>
          <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Sidebar — spec list */}
        <div className="w-64 flex-shrink-0 space-y-1">
          {SPECS.map(spec => {
            const status = specStatuses[spec.key] || 'pending';
            return (
              <button
                key={spec.key}
                onClick={() => setActiveSpec(spec.key)}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all ${
                  activeSpec === spec.key
                    ? 'bg-[var(--bg-elevated)] border border-[var(--accent)]/50'
                    : 'hover:bg-[var(--bg-card)] border border-transparent'
                }`}
              >
                <span className="text-lg">{spec.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{spec.label}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {status === 'pending' && 'Waiting...'}
                    {status === 'generating' && (
                      <span className="text-[var(--accent)]">Generating...</span>
                    )}
                    {status === 'done' && (
                      <span className="text-[var(--success)]">Complete ✓</span>
                    )}
                    {status === 'error' && (
                      <span className="text-[var(--danger)]">Error ✗</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col">
          {/* Content header */}
          <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg)]/50">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-[var(--accent)] font-medium">{activeSpec}</span>
              {specStatuses[activeSpec] === 'generating' && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--accent)] font-medium">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
                  Generating...
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeSpec !== '06_UI_WIREFRAMES.html' && specContents[activeSpec] && (
                <div className="flex items-center bg-[var(--bg-elevated)] p-0.5 rounded-lg border border-[var(--border)] text-xs">
                  <button
                    onClick={() => setViewFormat('visual')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      viewFormat === 'visual'
                        ? 'bg-[var(--accent)] text-white shadow'
                        : 'text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    ✨ Rendered & Diagrams
                  </button>
                  <button
                    onClick={() => setViewFormat('raw')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      viewFormat === 'raw'
                        ? 'bg-[var(--accent)] text-white shadow'
                        : 'text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    📝 Raw Markdown
                  </button>
                </div>
              )}

              {specContents[activeSpec] && (
                <button
                  onClick={() => copySpec(activeSpec)}
                  className="text-xs px-3 py-1 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-[var(--accent)] transition-all"
                >
                  Copy
                </button>
              )}
            </div>
          </div>

          {/* Content body */}
          <div ref={contentRef} className="flex-1 overflow-y-auto">
            {activeSpec === '06_UI_WIREFRAMES.html' ? (
              specContents[activeSpec] ? (
                <WireframePreview htmlContent={specContents[activeSpec]} />
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                  {specStatuses[activeSpec] === 'pending' ? (
                    <div className="text-center">
                      <div className="text-4xl mb-3">🎨</div>
                      <p className="text-sm">Waiting to generate UI wireframe...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl mb-3 animate-pulse">⚡</div>
                      <p className="text-sm">Designing interactive UI prototype...</p>
                    </div>
                  )}
                </div>
              )
            ) : specContents[activeSpec] ? (
              <div className="p-6">
                {viewFormat === 'visual' ? (
                  <MarkdownRenderer content={specContents[activeSpec]} />
                ) : (
                  <pre className="spec-content whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--text)]">
                    {specContents[activeSpec]}
                  </pre>
                )}
                {specStatuses[activeSpec] === 'generating' && (
                  <span className="typing-cursor" />
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
                {specStatuses[activeSpec] === 'pending' ? (
                  <div className="text-center">
                    <div className="text-4xl mb-3">⏳</div>
                    <p className="text-sm">Waiting to generate...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-3 animate-pulse">⚡</div>
                    <p className="text-sm">Generating...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

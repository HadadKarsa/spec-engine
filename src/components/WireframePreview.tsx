'use client';

import { useState } from 'react';

interface WireframePreviewProps {
  htmlContent: string;
}

export default function WireframePreview({ htmlContent }: WireframePreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  // Strip markdown backticks if any
  let cleanHtml = htmlContent.trim();
  if (cleanHtml.startsWith('```html')) {
    cleanHtml = cleanHtml.replace(/^```html\s*/, '').replace(/\s*```$/, '');
  } else if (cleanHtml.startsWith('```')) {
    cleanHtml = cleanHtml.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  const deviceWidths = {
    desktop: 'w-full',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  };

  const openInNewTab = () => {
    const blob = new Blob([cleanHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* Toolbar */}
      <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-card)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-xl border border-[var(--border)]">
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'preview'
                ? 'bg-[var(--accent)] text-white shadow'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            🖥️ Live Wireframe
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'code'
                ? 'bg-[var(--accent)] text-white shadow'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            &lt;/&gt; HTML Source
          </button>
        </div>

        {viewMode === 'preview' && (
          <div className="flex items-center gap-1 bg-[var(--bg)] p-1 rounded-xl border border-[var(--border)]">
            <button
              onClick={() => setDevice('desktop')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                device === 'desktop'
                  ? 'bg-[var(--bg-elevated)] text-white'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
              title="Desktop View"
            >
              Desktop
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                device === 'tablet'
                  ? 'bg-[var(--bg-elevated)] text-white'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
              title="Tablet View (768px)"
            >
              Tablet
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                device === 'mobile'
                  ? 'bg-[var(--bg-elevated)] text-white'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
              title="Mobile View (375px)"
            >
              Mobile
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={openInNewTab}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-[var(--accent)] text-xs text-[var(--text-muted)] hover:text-white transition-all flex items-center gap-1.5"
          >
            <span>↗</span> Open Fullscreen
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#050508] p-4 flex justify-center items-start">
        {viewMode === 'preview' ? (
          <div
            className={`transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden border border-[var(--border)] bg-white h-[calc(100vh-290px)] min-h-[500px] ${deviceWidths[device]}`}
          >
            <iframe
              title="Interactive UI Wireframe"
              srcDoc={cleanHtml}
              className="w-full h-full border-none"
              sandbox="allow-scripts allow-modals allow-forms"
            />
          </div>
        ) : (
          <pre className="w-full h-[calc(100vh-290px)] p-4 rounded-xl bg-[#0d0d14] border border-[var(--border)] text-xs font-mono text-[var(--text)] overflow-auto whitespace-pre-wrap">
            {cleanHtml}
          </pre>
        )}
      </div>
    </div>
  );
}

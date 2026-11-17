'use client';

import { useEffect, useRef, useState } from 'react';

interface MermaidViewerProps {
  chart: string;
}

export default function MermaidViewer({ chart }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      if (!chart.trim()) return;

      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          themeVariables: {
            darkMode: true,
            background: '#12121a',
            primaryColor: '#6c5ce7',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#2a2a3e',
            lineColor: '#8888a0',
            secondaryColor: '#1a1a2e',
            tertiaryColor: '#12121a',
          },
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart.trim());
        if (isMounted) {
          setSvgContent(svg);
          setError('');
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.warn('Mermaid render error:', err);
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-4 p-4 rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/10 text-xs">
        <p className="font-semibold text-[var(--danger)] mb-1">Diagram Render Warning</p>
        <p className="text-[var(--text-muted)] mb-2">{error}</p>
        <pre className="p-2 rounded bg-black/40 overflow-x-auto text-[11px] font-mono text-[var(--text)]">
          {chart}
        </pre>
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className="my-4 p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-center text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
          Rendering visual diagram...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-6 p-4 rounded-2xl border border-[var(--border)] bg-[#101018] overflow-x-auto flex justify-center shadow-lg"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

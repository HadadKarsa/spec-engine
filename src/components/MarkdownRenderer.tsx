'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidViewer from './MermaidViewer';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="spec-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (language === 'mermaid') {
              return <MermaidViewer chart={codeString} />;
            }

            const isInline = !className && !codeString.includes('\n');
            if (isInline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <pre className="relative group p-4 rounded-xl bg-[#0d0d14] border border-[var(--border)] overflow-x-auto text-xs my-4">
                {language && (
                  <span className="absolute top-2 right-3 text-[10px] uppercase font-mono text-[var(--text-muted)] tracking-wider">
                    {language}
                  </span>
                )}
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 border border-[var(--border)] rounded-xl">
                <table className="w-full text-left text-sm border-collapse">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="p-3 bg-[var(--bg-elevated)] font-semibold border-b border-[var(--border)] text-white">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="p-3 border-b border-[var(--border)] text-[var(--text)]">
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

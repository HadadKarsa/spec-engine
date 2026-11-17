import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spec Engine — AI Software Architect',
  description: 'Transform app ideas into production-ready technical specifications',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <nav className="border-b border-[var(--border)] bg-[var(--bg-card)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <a href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm">
                  SE
                </div>
                <span className="font-semibold text-white">Spec Engine</span>
              </a>
              <div className="flex items-center gap-3">
                <a
                  href="/new"
                  className="px-3 py-1.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors"
                >
                  + New Project
                </a>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}

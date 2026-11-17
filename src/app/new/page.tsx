'use client';

import { useState } from 'react';
import InterviewWizard from '@/components/InterviewWizard';
import SpecGenerator from '@/components/SpecGenerator';
import SettingsModal from '@/components/SettingsModal';

interface InterviewResult {
  idea: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  summary: string;
}

export default function NewProjectPage() {
  const [phase, setPhase] = useState<'interview' | 'generating'>('interview');
  const [interviewData, setInterviewData] = useState<InterviewResult | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleInterviewComplete = (data: InterviewResult) => {
    setInterviewData(data);
    setPhase('generating');
  };

  return (
    <div className="min-h-[calc(100vh-56px)]">
      {/* Quick settings access */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)] transition-all shadow-lg"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {phase === 'interview' && (
        <InterviewWizard onComplete={handleInterviewComplete} />
      )}

      {phase === 'generating' && interviewData && (
        <SpecGenerator
          idea={interviewData.idea}
          history={interviewData.history}
          summary={interviewData.summary}
        />
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

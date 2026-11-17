'use client';

import { useState, useEffect } from 'react';

interface ProviderInfo {
  id: string;
  label: string;
  models: string[];
  configured: boolean;
  activeModel: string;
  baseUrl: string;
}

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [activeProvider, setActiveProvider] = useState('');
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [models, setModels] = useState<Record<string, string>>({});
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!open) return;
    fetch('/api/providers')
      .then(r => r.json())
      .then(data => {
        setProviders(data.providers);
        setActiveProvider(data.activeProvider);
        const k: Record<string, string> = {};
        const m: Record<string, string> = {};
        const b: Record<string, string> = {};
        for (const p of data.providers) {
          k[p.id] = ''; // don't show existing keys for security
          m[p.id] = p.activeModel;
          b[p.id] = p.baseUrl;
        }
        setKeys(k);
        setModels(m);
        setBaseUrls(b);
      });
  }, [open]);

  const save = async () => {
    setSaving(true);
    const providerConfig: Record<string, { apiKey: string; model: string; baseUrl?: string }> = {};
    for (const p of providers) {
      if (keys[p.id] || p.id === 'ollama' || p.id === 'custom' || baseUrls[p.id]) {
        providerConfig[p.id] = {
          apiKey: keys[p.id] || '',
          model: models[p.id] || '',
          ...(baseUrls[p.id] ? { baseUrl: baseUrls[p.id] } : {}),
        };
      }
    }

    try {
      await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeProvider, providers: providerConfig }),
      });
      setStatus('Saved!');
      setTimeout(() => { setStatus(''); onClose(); }, 800);
    } catch (err) {
      setStatus('Error saving');
    }
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Provider Settings</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Active provider selector */}
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--text-muted)]">Active Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {providers.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActiveProvider(p.id)}
                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border truncate ${
                    activeProvider === p.id
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Provider configs */}
          {providers.map(p => (
            <div
              key={p.id}
              className={`p-4 rounded-xl border transition-all ${
                activeProvider === p.id
                  ? 'border-[var(--accent)] bg-[var(--bg-elevated)]'
                  : 'border-[var(--border)] opacity-60'
              }`}
            >
              <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                {p.label}
                {p.configured && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--success)]/20 text-[var(--success)]">configured</span>}
              </h3>

              {p.id !== 'ollama' && (
                <div className="mb-3">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    API Key {p.id === 'custom' && <span className="text-[var(--text-muted)]">(optional if local / not needed)</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={p.configured ? '••••••••••• (saved)' : p.id === 'custom' ? 'sk-... (or leave empty if local)' : 'Enter API key...'}
                    value={keys[p.id] || ''}
                    onChange={e => setKeys({ ...keys, [p.id]: e.target.value })}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              )}

              {(p.id === 'ollama' || p.id === 'openrouter' || p.id === 'custom') && (
                <div className="mb-3">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">
                    Base URL {p.id === 'custom' && <span className="text-[var(--accent)]">(OpenAI-Compatible /chat/completions)</span>}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      p.id === 'ollama'
                        ? 'http://localhost:11434'
                        : p.id === 'openrouter'
                        ? 'https://openrouter.ai/api/v1'
                        : 'https://api.deepseek.com/v1 (or http://localhost:1234/v1, https://api.together.xyz/v1)'
                    }
                    value={baseUrls[p.id] || ''}
                    onChange={e => setBaseUrls({ ...baseUrls, [p.id]: e.target.value })}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
              )}

              <div className="mb-1">
                <label className="block text-xs text-[var(--text-muted)] mb-1">Model Name</label>
                {p.id === 'custom' ? (
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. deepseek-chat, deepseek-reasoner, qwen-2.5-72b..."
                      value={models[p.id] || ''}
                      onChange={e => setModels({ ...models, [p.id]: e.target.value })}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-[var(--text-muted)] self-center mr-1">Quick pick:</span>
                      {p.models.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setModels({ ...models, [p.id]: m })}
                          className="text-[11px] px-2 py-0.5 rounded bg-[var(--bg)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-white transition-colors"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <select
                    value={models[p.id] || ''}
                    onChange={e => setModels({ ...models, [p.id]: e.target.value })}
                    className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                  >
                    {p.models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-sm text-[var(--success)]">{status}</span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--bg-elevated)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

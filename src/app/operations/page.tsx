'use client';
import { useEffect, useState } from 'react';
import { fetchConfig, updateConfig, type AppConfig } from '@/lib/api';

export default function OperationsPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig().then(setConfig).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await updateConfig(config);
      setConfig(updated);
    } catch (e) { console.error(e); }
    setSaving(false);
  };



  if (!config) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Operations</h1>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>System control center — manage AI, agents, and remediation behavior</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Remediation Mode */}
        <div className="glass-card">
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '16px' }}>⚡ Remediation Mode</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { value: 'full_auto', label: 'Full Auto', desc: 'AI detects, analyzes, and executes fixes automatically' },
              { value: 'semi_auto', label: 'Semi-Auto', desc: 'AI analyzes and suggests fix — you approve before execution' },
              { value: 'manual', label: 'Manual Only', desc: 'AI analyzes and reports only — no commands generated' },
            ].map(mode => (
              <label key={mode.value} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px',
                borderRadius: '8px', cursor: 'pointer',
                border: `1px solid ${config.remediation_mode === mode.value ? 'var(--accent-cyan)' : 'var(--border)'}`,
                background: config.remediation_mode === mode.value ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
              }}>
                <input
                  type="radio"
                  name="mode"
                  checked={config.remediation_mode === mode.value}
                  onChange={() => setConfig({ ...config, remediation_mode: mode.value })}
                  style={{ marginTop: '2px', accentColor: 'var(--accent-cyan)' }}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{mode.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{mode.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* AI Model Configuration */}
        <div className="glass-card">
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '16px' }}>🧠 AI Model Configuration</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Model</label>
              <select className="select" style={{ width: '100%' }} value={config.model_id} onChange={e => setConfig({ ...config, model_id: e.target.value })}>
                <option value="cohere.command-r-plus-08-2024">Cohere Command R+ (Recommended)</option>
                <option value="cohere.command-r-08-2024">Cohere Command R</option>
                <option value="meta.llama-3.1-70b-instruct">Meta Llama 3.1 70B</option>
                <option value="meta.llama-3.1-405b-instruct">Meta Llama 3.1 405B</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Temperature: {config.temperature.toFixed(1)}
              </label>
              <input type="range" min="0" max="1" step="0.1" value={config.temperature}
                onChange={e => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                <span>Precise</span><span>Creative</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Max Tokens</label>
              <input className="input" type="number" value={config.max_tokens}
                onChange={e => setConfig({ ...config, max_tokens: parseInt(e.target.value) || 1500 })}
              />
            </div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="glass-card">
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '16px' }}>📝 System Prompt</h2>
          <textarea
            className="input"
            rows={5}
            value={config.system_prompt}
            onChange={e => setConfig({ ...config, system_prompt: e.target.value })}
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8rem' }}
          />
          <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            This prompt is prepended to every AI analysis request. Customize it to tune the AI&apos;s behavior.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Configuration'}
        </button>
      </div>
    </div>
  );
}

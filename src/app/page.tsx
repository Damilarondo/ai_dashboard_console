'use client';
import { useEffect, useState } from 'react';
import { 
  fetchMetrics, fetchIncidents, fetchSystemMetrics, createWebSocket, 
  API_URL, type Metrics, type Incident, type SystemMetrics 
} from '@/lib/api';
import { useInterface } from '@/components/InterfaceContext';

interface LiveEvent {
  type: string;
  incident_id?: string;
  server?: string;
  timestamp?: string;
  preview?: string;
  root_cause?: string;
  mttr?: number;
}

function MetricChart({ data, color, title }: { data: number[], color: string, title: string }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{title}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>No data</span>
        </div>
        <div style={{ height: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }} />
      </div>
    );
  }

  const max = 100;
  const width = 200;
  const height = 40;
  
  // Use explicit Move and Line commands for safer SVG path data
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * height;
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{title}</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, color }}>{data[data.length - 1]?.toFixed(1)}%</span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <path d={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <path d={`${points} V ${height} H 0 Z`} fill={color} fillOpacity="0.1" stroke="none" />
      </svg>
    </div>
  );
}

function ProcessList({ processes }: { processes?: any[] }) {
  if (!processes || processes.length === 0) return <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No process data</div>;
  return (
    <div style={{ marginTop: '12px' }}>
      <h3 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Top Processes (RAM)</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {processes.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
            <span style={{ fontFamily: 'monospace' }}>{p.name} <span style={{ color: 'var(--text-secondary)', fontSize: '0.65rem' }}>({p.pid})</span></span>
            <span style={{ fontWeight: 600 }}>{p.memory_percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceStatusGrid({ services }: { services?: Record<string, any> }) {
  if (!services || Object.keys(services).length === 0) return <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No services discovered</div>;
  return (
    <div style={{ marginTop: '12px' }}>
      <h3 style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Active Services</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {Object.entries(services).map(([name, info]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: `1px solid ${info.status === 'active' || info.status === 'running' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}` }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: info.status === 'active' || info.status === 'running' ? 'var(--accent-green)' : 'var(--accent-red)' }} />
            <div style={{ fontSize: '0.75rem', fontWeight: 500 }}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function HealthGauge({ score }: { score: number }) {
  const radius = 45;
  const stroke = 8;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const color = score > 85 ? 'var(--accent-green)' : score > 60 ? 'var(--accent-yellow)' : 'var(--accent-magenta)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '100px', height: '60px', overflow: 'hidden' }}>
        <svg height="100" width="100" style={{ transform: 'rotate(-180deg)', position: 'absolute', top: 0, left: 0 }}>
          <circle
            stroke="rgba(255,255,255,0.05)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="50"
            cy="50"
            style={{ strokeDasharray: `${circumference / 2} ${circumference}` }}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="50"
            cy="50"
            style={{ 
              strokeDasharray: `${(score / 200) * circumference} ${circumference}`,
              transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
              filter: `drop-shadow(0 0 5px ${color}66)`
            }}
          />
        </svg>
        <div style={{ 
          position: 'absolute', bottom: '0', width: '100%', textAlign: 'center',
          fontSize: '1.4rem', fontWeight: 800, color: color, textShadow: `0 0 10px ${color}33`
        }}>
          {Math.round(score)}
        </div>
      </div>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.1em' }}>Stability Index</div>
    </div>
  );
}

export default function DashboardPage() {
  const { mode } = useInterface();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [activeNode, setActiveNode] = useState<string>('');
  const [prediction, setPrediction] = useState<{health_score?: number, predicted_failure?: string, status?: string, warnings?: string[]} | null>(null);
  const [history, setHistory] = useState<{cpu: number[], mem: number[], disk: number[]}>({ cpu: [], mem: [], disk: [] });
  const [latestMetric, setLatestMetric] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    // Fetch initial data
    fetchMetrics().then(setMetrics).catch(console.error);
    fetchIncidents(1).then(data => setRecentIncidents(data.incidents.slice(0, 5))).catch(console.error);
    fetchSystemMetrics(20).then(data => {
      if (data.length > 0) setLatestMetric(data[0]);
      const reversed = [...data].reverse();
      setHistory({
        cpu: reversed.map(m => m.cpu_percent),
        mem: reversed.map(m => m.memory_percent),
        disk: reversed.map(m => m.disk_percent)
      });
    }).catch(console.error);

    // WebSocket for live events
    const token = localStorage.getItem('access_token');
    const ws = createWebSocket(token);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [data, ...prev].slice(0, 50));

      if (data.type === 'error_detected') setActiveNode('detect');
      else if (data.type === 'analyzing') setActiveNode('analyze');
      else if (data.type === 'analysis_complete' || data.type === 'pending_approval') setActiveNode('remediate');
      else if (data.type === 'resolved') setActiveNode('verify');

      fetchMetrics().then(setMetrics).catch(console.error);
      fetchIncidents(1).then(data => setRecentIncidents(data.incidents.slice(0, 5))).catch(console.error);
    };

    const interval = setInterval(() => {
      fetchMetrics().then(setMetrics).catch(console.error);
      fetchSystemMetrics(20).then(data => {
        if (data.length > 0) setLatestMetric(data[0]);
        const reversed = [...data].reverse();
        setHistory({
          cpu: reversed.map(m => m.cpu_percent),
          mem: reversed.map(m => m.memory_percent),
          disk: reversed.map(m => m.disk_percent)
        });
      });
      fetch(`${API_URL}/metrics/predictions`)
        .then(res => res.json())
        .then(setPrediction)
        .catch(console.error);
    }, 10000); // 10s for more "live" feel

    fetchPredictions()
       .then(data => { if (data && !data.detail) setPrediction(data); })
       .catch(console.error);

    return () => { ws.close(); clearInterval(interval); };
  }, []);

  const workflowNodes = ['Detect', 'Analyze', 'Remediate', 'Verify'];

  const calculateHealthScore = () => {
    let score = 100;

    // 1. Service Uptime (40%)
    if (latestMetric?.services) {
      const services = Object.values(latestMetric.services);
      if (services.length > 0) {
        const active = services.filter((s: any) => s.status === 'active' || s.status === 'running').length;
        const serviceScore = (active / services.length) * 40;
        score = (score - 40) + serviceScore;
      }
    }

    // 2. Resource Pressure (30%)
    if (latestMetric) {
      const avgLoad = (latestMetric.cpu_percent + latestMetric.memory_percent + latestMetric.disk_percent) / 3;
      const resourcePenalty = (avgLoad / 100) * 30;
      score -= resourcePenalty;
    }

    // 3. Incidents (20%)
    const unresolved = recentIncidents.filter(inc => inc.status !== 'resolved' && inc.status !== 'rejected').length;
    score -= Math.min(20, unresolved * 5);

    // 4. ML/UX Bonus/Penalty (10%)
    if (prediction?.health_score !== undefined) {
      const mlContribution = (prediction.health_score / 100) * 10;
      score = (score - 10) + mlContribution;
    }

    return Math.max(0, Math.min(100, score));
  };

  const healthScore = calculateHealthScore();

  if (mode === 'expert') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', minHeight: '85vh' }}>
        {/* Left: Terminal Console */}
        <div style={{ background: '#0a0a0f', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)', fontFamily: 'monospace' }}>&gt; AIOps Terminal</h2>
            <div className="pulse-dot" />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {events.map((evt, i) => (
              <div key={i} style={{ color: evt.type === 'error_detected' ? '#ef4444' : evt.type === 'resolved' ? '#10b981' : '#a855f7' }}>
                <span style={{ color: '#6b7280' }}>[{new Date(evt.timestamp || Date.now()).toISOString()}]</span>{" "}
                {evt.server ? `[${evt.server}]` : ''}{" "}
                {evt.type.toUpperCase()}{" "}
                {evt.root_cause ? `[RCA: ${evt.root_cause}]` : ''}
              </div>
            ))}
            {events.length === 0 && <div style={{ color: '#6b7280' }}>Listening for live telemetry...</div>}
          </div>
        </div>

        {/* Right: Expert Tooling */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card glow-cyan">
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', fontFamily: 'monospace' }}>System Telemetry</h3>
            <MetricChart data={history.cpu} color="var(--accent-cyan)" title="CPU Load" />
            <MetricChart data={history.mem} color="var(--accent-yellow)" title="Memory Usage" />
            <MetricChart data={history.disk} color="var(--accent-magenta)" title="Disk I/O" />
            
            <ProcessList processes={latestMetric?.processes} />
          </div>

          <div className="glass-card">
            <ServiceStatusGrid services={latestMetric?.services} />
          </div>
          
          <div className="glass-card">
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', color: 'var(--accent-red)', fontFamily: 'monospace' }}>Network Override</h3>
            <button className="btn" style={{ width: '100%', marginBottom: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              Flush IP Tables
            </button>
            <button className="btn" style={{ width: '100%', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
              Force Agent Restart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Dashboard</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Real-time system overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="pulse-dot" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card glow-cyan">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Total Incidents</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{metrics?.total_incidents ?? '—'}</div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Mean Time to Repair</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-green)' }}>{metrics ? `${metrics.avg_mttr_seconds.toFixed(0)}s` : '—'}</div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Success Rate</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: metrics && metrics.success_rate >= 90 ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>{metrics ? `${metrics.success_rate}%` : '—'}</div>
        </div>
        <div className="glass-card">
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Active Agents</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{metrics ? `${metrics.agents_online}/${metrics.agents_total || 1}` : '—'}</div>
        </div>
        <div className="glass-card" style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HealthGauge score={healthScore} />
        </div>
      </div>

      {/* Middle Row: Live Feed + Workflow */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Live Event Feed */}
        <div className="glass-card" style={{ maxHeight: '360px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Live Event Feed</h2>
            <div className="pulse-dot" />
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '290px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {events.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
                Waiting for events...
              </p>
            ) : (
              events.map((evt, i) => (
                <div key={i} className={`feed-item ${evt.type === 'error_detected' ? 'error' : evt.type === 'analyzing' ? 'analyzing' : 'resolved'}`}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      {evt.type === 'error_detected' && '🔴 Error Detected'}
                      {evt.type === 'analyzing' && '🟡 AI Analyzing...'}
                      {evt.type === 'analysis_complete' && '🟢 Analysis Complete'}
                      {evt.type === 'pending_approval' && '🟠 Pending Approval'}
                      {evt.type === 'resolved' && '✅ Resolved'}
                      {evt.type === 'failed' && '❌ Failed'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      {evt.incident_id} {evt.server ? `• ${evt.server}` : ''} {evt.root_cause ? `• RCA: ${evt.root_cause}` : ''} {evt.mttr ? `• ${evt.mttr.toFixed(0)}s` : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Service Health Card */}
        <div className="glass-card" style={{ maxHeight: '360px', overflowY: 'auto' }}>
           <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '16px' }}>App Stack Health</h2>
           <ServiceStatusGrid services={latestMetric?.services} />
           <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '16px', paddingTop: '16px' }}>
             <ProcessList processes={latestMetric?.processes} />
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card">
          <MetricChart data={history.cpu} color="var(--accent-cyan)" title="CPU Utilization" />
        </div>
        <div className="glass-card">
          <MetricChart data={history.mem} color="var(--accent-yellow)" title="Memory Utilization" />
        </div>
        <div className="glass-card">
          <MetricChart data={history.disk} color="var(--accent-magenta)" title="Disk Storage" />
        </div>
        <div className="glass-card">
           <h2 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '16px' }}>Agent Workflow</h2>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             {workflowNodes.map((node, i) => (
                <div key={node} style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: activeNode === node.toLowerCase() ? 1 : 0.4 }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeNode === node.toLowerCase() ? 'var(--accent-cyan)' : 'var(--text-secondary)' }} />
                  <div style={{ fontSize: '0.75rem', fontWeight: activeNode === node.toLowerCase() ? 600 : 400 }}>{node}</div>
                </div>
             ))}
           </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Recent Incidents</h2>
          <a href="/incidents" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textDecoration: 'none' }}>View all →</a>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Server</th>
              <th>Root Cause</th>
              <th>Error Code</th>
              <th>MTTR</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentIncidents.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>No incidents yet</td></tr>
            ) : (
              recentIncidents.map(inc => (
                <tr key={inc.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/incidents/${inc.id}`}>
                  <td style={{ color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {new Date(inc.timestamp).toLocaleString()}
                  </td>
                  <td>{inc.server}</td>
                  <td>
                    <span className="badge badge-pending" style={{ background: 'rgba(255, 155, 113, 0.1)', color: '#FF9B71', border: '1px solid rgba(255, 155, 113, 0.2)' }}>
                      {inc.root_cause || 'Analyzing...'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{inc.error_code}</td>
                  <td>{inc.mttr_seconds ? `${inc.mttr_seconds.toFixed(0)}s` : '—'}</td>
                  <td>
                    <span className={`badge badge-${inc.status === 'resolved' ? 'resolved' : inc.status === 'failed' ? 'failed' : 'pending'}`}>
                      {inc.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

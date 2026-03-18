'use client';
import { useEffect, useState, Fragment } from 'react';
import { fetchIncidents, type Incident } from '@/lib/api';

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchIncidents(page, search, statusFilter).then(data => {
      setIncidents(data.incidents);
      setTotal(data.total);
    }).catch(console.error);
  }, [page, search, statusFilter]);

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Incidents</h1>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Full incident history with AI analysis and remediation details</p>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          className="input"
          placeholder="Search by error code, logs, or analysis..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: '400px' }}
        />
        <select className="select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="resolved">Resolved</option>
          <option value="failed">Failed</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="remediation_sent">In Progress</option>
        </select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>{total} total</span>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Incident ID</th>
              <th>Time</th>
              <th>Server</th>
              <th>Root Cause</th>
              <th>Error Code</th>
              <th>MTTR</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map(inc => (
              <Fragment key={inc.id}>
                <tr key={inc.id} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === inc.id ? null : inc.id)}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontSize: '0.75rem' }}>{inc.id}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{new Date(inc.timestamp).toLocaleString()}</td>
                  <td>{inc.server}</td>
                  <td>
                    <span className="badge badge-pending" style={{ background: 'rgba(255, 155, 113, 0.1)', color: '#FF9B71', border: '1px solid rgba(255, 155, 113, 0.2)' }}>
                      {inc.root_cause || 'Analyzing...'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>{inc.error_code}</td>
                  <td>{inc.status === 'resolved' && inc.mttr_seconds ? `${inc.mttr_seconds.toFixed(0)}s` : '—'}</td>
                  <td>
                    <span className={`badge badge-${inc.status === 'resolved' ? 'resolved' : inc.status === 'failed' ? 'failed' : 'pending'}`}>
                      {inc.status}
                    </span>
                  </td>
                </tr>
                {expandedId === inc.id && (
                  <tr key={`${inc.id}-detail`}>
                    <td colSpan={7} style={{ padding: '20px', background: 'var(--bg-primary)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '8px' }}>AI Analysis</h3>
                          <p style={{ fontSize: '0.8rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{inc.ai_analysis}</p>
                        </div>
                        <div>
                          <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '8px' }}>Remediation Commands</h3>
                          <pre style={{
                            fontSize: '0.75rem', background: '#000', padding: '12px', borderRadius: '8px',
                            overflow: 'auto', maxHeight: '200px', whiteSpace: 'pre-wrap',
                          }}>{inc.remediation_commands}</pre>
                          {inc.recommendations && (
                            <>
                              <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-yellow)', marginBottom: '8px', marginTop: '16px' }}>Recommendations</h3>
                              <p style={{ fontSize: '0.75rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{inc.recommendations}</p>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
          <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Page {page}</span>
          <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next</button>
        </div>
      )}
    </div>
  );
}

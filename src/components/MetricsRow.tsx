'use client';
import { useBambuStore } from '~/lib/store';

export default function MetricsRow() {
  const { jobs, statuses } = useBambuStore();

  const active    = Object.values(statuses).filter(s => s.gcodeState === 'RUNNING').length;
  const queued    = jobs.filter(j => j.status === 'queued').length;
  const completed = jobs.filter(j => j.status === 'done').length;

  const metrics = [
    { label: 'Active jobs',    value: String(active),    sub: 'printing now',   color: 'var(--accent)' },
    { label: 'Queue',          value: String(queued),    sub: 'jobs pending',   color: 'var(--text)' },
    { label: 'Completed',      value: String(completed), sub: 'this session',   color: 'var(--success)' },
    { label: 'Printers online',value: String(Object.values(statuses).filter(s => s.connected).length), sub: `of ${Object.keys(statuses).length} total`, color: 'var(--accent2)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
      {metrics.map((m) => (
        <div key={m.label} style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '12px 14px',
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>{m.label}</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: m.color, margin: 0, lineHeight: 1.1 }}>{m.value}</p>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '3px 0 0' }}>{m.sub}</p>
        </div>
      ))}
    </div>
  );
}

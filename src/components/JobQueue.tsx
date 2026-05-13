'use client';
import { useState } from 'react';
import { useBambuStore } from '~/lib/store';
import { PrintJob } from '~/lib/types';
import AddJobModal from './AddJobModal';

const STATUS_STYLES: Record<PrintJob['status'], { bg: string; color: string; label: string }> = {
  printing: { bg: 'rgba(0,212,170,.12)',   color: 'var(--accent)',   label: 'printing' },
  queued:   { bg: 'rgba(100,116,139,.1)',  color: 'var(--muted)',    label: 'queued'   },
  done:     { bg: 'rgba(34,197,94,.1)',    color: 'var(--success)',  label: 'done'     },
  failed:   { bg: 'rgba(239,68,68,.1)',    color: 'var(--danger)',   label: 'failed'   },
  paused:   { bg: 'rgba(245,158,11,.1)',   color: 'var(--warn)',     label: 'paused'   },
};

function fmtTime(minutes: number) {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function JobQueue() {
  const { jobs, printers } = useBambuStore();
  const [showModal, setShowModal] = useState(false);

  const printerName = (serial: string) =>
    printers.find(p => p.serial === serial)?.name ?? serial.slice(-6);

  return (
    <>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.1em', color: 'var(--muted)', textTransform: 'uppercase', margin: 0 }}>Job queue</p>
        <button 
          onClick={() => setShowModal(true)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          + New job
        </button>
      </div>

      <div>
        {jobs.map((job, i) => {
          const s = STATUS_STYLES[job.status];
          return (
            <div
              key={job.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 0',
                borderBottom: i < jobs.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {/* Icon */}
              <div style={{
                width: '32px', height: '32px',
                background: 'var(--panel)', border: '1px solid var(--border)',
                borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="2" width="10" height="10" rx="1" stroke={s.color} strokeWidth="1.2"/>
                  {job.status === 'done' && <path d="M4.5 7l1.5 1.5L9 5.5" stroke={s.color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>}
                  {job.status === 'printing' && <path d="M5 7h4M7 5v4" stroke={s.color} strokeWidth="1.2" strokeLinecap="round"/>}
                  {job.status === 'queued' && <path d="M5 7h4" stroke={s.color} strokeWidth="1.2" strokeLinecap="round"/>}
                  {job.status === 'paused' && <path d="M5.5 5v4M8.5 5v4" stroke={s.color} strokeWidth="1.2" strokeLinecap="round"/>}
                  {job.status === 'failed' && <path d="M7 5v3M7 9.5v.5" stroke={s.color} strokeWidth="1.2" strokeLinecap="round"/>}
                </svg>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {job.fileName}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', margin: 0 }}>
                  {printerName(job.printerSerial)} · {job.material}
                  {job.layerCurrent && job.layerTotal ? ` · ${job.layerCurrent}/${job.layerTotal} layers` : ''}
                  {job.status === 'queued' ? ` · est. ${fmtTime(job.estimatedMinutes)}` : ''}
                </p>
              </div>

              {/* Progress bar for active prints */}
              {job.status === 'printing' && job.progressPercent !== undefined && (
                <div style={{ width: '60px' }}>
                  <div style={{ background: 'var(--dim)', borderRadius: '2px', height: '3px' }}>
                    <div style={{ height: '3px', borderRadius: '2px', background: 'var(--accent)', width: `${job.progressPercent}%` }}/>
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', margin: '2px 0 0', textAlign: 'right' }}>
                    {job.progressPercent}%
                  </p>
                </div>
              )}

              {/* Status badge */}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px',
                padding: '3px 8px', borderRadius: '3px', whiteSpace: 'nowrap',
                background: s.bg, color: s.color,
                border: `1px solid ${s.color}40`,
              }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
    {showModal && <AddJobModal onClose={() => setShowModal(false)} />}
    </>
  );
}

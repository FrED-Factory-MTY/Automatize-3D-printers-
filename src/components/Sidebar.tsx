'use client';
import { useState } from 'react';
import { useBambuStore } from '~/lib/store';
import { SPEED_PROFILES } from '~/lib/types';
import AddPrinterModal from './AddPrinterModal';

function stateColor(state: string) {
  switch (state) {
    case 'RUNNING':  return 'var(--accent)';
    case 'PAUSE':    return 'var(--warn)';
    case 'FAILED':   return 'var(--danger)';
    case 'FINISH':   return 'var(--success)';
    default:         return 'var(--muted)';
  }
}

function stateLabel(state: string) {
  const map: Record<string,string> = {
    IDLE: 'Idle', PREPARE: 'Preparing', RUNNING: 'Printing',
    PAUSE: 'Paused', FINISH: 'Finished', FAILED: 'Failed', SLICING: 'Slicing',
  };
  return map[state] ?? state;
}

export default function Sidebar() {
  const { printers, statuses, selectedSerial, selectPrinter } = useBambuStore();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <aside style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '260px',
        minHeight: '100%',
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
          Printers
        </p>

        {printers.length === 0 && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', padding: '12px 0' }}>
            No printers yet. Add one below.
          </p>
        )}

        {printers.map((printer) => {
          const st = statuses[printer.serial];
          const isSelected = selectedSerial === printer.serial;
          const color = stateColor(st?.gcodeState ?? 'IDLE');
          const pct = st?.printPercent ?? 0;

          return (
            <div
              key={printer.serial}
              onClick={() => selectPrinter(printer.serial)}
              style={{
                background: isSelected ? 'rgba(0,212,170,.05)' : 'var(--panel)',
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '6px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}>{printer.name}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', margin: 0 }}>
                    {printer.model} · {st?.connected ? 'online' : 'offline'}
                  </p>
                </div>
                <span
                  className={st?.connected && st.gcodeState === 'RUNNING' ? 'blink' : ''}
                  style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: color, display: 'block',
                    boxShadow: st?.connected ? `0 0 6px ${color}` : 'none',
                  }}
                />
              </div>

              <div style={{ background: 'var(--dim)', borderRadius: '2px', height: '3px', overflow: 'hidden' }}>
                <div style={{ height: '3px', borderRadius: '2px', background: color, width: `${pct}%`, transition: 'width 1s' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>
                  {stateLabel(st?.gcodeState ?? 'IDLE')}{' '}
                  <span style={{ color }}>{st?.gcodeState === 'RUNNING' ? `${pct}%` : ''}</span>
                </span>
                {st?.gcodeState === 'RUNNING' && st.remainingTime > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)' }}>
                    {Math.floor(st.remainingTime / 60)}h {st.remainingTime % 60}m
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'transparent', border: '1px dashed var(--dim)',
            borderRadius: '6px', padding: '8px', color: 'var(--muted)',
            fontSize: '12px', cursor: 'pointer', marginTop: '4px',
            fontFamily: 'var(--font-sans)',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--accent)'; (e.target as HTMLElement).style.color = 'var(--accent)'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--dim)'; (e.target as HTMLElement).style.color = 'var(--muted)'; }}
        >
          + Add printer
        </button>
      </aside>

      {showModal && <AddPrinterModal onClose={() => setShowModal(false)} />}
    </>
  );
}

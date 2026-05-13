'use client';
import { useBambuStore } from '~/lib/store';

export default function Topbar() {
  const { mqttConnected, statuses, printers } = useBambuStore();

  const onlineCount = Object.values(statuses).filter(s => s.connected).length;
  const total = printers.length;
  const firstOnline = printers.find(p => statuses[p.serial]?.connected);
  const connLabel = total === 0
    ? 'No printers added'
    : onlineCount === 0
    ? 'All offline'
    : total === 1
    ? `${firstOnline?.model ?? 'Printer'} · online`
    : `${onlineCount}/${total} online`;

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '15px', letterSpacing: '.05em', color: 'var(--accent)' }}>
        B.L.A.Z.E<span style={{ color: 'var(--muted)', fontWeight: 400 }}></span>{' '}
        <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 400, marginLeft: '8px' }}>v0.3.1</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          MQTT{' '}
          <span
            className={mqttConnected ? 'blink' : ''}
            style={{
              width: '7px', height: '7px', borderRadius: '50%', display: 'inline-block',
              background: mqttConnected ? 'var(--accent)' : 'var(--muted)',
              boxShadow: mqttConnected ? '0 0 6px var(--accent)' : 'none',
            }}
          />
          <span style={{ color: mqttConnected ? 'var(--accent)' : 'var(--muted)' }}>
            {mqttConnected ? 'live' : 'disconnected'}
          </span>
        </span>

        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px',
          color: onlineCount > 0 ? 'var(--accent)' : 'var(--muted)',
          background: onlineCount > 0 ? 'rgba(0,212,170,.1)' : 'rgba(100,116,139,.1)',
          border: `1px solid ${onlineCount > 0 ? 'rgba(0,212,170,.25)' : 'rgba(100,116,139,.25)'}`,
          borderRadius: '4px',
          padding: '3px 12px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: onlineCount > 0 ? 'var(--accent)' : 'var(--muted)',
            display: 'inline-block',
          }}/>
          {connLabel}
        </div>
      </div>
    </header>
  );
}

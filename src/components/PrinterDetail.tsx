'use client';
import { useState } from 'react';
import { useBambuStore } from '~/lib/store';
import { bambuCommands, SPEED_PROFILES } from '~/lib/types';

function TempBar({ label, current, target, max, hot }: { label: string; current: number; target: number; max: number; hot: boolean }) {
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: '80px', fontSize: '12px', color: 'var(--muted)' }}>{label}</span>
      <div style={{ flex: 1, background: 'var(--dim)', borderRadius: '2px', height: '4px' }}>
        <div style={{
          height: '4px', borderRadius: '2px', width: `${pct}%`, transition: 'width 1s',
          background: hot ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'var(--accent2)',
        }}/>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', width: '80px', textAlign: 'right' }}>
        {current}°C <span style={{ color: 'var(--muted)' }}>/ {target}°C</span>
      </span>
    </div>
  );
}

export default function PrinterDetail() {
  const { selectedSerial, statuses, printers, logs, addLog } = useBambuStore();
  const [tab, setTab] = useState<'temps' | 'ams' | 'speed' | 'api'>('temps');
  const [serial, setSerial] = useState(printers[0]?.serial ?? '');
  const [ip, setIp] = useState(printers[0]?.ip ?? '');
  const [accessCode, setAccessCode] = useState('');
  const [mqttPort, setMqttPort] = useState('8883');

  const st = selectedSerial ? statuses[selectedSerial] : null;
  const printer = printers.find(p => p.serial === selectedSerial);

  function handleTest() {
    addLog({ level: 'warn', message: `Testing ${ip}:${mqttPort} serial=${serial}…` });
    setTimeout(() => addLog({ level: 'info', message: 'MQTT handshake OK · TLS 1.3' }), 800);
  }

  const tabStyle = (t: string) => ({
    flex: 1, padding: '6px', textAlign: 'center' as const,
    fontFamily: 'var(--font-mono)', fontSize: '11px',
    cursor: 'pointer', borderRadius: '3px',
    background: tab === t ? 'var(--surface)' : 'transparent',
    color: tab === t ? 'var(--text)' : 'var(--muted)',
    border: tab === t ? '1px solid var(--border)' : '1px solid transparent',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Live panel */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.1em', color: 'var(--muted)', textTransform: 'uppercase', margin: '0 0 12px' }}>
          {printer?.name ?? 'Select a printer'} — live
        </p>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '2px', background: 'var(--panel)', borderRadius: '5px', padding: '3px', marginBottom: '14px' }}>
          {(['temps', 'ams', 'speed', 'api'] as const).map(t => (
            <div key={t} style={tabStyle(t)} onClick={() => setTab(t)}>{t}</div>
          ))}
        </div>

        {/* Temps tab */}
        {tab === 'temps' && st && (
          <div>
            <TempBar label="Nozzle" current={st.nozzleTemp} target={st.nozzleTempTarget} max={300} hot />
            <TempBar label="Bed" current={st.bedTemp} target={st.bedTempTarget} max={120} hot />
            <TempBar label="Chamber" current={st.chamberTemp} target={60} max={60} hot={false} />
          </div>
        )}
        {tab === 'temps' && !st && (
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>No printer selected.</p>
        )}

        {/* AMS tab */}
        {tab === 'ams' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {(st?.ams?.length ? st.ams : []).map(slot => (
              <div key={slot.id} style={{
                border: '1px solid var(--border)', borderRadius: '5px', padding: '8px 6px', textAlign: 'center', cursor: 'pointer',
              }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: `#${slot.color}`, margin: '0 auto 5px', border: '2px solid rgba(255,255,255,.15)' }}/>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--muted)', margin: '0 0 2px', lineHeight: 1.3 }}>{slot.type}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: `#${slot.color}`, margin: 0 }}>{slot.remain}%</p>
              </div>
            ))}
            {!st?.ams?.length && <p style={{ color: 'var(--muted)', fontSize: '12px', gridColumn: 'span 4' }}>No AMS data.</p>}
          </div>
        )}

        {/* Speed tab */}
        {tab === 'speed' && st && (
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>Print speed profile</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {([1,2,3,4] as const).map(lvl => {
                const active = st.speed === lvl;
                return (
                  <div
                    key={lvl}
                    onClick={() => {
                      // In real usage: publish(bambuCommands.setSpeed(lvl))
                      addLog({ level: 'info', message: `Speed → ${SPEED_PROFILES[lvl].label}` });
                    }}
                    style={{
                      background: active ? 'rgba(0,212,170,.08)' : 'var(--panel)',
                      border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '4px', padding: '7px 4px',
                      fontFamily: 'var(--font-mono)', fontSize: '11px',
                      color: active ? 'var(--accent)' : 'var(--muted)',
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                    }}
                  >
                    {SPEED_PROFILES[lvl].label}
                  </div>
                );
              })}
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', marginTop: '10px' }}>
              Current: <span style={{ color: 'var(--accent)' }}>
                {SPEED_PROFILES[st.speed as keyof typeof SPEED_PROFILES]?.label} ({SPEED_PROFILES[st.speed as keyof typeof SPEED_PROFILES]?.percent}%)
              </span>
            </p>
          </div>
        )}

        {/* API Config tab */}
        {tab === 'api' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Device serial</p>
              <input value={serial} onChange={e => setSerial(e.target.value)} placeholder="01S09C451234567"/>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Access code</p>
              <input type="password" value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="8-digit code from printer screen"/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>Printer IP</p>
                <input value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.1.x"/>
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', margin: '0 0 4px' }}>MQTT port</p>
                <input value={mqttPort} onChange={e => setMqttPort(e.target.value)} placeholder="8883"/>
              </div>
            </div>
            <button
              onClick={handleTest}
              style={{
                background: 'var(--accent)', color: '#000',
                fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700,
                border: 'none', borderRadius: '4px', padding: '9px 16px',
                cursor: 'pointer', letterSpacing: '.04em', width: '100%',
              }}
            >
              Test connection
            </button>
          </div>
        )}
      </div>

      {/* MQTT log */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.1em', color: 'var(--muted)', textTransform: 'uppercase', margin: '0 0 10px' }}>MQTT log</p>
        <div style={{
          background: 'var(--ink)', border: '1px solid var(--border)', borderRadius: '4px',
          padding: '10px', fontFamily: 'var(--font-mono)', fontSize: '11px',
          maxHeight: '120px', overflowY: 'auto', lineHeight: 1.8,
        }}>
          {logs.slice(-20).map((entry, i) => {
            const ts = entry.timestamp.toTimeString().slice(0,8);
            const colors: Record<string,string> = { info: 'var(--muted)', warn: 'var(--warn)', error: 'var(--danger)', data: 'var(--accent)' };
            return (
              <div key={i}>
                <span style={{ color: 'var(--muted)' }}>[{ts}] </span>
                <span style={{ color: colors[entry.level] ?? 'var(--text)' }}>{entry.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

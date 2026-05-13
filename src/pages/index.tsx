import Head from "next/head";
import { useEffect, useState } from 'react';
import { supabase } from '~/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { useBambuStore } from '~/lib/store';
import { useMqtt } from '~/hooks/useMqtt';
import Topbar from '~/components/Topbar';
import Sidebar from '~/components/Sidebar';
import MetricsRow from '~/components/MetricsRow';
import JobQueue from '~/components/JobQueue';
import PrinterDetail from '~/components/PrinterDetail';
import AuthScreen from '../components/AuthScreen';
import { type PrinterConfig } from '~/lib/types';

function MqttConnector({ config }: { config: PrinterConfig }) {
  useMqtt(config);
  return null;
}

export default function Home() {
  const { printers } = useBambuStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. This checks if the user is logged in when the page loads
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. This listens for logins/logouts in real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show a blank dark screen while checking authentication
  if (loading) {
    return <div className="min-h-screen bg-ink" />;
  }

  // If they are NOT logged in, show the Login/Register screen
  if (!session) {
    return (
      <>
        <Head><title>Login — Bambu Auto</title></Head>
        <AuthScreen />
      </>
    );
  }

  // If they ARE logged in, show the Dashboard!
  return (
    <>
      <Head>
        <title>Dashboard — Bambu Auto</title>
      </Head>
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--ink, #111)' }}>
        {printers.map(p => <MqttConnector key={p.serial} config={p} />)}
        
        <Topbar />
        
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 'calc(100vh - 52px)' }}>
          <Sidebar />
          <main style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="flex justify-between items-center bg-panel border border-border p-4 rounded-lg mb-4">
              <p className="text-text">
                Logged in as: <span className="font-bold text-accent">{session.user.email}</span>
              </p>
              <button 
                onClick={() => supabase.auth.signOut()} 
                className="bg-danger text-ink px-4 py-2 rounded font-bold hover:opacity-90"
              >
                Log Out
              </button>
            </div>

            <MetricsRow />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px', alignItems: 'start' }}>
              <JobQueue />
              <PrinterDetail />
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
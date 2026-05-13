import { useState } from 'react';
import { supabase } from '~/lib/supabase';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organization, setOrganization] = useState('FrED-Factory'); // Default org
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isLogin) {
      // --- LOGIN LOGIC ---
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(`Error: ${error.message}`);
    } else {
      // --- REGISTER LOGIC ---
      if (!email.endsWith('@tec.mx')) {
        setMessage('Error: Only @tec.mx email addresses are allowed.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This saves their organization choice permanently in their Supabase profile!
          data: { organization }, 
        }
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Success! Check your email to confirm your account.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-panel border border-border p-8 rounded-lg w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-text text-center">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>
        
        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="block text-dim mb-1 text-xs uppercase tracking-wider">Email</label>
            <input 
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="alumno@tec.mx" required
              className="w-full bg-surface border border-border rounded px-3 py-2 text-text focus:border-accent outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-dim mb-1 text-xs uppercase tracking-wider">Password</label>
            <input 
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required
              className="w-full bg-surface border border-border rounded px-3 py-2 text-text focus:border-accent outline-none transition-colors"
            />
          </div>

          {/* Only show the Organization dropdown if they are registering */}
          {!isLogin && (
            <div>
              <label className="block text-dim mb-1 text-xs uppercase tracking-wider">Organization</label>
              <select 
                value={organization} 
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full bg-surface border border-border rounded px-3 py-2 text-text focus:border-accent outline-none transition-colors"
              >
                <option value="FrED-Factory">FrED-Factory</option>
                <option value="RoBorregos">RoBorregos</option>
                <option value="VantTec">VantTec</option>
              </select>
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            className="mt-4 bg-accent text-ink font-bold py-2 px-4 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Register')}
          </button>

          {message && (
            <p className={`text-sm mt-2 text-center ${message.startsWith('Error') ? 'text-danger' : 'text-success'}`}>
              {message}
            </p>
          )}
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
            className="text-sm text-dim hover:text-accent transition-colors"
          >
            {isLogin ? "Don't have an account? Register here." : "Already have an account? Log in."}
          </button>
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, LockKeyhole } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useSession } from '@/components/SessionProvider';
import { CzechAuth } from '@/components/CzechAuth';
import { authError } from '@/lib/auth-errors';
import { haptic } from '@/lib/radar-types';

export default function Login({ callback = false, reset = false }: { callback?: boolean; reset?: boolean }) {
  const { session, recovery, clearRecovery, loading } = useSession();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(callback);
  const isRecovery = reset || recovery || window.location.hash.includes('type=recovery');
  useEffect(() => {
    if (!callback) return;
    const code = new URLSearchParams(window.location.search).get('code');
    const run = async () => {
      if (code) { const { error } = await supabase.auth.exchangeCodeForSession(code); if (error) setMessage(authError(error)); }
      if (window.location.hash.includes('error')) setMessage('Odkaz je neplatný nebo vypršel. Vyžádejte si nový.');
      setProcessing(false);
    }; void run();
  }, [callback]);
  useEffect(() => { if (session && !isRecovery && !loading && !processing && !message) navigate('/', { replace: true }); }, [session, isRecovery, loading, processing, message, navigate]);
  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault(); haptic(); setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false); if (error) setMessage(authError(error)); else { clearRecovery(); navigate('/', { replace: true }); }
  };
  return <main className="flex min-h-dvh items-center justify-center px-5 py-12"><div className="w-full max-w-md"><Link to="/" onClick={haptic} className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={16} />Zpět na radar</Link><div className="panel p-7 sm:p-9"><div className="mb-8 flex items-center gap-3"><div className="brand-icon"><ShieldCheck size={26} /></div><div><h1 className="text-xl font-semibold">Noční Stráž<span className="text-primary">.</span></h1><p className="mt-1 text-xs text-muted-foreground">Váš prostor. Pod kontrolou.</p></div></div><h2 className="mb-2 text-2xl font-semibold">{isRecovery ? 'Nové heslo' : 'Vítejte doma'}</h2><p className="mb-6 text-sm leading-6 text-muted-foreground">{isRecovery ? 'Zvolte nové bezpečné heslo ke svému účtu.' : 'Přihlaste se pro bezpečný přístup k živému radaru své domácnosti.'}</p>
    {message && <p role="alert" className="mb-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-300">{message}</p>}
    {processing ? <p className="text-sm text-primary">Ověřování přihlášení…</p> : isRecovery && session ? <form onSubmit={updatePassword}><label className="field-label" htmlFor="new-password">Nové heslo</label><input id="new-password" type="password" minLength={8} required autoComplete="new-password" className="field" value={password} onChange={e => setPassword(e.target.value)} /><button disabled={busy} className="primary-button mt-5 w-full">{busy ? 'Ukládání…' : 'Uložit nové heslo'}</button></form> : <CzechAuth />}
    <div className="mt-7 flex items-center justify-center gap-2 border-t border-white/5 pt-5 text-[11px] text-muted-foreground"><LockKeyhole size={13} />Přístup pouze pro členy vaší domácnosti</div></div></div></main>;
}

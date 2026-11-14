import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, LockKeyhole, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { useSession } from '@/components/SessionProvider';
import { CzechAuth } from '@/components/CzechAuth';
import { authError } from '@/lib/auth-errors';

export default function Login({ callback = false, reset = false }: { callback?: boolean; reset?: boolean }) {
  const { session, recovery, clearRecovery, loading } = useSession();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(callback);
  const isRecovery = reset || recovery;

  useEffect(() => {
    if (!callback) return;
    let active = true;
    const verify = async () => {
      try {
        // Klient automaticky zpracuje tokeny i PKCE kód; getSession počká na jeho inicializaci.
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active && !data.session) setMessage('Odkaz je neplatný nebo vypršel. Přihlaste se znovu nebo si vyžádejte nový odkaz.');
      } catch (failure) {
        if (active) setMessage(authError(failure));
      } finally {
        if (active) setProcessing(false);
      }
    };
    void verify();
    return () => { active = false; };
  }, [callback]);

  useEffect(() => {
    if (session && !isRecovery && !loading && !processing && !message) navigate('/', { replace: true });
  }, [session, isRecovery, loading, processing, message, navigate]);

  const returnToDemo = () => {
    clearRecovery();
    navigate('/', { replace: true });
  };

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setMessage('');
    if (password.length < 8) { setMessage('Nové heslo musí mít alespoň 8 znaků.'); return; }
    if (password !== confirmation) { setMessage('Zadaná hesla se neshodují.'); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      clearRecovery();
      navigate('/', { replace: true });
    } catch (failure) {
      setMessage(authError(failure));
    } finally {
      setBusy(false);
    }
  };

  return <main className="flex min-h-dvh items-center justify-center px-5 py-12">
    <div className="w-full max-w-md">
      <Button type="button" variant="ghost" onClick={returnToDemo} className="mb-7 h-11 rounded-xl px-3 text-sm text-muted-foreground hover:bg-white/5 hover:text-primary"><ArrowLeft />Zpět do Demo režimu</Button>
      <div className="panel p-7 sm:p-9">
        <div className="mb-8 flex items-center gap-3"><div className="brand-icon"><ShieldCheck size={26} /></div><div><h1 className="text-xl font-semibold">Noční Stráž<span className="text-primary">.</span></h1><p className="mt-1 text-xs text-muted-foreground">Váš prostor. Pod kontrolou.</p></div></div>
        <h2 className="mb-2 text-2xl font-semibold">{isRecovery ? 'Nové heslo' : 'Vítejte doma'}</h2>
        <p className="mb-6 text-sm leading-6 text-muted-foreground">{isRecovery ? 'Zvolte nové bezpečné heslo ke svému účtu.' : 'Přihlaste se nebo vytvořte účet pro bezpečný přístup k živému radaru své domácnosti.'}</p>
        {message && <p id="recovery-error" role="alert" className="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-sm leading-6 text-rose-200">{message}</p>}
        {processing || loading ? <div role="status" className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm text-primary"><LoaderCircle size={18} className="animate-spin" />Ověřování přihlášení…</div> : isRecovery && session ? <form onSubmit={updatePassword} noValidate aria-busy={busy} aria-describedby={message ? 'recovery-error' : undefined} className="space-y-4">
          <div><label className="field-label" htmlFor="new-password">Nové heslo</label><Input id="new-password" type="password" required autoComplete="new-password" disabled={busy} className="field h-12 rounded-xl" placeholder="Alespoň 8 znaků" value={password} onChange={event => setPassword(event.target.value)} /></div>
          <div><label className="field-label" htmlFor="confirm-password">Potvrzení nového hesla</label><Input id="confirm-password" type="password" required autoComplete="new-password" disabled={busy} className="field h-12 rounded-xl" placeholder="Zopakujte nové heslo" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></div>
          <Button type="submit" disabled={busy} className="primary-button h-12 w-full rounded-xl">{busy ? <LoaderCircle className="animate-spin" /> : <LockKeyhole />}{busy ? 'Ukládání…' : 'Uložit nové heslo'}</Button>
        </form> : <>
          {isRecovery && <p className="mb-5 text-sm leading-6 text-amber-200">Pro změnu hesla otevřete platný odkaz z e-mailu. Zde si můžete vyžádat nový.</p>}
          <CzechAuth initialView={isRecovery ? 'forgot' : 'signin'} />
        </>}
        <div className="mt-7 flex items-center justify-center gap-2 border-t border-white/5 pt-5 text-[11px] text-muted-foreground"><LockKeyhole size={13} />Přístup pouze pro členy vaší domácnosti</div>
      </div>
      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Demo režim můžete používat bez účtu a bez připojeného zařízení.</p>
    </div>
  </main>;
}

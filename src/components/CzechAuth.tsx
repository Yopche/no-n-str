import { FormEvent, useState } from 'react';
import { ArrowLeft, LoaderCircle, LockKeyhole, Mail, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabaseClient';
import { authError } from '@/lib/auth-errors';

type View = 'signin' | 'signup' | 'forgot';

export function CzechAuth({ initialView = 'signin' }: { initialView?: View }) {
  const [view, setView] = useState<View>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const changeView = (next: View) => {
    setView(next);
    setPassword('');
    setConfirmation('');
    setError('');
    setNotice('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setNotice('');

    const emailInput = event.currentTarget.elements.namedItem('email') as HTMLInputElement;
    if (!email.trim() || !emailInput.validity.valid) {
      setError('Zadejte platnou e-mailovou adresu.');
      emailInput.focus();
      return;
    }
    if (view !== 'forgot' && !password) {
      setError('Zadejte heslo.');
      return;
    }
    if (view === 'signup' && password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků.');
      return;
    }
    if (view === 'signup' && password !== confirmation) {
      setError('Zadaná hesla se neshodují.');
      return;
    }

    setBusy(true);
    try {
      if (view === 'signin') {
        const { data, error: failure } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (failure) throw failure;
        if (!data.session) throw new Error('Přihlášení nebylo dokončeno.');
      } else if (view === 'signup') {
        const { data, error: failure } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: new URL('/auth/callback', window.location.origin).href },
        });
        if (failure) throw failure;
        if (!data.session) {
          setPassword('');
          setConfirmation('');
          setView('signin');
          setNotice('Zkontrolujte svou e-mailovou schránku. Pokud je potvrzení účtu potřeba, otevřete odkaz v e-mailu a poté se přihlaste.');
        }
      } else {
        const { error: failure } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: new URL('/reset-password', window.location.origin).href,
        });
        if (failure) throw failure;
        setNotice('Pokud pro tuto adresu existuje účet, obdržíte e-mail s odkazem pro obnovu hesla.');
      }
    } catch (failure) {
      setError(authError(failure));
    } finally {
      setBusy(false);
    }
  };

  return <div className="space-y-5">
    {view !== 'forgot' ? <div className="flex rounded-xl border border-white/10 bg-[#090f19] p-1" role="group" aria-label="Způsob přihlášení">
      <Button type="button" variant="ghost" disabled={busy} aria-pressed={view === 'signin'} onClick={() => changeView('signin')} className={`flex-1 rounded-lg text-xs ${view === 'signin' ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary' : 'text-slate-400'}`}>Přihlášení</Button>
      <Button type="button" variant="ghost" disabled={busy} aria-pressed={view === 'signup'} onClick={() => changeView('signup')} className={`flex-1 rounded-lg text-xs ${view === 'signup' ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary' : 'text-slate-400'}`}>Registrace</Button>
    </div> : <div><h3 className="text-base font-medium">Obnova hesla</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Zašleme vám odkaz pro nastavení nového hesla.</p></div>}

    {error && <p id="auth-error" role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-sm leading-6 text-rose-200">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm leading-6 text-slate-200">{notice}</p>}

    <form onSubmit={submit} noValidate aria-busy={busy} aria-describedby={error ? 'auth-error' : undefined} className="space-y-4">
      <div><label className="field-label" htmlFor="auth-email">E-mail</label><Input id="auth-email" name="email" type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} disabled={busy} value={email} onChange={event => setEmail(event.target.value)} placeholder="vas@email.cz" className="field h-12 rounded-xl" /></div>
      {view !== 'forgot' && <div><label className="field-label" htmlFor="auth-password">Heslo</label><Input id="auth-password" type="password" required autoComplete={view === 'signup' ? 'new-password' : 'current-password'} disabled={busy} value={password} onChange={event => setPassword(event.target.value)} placeholder={view === 'signup' ? 'Alespoň 8 znaků' : 'Vaše heslo'} className="field h-12 rounded-xl" /></div>}
      {view === 'signup' && <div><label className="field-label" htmlFor="auth-confirmation">Potvrzení hesla</label><Input id="auth-confirmation" type="password" required autoComplete="new-password" disabled={busy} value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Zopakujte zvolené heslo" className="field h-12 rounded-xl" /></div>}
      <Button type="submit" disabled={busy} className="primary-button h-12 w-full rounded-xl">{busy ? <LoaderCircle className="animate-spin" /> : view === 'forgot' ? <Mail /> : view === 'signup' ? <UserPlus /> : <LockKeyhole />}{busy ? 'Zpracování…' : view === 'forgot' ? 'Odeslat odkaz pro obnovu' : view === 'signup' ? 'Vytvořit účet' : 'Přihlásit se'}</Button>
    </form>

    <Button type="button" variant="ghost" disabled={busy} onClick={() => changeView(view === 'forgot' ? 'signin' : 'forgot')} className="h-auto w-full rounded-xl py-2 text-xs text-muted-foreground hover:text-primary">{view === 'forgot' && <ArrowLeft />}{view === 'forgot' ? 'Zpět k přihlášení' : 'Zapomenuté heslo?'}</Button>
    {view === 'signup' && <p className="text-[11px] leading-5 text-muted-foreground">Nový účet sám nezíská přístup k cizímu radaru. Po přihlášení vytvořte vlastní domácnost nebo přijměte pozvánku od jejího člena.</p>}
  </div>;
}

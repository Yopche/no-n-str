import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Database, FlaskConical, LogIn, LogOut, Users, Check, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { TacticalModal } from './TacticalModal';
import { useSession } from './SessionProvider';
import { DEFAULT_KEY, DEFAULT_URL, storedConnection, supabase } from '@/integrations/supabase/client';
import { authError } from '@/lib/auth-errors';
import { haptic } from '@/lib/radar-types';
export function SettingsModal({ open, onClose, demo, changeMode }: { open: boolean; onClose: () => void; demo: boolean; changeMode: (demo: boolean) => void }) {
  const saved = storedConnection();
  const [url, setUrl] = useState(saved.url || DEFAULT_URL);
  const [key, setKey] = useState(saved.key || DEFAULT_KEY);
  const [showKey, setShowKey] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [name, setName] = useState('Moje domácnost');
  const [invite, setInvite] = useState('');
  const [busy, setBusy] = useState(false);
  const { session, household, households, refreshHouseholds, selectHousehold, error } = useSession();
  const validate = () => {
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') throw new Error();
      if (key.startsWith('sb_secret_')) throw new Error();
      if (key.startsWith('eyJ')) { const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); if (payload.role !== 'anon') throw new Error(); }
      else if (!key.startsWith('sb_publishable_')) throw new Error();
      setConfirm(true);
    } catch { toast.error('Zadejte platnou HTTPS adresu projektu a veřejný klíč anon / publishable. Tajný klíč není povolen.'); }
  };
  const save = () => {
    haptic(); localStorage.setItem('ns-connection', JSON.stringify({ url: url.trim().replace(/\/$/, ''), key: key.trim() }));
    setConfirm(false); toast.success('Připojení uloženo. Aplikace se znovu načte v bezpečném demo režimu.');
    window.location.assign('/');
  };
  const householdAction = async (join: boolean) => {
    haptic(); setBusy(true);
    const { data, error } = join ? await supabase.rpc('radar_join_household', { code: invite.trim() }) : await supabase.rpc('radar_create_household', { house_name: name });
    setBusy(false);
    if (error) { toast.error(join ? 'Pozvánka není platná nebo připojení selhalo.' : 'Domácnost se nepodařilo vytvořit.'); return; }
    await refreshHouseholds(); if (data) selectHousehold(data); setInvite(''); toast.success(join ? 'Připojili jste se k domácnosti.' : 'Domácnost byla vytvořena.');
  };
  return <TacticalModal open={open} onClose={onClose} title="Nastavení systému" description="Připojení, provozní režim a přístup vaší domácnosti.">
    <div className="space-y-6"><div className="rounded-2xl border border-primary/15 bg-primary/5 p-4"><div className="flex items-center justify-between gap-4"><div className="flex gap-3"><FlaskConical size={20} className="text-primary" /><div><p className="text-sm font-medium">Demo režim</p><p className="mt-1 text-xs text-muted-foreground">Realistická simulace bez zařízení</p></div></div><Switch checked={demo} onCheckedChange={v => { haptic(); changeMode(v); }} className="data-[state=checked]:bg-primary" /></div><p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Wifi size={13} />{demo ? 'Živé připojení je vypnuté.' : 'Živé připojení (Supabase) je zapnuté.'}</p></div>
    <section><h3 className="mb-4 flex items-center gap-2 text-sm font-medium"><Database size={16} className="text-primary" />Připojení Supabase</h3><label className="field-label" htmlFor="supabase-url">Adresa projektu (SUPABASE_URL)</label><input id="supabase-url" className="field mb-4" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://vas-projekt.supabase.co" /><label className="field-label" htmlFor="supabase-key">Veřejný klíč (SUPABASE_ANON_KEY)</label><input id="supabase-key" className="field" type={showKey ? 'text' : 'password'} autoComplete="off" value={key} onChange={e => setKey(e.target.value)} /><button className="mt-2 text-xs text-muted-foreground hover:text-primary" onClick={() => { haptic(); setShowKey(!showKey); }}>{showKey ? 'Skrýt klíč' : 'Zobrazit klíč'}</button><p className="mt-3 text-xs leading-5 text-muted-foreground">Ukládá se pouze veřejný klíč do tohoto prohlížeče. Nikdy sem nevkládejte service_role. Změna projektu vyžaduje nové přihlášení.</p>
    {confirm ? <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4"><p className="text-sm text-amber-200">Uložit nové připojení a znovu načíst aplikaci?</p><div className="mt-3 flex gap-2"><button className="primary-button flex-1" onClick={save}>Potvrdit připojení</button><button className="secondary-button" onClick={() => { haptic(); setConfirm(false); }}>Zrušit</button></div></div> : <button className="secondary-button mt-4 w-full" onClick={() => { haptic(); validate(); }}>Uložit připojení</button>}</section>
    <section className="border-t border-white/5 pt-5"><h3 className="mb-4 flex items-center gap-2 text-sm font-medium"><Users size={16} className="text-primary" />Domácnost a přístup</h3>{!session ? <><p className="mb-4 text-xs leading-5 text-muted-foreground">Živý radar mohou ovládat pouze přihlášení členové. Demo zůstává volně dostupné.</p><Link onClick={haptic} to="/prihlaseni" className="primary-button w-full"><LogIn size={16} />Přihlásit se nebo vytvořit účet</Link></> : <><div className="mb-4 flex items-center justify-between gap-3"><span className="truncate text-xs text-muted-foreground">{session.user.email}</span><button className="icon-button" aria-label="Odhlásit se" onClick={async () => { haptic(); const { error } = await supabase.auth.signOut(); if (error) toast.error(authError(error)); else { changeMode(true); toast.success('Byli jste odhlášeni.'); } }}><LogOut size={16} /></button></div>{error && <p className="mb-3 text-xs text-rose-300">{error}</p>}{households.length > 0 && <><label className="field-label" htmlFor="household">Aktivní domácnost</label><select id="household" className="field mb-4" value={household?.id || ''} onChange={e => { haptic(); changeMode(true); selectHousehold(e.target.value); }}>{households.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select><div className="mb-5 rounded-xl bg-white/[.03] p-3"><p className="mb-2 text-xs text-muted-foreground">Kód pozvánky pro další členy</p><div className="flex items-center gap-2"><code className="min-w-0 flex-1 break-all text-xs text-primary">{household?.invite_code}</code><button aria-label="Zkopírovat pozvánku" className="icon-button" onClick={async () => { haptic(); try { await navigator.clipboard.writeText(household?.invite_code || ''); toast.success('Pozvánka zkopírována. Sdílejte ji jen s důvěryhodnými členy.'); } catch { toast.error('Kód zkopírujte ručně.'); } }}><Copy size={15} /></button></div></div></>}
    <label className="field-label" htmlFor="house-name">Nová domácnost</label><div className="flex gap-2"><input id="house-name" className="field min-w-0" maxLength={80} value={name} onChange={e => setName(e.target.value)} /><button disabled={busy || !name.trim()} className="secondary-button shrink-0" onClick={() => void householdAction(false)}>Vytvořit</button></div><label className="field-label mt-4" htmlFor="invite">Připojit se pomocí pozvánky</label><div className="flex gap-2"><input id="invite" className="field min-w-0" value={invite} onChange={e => setInvite(e.target.value)} placeholder="Kód od člena domácnosti" /><button aria-label="Připojit se k domácnosti" disabled={busy || !invite.trim()} className="secondary-button" onClick={() => void householdAction(true)}><Check size={17} /></button></div></>}</section>
    <div className="flex flex-wrap gap-4 border-t border-white/5 pt-4 text-xs text-primary"><a href="/nocni-straz.sql" download>Stáhnout SQL skript</a><a href="/pripojeni-esp32.txt" download>Návod pro ESP32</a></div>
    <p className="text-[11px] leading-5 text-muted-foreground">Při odpojení se telemetrie skryje a ovládání zablokuje. Pro offline provoz se žádná telemetrie ani historie neukládá.</p></div>
  </TacticalModal>;
}

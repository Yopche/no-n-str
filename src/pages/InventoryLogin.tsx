import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Cpu, ArrowUpRight, LockKeyhole, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useInventorySession } from '@/components/InventorySession';
import { PartVisual } from '@/components/PartVisual';
import { authError } from '@/lib/auth-errors';
export default function InventoryLogin({callback=false,reset=false}:{callback?:boolean;reset?:boolean}) {
 const {session,loading,recovery,clearRecovery,error}=useInventorySession();const navigate=useNavigate();
 const [message,setMessage]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[processing,setProcessing]=useState(callback);
 const recovering=reset||recovery;
 useEffect(()=>{if(!callback)return;let active=true;supabase.auth.getSession().then(({data,error})=>{if(active){if(error)setMessage(authError(error));else if(!data.session)setMessage('Odkaz vypršel nebo je neplatný. Vyžádej si nový.');setProcessing(false);}});return()=>{active=false;};},[callback]);
 useEffect(()=>{if(session&&!recovering&&!loading&&!processing&&!message)navigate('/',{replace:true});},[session,recovering,loading,processing,message,navigate]);
 const save=async(e:FormEvent)=>{e.preventDefault();if(busy)return;if(password!==confirm){setMessage('Hesla se neshodují.');return;}setBusy(true);const {error}=await supabase.auth.updateUser({password});setBusy(false);if(error)setMessage(authError(error));else{clearRecovery();navigate('/',{replace:true});}};
 return <main className="mx-auto flex min-h-dvh max-w-6xl flex-col justify-center px-5 py-8 sm:px-10">
  <Link to="/ukazka" className="mb-12 flex w-fit items-center gap-3"><div className="brand-icon"><Cpu size={25} strokeWidth={1.3}/></div><div><span className="text-base font-semibold">Sklad součástek<span className="text-primary">.</span></span><p className="mt-1 font-mono text-[8px] tracking-[.22em] text-primary/80">TVÁ SOUKROMÁ DÍLNA</p></div></Link>
  <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
   <section><p className="eyebrow mb-5">POŘÁDEK V DÍLECH. PROSTOR PRO NÁPADY.</p><h1 className="font-display text-4xl leading-[1.18] tracking-tight sm:text-6xl">Méně hledání.<br/><span className="text-primary">Více tvoření.</span></h1><p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">Každý modul, každý vodič, každý další nápad. Tvůj osobní sklad a projekty na jednom místě — od pracovní dílny až do kapsy.</p><div className="mt-8 hidden max-w-lg grid-cols-3 gap-3 sm:grid"><PartVisual category="MCU" large/><PartVisual category="senzor" large/><PartVisual category="napájení" large/></div><div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted-foreground">{['Přehledný dashboard','Chytré kusovníky','Vlastní projekty'].map(t=><span key={t} className="flex items-center gap-1.5"><Check size={13} className="text-emerald-400"/>{t}</span>)}</div><Button asChild className="secondary-button mt-7"><Link to="/ukazka">Prohlédnout ukázkovou dílnu<ArrowUpRight size={15}/></Link></Button></section>
   <section className="panel p-6 sm:p-8"><div className="mb-6 flex items-center gap-2 font-mono text-[9px] tracking-wider text-primary"><LockKeyhole size={14}/>SOUKROMÝ SKLAD</div><h2 className="font-display text-3xl">{recovering?'Nové heslo':'Vítej ve své dílně'}</h2><p className="mb-6 mt-3 text-xs leading-6 text-muted-foreground">{recovering?'Obnov přístup ke svým součástkám.':'Přihlas se nebo vytvoř účet. Novému účtu připravíme 24 součástek a ukázkový projekt.'}</p>
    {(message||error)&&<p role="alert" className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-200">{message||error}</p>}
    {loading||processing?<div role="status" aria-label="Ověřuji přihlášení" className="space-y-4 py-6"><Skeleton className="h-12 rounded-xl bg-white/5"/><Skeleton className="h-12 rounded-xl bg-white/5"/><Skeleton className="h-12 rounded-xl bg-primary/10"/></div>:recovering&&session?<form onSubmit={save} className="space-y-4"><div><label className="field-label" htmlFor="password">Nové heslo</label><Input id="password" required type="password" autoComplete="new-password" minLength={8} className="field" value={password} onChange={e=>setPassword(e.target.value)}/></div><div><label className="field-label" htmlFor="confirm">Potvrzení hesla</label><Input id="confirm" required type="password" autoComplete="new-password" className="field" value={confirm} onChange={e=>setConfirm(e.target.value)}/></div><Button disabled={busy} className="primary-button w-full">{busy?'Ukládám…':'Uložit heslo'}</Button></form>:<Auth
      supabaseClient={supabase} providers={[]} view={recovering?'forgotten_password':'sign_in'}
      redirectTo={new URL(recovering?'/reset-password':'/auth/callback',window.location.origin).href} theme="dark"
      appearance={{theme:ThemeSupa,variables:{default:{colors:{brand:'#D4AF37',brandAccent:'#E3C35D',brandButtonText:'#0B0D10',defaultButtonBackground:'#171B22',defaultButtonBackgroundHover:'#222731',defaultButtonText:'#F4F1E9',inputBackground:'#0D1016',inputBorder:'#30343D',inputBorderFocus:'#D4AF37',inputText:'#F4F1E9',inputLabelText:'#A0A6B2',inputPlaceholder:'#949BA9',anchorTextColor:'#D4AF37'},radii:{borderRadiusButton:'12px',buttonBorderRadius:'12px',inputBorderRadius:'12px'},space:{inputPadding:'14px',buttonPadding:'14px'}}}}}
      localization={{variables:{sign_in:{email_label:'E-mail',password_label:'Heslo',email_input_placeholder:'tvuj@email.cz',password_input_placeholder:'Tvoje heslo',button_label:'Otevřít svou dílnu',loading_button_label:'Přihlašuji…',link_text:'Už máš účet? Přihlas se'},sign_up:{email_label:'E-mail',password_label:'Heslo',email_input_placeholder:'tvuj@email.cz',password_input_placeholder:'Zvol bezpečné heslo',button_label:'Vytvořit účet',loading_button_label:'Vytvářím účet…',link_text:'Nemáš účet? Vytvoř si ho',confirmation_text:'Potvrď registraci v e-mailu a vrať se do svého skladu.'},forgotten_password:{email_label:'E-mail',email_input_placeholder:'tvuj@email.cz',button_label:'Poslat odkaz pro obnovu',loading_button_label:'Odesílám…',link_text:'Zapomenuté heslo?',confirmation_text:'Odkaz pro obnovu jsme poslali na tvůj e-mail.'}}}}/>
    }
    <p className="mt-6 border-t border-border pt-5 text-center text-[10px] leading-5 text-muted-foreground">Jen tvoje díly, jen tvůj účet.<br/>Data jsou chráněná oprávněními Supabase.</p>
   </section>
  </div><footer className="mt-12 font-mono text-[8px] tracking-widest text-muted-foreground">SKLAD SOUČÁSTEK / CARBON & GOLD</footer>
 </main>;
}

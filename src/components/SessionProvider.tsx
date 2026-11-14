import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

type Household = { id: string; name: string; invite_code: string; owner_id: string };
type SessionState = { session: Session | null; loading: boolean; recovery: boolean; households: Household[]; household: Household | null; selectHousehold: (id: string) => void; refreshHouseholds: () => Promise<void>; error: string; clearRecovery: () => void };
const Context = createContext<SessionState | null>(null);
export function SessionContextProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const refreshHouseholds = async () => {
    const { data, error: failure } = await supabase.from('radar_households').select('*').order('created_at');
    if (failure) { setError('Domácnosti se nepodařilo načíst. Zkontrolujte databázi a oprávnění.'); return; }
    setHouseholds(data || []);
    setError('');
  };
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, current) => {
      setSession(current); setLoading(false);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') { setHouseholds([]); setError(''); setRecovery(false); }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError('Přihlášení nelze ověřit. Zkuste se přihlásit znovu.');
      setSession(data.session); setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => { if (session) void refreshHouseholds(); }, [session?.user.id]);
  return <Context.Provider value={{ session, loading, recovery, households, household: households.find(h => h.id === selected) || households[0] || null, selectHousehold: setSelected, refreshHouseholds, error, clearRecovery: () => setRecovery(false) }}>{children}</Context.Provider>;
}
export function useSession() { const value = useContext(Context); if (!value) throw new Error('Chybí poskytovatel přihlášení.'); return value; }

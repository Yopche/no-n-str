import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { authError } from '@/lib/auth-errors';
const Context = createContext<{session:Session|null;loading:boolean;recovery:boolean;clearRecovery:()=>void;error:string}|null>(null);
export function InventorySession({children}:{children:ReactNode}) {
 const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(true),[recovery,setRecovery]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const {data}=supabase.auth.onAuthStateChange((event,current)=>{setSession(current);setLoading(false);if(event==='PASSWORD_RECOVERY')setRecovery(true);if(event==='SIGNED_OUT'){setRecovery(false);setError('');}});supabase.auth.getSession().then(({data,error})=>{setSession(data.session);if(error)setError(authError(error));setLoading(false);});return()=>data.subscription.unsubscribe();},[]);
 return <Context.Provider value={{session,loading,recovery,clearRecovery:()=>setRecovery(false),error}}>{children}</Context.Provider>;
}
export function useInventorySession(){const value=useContext(Context);if(!value)throw new Error('Chybí přihlášení');return value;}

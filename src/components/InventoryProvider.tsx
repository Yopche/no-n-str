import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useInventorySession } from './InventorySession';
import { Part, Project, Need, demoParts, demoProject, demoNeeds } from '@/lib/inventory';
import { InventoryEvent } from '@/lib/inventory-dashboard';
type Store = {parts:Part[];projects:Project[];needs:Need[];events:InventoryEvent[];loading:boolean;error:string;demo:boolean;refresh:()=>Promise<void>;mutate:(action:()=>PromiseLike<{error:unknown}>,success:string)=>Promise<boolean>};
const Context=createContext<Store|null>(null);
export function InventoryProvider({children,demo=false}:{children:ReactNode;demo?:boolean}){
 const {session}=useInventorySession();
 const [parts,setParts]=useState<Part[]>(demo?demoParts:[]),[projects,setProjects]=useState<Project[]>(demo?[demoProject]:[]),[needs,setNeeds]=useState<Need[]>(demo?demoNeeds:[]),[loading,setLoading]=useState(!demo),[error,setError]=useState('');
 const [events,setEvents]=useState<InventoryEvent[]>([]);
 const refresh=useCallback(async()=>{
 if(demo||!session)return;
 const {error:seedError}=await supabase.rpc('initialize_inventory');if(seedError)throw seedError;
 // Data API vrací stránkované výsledky; i větší CSV import musí být vidět celý.
 const readAll=async(table:string)=>{
   const rows:unknown[]=[];
   for(let offset=0;;offset+=1000){
     const {data,error}=await supabase.from(table).select('*').order(table==='project_parts'?'id':'created_at').order('id').range(offset,offset+999);
     if(error)throw error;rows.push(...data);if(data.length<1000)return rows;
   }
 };
 const results=await Promise.all([readAll('parts'),readAll('projects'),readAll('project_parts'),readAll('inventory_events')]);
 setParts(results[0] as Part[]);setProjects(results[1] as Project[]);setNeeds(results[2] as Need[]);setEvents(results[3] as InventoryEvent[]);setError('');
 },[demo,session?.user.id]);
 useEffect(()=>{if(demo||!session)return;let active=true;setLoading(true);(async()=>{try{await refresh();}catch{if(active)setError('Sklad se nepodařilo načíst. Zkontroluj připojení a zkus to znovu.');}finally{if(active)setLoading(false);}})();return()=>{active=false;};},[demo,session?.user.id,refresh]);
 const mutate=async(action:()=>PromiseLike<{error:unknown}>,success:string)=>{
 if(demo){toast.info('Ukázka je jen pro čtení. Přihlas se pro vlastní sklad.');return false;}
 try{const {error}=await action();if(error)throw error;}catch{toast.error('Změnu se nepodařilo uložit. Zkontroluj připojení.');return false;}
 toast.success(success);
 try{await refresh();}catch{setError('Změna byla uložena, ale přehled nelze obnovit. Zkus ho načíst znovu.');}
 return true;
 };
 return <Context.Provider value={{parts,projects,needs,events,loading,error,demo,refresh,mutate}}>{children}</Context.Provider>;
}
export function useInventory(){const value=useContext(Context);if(!value)throw new Error('Chybí sklad');return value;}

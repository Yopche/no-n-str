import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Part } from '@/lib/inventory';
import { useInventory } from './InventoryProvider';
import { supabase } from '@/integrations/supabase/client';
export function QuantityControl({part}:{part:Part}){
 const {mutate,demo}=useInventory();const [busy,setBusy]=useState(false);
 const adjust=async(delta:number)=>{if(busy)return;setBusy(true);await mutate(()=>supabase.rpc('adjust_part_quantity',{part_id_input:part.id,delta}),delta>0?'Kus přidán':'Kus odebrán');setBusy(false);};
 return <div className="flex gap-1.5"><Button className="quantity-button" disabled={demo||busy||part.quantity===0} onClick={()=>adjust(-1)} aria-label={`Odebrat kus ${part.name}`}><Minus size={15}/></Button><Button className="quantity-button" disabled={demo||busy||part.quantity===2147483647} onClick={()=>adjust(1)} aria-label={`Přidat kus ${part.name}`}><Plus size={15}/></Button></div>;
}

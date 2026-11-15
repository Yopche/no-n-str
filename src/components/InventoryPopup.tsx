import { ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInventory } from './InventoryProvider';
import { PremiumModal } from './PremiumModal';
import { InventoryDashboard } from './InventoryDashboard';
import { StockList } from './StockList';
import { ProjectList } from './Projects';
export function InventoryPopup({title,drawer=false,children}:{title:string;drawer?:boolean;children:ReactNode}){
 const {demo}=useInventory();const location=useLocation();const navigate=useNavigate();const [open,setOpen]=useState(true);const prefix=demo?'/ukazka':'';
 const allowed=[prefix||'/',`${prefix}/sklad`,`${prefix}/projekty`];
 const candidate=(location.state as {returnTo?:string}|null)?.returnTo;
 const returnTo=candidate&&allowed.includes(candidate)?candidate:prefix||'/';
 const background=returnTo.endsWith('/sklad')?<StockList/>:returnTo.endsWith('/projekty')?<ProjectList/>:<InventoryDashboard/>;
 return <>{background}<PremiumModal open={open} onClose={()=>setOpen(false)} onExited={()=>navigate(returnTo,{replace:true})} title={title} drawer={drawer}>{children}</PremiumModal></>;
}

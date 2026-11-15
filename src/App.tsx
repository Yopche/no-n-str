import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { InventorySession, useInventorySession } from '@/components/InventorySession';
import { InventoryProvider } from '@/components/InventoryProvider';
import { InventoryLayout } from '@/components/InventoryLayout';
import { InventoryPopup } from '@/components/InventoryPopup';
import { DashboardSkeleton } from '@/components/PremiumPrimitives';
import { StockList } from '@/components/StockList';
import { PartForm } from '@/components/PartForm';
import { PartDetail } from '@/components/PartDetail';
import { ProjectList, ProjectDetail } from '@/components/Projects';
import { ProjectForm } from '@/components/ProjectForm';
import { IdeaBuilder } from '@/components/IdeaBuilder';
import Index from '@/pages/Index';
import InventoryLogin from '@/pages/InventoryLogin';
import NotFound from '@/pages/NotFound';
function Workspace({demo=false}:{demo?:boolean}){
 const {session,loading,recovery}=useInventorySession();
 if(!demo&&loading)return <div className="mx-auto max-w-6xl p-8"><DashboardSkeleton/></div>;
 if(!demo&&recovery)return <Navigate to="/reset-password" replace/>;
 if(!demo&&!session)return <Navigate to="/prihlaseni" replace/>;
 return <InventoryProvider key={demo?'demo':session?.user.id} demo={demo}><InventoryLayout><Outlet/></InventoryLayout></InventoryProvider>;
}
export default function App(){return <InventorySession><BrowserRouter><Routes>
 <Route path="/prihlaseni" element={<InventoryLogin/>}/><Route path="/auth/callback" element={<InventoryLogin callback/>}/><Route path="/reset-password" element={<InventoryLogin reset/>}/>
 <Route element={<Workspace/>}>
  <Route path="/" element={<Index/>}/><Route path="/sklad" element={<StockList/>}/>
  <Route path="/dily/novy" element={<InventoryPopup title="Přidat součástku" drawer><PartForm key="new"/></InventoryPopup>}/>
  <Route path="/dily/:id" element={<InventoryPopup title="Detail součástky"><PartDetail/></InventoryPopup>}/>
  <Route path="/dily/:id/upravit" element={<InventoryPopup title="Upravit součástku" drawer><PartForm/></InventoryPopup>}/>
  <Route path="/projekty" element={<ProjectList/>}/>
  <Route path="/projekty/novy" element={<InventoryPopup title="Nový projekt" drawer><ProjectForm key="new"/></InventoryPopup>}/>
  <Route path="/projekty/:id" element={<InventoryPopup title="Detail projektu"><ProjectDetail/></InventoryPopup>}/>
  <Route path="/projekty/:id/upravit" element={<InventoryPopup title="Upravit projekt" drawer><ProjectForm/></InventoryPopup>}/>
  <Route path="/napad" element={<InventoryPopup title="Co postavím?"><IdeaBuilder/></InventoryPopup>}/>
 </Route>
 <Route path="/ukazka" element={<Workspace demo/>}>
  <Route index element={<Index/>}/><Route path="sklad" element={<StockList/>}/>
  <Route path="dily/:id" element={<InventoryPopup title="Detail součástky"><PartDetail/></InventoryPopup>}/>
  <Route path="projekty" element={<ProjectList/>}/><Route path="projekty/:id" element={<InventoryPopup title="Detail projektu"><ProjectDetail/></InventoryPopup>}/>
  <Route path="napad" element={<InventoryPopup title="Co postavím?"><IdeaBuilder/></InventoryPopup>}/>
 </Route>
 <Route path="*" element={<NotFound/>}/></Routes><Toaster theme="dark" position="bottom-right" offset={90} toastOptions={{style:{background:'#171B22',color:'#F4F1E9',border:'1px solid #D4AF3726',borderRadius:'16px',boxShadow:'0 12px 35px #00000040'}}}/></BrowserRouter></InventorySession>;}

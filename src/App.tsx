import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { InventorySession, useInventorySession } from '@/components/InventorySession';
import { InventoryProvider } from '@/components/InventoryProvider';
import { InventoryLayout } from '@/components/InventoryLayout';
import { PartForm } from '@/components/PartForm';
import { ProjectList, ProjectDetail, ProjectForm } from '@/components/Projects';
import { IdeaBuilder } from '@/components/IdeaBuilder';
import Index from '@/pages/Index';
import InventoryLogin from '@/pages/InventoryLogin';
import NotFound from '@/pages/NotFound';
function Workspace({demo=false}:{demo?:boolean}){
 const {session,loading,recovery}=useInventorySession();
 if(!demo&&loading)return <div className="flex min-h-dvh items-center justify-center font-mono text-sm text-primary">Otevírám dílnu…</div>;
 if(!demo&&recovery)return <Navigate to="/reset-password" replace/>;
 if(!demo&&!session)return <Navigate to="/prihlaseni" replace/>;
 return <InventoryProvider key={demo?'demo':session?.user.id} demo={demo}><InventoryLayout><Outlet/></InventoryLayout></InventoryProvider>;
}
export default function App(){return <InventorySession><BrowserRouter><Routes>
 <Route path="/prihlaseni" element={<InventoryLogin/>}/><Route path="/auth/callback" element={<InventoryLogin callback/>}/><Route path="/reset-password" element={<InventoryLogin reset/>}/>
 <Route element={<Workspace/>}><Route path="/" element={<Index/>}/><Route path="/dily/novy" element={<PartForm key="new"/>}/><Route path="/dily/:id" element={<PartForm/>}/><Route path="/projekty" element={<ProjectList/>}/><Route path="/projekty/novy" element={<ProjectForm key="new"/>}/><Route path="/projekty/:id" element={<ProjectDetail/>}/><Route path="/projekty/:id/upravit" element={<ProjectForm/>}/><Route path="/napad" element={<IdeaBuilder/>}/></Route>
 <Route path="/ukazka" element={<Workspace demo/>}><Route index element={<Index/>}/><Route path="dily/:id" element={<PartForm/>}/><Route path="projekty" element={<ProjectList/>}/><Route path="projekty/:id" element={<ProjectDetail/>}/><Route path="napad" element={<IdeaBuilder/>}/></Route>
 <Route path="*" element={<NotFound/>}/></Routes><Toaster theme="dark" position="top-center" toastOptions={{style:{background:'#242a23',color:'#edf1e9',border:'1px solid #3c4635',borderRadius:'14px'}}}/></BrowserRouter></InventorySession>;}

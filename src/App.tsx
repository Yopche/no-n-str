import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SessionContextProvider } from '@/components/SessionProvider';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import { haptic } from '@/lib/radar-types';

export default function App() {
  return <SessionContextProvider><div onClickCapture={e => { if ((e.target as HTMLElement).closest('button:not(:disabled),a')) haptic(); }}><BrowserRouter><Routes>
    <Route path="/" element={<Index />} />
    <Route path="/prihlaseni" element={<Login />} />
    <Route path="/auth/callback" element={<Login callback />} />
    <Route path="/reset-password" element={<Login reset />} />
    <Route path="*" element={<NotFound />} />
  </Routes><Toaster theme="dark" position="top-center" toastOptions={{ style: { background: '#152131', color: '#edf4f8', border: '1px solid #2c4152', borderRadius: '14px', fontFamily: 'DM Sans, sans-serif' } }} closeButton={false} /></BrowserRouter></div></SessionContextProvider>;
}

import { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { haptic } from '@/lib/radar-types';
export function TacticalModal({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description: string; children: ReactNode }) {
  return <Dialog.Root open={open} onOpenChange={v => { if (!v) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-[#02060d]/80 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0" />
    <Dialog.Content className="fixed bottom-0 left-1/2 z-50 max-h-[90dvh] w-full max-w-lg -translate-x-1/2 overflow-y-auto rounded-t-3xl border border-white/10 bg-[#101824] p-6 shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-6 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
      <div className="mb-5 pr-8"><div className="mb-3 h-1 w-8 rounded-full bg-primary/70" /><Dialog.Title className="text-xl font-semibold tracking-tight">{title}</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</Dialog.Description></div>
      {children}<Dialog.Close onClick={haptic} aria-label="Zavřít okno" className="icon-button absolute right-4 top-4"><X size={18} /></Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

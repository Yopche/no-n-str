import { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

type Props = {
 open:boolean;
 onClose:()=>void;
 onExited?:()=>void;
 title:string;
 description?:string;
 drawer?:boolean;
 children:ReactNode;
};

export function PremiumModal({open,onClose,onExited,title,description,drawer=false,children}:Props){
 const reduced=useReducedMotion();
 const drag=useDragControls();
 return <Dialog.Root open={open} onOpenChange={value=>{if(!value)onClose();}}>
  <Dialog.Portal forceMount>
   <AnimatePresence onExitComplete={onExited}>
    {open&&<motion.div key="popup-layer" initial={reduced?false:{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.18}}>
     <Dialog.Overlay className="fixed inset-0 z-50 bg-[#050608]/75 backdrop-blur-lg"/>
     <div className={`pointer-events-none fixed inset-0 z-50 flex items-end justify-center ${drawer?'sm:justify-end':'sm:items-center sm:p-6'}`}>
      <Dialog.Content asChild>
       <motion.div
        className={`premium-modal pointer-events-auto relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[24px] border border-white/10 bg-[#14171d]/95 shadow-2xl backdrop-blur-2xl ${drawer?'sm:h-dvh sm:max-h-dvh sm:max-w-xl sm:rounded-l-[24px] sm:rounded-r-none':'sm:max-w-4xl sm:rounded-[20px]'}`}
        initial={reduced?false:drawer?{x:window.innerWidth>=640?70:0,y:window.innerWidth<640?70:0}:{y:24,scale:.985}}
        animate={{x:0,y:0,scale:1}}
        exit={reduced?{}:{y:24,opacity:0}}
        transition={{duration:.23,ease:'easeOut'}}
        drag="y" dragListener={false} dragControls={drag}
        dragConstraints={{top:0,bottom:0}} dragElastic={{top:0,bottom:.2}}
        onDragEnd={(_,info)=>{if(window.innerWidth<640&&(info.offset.y>80||info.velocity.y>650))onClose();}}
       >
        <button className="mx-auto mt-3 flex h-6 w-24 touch-none items-center justify-center sm:hidden" aria-label="Zavřít okno nebo táhnout dolů" onPointerDown={e=>drag.start(e)} onClick={onClose}>
         <span className="h-1 w-10 rounded-full bg-white/20"/>
        </button>
        <div className="flex shrink-0 items-center justify-between border-b border-white/[.07] px-5 py-4 sm:px-7">
         <div>
          <Dialog.Title className="text-sm font-medium tracking-wide">{title}</Dialog.Title>
          <Dialog.Description className={description?'mt-1 text-[11px] text-muted-foreground':'sr-only'}>
           {description||'Detail a ovládání skladu. Okno zavřeš klávesou Escape nebo tlačítkem zavřít.'}
          </Dialog.Description>
         </div>
         <Dialog.Close className="icon-button ml-3" aria-label="Zavřít okno"><X size={19}/></Dialog.Close>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-6 sm:px-7">{children}</div>
       </motion.div>
      </Dialog.Content>
     </div>
    </motion.div>}
   </AnimatePresence>
  </Dialog.Portal>
 </Dialog.Root>;
}

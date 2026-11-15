import { Cpu, Radio, Cable, Zap, Box, Wrench, Monitor, CircuitBoard, Disc3 } from 'lucide-react';
import { Category } from '@/lib/inventory';
export function PartVisual({category,large=false}:{category:Category;large?:boolean}) {
 const Icon={MCU:Cpu,senzor:Radio,displej:Monitor,napájení:Zap,pasivní:Disc3,kabeláž:Cable,krabičky:Box,nářadí:Wrench,ostatní:CircuitBoard}[category];
 return <div className={`part-visual category-${category==='MCU'?'mcu':category==='senzor'?'sensor':category==='napájení'?'power':'other'} ${large?'h-40 w-full':'h-16 w-16 shrink-0'}`}><div className="visual-grid"/><Icon size={large?70:29} strokeWidth={1.3} className="relative"/>{large&&<><span className="absolute left-5 top-4 font-mono text-[10px] tracking-widest opacity-60">COMPONENT / 01</span><span className="absolute bottom-4 right-5 font-mono text-[10px] opacity-60">READY TO BUILD</span></>}</div>;
}

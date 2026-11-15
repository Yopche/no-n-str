import { Cpu, Radio, Cable, Zap, Box, Wrench, Monitor, CircuitBoard, Disc3 } from 'lucide-react';
import { Category } from '@/lib/inventory';
export function PartVisual({category,large=false}:{category:Category;large?:boolean}) {
 const Icon={MCU:Cpu,senzor:Radio,displej:Monitor,napájení:Zap,pasivní:Disc3,kabeláž:Cable,krabičky:Box,nářadí:Wrench,ostatní:CircuitBoard}[category];
 return <div className={`part-visual category-${category==='MCU'?'mcu':category==='senzor'?'sensor':category==='napájení'?'power':'other'} ${large?'h-40 w-full':'h-16 w-16 shrink-0'}`}><div className="visual-grid"/><Icon size={large?64:29} strokeWidth={1.3} className="relative"/>{large&&<><span className="absolute left-4 top-4 font-mono text-[8px] tracking-wider">SOUČÁSTKA</span><span className="absolute bottom-4 right-4 font-mono text-[8px]">TVÁ DÍLNA</span></>}</div>;
}

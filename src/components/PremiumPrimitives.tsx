import { ReactNode, useEffect, useState } from 'react';
import { animate, motion, useReducedMotion } from 'framer-motion';
import { CircuitBoard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
export function CountUp({value}:{value:number}){
 const [display,setDisplay]=useState(value);const reduced=useReducedMotion();
 useEffect(()=>{if(reduced){setDisplay(value);return;}const controls=animate(0,value,{duration:.85,ease:'easeOut',onUpdate:n=>setDisplay(Math.round(n))});return()=>controls.stop();},[value,reduced]);
 return <span aria-label={value.toLocaleString('cs-CZ')}>{display.toLocaleString('cs-CZ')}</span>;
}
export function ProgressRing({percent,size=56}:{percent:number;size?:number}){
 const reduced=useReducedMotion();const r=23,c=2*Math.PI*r;
 return <div className="relative shrink-0" style={{width:size,height:size}} aria-label={`Dostupnost ${percent} %`}><svg viewBox="0 0 56 56" className="h-full w-full -rotate-90"><circle cx="28" cy="28" r={r} fill="none" stroke="var(--chart-track)" strokeWidth="3"/><motion.circle cx="28" cy="28" r={r} fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} initial={reduced?false:{strokeDashoffset:c}} animate={{strokeDashoffset:c*(1-percent/100)}} transition={{duration:reduced?0:.9}}/></svg><span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-primary">{percent}%</span></div>;
}
export function EmptyState({title,description,action}:{title:string;description:string;action?:ReactNode}){
 return <div className="py-9 text-center"><div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[22px] border border-primary/20 bg-primary/5 text-primary"><CircuitBoard size={38} strokeWidth={1}/></div><h3 className="text-base font-medium">{title}</h3><p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-muted-foreground">{description}</p>{action&&<div className="mt-5">{action}</div>}</div>;
}
export function DashboardSkeleton(){return <div role="status" aria-label="Načítání přehledu" className="space-y-6"><Skeleton className="h-10 w-56 rounded-xl bg-white/5"/><div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[0,1,2,3].map(i=><Skeleton key={i} className="h-36 rounded-[20px] bg-white/5"/>)}</div><div className="grid gap-5 xl:grid-cols-2"><Skeleton className="h-80 rounded-[20px] bg-white/5"/><Skeleton className="h-80 rounded-[20px] bg-white/5"/></div><Skeleton className="h-64 rounded-[20px] bg-white/5"/></div>;}

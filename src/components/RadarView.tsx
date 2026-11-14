import { useEffect, useRef, useState } from 'react';
import { Blip, Telemetry } from '@/lib/radar-types';
import { ScanLine, ShieldAlert } from 'lucide-react';
const point = (angle: number, radius: number) => ({ x: 360 - Math.cos(angle * Math.PI / 180) * radius, y: 336 - Math.sin(angle * Math.PI / 180) * radius });
export function RadarView({ telemetry, blips, baseline, mapReady, alive }: { telemetry: Telemetry; blips: Blip[]; baseline: { angle: number; distance: number }[]; mapReady: boolean; alive: boolean }) {
  const [angle, setAngle] = useState(telemetry.angle);
  const target = useRef(telemetry.angle);
  const current = useRef(telemetry.angle);
  useEffect(() => { target.current = telemetry.angle; }, [telemetry.angle]);
  useEffect(() => { let id: number; const animate = () => { current.current += (target.current - current.current) * .17; setAngle(current.current); id = requestAnimationFrame(animate); }; id = requestAnimationFrame(animate); return () => cancelAnimationFrame(id); }, []);
  const end = point(angle, 282);
  const tail = point(Math.max(0, angle - 22), 282);
  return <div className="relative px-2 pt-3 sm:px-7">
    <div className="absolute left-5 top-7 z-10 hidden text-[10px] font-mono leading-5 text-slate-500 sm:block">SENZOR / HLK-LD2410<br />ROZSAH / 400 CM</div>
    <svg viewBox="0 0 720 390" className="mx-auto w-full max-w-[830px]" role="img" aria-label={`Radarový snímek, úhel ${Math.round(angle)} stupňů`}>
      <defs><filter id="radar-glow"><feGaussianBlur stdDeviation="4" /></filter><pattern id="radar-dots" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="#203544" /></pattern><clipPath id="radar-field"><path d="M 78 336 A 282 282 0 0 1 642 336 Z" /></clipPath></defs>
      <path d="M 78 336 A 282 282 0 0 1 642 336 Z" fill="#0b1720" />
      <rect x="78" y="50" width="564" height="286" fill="url(#radar-dots)" clipPath="url(#radar-field)" opacity=".6" />
      {[70.5, 141, 211.5, 282].map((r, i) => <g key={r}><path d={`M ${360-r} 336 A ${r} ${r} 0 0 1 ${360+r} 336`} fill="none" stroke="#21434b" strokeWidth="1" /><text x="369" y={332-r} fill="#59808a" fontSize="9" fontFamily="monospace">{(i+1)*100} cm</text></g>)}
      {[0,30,60,90,120,150,180].map(a => { const p = point(a, 282); const label = point(a, 306); return <g key={a}><line x1="360" y1="336" x2={p.x} y2={p.y} stroke="#17333c" strokeDasharray={a === 90 ? '4 6' : 'none'} /><text x={label.x} y={label.y+4} textAnchor="middle" fill="#69808f" fontSize="10" fontFamily="monospace">{a}°</text></g>; })}
      {Array.from({ length: 61 }, (_, i) => { const a = i*3; const p = point(a, 287); const q = point(a, i%5===0 ? 296 : 291); return <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={i%5===0 ? '#547d88' : '#284553'} />; })}
      {mapReady && !telemetry.hide_static && alive && <g opacity=".65">{baseline.map((b, i) => { const p = point(b.angle, Math.min(b.distance,400)/400*282); return <rect key={i} x={p.x} y={p.y} width="3" height="3" rx="1" fill="#6a8290" />; })}</g>}
      {alive && <><path d={`M 360 336 L ${end.x} ${end.y} A 282 282 0 0 0 ${tail.x} ${tail.y} Z`} fill="#00f0ff" opacity=".075" /><line x1="360" y1="336" x2={end.x} y2={end.y} stroke="#00f0ff" strokeWidth="2" filter="url(#radar-glow)" /><line x1="360" y1="336" x2={end.x} y2={end.y} stroke="#43f5ed" strokeWidth="1.4" /></>}
      {alive && blips.filter(b => b.moving || !telemetry.hide_static).map((b, i) => { const p = point(b.angle, Math.min(b.distance,400)/400*282); const opacity = Math.max(.12, 1-(Date.now()-b.time)/9000); return <g key={i} opacity={opacity}><circle cx={p.x} cy={p.y} r={b.moving ? 5 : 3} fill={b.moving ? '#00f0ff' : '#ffb800'} filter="url(#radar-glow)" /><circle cx={p.x} cy={p.y} r="2.3" fill={b.moving ? '#83ffef' : '#ffcf66'} /></g>; })}
      {alive && blips.length>0 && (() => { const b = blips[blips.length-1]; const p = point(b.angle, Math.min(b.distance,400)/400*282); return <g><circle cx={p.x} cy={p.y} r="11" stroke="#00f0ff" fill="none" opacity=".5" /><path d={`M ${p.x+16} ${p.y-3} h 22 l 7 -7 h 44`} stroke="#396a74" fill="none" /><text x={p.x+47} y={p.y-16} fill="#7ce8e8" fontSize="10" fontFamily="monospace">{Math.round(b.distance)} cm</text></g>; })()}
      {telemetry.laser && alive && <line x1="360" y1="336" x2={telemetry.laser_mode === 'barrier' ? 120 : end.x} y2={telemetry.laser_mode === 'barrier' ? 165 : end.y} stroke="#ff2a55" strokeWidth="1.5" strokeDasharray={telemetry.barrier_broken ? '7 7' : 'none'} />}
      <line x1="70" y1="336" x2="650" y2="336" stroke="#2b6570" /><circle cx="360" cy="336" r="6" fill="#00f0ff" /><circle cx="360" cy="336" r="13" fill="none" stroke="#00f0ff" opacity=".3" />
      <text x="360" y="365" textAnchor="middle" fill="#86a1ac" fontSize="10" fontFamily="monospace">ESP32 · POČÁTEK SKENOVÁNÍ</text>
    </svg>
    {!alive && <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0e1520]/75"><ScanLine size={36} className="mb-3 text-amber-400" /><span className="text-sm font-medium">Čekání na telemetrii zařízení</span><span className="mt-2 text-xs text-muted-foreground">Neaktuální data se nezobrazují.</span></div>}
    {telemetry.barrier_broken && alive && <div className="absolute right-5 top-6 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"><ShieldAlert size={17} className="animate-pulse" />Závora přerušena</div>}
    {telemetry.calibration === 'running' && <div className="absolute left-1/2 top-7 -translate-x-1/2 rounded-full border border-primary/30 bg-[#0d232c] px-4 py-2 text-xs text-primary">Mapování prostředí · 2 průchody</div>}
  </div>;
}

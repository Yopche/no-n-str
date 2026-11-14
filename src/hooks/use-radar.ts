import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionProvider';
import { Blip, Detection, emptyTelemetry, LaserMode, Sample, Telemetry } from '@/lib/radar-types';

function validTelemetry(input: unknown): input is Telemetry {
  if (!input || typeof input !== 'object') return false;
  const d = input as Telemetry;
  return ['angle', 'distance', 'radar_distance', 'motion_energy', 'static_energy', 'light'].every(k => Number.isFinite((d as unknown as Record<string, number>)[k]))
    && d.angle >= 0 && d.angle <= 180 && d.distance >= 0 && d.distance <= 600 && d.radar_distance >= 0 && d.radar_distance <= 600
    && d.light >= 0 && d.light <= 100 && d.motion_energy >= 0 && d.motion_energy <= 100 && d.static_energy >= 0 && d.static_energy <= 100
    && ['quiet', 'motion', 'person'].includes(d.presence) && ['off', 'manual', 'auto', 'barrier'].includes(d.laser_mode)
    && (d.room_map === undefined || (Array.isArray(d.room_map) && d.room_map.length <= 181 && d.room_map.every(p => p && Number.isFinite(p.angle) && p.angle >= 0 && p.angle <= 180 && Number.isFinite(p.distance) && p.distance >= 0 && p.distance <= 600)))
    && ['idle', 'running', 'done'].includes(d.calibration) && ['laser', 'paused', 'hide_static', 'barrier_broken'].every(k => typeof (d as unknown as Record<string, unknown>)[k] === 'boolean');
}
const demoMap = Array.from({ length: 42 }, (_, i) => ({ angle: 8 + i * 4, distance: (233 + Math.sin(i * .38) * 18) / 282 * 400 }));
const initialEvents: Detection[] = [
  { id: 'demo-1', kind: 'motion', angle: 64, distance: 182, laser_triggered: false, motion_energy: 76, static_energy: 24, created_at: new Date(Date.now() - 32000).toISOString() },
  { id: 'demo-2', kind: 'presence', angle: 118, distance: 246, laser_triggered: false, motion_energy: 14, static_energy: 68, created_at: new Date(Date.now() - 96000).toISOString() },
  { id: 'demo-3', kind: 'calibration', angle: 180, distance: 400, laser_triggered: false, motion_energy: 0, static_energy: 0, created_at: new Date(Date.now() - 240000).toISOString() },
];
export function useRadar() {
  const { session, household } = useSession();
  const [demo, setDemo] = useState(true);
  const [telemetry, setTelemetry] = useState<Telemetry>({ ...emptyTelemetry, angle: 64, distance: 182, radar_distance: 214, light: 72, motion_energy: 76, static_energy: 24, presence: 'motion' });
  const [events, setEvents] = useState<Detection[]>(initialEvents);
  const [blips, setBlips] = useState<Blip[]>([{ angle: 64, distance: 182, time: Date.now(), moving: true }, { angle: 118, distance: 246, time: Date.now(), moving: false }]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [connected, setConnected] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [lastReceived, setLastReceived] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [pending, setPending] = useState('');
  const [mapReady, setMapReady] = useState(true);
  const [baseline, setBaseline] = useState(demoMap);
  const teleRef = useRef(telemetry);
  const tick = useRef(0);
  const lastSample = useRef(0);
  const lastDemoEvent = useRef(0);
  const calibrationStarted = useRef(0);
  const manualUntil = useRef(0);
  const pendingId = useRef('');
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const alive = online && (demo || (connected && now - lastReceived < 5000 && !!session && !!household));
  useEffect(() => { teleRef.current = telemetry; }, [telemetry]);
  useEffect(() => {
    const up = () => setOnline(true); const down = () => setOnline(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => { clearInterval(timer); window.removeEventListener('online', up); window.removeEventListener('offline', down); clearTimeout(pendingTimer.current); };
  }, []);
  const ingest = useCallback((d: Telemetry) => {
    setTelemetry(d); setLastReceived(Date.now());
    if (d.room_map) setBaseline(d.room_map);
    else if (d.calibration === 'running') setBaseline(prev => [...prev.filter(p => Math.abs(p.angle - d.angle) > 2), { angle: d.angle, distance: d.distance }]);
    if (d.calibration === 'done') setMapReady(true);
    setBlips(prev => [...prev.filter(b => Date.now() - b.time < 9000), ...(d.presence !== 'quiet' ? [{ angle: d.angle, distance: d.distance, moving: d.presence === 'motion', time: Date.now() }] : [])].slice(-140));
    if (Date.now() - lastSample.current > 800) {
      lastSample.current = Date.now();
      setSamples(prev => [...prev, { time: new Date().toLocaleTimeString('cs-CZ', { minute: '2-digit', second: '2-digit' }), distance: d.distance, motion: d.motion_energy, static: d.static_energy, light: d.light }].slice(-40));
    }
  }, []);
  const addDemoEvent = useCallback((kind: Detection['kind'], d: Telemetry) => {
    setEvents(prev => [{ id: crypto.randomUUID(), kind, angle: Math.round(d.angle), distance: Math.round(d.distance), laser_triggered: d.laser, motion_energy: Math.round(d.motion_energy), static_energy: Math.round(d.static_energy), created_at: new Date().toISOString() }, ...prev].slice(0, 60));
  }, []);
  useEffect(() => {
    if (!demo || !online) return;
    const timer = setInterval(() => {
      tick.current++;
      const t = tick.current / 15;
      let old = teleRef.current;
      if (old.laser_mode !== 'off' && Date.now() >= manualUntil.current) {
        old = { ...old, laser_mode: 'off', laser: false, barrier_broken: false };
        teleRef.current = old; setTelemetry(old);
        toast.info('Bezpečnostní časový limit laseru vypršel.');
      }
      if (old.paused) return;
      const phase = (t * 19) % 360;
      const angle = phase <= 180 ? phase : 360 - phase;
      const movingAngle = 65 + Math.sin(t * .28) * 12;
      const moving = Math.abs(angle - movingAngle) < 15;
      const person = Math.abs(angle - 118) < 10;
      const barrier = old.laser_mode === 'barrier' && tick.current % 240 < 22;
      const d: Telemetry = { ...old, angle, distance: moving ? 175 + Math.sin(t) * 22 : person ? 242 + Math.sin(t * .8) * 5 : 320 + 38 * Math.sin(angle * Math.PI / 180), radar_distance: moving ? 209 + Math.sin(t) * 18 : person ? 248 : 0,
        motion_energy: moving ? 65 + Math.sin(t * 2) * 15 : 3 + Math.abs(Math.sin(t)) * 5, static_energy: person ? 72 : 22 + Math.sin(t) * 4, light: 72 + Math.sin(t * .1) * 4, presence: moving ? 'motion' : person ? 'person' : 'quiet', barrier_broken: barrier,
        laser: old.laser_mode === 'manual' ? Date.now() < manualUntil.current : old.laser_mode === 'auto' ? moving : old.laser_mode === 'barrier', latency_ms: 12 + Math.round(Math.abs(Math.sin(t)) * 7) };
      if (calibrationStarted.current && Date.now() - calibrationStarted.current > 19000) { d.calibration = 'done'; calibrationStarted.current = 0; setMapReady(true); setBaseline(demoMap); addDemoEvent('calibration', d); toast.success('Prostředí je zkalibrováno. Mapa překážek je připravená.'); }
      if (d.presence !== 'quiet' && d.presence !== old.presence && d.calibration !== 'running' && Date.now() - lastDemoEvent.current > 4000) {
        addDemoEvent(d.presence === 'motion' ? 'motion' : 'presence', d); lastDemoEvent.current = Date.now();
      }
      if (barrier && !old.barrier_broken) { addDemoEvent('barrier', d); toast.warning('Světelná závora byla přerušena.'); }
      teleRef.current = d; ingest(d);
    }, 66);
    return () => clearInterval(timer);
  }, [demo, online, ingest, addDemoEvent]);
  useEffect(() => {
    if (demo || !session || !household || !online) { setConnected(false); return; }
    let active = true;
    const channel = supabase.channel(`radar_live:${household.id}`, { config: { private: true } })
      .on('broadcast', { event: 'telemetry' }, ({ payload }) => { if (active && validTelemetry(payload)) ingest(payload); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'radar_events', filter: `household_id=eq.${household.id}` }, ({ new: event }) => {
        if (active) setEvents(prev => [event as Detection, ...prev.filter(e => e.id !== event.id)].slice(0, 60));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'radar_commands', filter: `household_id=eq.${household.id}` }, ({ new: command }) => {
        if (!active || command.id !== pendingId.current || command.status === 'pending') return;
        clearTimeout(pendingTimer.current); pendingId.current = ''; setPending('');
        if (command.status === 'acknowledged') {
          toast.success('Zařízení potvrdilo příkaz.');
          if (command.command === 'clear_map') { setMapReady(false); setBaseline([]); setBlips([]); }
        } else toast.error('Zařízení příkaz odmítlo.');
      })
      .subscribe(status => { if (active) setConnected(status === 'SUBSCRIBED'); });
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [demo, household?.id, session?.user.id, online, ingest]);
  useEffect(() => {
    if (demo || !alive || !household) return;
    let active = true;
    supabase.from('radar_events').select('*').eq('household_id', household.id).order('created_at', { ascending: false }).limit(60).then(({ data, error }) => {
      if (!active) return;
      if (error) toast.error('Historii detekcí nelze načíst.');
      else setEvents(prev => [...(data || []) as Detection[], ...prev.filter(e => !data?.some(row => row.id === e.id))].sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0,60));
    });
    return () => { active = false; };
  }, [demo, alive, household?.id]);
  useEffect(() => { if (!alive) { teleRef.current = emptyTelemetry; setTelemetry(emptyTelemetry); setBlips([]); setSamples([]); setEvents([]); setBaseline([]); setMapReady(false); } }, [alive]);
  const changeMode = (isDemo: boolean) => {
    clearTimeout(pendingTimer.current); pendingId.current = ''; setPending('');
    calibrationStarted.current = 0; manualUntil.current = 0;
    teleRef.current = { ...emptyTelemetry, light: isDemo ? 72 : 0 };
    setTelemetry(teleRef.current); setEvents(isDemo ? initialEvents : []); setSamples([]); setBlips([]); setLastReceived(0); setMapReady(isDemo); setBaseline(isDemo ? demoMap : []); setDemo(isDemo);
  };
  const send = async (command: string, payload: Record<string, unknown> = {}) => {
    const emergencyOff = command === 'laser_mode' && payload.mode === 'off';
    if (!alive || (pending && !emergencyOff)) { toast.error('Vyčkejte na živé spojení nebo potvrzení předchozího příkazu.'); return; }
    if (emergencyOff) { clearTimeout(pendingTimer.current); pendingId.current = ''; }
    if (demo) {
      const d = { ...teleRef.current };
      if (command === 'pause') { d.paused = true; d.laser_mode = 'off'; d.laser = false; d.barrier_broken = false; }
      if (command === 'resume') d.paused = false;
      if (command === 'hide_static') d.hide_static = !!payload.enabled;
      if (command === 'laser_mode') { d.laser_mode = payload.mode as LaserMode; d.laser = d.laser_mode === 'manual' || d.laser_mode === 'barrier'; d.barrier_broken = false; manualUntil.current = Date.now() + (d.laser_mode === 'manual' ? 5000 : 30000); }
      if (command === 'clear_map') { setMapReady(false); setBaseline([]); setBlips([]); }
      if (command === 'calibrate') { setBaseline([]); setMapReady(false); d.calibration = 'running'; d.paused = false; d.laser_mode = 'off'; d.laser = false; tick.current = 0; calibrationStarted.current = Date.now(); }
      teleRef.current = d; setTelemetry(d); toast.success(command === 'calibrate' ? 'Kalibrace spuštěna. Proběhnou dva průchody prostoru.' : 'Nastavení simulátoru bylo změněno.'); return;
    }
    if (!session || !household) return;
    setPending('Odesílání příkazu…');
    const { data, error } = await supabase.from('radar_commands').insert({ household_id: household.id, user_id: session.user.id, command, payload, expires_at: new Date(Date.now() + 30000).toISOString() }).select('id').single();
    if (error || !data) { setPending(''); toast.error('Příkaz se nepodařilo odeslat. Zkontrolujte připojení a oprávnění.'); return; }
    pendingId.current = data.id; setPending('Čeká se na potvrzení ESP32');
    pendingTimer.current = setTimeout(() => { pendingId.current = ''; setPending(''); toast.error('Zařízení nepotvrdilo příkaz do 30 sekund. Stav se nezměnil.'); }, 30000);
  };
  return { demo, changeMode, telemetry, events, blips, samples, alive, online, pending, mapReady, baseline, send, addDemoEvent: () => addDemoEvent('barrier', { ...telemetry, barrier_broken: true }) };
}

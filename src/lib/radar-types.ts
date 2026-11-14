export type LaserMode = 'off' | 'manual' | 'auto' | 'barrier';
export type Telemetry = {
  angle: number; distance: number; radar_distance: number; motion_energy: number;
  static_energy: number; light: number; laser: boolean; presence: 'quiet' | 'motion' | 'person';
  paused: boolean; hide_static: boolean; laser_mode: LaserMode; barrier_broken: boolean;
  calibration: 'idle' | 'running' | 'done'; latency_ms?: number;
  room_map?: { angle: number; distance: number }[];
};
export type Detection = { id: string; kind: 'motion' | 'presence' | 'barrier' | 'calibration'; angle: number; distance: number; laser_triggered: boolean; motion_energy: number; static_energy: number; created_at: string };
export type Blip = { angle: number; distance: number; time: number; moving: boolean };
export type Sample = { time: string; distance: number; motion: number; static: number; light: number };
export const eventLabel = { motion: 'Pohyb v prostoru', presence: 'Přítomnost osoby', barrier: 'Přerušení světelné závory', calibration: 'Kalibrace dokončena' };
export const laserLabel: Record<LaserMode, string> = { off: 'Vypnuto', manual: 'Manuální test', auto: 'Auto-zaměření', barrier: 'Světelná závora' };
let lastHaptic = 0;
export const haptic = () => { if (navigator.vibrate && Date.now() - lastHaptic > 50) { navigator.vibrate(15); lastHaptic = Date.now(); } };
export const formatTime = (date: string) => new Date(date).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
export const emptyTelemetry: Telemetry = { angle: 90, distance: 0, radar_distance: 0, motion_energy: 0, static_energy: 0, light: 0, laser: false, presence: 'quiet', paused: false, hide_static: false, laser_mode: 'off', barrier_broken: false, calibration: 'idle' };

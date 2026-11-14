import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0';
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const reply = (status: number, message: string) => new Response(JSON.stringify({ zprava: message }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const uuid = (v: unknown) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const number = (v: unknown, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return reply(405, 'Použijte požadavek POST.');
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return reply(401, 'Přihlášení je nutné.');
  const url = Deno.env.get('SUPABASE_URL')!;
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: { user }, error: authFailure } = await caller.auth.getUser(authHeader.slice(7));
  if (authFailure || !user) { console.warn('[radar-ingest] Přihlášení zařízení nebylo ověřeno.'); return reply(401, 'Přihlášení není platné.'); }
  try {
    if (Number(req.headers.get('content-length')) > 12000) return reply(413, 'Požadavek je příliš velký.');
    const raw = await req.text();
    if (raw.length > 12000) return reply(413, 'Požadavek je příliš velký.');
    let body;
    try { body = JSON.parse(raw); } catch { return reply(400, 'Neplatná data JSON.'); }
    if (!body || !uuid(body.household_id)) return reply(400, 'Chybí platná domácnost.');
    const { data: member, error: membershipFailure } = await caller.from('radar_members').select('user_id').eq('household_id', body.household_id).eq('user_id', user.id).maybeSingle();
    if (membershipFailure || !member) return reply(403, 'Zařízení nemá přístup k této domácnosti.');
    const d = body.telemetry;
    if (d && (!number(d.angle,180) || !number(d.distance,600) || !number(d.radar_distance,600) || !number(d.motion_energy,100) || !number(d.static_energy,100) || !number(d.light,100)
      || !['quiet','motion','person'].includes(d.presence) || !['off','manual','auto','barrier'].includes(d.laser_mode) || !['idle','running','done'].includes(d.calibration)
      || !['laser','paused','hide_static','barrier_broken'].every(k => typeof d[k] === 'boolean') || (d.latency_ms !== undefined && !number(d.latency_ms,60000)))) return reply(400, 'Telemetrie neodpovídá datovému kontraktu.');
    if (d?.room_map !== undefined && (!Array.isArray(d.room_map) || d.room_map.length > 181 || !d.room_map.every((p: { angle: unknown; distance: unknown }) => p && number(p.angle,180) && number(p.distance,600)))) return reply(400, 'Mapa prostředí není platná.');
    const event = body.event;
    if (event && (!['motion','presence','barrier','calibration'].includes(event.kind) || !number(event.angle,180) || !number(event.distance,600) || typeof event.laser_triggered !== 'boolean' || !number(event.motion_energy,100) || !number(event.static_energy,100))) return reply(400, 'Událost není platná.');
    const ack = body.ack;
    if (ack && (!uuid(ack.id) || !['acknowledged','failed'].includes(ack.status))) return reply(400, 'Potvrzení příkazu není platné.');
    if (!d && !event && !ack) return reply(400, 'Požadavek neobsahuje telemetrii, událost ani potvrzení.');
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    if (ack) {
      const { data, error } = await admin.from('radar_commands').update({ status: ack.status, acknowledged_at: new Date().toISOString() }).eq('id', ack.id).eq('household_id', body.household_id).eq('status','pending').gt('expires_at',new Date().toISOString()).select('id');
      if (error) throw error;
      if (!data?.length) return reply(409, 'Příkaz vypršel nebo již byl potvrzen.');
      console.info('[radar-ingest] Příkaz zařízení byl potvrzen.', { household: body.household_id, status: ack.status });
    }
    if (event) {
      const { error } = await admin.from('radar_events').insert({ household_id: body.household_id, kind: event.kind, angle: event.angle, distance: event.distance, laser_triggered: event.laser_triggered, motion_energy: event.motion_energy, static_energy: event.static_energy });
      if (error) throw error;
      console.info('[radar-ingest] Detekční událost byla uložena.', { household: body.household_id, kind: event.kind });
    }
    if (d) {
      const channel = admin.channel(`radar_live:${body.household_id}`, { config: { private: true } });
      const result = await channel.send({ type: 'broadcast', event: 'telemetry', payload: { angle: d.angle, distance: d.distance, radar_distance: d.radar_distance, motion_energy: d.motion_energy, static_energy: d.static_energy, light: d.light, laser: d.laser, presence: d.presence, paused: d.paused, hide_static: d.hide_static, laser_mode: d.laser_mode, barrier_broken: d.barrier_broken, calibration: d.calibration, ...(d.room_map !== undefined ? { room_map: d.room_map.map((p: { angle: number; distance: number }) => ({ angle: p.angle, distance: p.distance })) } : {}), ...(d.latency_ms !== undefined ? { latency_ms: d.latency_ms } : {}) } });
      await admin.removeChannel(channel);
      if (result !== 'ok') throw new Error('Přenos telemetrie selhal.');
    }
    return reply(200, 'Data byla přijata.');
  } catch { console.error('[radar-ingest] Zpracování požadavku selhalo.'); return reply(500, 'Požadavek se nepodařilo zpracovat.'); }
});

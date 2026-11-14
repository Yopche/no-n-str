-- Noční Stráž: tabulky, oprávnění a Realtime pro projekt homeradar.
-- Skript lze spustit opakovaně. Existující tabulku radar_sweeps nemění.
BEGIN;

CREATE TABLE IF NOT EXISTS public.radar_households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Moje domácnost',
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.radar_members (
  household_id uuid NOT NULL REFERENCES public.radar_households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY(household_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.radar_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.radar_households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  command text NOT NULL CHECK(command IN ('pause','resume','calibrate','clear_map','hide_static','laser_mode')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','acknowledged','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now()+interval '30 seconds',
  acknowledged_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.radar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.radar_households(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN ('motion','presence','barrier','calibration')),
  angle double precision NOT NULL CHECK(angle BETWEEN 0 AND 180),
  distance double precision NOT NULL CHECK(distance BETWEEN 0 AND 600),
  laser_triggered boolean NOT NULL DEFAULT false,
  motion_energy double precision NOT NULL DEFAULT 0,
  static_energy double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.radar_households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS radar_events_recent ON public.radar_events(household_id,created_at DESC);
CREATE INDEX IF NOT EXISTS radar_commands_pending ON public.radar_commands(household_id,status,created_at);

CREATE OR REPLACE FUNCTION public.radar_is_member(household uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS(SELECT 1 FROM public.radar_members WHERE household_id=household AND user_id=auth.uid()) $$;

CREATE OR REPLACE FUNCTION public.radar_create_household(house_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE result uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Přihlášení je nutné'; END IF;
  IF length(trim(house_name)) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'Název musí mít 1 až 80 znaků'; END IF;
  INSERT INTO public.radar_households(name,owner_id) VALUES(trim(house_name),auth.uid()) RETURNING id INTO result;
  INSERT INTO public.radar_members(household_id,user_id) VALUES(result,auth.uid());
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.radar_join_household(code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE result uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Přihlášení je nutné'; END IF;
  SELECT id INTO result FROM public.radar_households WHERE invite_code=trim(code);
  IF result IS NULL THEN RAISE EXCEPTION 'Pozvánka není platná'; END IF;
  INSERT INTO public.radar_members(household_id,user_id) VALUES(result,auth.uid()) ON CONFLICT DO NOTHING;
  RETURN result;
END $$;

REVOKE ALL ON public.radar_households,public.radar_members,public.radar_commands,public.radar_events FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.radar_households,public.radar_members,public.radar_commands,public.radar_events TO service_role;
GRANT SELECT ON public.radar_households,public.radar_members,public.radar_events TO authenticated;
GRANT SELECT,INSERT ON public.radar_commands TO authenticated;
REVOKE ALL ON FUNCTION public.radar_is_member(uuid),public.radar_create_household(text),public.radar_join_household(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.radar_is_member(uuid),public.radar_create_household(text),public.radar_join_household(text) TO authenticated;

DROP POLICY IF EXISTS radar_household_read ON public.radar_households;
CREATE POLICY radar_household_read ON public.radar_households FOR SELECT TO authenticated USING(public.radar_is_member(id));
DROP POLICY IF EXISTS radar_members_read ON public.radar_members;
CREATE POLICY radar_members_read ON public.radar_members FOR SELECT TO authenticated USING(public.radar_is_member(household_id));
DROP POLICY IF EXISTS radar_commands_read ON public.radar_commands;
CREATE POLICY radar_commands_read ON public.radar_commands FOR SELECT TO authenticated USING(public.radar_is_member(household_id));
DROP POLICY IF EXISTS radar_commands_send ON public.radar_commands;
CREATE POLICY radar_commands_send ON public.radar_commands FOR INSERT TO authenticated
WITH CHECK(public.radar_is_member(household_id) AND user_id=auth.uid() AND status='pending' AND acknowledged_at IS NULL AND expires_at>now() AND expires_at<=now()+interval '1 minute');
DROP POLICY IF EXISTS radar_events_read ON public.radar_events;
CREATE POLICY radar_events_read ON public.radar_events FOR SELECT TO authenticated USING(public.radar_is_member(household_id));

-- Klient může telemetrii číst, ale nesmí ji sám vysílat.
DROP POLICY IF EXISTS radar_broadcast_read ON realtime.messages;
CREATE POLICY radar_broadcast_read ON realtime.messages FOR SELECT TO authenticated
USING(EXISTS(SELECT 1 FROM public.radar_members m WHERE m.user_id=auth.uid() AND realtime.topic()='radar_live:'||m.household_id::text));

DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='radar_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.radar_events;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='radar_commands') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.radar_commands;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.radar_commands'::regclass AND conname='radar_command_payload') THEN
    ALTER TABLE public.radar_commands ADD CONSTRAINT radar_command_payload CHECK(
      jsonb_typeof(payload)='object' AND COALESCE(CASE command
        WHEN 'hide_static' THEN jsonb_typeof(payload->'enabled')='boolean'
        WHEN 'laser_mode' THEN payload->>'mode' IN ('off','manual','auto','barrier') AND (
          payload->>'mode'='off' OR (jsonb_typeof(payload->'timeout_ms')='number'
          AND (payload->>'timeout_ms')::numeric>0
          AND (payload->>'timeout_ms')::numeric<=CASE WHEN payload->>'mode'='manual' THEN 5000 ELSE 30000 END))
        ELSE payload='{}'::jsonb END,false)
    );
  END IF;
END $$;
COMMIT;

-- Referenční rozšíření původního schématu. V připojeném projektu již aplikováno.
-- Není automatická migrace. Neupravuje ani nemaže stávající díly a projekty.
CREATE TABLE public.inventory_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 part_id uuid NOT NULL,
 part_name text NOT NULL,
 unit text NOT NULL,
 action text NOT NULL CHECK(action IN ('added','updated','removed')),
 old_quantity integer,
 new_quantity integer,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON public.inventory_events FROM authenticated;
GRANT SELECT ON public.inventory_events TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.inventory_events TO service_role;
REVOKE ALL ON public.inventory_events FROM anon;
ALTER TABLE public.inventory_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY inventory_events_read ON public.inventory_events
 FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE INDEX inventory_events_owner_time ON public.inventory_events(user_id,created_at DESC);
CREATE INDEX inventory_events_part ON public.inventory_events(part_id,created_at);

CREATE OR REPLACE FUNCTION public.record_inventory_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  INSERT INTO public.inventory_events(user_id,part_id,part_name,unit,action,new_quantity)
  VALUES(NEW.user_id,NEW.id,NEW.name,NEW.unit,'added',NEW.quantity);
  RETURN NEW;
 ELSIF TG_OP='DELETE' THEN
  -- Při kaskádovém smazání účtu už není kam historii zapisovat.
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=OLD.user_id) THEN RETURN OLD; END IF;
  INSERT INTO public.inventory_events(user_id,part_id,part_name,unit,action,old_quantity)
  VALUES(OLD.user_id,OLD.id,OLD.name,OLD.unit,'removed',OLD.quantity);
  RETURN OLD;
 ELSE
  IF OLD.user_id<>NEW.user_id THEN RAISE EXCEPTION 'Owner cannot change'; END IF;
  IF ROW(OLD.name,OLD.category,OLD.quantity,OLD.unit,OLD.specs,OLD.location,OLD.notes)
   IS DISTINCT FROM ROW(NEW.name,NEW.category,NEW.quantity,NEW.unit,NEW.specs,NEW.location,NEW.notes) THEN
   INSERT INTO public.inventory_events(user_id,part_id,part_name,unit,action,old_quantity,new_quantity)
   VALUES(NEW.user_id,NEW.id,NEW.name,NEW.unit,'updated',OLD.quantity,NEW.quantity);
  END IF;
  RETURN NEW;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.record_inventory_event() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER inventory_change AFTER INSERT OR UPDATE OR DELETE ON public.parts
 FOR EACH ROW EXECUTE FUNCTION public.record_inventory_event();

-- Referenční SQL schéma Skladu součástek. Není to migrační soubor.
-- V připojeném projektu bylo již aplikováno. Neprováděj znovu na existujících tabulkách.
CREATE TABLE public.parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK(length(trim(name)) > 0),
  category text NOT NULL CHECK(category IN ('MCU','senzor','displej','napájení','pasivní','kabeláž','krabičky','nářadí','ostatní')),
  quantity integer NOT NULL DEFAULT 0 CHECK(quantity >= 0),
  unit text NOT NULL DEFAULT 'ks', specs text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,user_id)
);
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK(length(trim(name)) > 0), description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,user_id)
);
CREATE TABLE public.project_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL, part_id uuid,
  free_name text NOT NULL CHECK(length(trim(free_name)) > 0),
  qty_needed integer NOT NULL CHECK(qty_needed > 0), optional boolean NOT NULL DEFAULT false,
  FOREIGN KEY(project_id,user_id) REFERENCES public.projects(id,user_id) ON DELETE CASCADE,
  FOREIGN KEY(part_id,user_id) REFERENCES public.parts(id,user_id) ON DELETE SET NULL (part_id)
);
CREATE TABLE public.inventory_setup (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.parts,public.projects,public.project_parts,public.inventory_setup TO authenticated,service_role;
REVOKE ALL ON public.parts,public.projects,public.project_parts,public.inventory_setup FROM anon;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_setup ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_parts ON public.parts FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE POLICY own_projects ON public.projects FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE POLICY own_project_parts ON public.project_parts FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE POLICY own_inventory_setup ON public.inventory_setup FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE INDEX parts_owner ON public.parts(user_id);
CREATE INDEX projects_owner ON public.projects(user_id);
CREATE INDEX project_parts_project ON public.project_parts(project_id);

CREATE OR REPLACE FUNCTION public.adjust_part_quantity(part_id_input uuid, delta integer)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE result integer;
BEGIN
  IF delta NOT IN (-1,1) THEN RAISE EXCEPTION 'Invalid delta'; END IF;
  UPDATE public.parts SET quantity=greatest(0,quantity+delta)
  WHERE id=part_id_input AND user_id=auth.uid() RETURNING quantity INTO result;
  IF result IS NULL THEN RAISE EXCEPTION 'Not found'; END IF;
  RETURN result;
END $$;

CREATE OR REPLACE FUNCTION public.save_inventory_project(project_id_input uuid, project_name text, project_description text, items jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE pid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF project_id_input IS NULL THEN
    INSERT INTO public.projects(name,description) VALUES(project_name,project_description) RETURNING id INTO pid;
  ELSE
    UPDATE public.projects SET name=project_name,description=project_description
    WHERE id=project_id_input AND user_id=auth.uid() RETURNING id INTO pid;
    IF pid IS NULL THEN RAISE EXCEPTION 'Not found'; END IF;
    DELETE FROM public.project_parts WHERE project_id=pid;
  END IF;
  INSERT INTO public.project_parts(project_id,part_id,free_name,qty_needed,optional)
  SELECT pid,x.part_id,x.free_name,x.qty_needed,x.optional
  FROM jsonb_to_recordset(items) AS x(part_id uuid,free_name text,qty_needed integer,optional boolean);
  RETURN pid;
END $$;

CREATE OR REPLACE FUNCTION public.initialize_inventory()
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE inserted uuid; pid uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  INSERT INTO public.inventory_setup(user_id) VALUES(auth.uid()) ON CONFLICT DO NOTHING RETURNING user_id INTO inserted;
  IF inserted IS NULL THEN RETURN; END IF;
  INSERT INTO public.parts(name,category,quantity,unit,specs,location) VALUES
  ('ESP32 WROOM 32 (CP2102)','MCU',1,'ks','Wi-Fi / Bluetooth · 3,3 V · USB-C','Krabice A'),
  ('HLK-LD2410 24GHz radar','senzor',1,'ks','24 GHz · UART · 5 V','Krabice A'),
  ('HC-SR04 / RCWL-9610 ultrazvuk','senzor',1,'ks','2–400 cm · 5 V','Krabice A'),
  ('SG90 servo','ostatní',1,'ks','180° · 4,8–6 V','Krabice A'),
  ('Kondenzátor 470µF/35V','pasivní',1,'ks','470 µF · 35 V','Krabice B'),
  ('Breadboard MB-102 830 bodů','ostatní',1,'ks','Nepájivé pole · 830 bodů','Pracovní stůl'),
  ('Breadboard MB-102 400 bodů','ostatní',1,'ks','Nepájivé pole · 400 bodů','Pracovní stůl'),
  ('Breadboard ZY-170','ostatní',1,'ks','Nepájivé pole · 170 bodů','Pracovní stůl'),
  ('Dupont vodiče','kabeláž',1,'sada','Propojovací vodiče M/M, M/F','Krabice B'),
  ('Laser KY-008','ostatní',1,'ks','650 nm · 5 V','Krabice A'),
  ('Fotorezistor LDR 5528','senzor',1,'ks','Světelný senzor','Krabice A'),
  ('Piezo bzučák 12mm 5V','ostatní',1,'ks','12 mm · 5 V','Krabice B'),
  ('Převodník CH340 USB/TTL','kabeláž',1,'ks','USB / UART','Krabice B'),
  ('Napájecí modul MB-102 5V/3.3V','napájení',1,'ks','5 V / 3,3 V','Krabice C'),
  ('Adaptér 9V/2A','napájení',1,'ks','9 V · 2 A','Krabice C'),
  ('Step-down 12-24V→5V/3A','napájení',1,'ks','12–24 V → 5 V · 3 A','Krabice C'),
  ('DC jack 5.5x2.1','kabeláž',1,'ks','5,5 × 2,1 mm','Krabice B'),
  ('I2C level shifter 5V/3.3V','ostatní',1,'ks','Obousměrný · 5 V / 3,3 V','Krabice B'),
  ('Plastová krabička KM85','krabičky',1,'ks','178 × 160 × 85 mm','Police 1'),
  ('Univerzální PCB 7x9 cm','ostatní',1,'ks','70 × 90 mm','Krabice B'),
  ('Lišty pinů','kabeláž',1,'sada','Rozteč 2,54 mm','Krabice B'),
  ('Distanční sloupky M2.5/M3','ostatní',1,'sada','M2,5 / M3','Krabice B'),
  ('Klipy na 9V baterii','napájení',1,'ks','9 V baterie','Krabice C'),
  ('2.8" TFT UNO shield ILI9341','displej',1,'ks','320 × 240 · dotyk · UNO shield','Krabice A');
  INSERT INTO public.projects(name,description) VALUES('Radarový skener','Radar, ultrazvuk a servo pro přehled okolí na dotykovém displeji. Před zapojením ověř kompatibilitu UNO shieldu s ESP32 a úrovně signálů; toto je kusovník, nikoli ověřené schéma.') RETURNING id INTO pid;
  INSERT INTO public.project_parts(project_id,part_id,free_name,qty_needed)
  SELECT pid,id,name,1 FROM public.parts WHERE user_id=auth.uid() AND name IN
  ('ESP32 WROOM 32 (CP2102)','HLK-LD2410 24GHz radar','HC-SR04 / RCWL-9610 ultrazvuk','SG90 servo','Kondenzátor 470µF/35V','Breadboard MB-102 830 bodů','Dupont vodiče','2.8" TFT UNO shield ILI9341');
  INSERT INTO public.project_parts(project_id,free_name,qty_needed) VALUES(pid,'Tranzistor NPN pro bzučák',1);
END $$;
REVOKE ALL ON FUNCTION public.initialize_inventory(),public.save_inventory_project(uuid,text,text,jsonb),public.adjust_part_quantity(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.initialize_inventory(),public.save_inventory_project(uuid,text,text,jsonb),public.adjust_part_quantity(uuid,integer) TO authenticated,service_role;

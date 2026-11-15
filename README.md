# Sklad součástek

Česká mobile-first aplikace pro osobní sklad elektroniky. Tmavá dílna, zelené a jantarové akcenty, názvy dílů v IBM Plex Mono a ovládání připravené pro mobil.

## Technologie a rozsah

React + TypeScript + Vite, React Router, Tailwind, shadcn/ui, Supabase a existující vite-plugin-pwa. Stávající React byl zachován místo Next.js podle potvrzené volby. Nejsou potřeba Claude ani jiné API klíče. Návrhář používá jednoduchá pravidla pro radar/pohyb, ultrazvuk, světlo, teplotu, displej, servo a alarm. U obecného nápadu navrhne pouze základ sestavy a upozorní na omezení.

- Součástky: přidání, úpravy, mazání s potvrzením, kategorie, hledání v názvu/specifikaci/umístění, filtr nízkých zásob, atomické +/-.
- Projekty: CRUD, vlastní kusovník, volné názvy chybějících dílů, volitelné položky, dostupnost a kopírovatelný nákupní seznam.
- Návrhy používají pouze existující skladové ID. Neexistující nebo vyčerpané díly jsou oddělené jako „Nutno dokoupit“.
- Import/export CSV v UTF-8; import před potvrzením ukazuje náhled.
- Soukromá data každého účtu. Veřejná ukázka je statická a pouze pro čtení, nikdy nečte soukromé tabulky.

## První použití

1. Otevři aplikaci. Bez účtu se zobrazí české přihlášení.
2. Vyber vytvoření účtu, zadej e-mail a heslo. Pokud je zapnuté potvrzování e-mailu, otevři doručený odkaz.
3. Po prvním přihlášení se automaticky a v jedné transakci vytvoří 24 zadaných součástek a projekt **Radarový skener** s osmi dostupnými díly a chybějícím NPN tranzistorem.
4. Když chceš aplikaci nejprve prohlédnout, zvol **Prohlédnout ukázkový sklad**. Ukázka dovoluje hledání, detail, export a pravidlové návrhy, ale nepovoluje zápis.

Samostatné profily nejsou potřeba: identitu a e-mail spravuje Supabase Auth. Seznamy sad mají počáteční množství 1 a jednotku „sada“. Seedy se neobnovují po smazání dílů: inicializaci hlídá `inventory_setup`.

## Supabase – nastavení

Připojený projekt: `frdobdhcioftjdaxfpgf`. Schéma již bylo aplikováno přímo do databáze. Referenční SQL je v [docs/inventory-schema.sql](docs/inventory-schema.sql); není to automatická migrace a nemá se znovu spouštět na již existujících tabulkách.

1. V Supabase **Authentication → Providers → Email** ověř povolení e-mailu, hesla a registrace.
2. V **Authentication → URL Configuration → Redirect URLs** povol absolutní adresy této aplikace zakončené `/auth/callback` a `/reset-password`, a to pro preview i produkční doménu. Například `https://tvoje-domena.cz/auth/callback` a `https://tvoje-domena.cz/reset-password`. Nepoužívej tuto ukázkovou doménu jako skutečné nastavení.
3. U běžného localhost preview povol jeho skutečný origin a oba callbacky. App-specific preview adresy spravuje Dyad. Pro opravu redirectů nepřepisuj Site URL na localhost; aplikace vždy předává aktuální origin.
4. Vlastní e-mailové šablony musí používat požadované `RedirectTo`, ne pevně nastavenou doménu.
5. Použij veřejný publishable/anon klíč. Nikdy nevkládej `service_role` do klienta.

Klient je v `src/integrations/supabase/client.ts`; má výchozí veřejnou konfiguraci připojeného projektu. Pokud projekt již obsahuje vlastní platnou dvojici připojení z předchozí aplikace nebo `VITE_SUPABASE_URL` a veřejný klíč v konfiguraci prostředí, klient je použije. V takovém projektu musí být stejné skladové schéma.

### Ochrana dat

Všechny čtyři tabulky mají zapnuté RLS. `authenticated` má explicitní CRUD granty, ale smí pracovat jen s řádky `user_id = auth.uid()`. `anon` nemá práva. Složené cizí klíče v kusovníku zabraňují propojení s dílem nebo projektem jiného uživatele. `service_role` má serverová práva, ale aplikace jej nepoužívá. Funkce jsou `SECURITY INVOKER` a nemají veřejná execute práva.

### Datový model

- `parts`: id, user_id, name, category, quantity, unit, specs, location, notes, created_at.
- `projects`: id, user_id, name, description, created_at.
- `project_parts`: id, user_id, project_id, nullable part_id, free_name, qty_needed, optional.
- `inventory_setup`: user_id, created_at — jednorázové naplnění účtu.

Při smazání dílu se `part_id` v kusovníku vynuluje; `free_name` zůstává pro nákupní seznam. Smazání projektu odstraní jeho kusovník. Dostupnost se počítá **pro jeden projekt**, nikoli jako rezervace mezi všemi projekty. Opakované řádky stejného dílu sdílejí jeho dostupné množství; povinné díly mají přednost před volitelnými. „Chybí X dílů“ znamená počet nevyhovujících povinných řádků kusovníku, nikoli součet kusů. Statistika „Do košíku“ sčítá takové položky přes projekty.

## CSV

Hlavička: `name,category,quantity,unit,specs,location,notes`.

Kategorie: MCU, senzor, displej, napájení, pasivní, kabeláž, krabičky, nářadí, ostatní. Množství je nezáporné celé číslo. Podporují se čárky, escapované uvozovky a víceřádkové poznámky. Export přidává UTF-8 BOM a chrání buňky začínající znaky tabulkových vzorců apostrofem. Import je **přidávací**, nepřepisuje existující díly; opakování vytvoří duplicity. Limit je 2 MB / 2 000 řádků, vložení je jeden databázový požadavek. CSV nepřenáší projekty ani ID, pouze sklad.

## PWA a Android

Manifest a service worker generuje existující VitePWA konfigurace při produkčním sestavení. Ikona je vlastní škálovatelné SVG. Aplikaci publikuj na HTTPS. Na Androidu otevři v Chrome a zvol **Instalovat aplikaci** / **Přidat na plochu**. Pokud prohlížeč nabídne instalační událost, zobrazí se tlačítko také v aplikaci. Instalační výzvu určuje prohlížeč, ne aplikace; uvnitř iframe preview se nemusí objevit.

Service worker cachuje pouze shell aplikace; **Supabase odpovědi ani soukromý sklad necachuje**. Offline stav je viditelný; čtení nových dat a změny vyžadují internet, neexistuje fronta offline zápisů. První načtení musí proběhnout online. Callbacky a obnova hesla nejsou nahrazovány offline navigačním fallbackem.

## Struktura

- `src/App.tsx` — všechny trasy a ochrana přihlášení.
- `src/pages/Index.tsx` — sklad; `InventoryLogin.tsx` — Auth UI/callback/obnova.
- `src/components/InventorySession.tsx` — session bez závislosti na původním radaru.
- `src/components/InventoryProvider.tsx` — data, seed a mutace.
- `StockList`, `PartForm`, `Projects`, `IdeaBuilder` — funkční obrazovky.
- `InventoryLayout`, `PartVisual`, `InventoryLink` — vzhled a navigace.
- `src/lib/inventory.ts` — typy, dostupnost, pravidlový návrhář, CSV a statická ukázka.
- `docs/inventory-schema.sql` — referenční SQL.
- `vite.config.ts` — sestavení a PWA.

Původní radarové moduly a tabulky nejsou používány novými trasami a nebyly destruktivně odstraněny. Sdílený Supabase klient zůstává zachovaný.

## Ověření při nasazení

Sestavení je definováno skriptem `build` v projektu a náhled skriptem `dev`; Dyad spravuje běh náhledu. Produkční hosting musí obsloužit React Router deep links návratem `index.html` (včetně autentizačních tras). Před ostrým použitím ověř registraci a reset e-mailem na skutečné doméně, izolaci dvou účtů, import/export, opakovaný díl v kusovníku a instalaci na fyzickém telefonu.

Návrhy sestav nejsou schémata. Před zapojením ověř napětí, pinout, proudové odběry a kompatibilitu modulů — zvlášť TFT UNO shield versus ESP32. Vyhni se přímému propojení 5V signálu s 3,3V GPIO.

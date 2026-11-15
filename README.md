# Sklad součástek

Česká mobile-first aplikace pro osobní sklad elektroniky. Prémiový **carbon & gold** vzhled: pozadí #0B0D10, zlatá #D4AF37, smaragdové a rubínové stavy, skleněné karty, Inter / Playfair Display a monospace čísla.

## Technologie a rozsah

React + TypeScript + Vite, React Router, Tailwind, shadcn/ui, Supabase, Framer Motion, Recharts a existující vite-plugin-pwa. Stávající React byl zachován místo Next.js podle potvrzené volby. Nejsou potřeba Claude ani jiné API klíče. Návrhář používá jednoduchá pravidla pro radar/pohyb, ultrazvuk, světlo, teplotu, displej, servo a alarm. U obecného nápadu navrhne pouze základ sestavy a upozorní na omezení.

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

Všechny skladové tabulky mají zapnuté RLS. `authenticated` má explicitní CRUD granty pro původní tabulky, ale smí pracovat jen s řádky `user_id = auth.uid()`. Historie `inventory_events` dovoluje uživateli pouze SELECT vlastních záznamů; zápis provádí audit trigger. `anon` nemá práva. Složené cizí klíče v kusovníku zabraňují propojení s dílem nebo projektem jiného uživatele. `service_role` má serverová práva, ale aplikace jej nepoužívá. Klientské funkce jsou `SECURITY INVOKER`; audit je omezená `SECURITY DEFINER` triggerová funkce s prázdným search_path a bez veřejných execute práv.

### Datový model

- `parts`: id, user_id, name, category, quantity, unit, specs, location, notes, created_at.
- `projects`: id, user_id, name, description, created_at.
- `project_parts`: id, user_id, project_id, nullable part_id, free_name, qty_needed, optional.
- `inventory_setup`: user_id, created_at — jednorázové naplnění účtu.
- `inventory_events`: id, user_id, part_id, part_name, unit, action, old_quantity, new_quantity, created_at — skutečné změny od zavedení historie.

Při smazání dílu se `part_id` v kusovníku vynuluje; `free_name` zůstává pro nákupní seznam. Smazání projektu odstraní jeho kusovník. Dostupnost se počítá **pro jeden projekt**, nikoli jako rezervace mezi všemi projekty. Opakované řádky stejného dílu sdílejí jeho dostupné množství; povinné díly mají přednost před volitelnými. „Chybí X dílů“ znamená počet nevyhovujících povinných řádků kusovníku, nikoli součet kusů. Statistika „Do košíku“ sčítá takové položky přes projekty.

## CSV

Hlavička: `name,category,quantity,unit,specs,location,notes`.

Kategorie: MCU, senzor, displej, napájení, pasivní, kabeláž, krabičky, nářadí, ostatní. Množství je nezáporné celé číslo. Podporují se čárky, escapované uvozovky a víceřádkové poznámky. Export přidává UTF-8 BOM a chrání buňky začínající znaky tabulkových vzorců apostrofem. Import je **přidávací**, nepřepisuje existující díly; opakování vytvoří duplicity. Limit je 2 MB / 2 000 řádků, vložení je jeden databázový požadavek. CSV nepřenáší projekty ani ID, pouze sklad.

## PWA a Android

Manifest a service worker generuje existující VitePWA konfigurace při produkčním sestavení. Ikona je vlastní škálovatelné SVG. Aplikaci publikuj na HTTPS. Na Androidu otevři v Chrome a zvol **Instalovat aplikaci** / **Přidat na plochu**. Pokud prohlížeč nabídne instalační událost, zobrazí se tlačítko také v aplikaci. Instalační výzvu určuje prohlížeč, ne aplikace; uvnitř iframe preview se nemusí objevit.

Service worker cachuje pouze shell aplikace; **Supabase odpovědi ani soukromý sklad necachuje**. Offline stav je viditelný; čtení nových dat a změny vyžadují internet, neexistuje fronta offline zápisů. První načtení musí proběhnout online. Callbacky a obnova hesla nejsou nahrazovány offline navigačním fallbackem.

## Dashboard, popupy a historie

Úvodní `/` je dashboard; sklad je na `/sklad`. Veřejná ukázka má stejné přehledy pod `/ukazka`. KPI zahrnují druhy, součet evidovaných jednotek (sady se počítají jako jednotky), nízký stav 0–1 a připravené projekty. Zlaté kruhy počítají dostupné povinné kusy / potřebné povinné kusy, ne počet řádků. Prázdný kusovník není připraven ke stavbě; volitelné díly stavbě nebrání.

Detail dílu/projektu a návrhář jsou modály; formuláře mobilní bottom sheet / desktopový drawer. Okna mají focus trap, Esc, kliknutí mimo a mobilní tažení dolů za horní madlo. Ctrl/Cmd+K otevírá vyhledávání dílů, projektů a rychlých akcí. Sklad má přepínač mřížka / kompaktní tabulka; širší tabulka se na mobilu posouvá vodorovně. Animace respektují `prefers-reduced-motion`.

Audit se zapisuje atomicky triggerem při změně tabulky `parts`, včetně importu a +/-; uživatel nemůže historii falšovat. Historie zůstává po smazání dílu a mizí až s účtem. Existující díly a projekty nebyly přepsány. Starší historii zpětně nevytváříme. Referenční rozšíření je v [docs/inventory-history.sql](docs/inventory-history.sql) a v připojeném projektu už bylo aplikováno. Demo nezobrazuje soukromou ani vymyšlenou historii.

Ověření auditu proběhlo transakčním testem dvou dočasných účtů: vložení, zvýšení množství, ochrana cizího dílu/historie a zachování historie při smazání dílu. Všechny testovací řádky byly vráceny zpět.

## Struktura

- `src/App.tsx` — všechny trasy a ochrana přihlášení.
- `src/pages/Index.tsx` — dashboard; `InventoryLogin.tsx` — Auth UI/callback/obnova.
- `InventoryDashboard`, `DashboardCharts`, `PremiumPrimitives` — KPI, grafy a skeletony.
- `InventorySession`, `InventoryProvider` — session, data, seed a mutace.
- `StockList`, `PartDetail`, `PartForm`, `Projects`, `ProjectForm`, `IdeaBuilder` — funkční obrazovky.
- `PremiumModal`, `InventoryPopup`, `InventoryCommand` — modály, drawery a hledání.
- `InventoryLayout`, `PartVisual`, `InventoryLink`, `QuantityControl` — vzhled a ovládání.
- `src/lib/inventory.ts` — typy, dostupnost, pravidlový návrhář, CSV a statická ukázka.
- `src/lib/inventory-dashboard.ts` — historie, KPI a nákupní seznam.
- `docs/inventory-schema.sql`, `docs/inventory-history.sql` — referenční SQL mimo automatické migrace.
- `vite.config.ts` — sestavení a PWA.

Původní radarové moduly a tabulky nejsou používány novými trasami a nebyly destruktivně odstraněny. Sdílený Supabase klient zůstává zachovaný.

## Ověření při nasazení

Sestavení je definováno skriptem `build` v projektu a náhled skriptem `dev`; Dyad spravuje běh náhledu. Produkční hosting musí obsloužit React Router deep links návratem `index.html` (včetně autentizačních tras). Před ostrým použitím ověř registraci a reset e-mailem na skutečné doméně, izolaci dvou účtů, import/export, opakovaný díl v kusovníku a instalaci na fyzickém telefonu.

Návrhy sestav nejsou schémata. Před zapojením ověř napětí, pinout, proudové odběry a kompatibilitu modulů — zvlášť TFT UNO shield versus ESP32. Vyhni se přímému propojení 5V signálu s 3,3V GPIO.

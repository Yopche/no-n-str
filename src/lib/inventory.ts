export const categories = ['MCU', 'senzor', 'displej', 'napájení', 'pasivní', 'kabeláž', 'krabičky', 'nářadí', 'ostatní'] as const;
export type Category = typeof categories[number];
export type Part = { id: string; name: string; category: Category; quantity: number; unit: string; specs: string; location: string; notes: string; created_at?: string };
export type Need = { id?: string; project_id?: string; part_id: string | null; free_name: string; qty_needed: number; optional: boolean };
export type Project = { id: string; name: string; description: string };
export const emptyPart = { name: '', category: 'MCU' as Category, quantity: 1, unit: 'ks', specs: '', location: '', notes: '' };
const examples: [string, Category, string, string][] = [
 ['ESP32 WROOM 32 (CP2102)','MCU','Wi-Fi / Bluetooth · 3,3 V · USB','Krabice A'],
 ['HLK-LD2410 24GHz radar','senzor','24 GHz · UART · 5 V','Krabice A'],
 ['HC-SR04 / RCWL-9610 ultrazvuk','senzor','2–400 cm · 5 V','Krabice A'],
 ['SG90 servo','ostatní','180° · 4,8–6 V','Krabice A'],
 ['Kondenzátor 470µF/35V','pasivní','470 µF · 35 V','Krabice B'],
 ['Breadboard MB-102 830 bodů','ostatní','830 bodů','Pracovní stůl'],
 ['Breadboard MB-102 400 bodů','ostatní','400 bodů','Pracovní stůl'],
 ['Breadboard ZY-170','ostatní','170 bodů','Pracovní stůl'],
 ['Dupont vodiče','kabeláž','M/M · M/F','Krabice B'],
 ['Laser KY-008','ostatní','650 nm · 5 V','Krabice A'],
 ['Fotorezistor LDR 5528','senzor','Světelný senzor','Krabice A'],
 ['Piezo bzučák 12mm 5V','ostatní','12 mm · 5 V','Krabice B'],
 ['Převodník CH340 USB/TTL','kabeláž','USB / UART','Krabice B'],
 ['Napájecí modul MB-102 5V/3.3V','napájení','5 V / 3,3 V','Krabice C'],
 ['Adaptér 9V/2A','napájení','9 V · 2 A','Krabice C'],
 ['Step-down 12-24V→5V/3A','napájení','12–24 V → 5 V · 3 A','Krabice C'],
 ['DC jack 5.5x2.1','kabeláž','5,5 × 2,1 mm','Krabice B'],
 ['I2C level shifter 5V/3.3V','ostatní','5 V / 3,3 V','Krabice B'],
 ['Plastová krabička KM85','krabičky','178 × 160 × 85 mm','Police 1'],
 ['Univerzální PCB 7x9 cm','ostatní','70 × 90 mm','Krabice B'],
 ['Lišty pinů','kabeláž','2,54 mm','Krabice B'],
 ['Distanční sloupky M2.5/M3','ostatní','M2,5 / M3','Krabice B'],
 ['Klipy na 9V baterii','napájení','9 V','Krabice C'],
 ['2.8" TFT UNO shield ILI9341','displej','320 × 240 · dotyk','Krabice A'],
];
export const demoParts: Part[] = examples.map(([name,category,specs,location],i) => ({ id: `demo-${i}`,name,category,specs,location,quantity:1,unit:[8,20,21].includes(i)?'sada':'ks',notes:'' }));
export const demoProject: Project = { id:'demo-project', name:'Radarový skener',description:'Přehled okolí pomocí radaru, ultrazvuku a serva na dotykovém displeji. Ověř kompatibilitu TFT UNO shieldu s ESP32 a napěťové úrovně před zapojením.' };
export const demoNeeds: Need[] = [...[0,1,2,3,4,5,8,23].map(i => ({project_id:demoProject.id,part_id:demoParts[i].id,free_name:demoParts[i].name,qty_needed:1,optional:false})),{ project_id:demoProject.id,part_id:null,free_name:'Tranzistor NPN pro bzučák',qty_needed:1,optional:false }];

export function availability(needs: Need[], parts: Part[]) {
 // Stejný díl může být v kusovníku vícekrát. Povinné položky mají přednost.
 const remaining = new Map(parts.map(p => [p.id,p.quantity]));
 const rows = needs.map((n,index) => ({...n,index,available:0,missing:0}));
 for (const row of [...rows].sort((a,b) => Number(a.optional)-Number(b.optional))) {
   row.available = row.part_id ? Math.min(remaining.get(row.part_id)||0,row.qty_needed) : 0;
   row.missing = row.qty_needed-row.available;
   if(row.part_id) remaining.set(row.part_id,(remaining.get(row.part_id)||0)-row.available);
 }
 return rows;
}

export function suggestProject(idea: string, parts: Part[]): {name:string;description:string;needs:Need[]} {
 const text = idea.toLocaleLowerCase('cs');
 const needs: Need[] = [];
 const pick = (pattern: RegExp, missing: string) => {
   const part = parts.filter(p => pattern.test(p.name)).sort((a,b) => b.quantity-a.quantity)[0];
   if (part && needs.some(n => n.part_id===part.id)) return;
   needs.push({part_id:part?.id||null,free_name:part?.name||missing,qty_needed:1,optional:false});
 };
 pick(/esp32|arduino|stm32|raspberry/i,'Mikrokontrolér');
 if (/pohyb|radar|detektor|alarm|skener/.test(text)) pick(/ld2410|pir|radar/i,'Senzor pohybu');
 if (/vzdálen|ultrazvuk|skener|parkov/.test(text)) pick(/hc-sr04|rcwl-9610/i,'Ultrazvukový senzor');
 if (/svět|svetl|laser/.test(text)) pick(/ldr|fotorezistor/i,'Světelný senzor');
 if (/laser/.test(text)) pick(/ky-008|laser/i,'Laserový modul');
 if (/teplot|vlhk/.test(text)) pick(/dht|bme|ds18b20/i,'Senzor teploty / vlhkosti');
 if (/displej|obrazov|skener/.test(text)) pick(/tft|oled|lcd|ili9341/i,'Displej');
 if (/servo|otáč|otac|skener/.test(text)) pick(/sg90|servo/i,'Servomotor');
 if (/alarm|bzuč|zvuk/.test(text)) {pick(/piezo|bzuč/i,'Bzučák');pick(/npn|2n2222|bc547/i,'Tranzistor NPN pro bzučák');}
 pick(/breadboard/i,'Nepájivé pole'); pick(/dupont/i,'Propojovací vodiče'); pick(/napájecí modul/i,'Napájecí modul 3,3 V / 5 V');
 return {name:idea.trim(),description:'Pravidlový návrh ze skutečného skladu, nikoli ověřené zapojení. Ověř napájení, pinout a rozhraní modulů (zejména TFT UNO shield / ESP32). U obecného nápadu je návrh pouze základ sestavy; upřesni senzor nebo výstup.',needs};
}

const csvFields = ['name','category','quantity','unit','specs','location','notes'] as const;
export function exportCsv(parts: Part[]) {
 const quote = (value: unknown) => `"${String(value).replace(/^[=+@-]/,"'$&").replace(/"/g,'""')}"`;
 const csv = '\uFEFF'+[csvFields.join(','),...parts.map(p => csvFields.map(f => quote(p[f])).join(','))].join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='sklad-soucastek.csv';a.click();URL.revokeObjectURL(url);
}
export function parseCsv(text: string) {
 // CSV parser podporuje uvozovky, čárky i víceřádkové poznámky.
 const rows:string[][]=[];let row:string[]=[],value='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++) {const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(value);value='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(value);if(row.some(Boolean))rows.push(row);row=[];value='';}else value+=c;}
 if(quoted)throw new Error('Neuzavřené uvozovky v CSV.');
 row.push(value);if(row.some(Boolean))rows.push(row);
 const header=rows.shift()||[];
 if(!csvFields.every(f=>header.includes(f)))throw new Error('CSV musí obsahovat sloupce: '+csvFields.join(', '));
 if(rows.length>2000)throw new Error('Importuj nejvýše 2 000 řádků najednou.');
 return rows.map((r,i) => {
 const get=(f:string)=>r[header.indexOf(f)]||'';
 const quantity=Number(get('quantity')); const category=get('category') as Category;
 if(!get('name').trim()||!get('unit').trim()||!get('quantity').trim()||!Number.isSafeInteger(quantity)||quantity<0||quantity>2147483647||!categories.includes(category))throw new Error(`Neplatný název, kategorie, jednotka nebo množství na řádku ${i+2}.`);
 return {name:get('name').trim(),category,quantity,unit:get('unit'),specs:get('specs'),location:get('location'),notes:get('notes')};
 });
}

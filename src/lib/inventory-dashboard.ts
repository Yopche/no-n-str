import { availability, Need, Part, Project } from './inventory';
export type InventoryEvent = {id:string;part_id:string;part_name:string;unit:string;action:'added'|'updated'|'removed';old_quantity:number|null;new_quantity:number|null;created_at:string};
export const chartColors=['#D4AF37','#10B981','#7C96D7','#C98564','#A68ACE','#6EB3BC','#B6BD78','#CF7E98','#7A879B'];
export function projectStatus(project:Project,needs:Need[],parts:Part[]){
 const rows=availability(needs.filter(n=>n.project_id===project.id),parts);
 const required=rows.filter(n=>!n.optional);
 const total=required.reduce((sum,n)=>sum+n.qty_needed,0);
 const available=required.reduce((sum,n)=>sum+n.available,0);
 return {project,rows,percent:total?Math.round(available/total*100):rows.length?100:0,ready:rows.length>0&&required.every(n=>n.missing===0),missing:required.filter(n=>n.missing>0)};
}
export function shoppingList(projects:Project[],needs:Need[],parts:Part[]){
 // Projekty nerezervují zásoby. Každý deficit uvádíme s kontextem projektu.
 return projects.flatMap(project=>projectStatus(project,needs,parts).missing.map(n=>({name:parts.find(p=>p.id===n.part_id)?.name||n.free_name,quantity:n.missing,unit:parts.find(p=>p.id===n.part_id)?.unit||'ks',project:project.name})));
}
export function eventLabel(event:InventoryEvent){
 if(event.action==='added')return 'Díl přidán';
 if(event.action==='removed')return 'Díl smazán';
 const delta=(event.new_quantity||0)-(event.old_quantity||0);
 return delta>0?'Kusy přidány':delta<0?'Kusy odebrány':'Díl upraven';
}
export const dateTime=(value:string)=>new Date(value).toLocaleString('cs-CZ',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});

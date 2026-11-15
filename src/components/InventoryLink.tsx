import { forwardRef } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { useInventory } from './InventoryProvider';
// Ukázka má vlastní veřejné trasy; žádný odkaz nesmí přepnout do cizích dat.
export const InventoryLink=forwardRef<HTMLAnchorElement,LinkProps>((props,ref)=>{
 const {demo}=useInventory();let to=props.to;
 if(demo&&typeof to==='string'&&(to.startsWith('/dily/')||to.startsWith('/projekty/')||to==='/napad'))to=to.endsWith('/upravit')||to.endsWith('/novy')?'/prihlaseni':`/ukazka${to}`;
 return <Link {...props} to={to} ref={ref}/>;
});
InventoryLink.displayName='InventoryLink';

import { forwardRef } from 'react';
import { Link, LinkProps, useLocation } from 'react-router-dom';
import { useInventory } from './InventoryProvider';
export const InventoryLink=forwardRef<HTMLAnchorElement,LinkProps>((props,ref)=>{
 const {demo}=useInventory();const location=useLocation();let to=props.to;
 if(demo&&typeof to==='string'&&(to.startsWith('/dily/')||to.startsWith('/projekty')||to==='/napad'||to==='/sklad'))to=to.endsWith('/upravit')||to.endsWith('/novy')?'/prihlaseni':`/ukazka${to}`;
 const overlay=typeof to==='string'&&(to.includes('/dily/')||/\/projekty\/[^/]+/.test(to)||to.endsWith('/napad'));
 const returnTo=(location.state as {returnTo?:string}|null)?.returnTo||location.pathname;
 return <Link {...props} to={to} state={overlay?{...props.state,returnTo}:props.state} ref={ref}/>;
});
InventoryLink.displayName='InventoryLink';

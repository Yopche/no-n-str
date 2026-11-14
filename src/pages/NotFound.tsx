import { Link } from 'react-router-dom';
import { Radar } from 'lucide-react';
export default function NotFound() {
  return <main className="flex min-h-dvh items-center justify-center p-5"><div className="panel max-w-sm p-9 text-center"><Radar size={45} className="mx-auto mb-6 text-primary" /><p className="mb-3 font-mono text-sm text-muted-foreground">404</p><h1 className="text-2xl font-semibold">Mimo dosah radaru</h1><p className="mb-7 mt-3 text-sm text-muted-foreground">Tato stránka neexistuje. Vraťte se do bezpečí hlavního přehledu.</p><Link className="primary-button" to="/">Zpět na radar</Link></div></main>;
}

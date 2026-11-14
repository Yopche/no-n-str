import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://frdobdhcioftjdaxfpgf.supabase.co';
const PROJECT_KEY = 'sb_publishable_ei91a2yM60MptbWLekjIOA_trM9fKmZ';

function projectUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') return undefined;
    return url.origin;
  } catch { return undefined; }
}

function publicKey(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const key = value.trim();
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return key;
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return undefined;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload?.role === 'anon') return key;
  } catch { return undefined; }
  return undefined;
}

export const DEFAULT_URL = projectUrl(import.meta.env.VITE_SUPABASE_URL) || PROJECT_URL;
export const DEFAULT_KEY = publicKey(import.meta.env.VITE_SUPABASE_ANON_KEY)
  || publicKey(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY)
  || PROJECT_KEY;

export const storedConnection = (): { url?: string; key?: string } => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('ns-connection') || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    const connection = saved as Record<string, unknown>;
    const url = projectUrl(connection.url);
    const key = publicKey(connection.key);
    // Uživatelské připojení používáme pouze jako platnou dvojici.
    return url && key ? { url, key } : {};
  } catch { return {}; }
};

const saved = storedConnection();
export const supabase = createClient(saved.url || DEFAULT_URL, saved.key || DEFAULT_KEY);

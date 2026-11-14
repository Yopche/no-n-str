import { createClient } from '@supabase/supabase-js';

export const DEFAULT_URL = 'https://frdobdhcioftjdaxfpgf.supabase.co';
export const DEFAULT_KEY = 'sb_publishable_ei91a2yM60MptbWLekjIOA_trM9fKmZ';
export const storedConnection = () => {
  try { return JSON.parse(localStorage.getItem('ns-connection') || '{}') as { url?: string; key?: string }; }
  catch { return {}; }
};
const saved = storedConnection();
export const supabase = createClient(saved.url || DEFAULT_URL, saved.key || DEFAULT_KEY);

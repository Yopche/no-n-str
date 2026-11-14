import { AuthApiError } from '@supabase/supabase-js';
export function authError(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (error.status === 429) return 'Příliš mnoho pokusů. Zkuste to za chvíli.';
    if (error.code === 'invalid_credentials') return 'E-mail nebo heslo není správné.';
    if (error.code === 'email_not_confirmed') return 'Nejprve potvrďte e-mailovou adresu.';
    if (error.code === 'weak_password') return 'Použijte silnější heslo s alespoň 8 znaky.';
  }
  return 'Požadavek se nepodařilo dokončit. Zkontrolujte připojení a zkuste to znovu.';
}

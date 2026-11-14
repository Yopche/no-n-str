import { AuthApiError } from '@supabase/supabase-js';
export function authError(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (error.status === 429) return 'Příliš mnoho pokusů. Zkuste to za chvíli.';
    if (error.code === 'invalid_credentials') return 'E-mail nebo heslo není správné.';
    if (error.code === 'email_not_confirmed') return 'Nejprve potvrďte e-mailovou adresu.';
    if (error.code === 'weak_password') return 'Použijte silnější heslo s alespoň 8 znaky.';
    if (error.code === 'user_already_exists' || error.code === 'email_exists') return 'Pro tento e-mail už existuje účet. Přihlaste se nebo obnovte heslo.';
    if (error.code === 'email_address_invalid') return 'Zadejte platnou e-mailovou adresu.';
    if (error.code === 'signup_disabled') return 'Registrace je nyní vypnutá. Obraťte se na správce domácnosti.';
    if (error.code === 'same_password') return 'Nové heslo musí být jiné než původní.';
    if (error.code === 'otp_expired') return 'Odkaz vypršel. Vyžádejte si nový odkaz pro obnovu hesla.';
  }
  return 'Požadavek se nepodařilo dokončit. Zkontrolujte připojení a zkuste to znovu.';
}

import { useEffect, useRef } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';
import { haptic } from '@/lib/radar-types';

export function CzechAuth() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Auth UI předává serverové chyby bez lokalizace; překládáme jen jeho chybové prvky.
    const translate = () => root.current?.querySelectorAll('span[color="danger"]').forEach(element => {
      const original = element.textContent || '';
      if (!/[a-z]/i.test(original) || /[ěščřžýáíéůú]/i.test(original)) return;
      const translated = /invalid.*credentials|invalid login/i.test(original) ? 'E-mail nebo heslo není správné.'
        : /email not confirmed/i.test(original) ? 'Nejprve potvrďte e-mailovou adresu.'
        : /rate limit|too many|seconds/i.test(original) ? 'Příliš mnoho pokusů. Zkuste to za chvíli.'
        : /password/i.test(original) ? 'Heslo nesplňuje požadavky. Použijte alespoň 8 znaků.'
        : /already.*registered/i.test(original) ? 'Tento e-mail je již zaregistrovaný.'
        : 'Přihlášení se nepodařilo dokončit. Zkontrolujte údaje a připojení.';
      if (original !== translated) element.textContent = translated;
      element.setAttribute('role', 'alert');
    });
    const observer = new MutationObserver(translate);
    if (root.current) observer.observe(root.current, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);
  return <div ref={root} onClick={e => { if ((e.target as HTMLElement).closest('button,a')) haptic(); }}><Auth
    supabaseClient={supabase} providers={[]} theme="dark"
    redirectTo={new URL('/auth/callback', window.location.origin).href}
    appearance={{ theme: ThemeSupa, variables: { default: {
      colors: { brand: '#00f0ff', brandAccent: '#69f7ff', brandButtonText: '#07141b', inputBackground: '#090f19', inputText: '#edf4f8', inputBorder: '#263343', inputLabelText: '#afbbc9', messageText: '#b4c7d5', anchorTextColor: '#00f0ff' },
      radii: { borderRadiusButton: '12px', inputBorderRadius: '12px' },
      fonts: { bodyFontFamily: 'inherit', buttonFontFamily: 'inherit', inputFontFamily: 'inherit', labelFontFamily: 'inherit' }
    } } }}
    localization={{ variables: {
      sign_in: { email_label: 'E-mail', password_label: 'Heslo', email_input_placeholder: 'vas@email.cz', password_input_placeholder: 'Vaše heslo', button_label: 'Přihlásit se', loading_button_label: 'Přihlašování…', link_text: 'Už máte účet? Přihlaste se.' },
      sign_up: { email_label: 'E-mail', password_label: 'Heslo', email_input_placeholder: 'vas@email.cz', password_input_placeholder: 'Zvolte bezpečné heslo', button_label: 'Vytvořit účet', loading_button_label: 'Vytváření účtu…', link_text: 'Nemáte účet? Zaregistrujte se.', confirmation_text: 'Zkontrolujte svůj e-mail a potvrďte vytvoření účtu.' },
      forgotten_password: { email_label: 'E-mail', email_input_placeholder: 'vas@email.cz', button_label: 'Odeslat odkaz pro obnovu', loading_button_label: 'Odesílání…', link_text: 'Zapomenuté heslo?', confirmation_text: 'Odkaz pro obnovu hesla jsme odeslali na váš e-mail.' },
      magic_link: { email_input_label: 'E-mail', email_input_placeholder: 'vas@email.cz', button_label: 'Odeslat přihlašovací odkaz', loading_button_label: 'Odesílání…', link_text: 'Přihlásit se odkazem', confirmation_text: 'Přihlašovací odkaz byl odeslán.', empty_email_address: 'Zadejte e-mailovou adresu.' },
      update_password: { password_label: 'Nové heslo', password_input_placeholder: 'Zvolte nové heslo', button_label: 'Změnit heslo', loading_button_label: 'Ukládání…', confirmation_text: 'Heslo bylo změněno.' },
      verify_otp: { email_input_label: 'E-mail', email_input_placeholder: 'vas@email.cz', phone_input_label: 'Telefon', phone_input_placeholder: 'Vaše telefonní číslo', token_input_label: 'Ověřovací kód', token_input_placeholder: 'Kód ze zprávy', button_label: 'Ověřit kód', loading_button_label: 'Ověřování…' }
    } }}
  /></div>;
}

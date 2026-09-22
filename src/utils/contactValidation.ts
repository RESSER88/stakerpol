/**
 * Minimalna walidacja danych kontaktu w formularzach panelu.
 * Puste pole jest zawsze dozwolone; istniejące dane w bazie nie są ruszane.
 */

/** Telefon: min. 9 cyfr, tylko cyfry i znaki formatujące (+, spacje, nawiasy, myślniki). */
export const isValidPhone = (value: string): boolean => {
  const v = value.trim();
  if (!v) return true;
  if (!/^[+0-9\s()./-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
};

export const phoneError = (value: string): string | null =>
  isValidPhone(value)
    ? null
    : 'Podaj prawidłowy numer (min. 9 cyfr) albo zostaw pole puste.';

export const isValidEmail = (value: string): boolean => {
  const v = value.trim();
  if (!v) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
};

export const emailError = (value: string): string | null =>
  isValidEmail(value) ? null : 'Podaj prawidłowy adres e-mail albo zostaw pole puste.';

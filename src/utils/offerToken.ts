import { SITE_URL, ROUTES } from '@/config/routes';

/** Alfabet bez znaków mylących: brak l, I, O oraz 0 i 1. */
export const SUFFIX_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
export const SUFFIX_LENGTH = 6;
export const MAX_TOKEN_ATTEMPTS = 5;

export const DIACRITICS: Record<string, string> = {
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
};

/** Sprowadza opis do bezpiecznej podstawy tokenu (max 20 znaków). */
export const slugifyLabel = (raw: string): string => {
  const base = raw
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (ch) => DIACRITICS[ch] ?? ch)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20)
    .replace(/-$/, '');
  return base || 'oferta';
};

/** Losowy przyrostek z CSPRNG. */
export const randomSuffix = (): string => {
  const bytes = new Uint8Array(SUFFIX_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => SUFFIX_ALPHABET[b % SUFFIX_ALPHABET.length]).join('');
};

export const buildToken = (label: string): string => `${slugifyLabel(label)}-${randomSuffix()}`;

export const buildUrl = (token: string) =>
  `${SITE_URL}${ROUTES.sharedOffer.replace(':token', token)}`;

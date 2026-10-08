// Tworzenie i kontrola slugów produktów (tylko frontend).

/** Slug z nazwy i numeru seryjnego. Polskie znaki zamieniane na łacińskie (także ł→l). */
export const toSlug = (name: string, serial?: string): string => {
  const base = (name || '').toString()
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // usuń diakrytyki
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  const sn = (serial || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  return sn ? `${base}-${sn}` : base;
};

/** Czy slug kończy się na „-{numer seryjny}” (bez rozróżniania wielkości liter). */
export const slugMatchesSerial = (slug?: string | null, serial?: string | null): boolean => {
  const s = (slug || '').trim().toLowerCase();
  const sn = (serial || '').trim().toLowerCase();
  if (!s || !sn) return true; // brak danych — nie ostrzegamy
  return s.endsWith(`-${sn}`);
};

export const SLUG_MISMATCH_HINT = 'Adres karty nie zawiera aktualnego numeru seryjnego';

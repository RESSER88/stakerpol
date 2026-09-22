/** Wspólne etykiety kontaktu i aktywności — jedna mapa dla całego panelu. */

/** contacts.krok — etap sprzedażowy kontaktu (nie dotyczy oferty). */
export const KROK_LABELS: Record<string, string> = {
  nowy: 'Nowy',
  oferta: 'Oferta',
  oddzwonic: 'Oddzwonić',
  porownuje: 'Porównuje',
  cena: 'Cena',
  nieaktualne: 'Nieaktualne',
};

export const KROK_OPTIONS = Object.entries(KROK_LABELS).map(([value, label]) => ({ value, label }));

export const krokLabel = (krok: string | null | undefined): string =>
  (krok && KROK_LABELS[krok]) || krok || '—';

/** contact_activities.typ */
export const TYP_LABELS: Record<string, string> = {
  telefon: 'Rozmowa',
  formularz: 'Zgłoszenie z WWW',
  oferta: 'Oferta',
  sprzedaz: 'Sprzedaż',
  cofniecie_sprzedazy: 'Cofnięcie sprzedaży',
  ukrycie: 'Ukrycie',
  notatka: 'Notatka',
};

export const typLabel = (typ: string): string => TYP_LABELS[typ] ?? typ;

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });

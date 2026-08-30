/** Wspólna logika wyszukiwania kontaktu: osoba, telefon, e-mail — dopasowanie częściowe. */
export interface ContactSearchFields {
  osoba?: string | null;
  firma?: string | null;
  telefon?: string | null;
  email?: string | null;
}

export const normalizeQuery = (query: string) => query.trim().toLowerCase();

export const matchesContactQuery = (c: ContactSearchFields, query: string): boolean => {
  const q = normalizeQuery(query);
  if (!q) return true;
  return [c.osoba, c.firma, c.telefon, c.email].some((v) => (v ?? '').toLowerCase().includes(q));
};

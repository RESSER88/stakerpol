export type AdminSection = 'start' | 'products' | 'offers' | 'export' | 'contacts' | 'seo' | 'faq';

export interface AdminSectionItem {
  id: AdminSection;
  label: string;
}

/** Jedna uporządkowana lista sekcji — numery liczone z indeksu, nie wpisane na sztywno. */
export const adminSections: AdminSectionItem[] = [
  { id: 'start', label: 'Start' },
  { id: 'products', label: 'Produkty' },
  { id: 'offers', label: 'Oferty' },
  { id: 'export', label: 'Eksport' },
  { id: 'contacts', label: 'Kontakty' },
  { id: 'seo', label: 'SEO' },
  { id: 'faq', label: 'FAQ' },
];

export const sectionNumber = (index: number) => String(index + 1).padStart(2, '0');

export const sectionTitles: Record<AdminSection, string> = {
  start: 'Start',
  products: 'Produkty',
  offers: 'Oferty',
  export: 'Eksport',
  contacts: 'Kontakty',
  seo: 'SEO & Schema',
  faq: 'FAQ',
};


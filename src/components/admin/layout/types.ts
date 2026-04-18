export type AdminSection = 'start' | 'products' | 'inquiries' | 'export' | 'seo' | 'faq';

export const sectionTitles: Record<AdminSection, string> = {
  start: 'Start',
  products: 'Produkty',
  inquiries: 'Zapytania',
  export: 'Eksport',
  seo: 'SEO & Schema',
  faq: 'FAQ',
};

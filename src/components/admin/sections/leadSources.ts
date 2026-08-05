// Etykiety źródeł zapytań (leads.source).
// Wartości spoza tej mapy wyświetlamy surowo, bez zgadywania etykiety.
export const LEAD_SOURCE_LABELS: Record<string, string> = {
  product_page: 'Strona produktu (archiwalne)',
  product_list: 'Lista produktów (archiwalne)',
  contact_page: 'Kontakt',
  contact_form: 'Kontakt',
  product_page_inline: 'Strona produktu',
  product_callback_inline: 'Oddzwonienie z karty produktu',
  home_hero_form: 'Strona główna',
  visit_request: 'Prośba o prezentację',
  faq_price_inquiry: 'Zapytanie z FAQ',
};

export const leadSourceLabel = (source: string): string =>
  LEAD_SOURCE_LABELS[source] ?? source;

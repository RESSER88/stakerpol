/**
 * Feature flags — centralna konfiguracja
 * Każda zmiana może być cofnięta przez zmianę flagi.
 */
export const FEATURES = {
  /** Zadanie 1: FAQ przypisane do produktu (z bazy) */
  PRODUCT_FAQ: true,
  /** Zadanie 2: "wózków paletowych" zamiast "wózków widłowych" */
  USE_PALLET_TRUCKS_TEXT: true,
  /** Zadanie 3: Nowy meta title */
  NEW_META_TITLE: true,
  /** Zadanie 4: DeepL / tłumaczenia AI */
  DEEPL_ENABLED: false,
  /** Zadanie 5: Przycisk "Migruj FAQ z kodu" */
  SHOW_FAQ_MIGRATION: false,
  /** Zadanie 6: Nowoczesny styl FAQ */
  MODERN_FAQ_UI: true,
};

export const SITE_CONFIG = {
  META_TITLE: 'Stakerpol - Paleciaki elektryczne Toyota BT',
  META_TITLE_LEGACY: 'Stakerpol - Paleciaki elektryczne Toyota BT | Sprzedaż używanych wózków elektrycznych i spalinowych',
  DESCRIPTION: {
    pl: 'Oferujemy szeroki wybór wózków paletowych BT Toyota, idealnie dopasowanych do różnych zastosowań i potrzeb',
    en: 'We offer a wide selection of BT Toyota pallet trucks, perfectly adapted to various applications and needs.',
    cs: 'Nabízíme široký výběr paletových vozíků BT Toyota, ideálně přizpůsobených různým aplikacím a potřebám.',
    sk: 'Ponúkame široký výber paletových vozíkov BT Toyota, ideálne prispôsobených rôznym aplikáciám a potrebám.',
    de: 'Wir bieten eine große Auswahl an BT Toyota Palettenhubwagen, perfekt angepasst an verschiedene Anwendungen und Bedürfnisse.',
  } as Record<string, string>,
  DESCRIPTION_LEGACY: {
    pl: 'Oferujemy szeroki wybór wózków paletowych BT Toyota, idealnie dopasowanych do różnych zastosowań i potrzeb.',
    en: 'We offer a wide selection of BT Toyota forklifts, perfectly adapted to various applications and needs.',
    cs: 'Nabízíme široký výběr vysokozdvižných vozíků BT Toyota, ideálně přizpůsobených různým aplikacím a potřebám.',
    sk: 'Ponúkame široký výber vysokozdvižných vozíkov BT Toyota, ideálne prispôsobených rôznym aplikáciám a potrebám.',
    de: 'Wir bieten eine große Auswahl an BT Toyota Gabelstaplern, perfekt angepasst an verschiedene Anwendungen und Bedürfnisse.',
  } as Record<string, string>,
};

/** Helper: zwraca odpowiedni opis w zależności od flagi */
export const getSiteDescription = (language: string): string => {
  const descriptions = FEATURES.USE_PALLET_TRUCKS_TEXT
    ? SITE_CONFIG.DESCRIPTION
    : SITE_CONFIG.DESCRIPTION_LEGACY;
  return descriptions[language] || descriptions['pl'];
};

/** Helper: zwraca meta title w zależności od flagi */
export const getMetaTitle = (): string => {
  return FEATURES.NEW_META_TITLE
    ? SITE_CONFIG.META_TITLE
    : SITE_CONFIG.META_TITLE_LEGACY;
};

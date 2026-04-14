

# Plan wdrożenia — 6 zadań FAQ + UX + DeepL + teksty

## Podsumowanie

Wdrożenie 6 zmian w sposób bezpieczny z feature flagami, fallbackami i możliwością cofnięcia. Zmiany dotyczą: FAQ per produkt, tekstów strony, meta title, dezaktywacji DeepL, ukrycia przycisku migracji i ulepszenia UI FAQ.

---

## 0. Feature flags — konfiguracja centralna

Utworzyć plik `src/config/featureFlags.ts`:
```ts
export const FEATURES = {
  PRODUCT_FAQ: true,          // Zadanie 1
  USE_PALLET_TRUCKS_TEXT: true, // Zadanie 2
  NEW_META_TITLE: true,       // Zadanie 3
  DEEPL_ENABLED: false,       // Zadanie 4 — domyślnie wyłączony
  SHOW_FAQ_MIGRATION: false,  // Zadanie 5
  MODERN_FAQ_UI: true,        // Zadanie 6
};
```

---

## 1. FAQ przypisane do produktu

**Problem:** Obecnie `ProductDetail.tsx` (linie 104-125) ma hardcoded 5 FAQ z tłumaczeń statycznych, identyczne dla każdego produktu.

**Plan:**
- Dodać do interfejsu `Product` w `src/types/index.ts` opcjonalne pole `faqIds?: string[]` (max 4 ID z tabeli `faqs`)
- W `ProductForm.tsx` dodać sekcję: dropdown języka + multi-select do wyboru max 4 FAQ z bazy (hook `useSupabaseFAQ`)
- W `ProductDetail.tsx`:
  - Jeśli produkt ma `faqIds` → pobierz te FAQ z bazy
  - Jeśli brak → losowe 4 FAQ z bazy dla danego języka (fallback)
  - Jeśli baza niedostępna → obecna logika statyczna (drugi fallback)
- Feature flag `PRODUCT_FAQ` kontroluje czy używać nowej logiki

**Pliki:** `src/types/index.ts`, `src/components/admin/ProductForm.tsx`, `src/pages/ProductDetail.tsx`, `src/hooks/useSupabaseFAQ.ts` (dodać `getFAQsByIds`)

---

## 2. Zmiana tekstu "wózków widłowych" → "wózków paletowych"

**Problem:** Tekst pojawia się w wielu miejscach hardcoded.

**Plan:**
- W `src/config/featureFlags.ts` dodać stałą `SITE_DESCRIPTION`:
  ```ts
  export const SITE_DESCRIPTION = {
    pl: 'Oferujemy szeroki wybór wózków paletowych BT Toyota, idealnie dopasowanych do różnych zastosowań i potrzeb',
  };
  ```
- Zamienić w `Products.tsx` (linia 39): `wózków widłowych` → użyć zmiennej
- Zamienić w `Index.tsx` meta description (linia 82)
- Zamienić w `ProductDetail.tsx` meta description (linia 94)
- `LocalBusinessSchema.tsx` — **NIE zmieniać** (SEO schema to osobna kwestia)

**Pliki:** `src/pages/Products.tsx`, `src/pages/Index.tsx`, `src/pages/ProductDetail.tsx`

---

## 3. Meta title strony

**Problem:** `index.html` linia 7 ma title "Stakerpol Wózki paletowe BT Toyota", a `Index.tsx` linia 81 nadpisuje na "Stakerpol - Wózki widłowe Toyota BT | Sprzedaż..."

**Plan:**
- `index.html` linia 7: zmienić na `Stakerpol - Paleciaki elektryczne Toyota BT`
- `Index.tsx` Helmet title (linia 81): zmienić na `Stakerpol - Paleciaki elektryczne Toyota BT`
- Feature flag `NEW_META_TITLE` — jeśli false, użyj starego tytułu

**Pliki:** `index.html`, `src/pages/Index.tsx`

---

## 4. Dezaktywacja DeepL — chirurgicznie

**Problem:** DeepL jest zintegrowany w panelu admina przez `TranslationManager.tsx` (4 zakładki), `TranslationStatsPanel.tsx`, `useAutoTranslation.ts` oraz edge functions.

**Plan (etap 1 — dezaktywacja, bez usuwania kodu):**
- Feature flag `DEEPL_ENABLED = false`
- W `src/pages/Admin.tsx` (linie 228-244): ukryć kartę "Tłumaczenia AI" gdy flag = false
- W `TranslationStatsPanel.tsx`: ukryć panel gdy flag = false
- W `useAutoTranslation.ts`: w `useEffect` (linia 188) — nie wywoływać `loadStats()`/`loadJobs()` gdy flag = false
- Statyczne tłumaczenia (pliki `src/utils/translations/*.ts`) działają niezależnie od DeepL — **nic się nie zepsuje**

**NIE ruszać:** Edge functions, tabeli `deepl_api_keys`, tabeli `translation_jobs` — zostawić na etap 2 (czyszczenie).

**Pliki:** `src/pages/Admin.tsx`, `src/components/admin/TranslationStatsPanel.tsx`, `src/hooks/useAutoTranslation.ts`

---

## 5. Ukrycie przycisku "Migruj FAQ z kodu"

**Plan:**
- W `FAQManager.tsx` — ukryć przycisk migracji gdy `FEATURES.SHOW_FAQ_MIGRATION === false`
- Kod NIE jest usuwany, tylko ukryty za flagą

**Pliki:** `src/components/admin/FAQManager.tsx`

---

## 6. UI FAQ — nowoczesny styl

**Problem:** `FAQSection.tsx` ma za duży padding, obramowania po rozwinięciu, styl nie jest "clean".

**Plan zmian w `src/components/ui/FAQSection.tsx`:**
- Zmniejszyć `px-6 py-2` → `px-4 py-1`
- Usunąć `border rounded-lg` z `AccordionItem` → zastąpić `border-b border-border/50`
- `AccordionTrigger`: dodać `text-sm md:text-base`, poprawić line-height
- `AccordionContent`: usunąć dodatkowe padding, tekst `text-sm`
- Sekcja: `bg-white` → `bg-background`
- Spacing: `space-y-2` → `space-y-0` (elementy przylegają)
- Styl SaaS-owy: separator liniowy zamiast boxów

**Pliki:** `src/components/ui/FAQSection.tsx`

---

## Kolejność wdrożenia

1. `src/config/featureFlags.ts` — centralna konfiguracja
2. UI FAQ (zadanie 6) — czysta zmiana wizualna, zero ryzyka
3. Teksty + meta (zadania 2, 3) — proste zamiany
4. Dezaktywacja DeepL (zadanie 4) — ukrycie w UI
5. Ukrycie migracji (zadanie 5) — jedna linia
6. FAQ per produkt (zadanie 1) — najdłuższe, wymaga zmian w typach i formularzach

## Jak cofnąć każdą zmianę

| Zmiana | Cofnięcie |
|--------|-----------|
| FAQ per produkt | `FEATURES.PRODUCT_FAQ = false` |
| Tekst paletowe | `FEATURES.USE_PALLET_TRUCKS_TEXT = false` |
| Meta title | `FEATURES.NEW_META_TITLE = false` |
| DeepL | `FEATURES.DEEPL_ENABLED = true` |
| Przycisk migracji | `FEATURES.SHOW_FAQ_MIGRATION = true` |
| UI FAQ | `FEATURES.MODERN_FAQ_UI = false` |

## Ryzyka

- **FAQ per produkt:** Wymaga migracji danych w Supabase (dodanie kolumny `faq_ids` do `products`) — ale jako pole opcjonalne, zero ryzyka dla istniejących danych
- **DeepL:** Statyczne tłumaczenia działają niezależnie — wyłączenie DeepL nie wpływa na wielojęzyczność strony
- **Meta title:** Zmiana może wpłynąć na pozycjonowanie w Google — ale to zamierzona zmiana SEO


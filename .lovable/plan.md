

# Analiza stanu wdrożenia i plan naprawy

## Co dziala (wdrożone poprawnie)

| Zadanie | Status | Gdzie |
|---------|--------|-------|
| Feature flags | ✅ OK | `src/config/featureFlags.ts` |
| DeepL ukryty w panelu admina | ✅ OK | `Admin.tsx` linie 232, 259 |
| DeepL hook zablokowany | ✅ OK | `useAutoTranslation.ts` linia 190 |
| Przycisk migracji FAQ ukryty | ✅ OK | `FAQManager.tsx` linia 113 |
| Nowoczesny UI FAQ (SaaS style) | ✅ OK | `FAQSection.tsx` linie 18-43 |
| Meta title zmieniony | ✅ OK | `Index.tsx` linia 82 |
| Tekst "wózki paletowe" w Products | ✅ OK | `Products.tsx` linia 29 |
| FAQ CRUD + toggle + hard delete | ✅ OK | `useSupabaseFAQ.ts`, `FAQList.tsx`, `FAQManager.tsx` |

## Co NIE dziala (brakujace elementy)

### Problem 1: FAQ NIE mozna przypisac do produktu
- `faqIds` istnieje w typie `Product` (types/index.ts linia 5)
- **BRAK** kolumny `faq_ids` w tabeli `products` w Supabase
- **BRAK** mapowania w `mapSupabaseProductToProduct` (supabase.ts linia 29)
- **BRAK** UI w `ProductForm.tsx` do wyboru FAQ
- `ProductDetail.tsx` linia 58 czyta `(product as any).faqIds` - ale dane nigdy nie przychoda z bazy

### Problem 2: translateProductFields wciaz odpala DeepL
- `useSupabaseProducts.ts` linia 177 i 283 wywoluje `translateProductFields()` przy kazdym zapisie produktu
- Nie jest zabezpieczone flaga `DEEPL_ENABLED`
- Edge function `auto-translate` jest wolana i failuje cicho

### Problem 3: Drobne niespojnosci SEO
- `Index.tsx` linia 84: og:title wciaz mowi "Wózki widłowe" zamiast "Paleciaki elektryczne"

## Plan naprawy (5 krokow)

### Krok 1: Migracja SQL — dodac kolumne `faq_ids` do tabeli `products`
```sql
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS faq_ids TEXT[] DEFAULT '{}';
```
- Typ `TEXT[]` (tablica UUID jako tekst) - bezpieczne, nullable, zero ryzyka dla istniejacych danych
- Masz dostep do Supabase - mozna wykonac przez SQL Editor lub jako migracje

### Krok 2: Aktualizacja mapowania Supabase
- `src/types/supabase.ts` — dodac `faq_ids` do `mapSupabaseProductToProduct`, `mapProductToSupabaseInsert`, `mapProductToSupabaseUpdate`

### Krok 3: UI wyboru FAQ w formularzu produktu
- `src/components/admin/ProductForm.tsx` — dodac nowa zakladke/sekcje z multi-select (max 4 FAQ) z bazy
- Dropdown jezyka + lista FAQ do zaznaczenia

### Krok 4: Zabezpieczyc translateProductFields flaga
- `src/hooks/useSupabaseProducts.ts` linie 176-178 i 282-283 — dodac `if (FEATURES.DEEPL_ENABLED)` przed wywolaniem

### Krok 5: Naprawa og:title w Index.tsx
- `src/pages/Index.tsx` linia 84 — uzyc `getMetaTitle()` zamiast hardcoded tekstu

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `supabase/migrations/NEW.sql` | Dodanie kolumny `faq_ids` |
| `src/types/supabase.ts` | Mapowanie `faq_ids` |
| `src/components/admin/ProductForm.tsx` | Sekcja wyboru FAQ |
| `src/hooks/useSupabaseProducts.ts` | Guard `DEEPL_ENABLED` |
| `src/pages/Index.tsx` | og:title fix |

## Ryzyko
- Zerowe — kolumna `faq_ids` jest opcjonalna, istniejace produkty nie sa dotykane
- `translateProductFields` — blokada zapisze niepotrzebne wywolania API


# Adresy URL i filtr dostępności w sitemapie oraz feedzie produktowym

Cel: obie funkcje brzegowe mają emitować wyłącznie obecne, polskie adresy serwisu i pomijać egzemplarze sprzedane. Bez zmian w warstwie frontendu, bazie danych, politykach RLS i konfiguracji.

## Stan wyjściowy (potwierdzony w repozytorium)

- `supabase/functions/sitemap/index.ts` emituje `/`, `/products`, `/contact`, `/testimonials`, `/faq` oraz `/products/{slug||id}` — poza `/faq` to adresy stare (angielskie), obsługiwane wyłącznie przez przekierowania 301 w `src/App.tsx`.
- `supabase/functions/geo-feed/index.ts` emituje `${baseUrl}/products/{slug||id}` — również adresy stare.
- Żadna z funkcji nie filtruje produktów; `products.availability_status` (enum: `available` / `reserved` / `sold`) jest ignorowany.
- Brakuje wpisów dla `/prywatnosc`; brak jest też stron `/opinie` i `/kontakt` w wersji polskiej.

## Zakres zmian

### 1. `supabase/functions/sitemap/index.ts`

- Lista stron statycznych na obecne ścieżki: `/`, `/produkty`, `/kontakt`, `/opinie`, `/faq`, `/prywatnosc`. Bez `/admin` i `/oferta` (zablokowane w `robots.txt`).
- Ścieżka produktu: `/produkty/{slug||id}`.
- Zapytanie o produkty rozszerzone o `availability_status`; do sitemapy trafiają egzemplarze `available` i `reserved`, pomijane są `sold`.
- `lastmod` produktu pozostaje `updated_at`. Dla stron statycznych `lastmod` zostaje usunięty — dotąd wstawiał czas wygenerowania odpowiedzi, czyli wartość niezwiązaną z faktyczną zmianą treści.
- Bez zmian: nagłówki, `Cache-Control`, sekcja `image:image`, obsługa błędów, `baseUrl`.

### 2. `supabase/functions/geo-feed/index.ts`

- `url` pozycji: `${baseUrl}/produkty/{slug||id}`.
- Zapytanie rozszerzone o `availability_status`; pozycje `sold` pomijane, `numberOfItems` i `position` liczone po odfiltrowaniu.
- `offers.availability` mapowane z `availability_status`: `available` → `InStock`, `reserved` → `PreOrder` (dotąd zawsze `InStock`).
- Bez zmian: struktura `ItemList`, `publisher`, `additionalProperty`, obsługa zdjęć i nagłówki odpowiedzi.

## Poza zakresem

- Dostępność `/sitemap.xml` pod adresem z `robots.txt` i `llms.txt`.
- Obsługa nieistniejącego produktu i `noindex`.
- Mechanizm wyboru zdjęcia `og:image`.
- Frontend, `index.html`, `robots.txt`, `llms.txt`, baza danych, RLS, `config.toml`.

## Szczegóły techniczne

- Obie funkcje zostaną wdrożone ponownie po edycji (deploy funkcji brzegowych), bez migracji bazy.
- Filtr dostępności realizowany po stronie zapytania (`.neq('availability_status', 'sold')`), aby nie zwiększać transferu.
- Ścieżki zostaną wpisane wprost w kodzie funkcji — `src/config/routes.ts` nie jest importowalne z Deno.
- Weryfikacja: wywołanie obu funkcji i sprawdzenie, że każdy `<loc>` oraz każde `url` zawiera wyłącznie ścieżki polskie i że liczba pozycji odpowiada produktom nie oznaczonym jako sprzedane.

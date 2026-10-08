# Raport diagnostyczny SEO — STAKERPOL (tylko analiza)

Nic nie zostało zmienione. Dane: kod repozytorium + odczyt bazy (8.10.2026).

## 1. Routing i adresy
- Publiczne: `/`, `/produkty`, `/produkty/:id` (slug lub UUID), `/kontakt`, `/opinie`, `/faq`, `/prywatnosc`, `/oferta/:token` (noindex przez robots), `/admin` (zablokowany w robots).
- `/products`, `/products/:id`, `/contact`, `/testimonials`, `/privacy` → przekierowanie **po stronie przeglądarki** (`<Navigate replace>` w `App.tsx`). Serwer zwraca 200 z `index.html`; to nie jest 301.
- Mapowanie istnieje w `LEGACY_ROUTES` (`src/config/routes.ts`), ale służy tylko dokumentacji — `public/_redirects` ma wyłącznie fallback SPA.

## 2. Meta i canonical (react-helmet-async, wstawiane dopiero po JS)
| Strona | Źródło | Tytuł |
|---|---|---|
| `/` | `Index.tsx` (stały tekst) | z `getMetaTitle()`; opis „Profesjonalna sprzedaż używanych wózków paletowych Toyota i BT…” |
| `/produkty` | `Products.tsx` | „Paleciaki elektryczne BT Toyota – oferta \| Stakerpol”; opis z `getSiteDescription()` |
| `/faq` | `FAQ.tsx` (obiekt `meta`) | — |
| `/opinie` | `Testimonials.tsx` | „Opinie klientów – Stakerpol” |
| `/kontakt` | `Contact.tsx` | „Kontakt – Stakerpol \| Paleciaki elektryczne BT Toyota” |
| karta | `ProductDetail.tsx` | szablon „{model} {rok} — {mm}, {kg} \| Stakerpol”; opis „Używany {model}, rok…, mth. {status}…” |
- Canonical: `absoluteUrl()` / `productUrl()` → zawsze `https://stakerpol.pl/produkty/{slug || id}`. Wejście po UUID też daje canonical na slug (jeśli slug istnieje).
- `index.html` zawiera tylko ogólny tytuł i opis; robot bez JS widzi te same meta na każdej stronie.

## 3. Sitemap
- Generowana przez Edge Function `sitemap` z tabeli `products` (bez sprzedanych). W `public/` nie ma pliku `sitemap.xml`, a `_redirects` go nie przekierowuje — **w kodzie nie widać, jak `stakerpol.pl/sitemap.xml` trafia do funkcji** (prawdopodobnie Nginx; do potwierdzenia u administratora).
- lastmod: produkty = `updated_at`; strony statyczne w obecnym kodzie **nie mają lastmod**. Jeśli żywa mapa pokazuje dzisiejszą datę, serwuje ją inna wersja/serwer — tego nie da się ustalić z kodu.
- Duplikat 6760435: to dwa różne wózki. Rekord z numerem seryjnym **6865260** („Toyota Swe 200d BT”) ma slug `toyota-swe-200d-6760435`. Slug tworzy się tylko przy dodaniu (trigger `set_product_slug`) i nie zmienia się po edycji numeru — wózek najpewniej powstał jako kopia i dostał nowy numer później. W bazie jest 1 taki niezgodny slug.
- Brak „ł”: `generate_product_slug` robi `lower()` i usuwa wszystko spoza `a-z0-9` — wycina **wszystkie** polskie znaki (ą, ę, ł, ó, ś…), bez zamiany na litery łacińskie.
- Sprzedane: wykluczone (`neq sold`). Inne statusy (np. reserved) trafiają.

## 4. Treść
- `/`: jeden H1 w `Index.tsx`, H2 w sekcjach Polecane, Formularz, O nas, FAQ, Gotowy do zakupu.
- `/produkty`: H1 tylko `sr-only`, brak widocznego tekstu poza siatką i FAQ kategorii (4 pytania).
- Baza: 45 dostępnych + 8 sprzedanych; 7 bez `detailed_description` (5 dostępnych); `short_description` krótszy niż 300 znaków w 49/53. Licznik „<50 słów” zwrócił 0 dla połączonych pól — wymaga potwierdzenia osobno na każdym polu.
- Te same nazwy: „Toyota SWE 200d Staxio” ×12, „Toyota SWE 200D” ×4. Tytuły różnią się tylko rokiem/mm/kg — przy identycznych parametrach będą identyczne.

## 5. Dane strukturalne
- `/`: LocalBusiness (z katalogiem ofert) + FAQPage. `/produkty`, `/faq`, `/opinie`, karta: FAQPage. Karta: Product (`generateProductSchema.ts` + `product_seo_settings`) + BreadcrumbList.
- Aktywny kod nie generuje ocen. **Martwy plik `ProductSchema.tsx`** zawiera aggregateRating z opinii z kodu — nieużywany, do usunięcia.

## 6. Produkt sprzedany
- Pole `availability_status` istnieje (available/reserved/sold). Karta sprzedanego wciąż się wyświetla z dopiskiem „Egzemplarz sprzedany”; znika tylko z mapy. Usunięty → strona „Produkt niedostępny” z noindex, ale serwer zwraca 200 (miękki 404).

## 7. Linkowanie
- Strona główna linkuje do kart (Polecane). `/faq` i FAQ główne nie linkują do kart. Karta ma `RelatedProducts` (podobne).

## 8. Gotowość pod AI
- `product_ai_drafts`, `delta_content`, `content_lock` **nie istnieją**.
- Miejsce na opis: wewnątrz `ProductAboutSection` jako akapit nad obecnym tekstem — bez zmiany układu.

## 9. Plan etapowy
a) Treść i meta (bez bazy): tekst nad siatką `/produkty` i rozwinięcie sekcji O nas; linki z FAQ do kart; usunięcie `ProductSchema.tsx`. Ryzyko: minimalne.
b) Sitemap i slugi: lastmod dla stron statycznych z daty wdrożenia (nie now()); poprawny slug dla 6865260; transliteracja polskich znaków tylko dla **nowych** produktów. Ryzyko: zmiana istniejących slugów zgubi pozycje — nie zmieniać bez 301.
c) Baza (osobno): `delta_content`, `product_ai_drafts`, RLS, funkcja akceptacji.
d) Nginx (lista dla administratora): 301 `/products/*` → `/produkty/*`, `/contact` itd.; 301 starego sluga 6865260; serwowanie `/sitemap.xml` z funkcji; prawdziwy 404/410 dla usuniętych produktów; opcjonalnie prerender dla robotów.

## 10. Decyzje przed wdrożeniem
1. Czy sprzedane karty mają zostać (z linkami do podobnych), czy dostać 410?
2. Czy poprawiamy istniejące slugi bez polskich znaków (wymaga 301), czy tylko nowe?
3. Nowy slug dla wózka 6865260 — tak/nie?
4. Kto wykona zmiany w Nginx i jak wygląda obecna konfiguracja sitemap?
5. OpenAI czy Claude jako dostawca opisów.

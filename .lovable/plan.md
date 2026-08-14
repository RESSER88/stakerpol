# Weryfikacja techniczna przed publikacją na stakerpol.pl

Wszystkie ustalenia poniżej wynikają z odczytu kodu i zapytań do bazy (nie zmieniano niczego).

## 1. Cena produktu i dane Product / Offer

Dane w bazie: `show_price` — 11 egzemplarzy (wszystkie z ceną), `inquiry_with_pricelist` — 29 (1 z ceną), `inquiry_only` — 4 (bez ceny). Czyli 33 z 44 ofert nie ma publicznej ceny.

| Element | Co dzieje się teraz | Przyczyna techniczna | Problem | Zalecane rozwiązanie | Pliki | Ryzyko |
|---|---|---|---|---|---|---|
| Miejsce ceny w modelu | Kolumny `products.net_price`, `price_currency`, `price_display_mode` + `leasing_monthly_from_pln`; mapowane na `netPrice`, `priceCurrency`, `priceDisplayMode` | `src/types/supabase.ts:49-50` | Nie | Bez zmian (model wystarczający) | — | — |
| Cena na karcie produktu | Blok ceny renderuje się tylko dla `show_price` + cena > 0; w pozostałych przypadkach `return null` — brak jakiegokolwiek komunikatu | Świadoma decyzja z wcześniejszego etapu (ukrycie całego bloku) | Tak — brak stanu „Cena na zapytanie” | Wariant B bloku: gdy cena nieujawniona, ten sam kontener pokazuje „Cena na zapytanie” + odnośnik do CTA | `src/components/products/ProductPriceBlock.tsx` | Niskie; jedna zmiana prezentacyjna |
| Cena w katalogu | Karta katalogowa nie pokazuje ceny ani informacji o niej | Komponent nigdy nie czytał pól cenowych | Tak | Dodać jeden wiersz ceny / „Cena na zapytanie” w stopce karty, ta sama funkcja decydująca co na karcie produktu | `src/components/ui/ProductCard.tsx`, nowy `src/utils/productPricing.ts` (współdzielona logika `resolvePriceView`) | Niskie |
| `offers.price` / `priceCurrency` w JSON-LD | Emitowane **tylko** dla `show_price` i ceny > 0; dla pozostałych całkowicie pominięte | `src/utils/seo/generateProductSchema.ts:330-344` — zamierzone, brak fikcyjnych cen | Nie (poprawne) | Bez zmian; po wdrożeniu wspólnej funkcji schema korzysta z tego samego źródła | `generateProductSchema.ts` | — |
| Zgodność `availability`, `itemCondition`, `sku`, `brand`, `image`, `description` | `availability` z `availability_status`, `itemCondition` ze `condition`, `sku` = numer seryjny (fallback `id`), `brand` = zawsze „Toyota”, `image` z galerii, `description` ze `short_description` | `generateProductSchema.ts:236-258` | Częściowo: `brand` twardo „Toyota” (funkcja `getBrand` zwraca Toyota w każdej gałęzi), `sku` bywa `id` gdy brak numeru | Uporządkować `getBrand` (jawnie Toyota jako marka katalogu) i wymagać numeru seryjnego jako SKU | `generateProductSchema.ts`, `src/components/seo/ProductSchema.tsx` | Niskie; SKU zależy od kompletności danych w bazie |

Dlaczego dziś brakuje `price`: nie jest to błąd — schema celowo pomija cenę, gdy tryb prezentacji jej nie ujawnia. Widoczny brak dotyczy wyłącznie **warstwy UI** (brak komunikatu „Cena na zapytanie”).

## 2. Treść produktu ładowana dopiero przez JavaScript

| Element | Co dzieje się teraz | Przyczyna techniczna | Problem | Zalecane rozwiązanie | Pliki | Ryzyko |
|---|---|---|---|---|---|---|
| Typ aplikacji | Czysty SPA React + Vite, brak SSR; jedyny statyczny HTML to `index.html` | `vite.config.ts`, `src/main.tsx` | Tak (dla SEO kart produktu) | Patrz niżej | — | — |
| Pobieranie danych | React Query po montażu komponentu, z Supabase REST (`products`, `product_images`) | `src/hooks/usePublicSupabaseProducts.ts` | Tak — dane dostępne dopiero po JS | Prerender przy buildzie albo SSR | `usePublicSupabaseProducts.ts` | — |
| title / description / canonical / JSON-LD | Wstrzykiwane przez `react-helmet-async` po hydratacji i po dojściu danych | `src/pages/ProductDetail.tsx:155-172` | Tak dla crawlerów bez JS (podglądy społecznościowe, część botów AI) | j.w. | `ProductDetail.tsx` | — |
| Możliwości hostingu | Hosting Lovable dla tego szablonu serwuje statyczne pliki + fallback SPA; nie uruchamia SSR | dokumentacja platformy | — | Dwie realne opcje: **(a)** skrypt prerenderujący w buildzie — generuje `dist/produkty/<slug>/index.html` z gotowym H1, opisem, parametrami, dostępnością, ceną lub „Cena na zapytanie”, meta i JSON-LD (dane pobierane z Supabase w trakcie builda, limit stron w stałej); **(b)** migracja na szablon SSR (TanStack Start) — pełny render na żądanie | nowy `scripts/prerenderProducts.mts`, `vite.config.ts`, `package.json` | (a) HTML zamrożony do kolejnej publikacji — po zmianie oferty trzeba opublikować ponownie; limit 50 000 plików; (b) migracja całej aplikacji |
| Dane wrażliwe na SEO w pierwszym HTML | Dziś: brak | j.w. | Tak | Osiągalne w pełni w wariancie (a) i (b) | j.w. | — |

Wprost: obecna architektura **nie** dostarcza danych produktu w pierwszym HTML i nie da się tego naprawić „pozornie” po stronie klienta. Najbardziej niezawodny dla stabilnej indeksacji kart jest prerender przy buildzie (a) — bez zmiany architektury i URL; docelowo najmocniejszy jest SSR (b), [co daje migracja na TanStack Start](https://lovable.dev/blog/building-apps-using-tanstack-start).

## 3. Nieistniejący produkt i ryzyko soft 404

| Element | Co dzieje się teraz | Przyczyna techniczna | Problem | Zalecane rozwiązanie | Pliki | Ryzyko |
|---|---|---|---|---|---|---|
| Status HTTP dla `/produkty/nieistniejacy-test-audytowy-000000` | HTTP 200 z `index.html` | Fallback SPA hostingu: każda nieznana ścieżka nawigacyjna dostaje `index.html` | Tak (soft 404) | Statusu nie zmienimy w tym deploymencie | — | Kod 404 wymaga warstwy serwerowej (SSR lub reguła na Nginx w domenie produkcyjnej) |
| Widok braku produktu | Gałąź „Produkt niedostępny” z `noindex, follow` już istnieje | `ProductDetail.tsx:107-122` | Nie | Bez zmian | — | `noindex` działa tylko dla botów wykonujących JS |
| Trasa nieznana | `NotFound.tsx` z `noindex, follow` | `src/pages/NotFound.tsx` | Nie | Bez zmian | — | j.w. |
| Oferta sprzedana | Strona dostępna, indeksowalna, bez `noindex` | brak warunku na `availabilityStatus === 'sold'` | Do decyzji biznesowej | Albo pozostawić z jasnym oznaczeniem (dobre dla long-tail), albo dodać `noindex, follow` | `ProductDetail.tsx` | Utrata ruchu z archiwalnych ofert przy `noindex` |
| Prawdziwe 404 | — | — | — | Wariant realny bez SSR: reguła na serwerze produkcyjnym stakerpol.pl (proxy) zwracająca 404 dla ścieżek `/produkty/*` nieobecnych w sitemapie; wariant docelowy: SSR | konfiguracja serwera (poza repo) / migracja SSR | Reguła serwerowa wymaga listy aktualnych slugów |

## 4. FAQ i spójność treści ze schema

| Element | Co dzieje się teraz | Przyczyna techniczna | Problem | Zalecane rozwiązanie | Pliki | Ryzyko |
|---|---|---|---|---|---|---|
| Puste odpowiedzi | Zapytanie do bazy: 175 aktywnych FAQ, **0** pustych i 0 krótszych niż 10 znaków | dane kompletne | Nie | Bez zmian | — | — |
| Zgodność UI ↔ JSON-LD | Ten sam obiekt `productFaqItems` zasila `FAQSection` i `FAQSchema` | `ProductDetail.tsx:73-90, 255, 267` | Nie | Bez zmian | — | — |
| Widoczność odpowiedzi | Accordion `type="single" collapsible` — odpowiedzi zwinięte, w DOM pojawiają się po rozwinięciu | `src/components/ui/FAQSection.tsx` | Tak dla audytu bez JS/bez interakcji | Renderować treść odpowiedzi w DOM od początku (ukrycie wyłącznie wizualne) — rozwiązuje też odczyt przez boty przy prerenderze | `src/components/ui/FAQSection.tsx` | Niskie; bez zmian wizualnych |
| Schema tylko dla realnych pytań | Fallback na 4 pytania z plików tłumaczeń, gdy brak FAQ z bazy | `ProductDetail.tsx:84-89` | Nie (treści realne) | Dodać filtr pustych/krótkich odpowiedzi przed przekazaniem do `FAQSchema` | `src/components/seo/FAQSchema.tsx` | Niskie |

## 5. Jednolity standard nazw i identyfikacji

| Element | Co dzieje się teraz | Przyczyna techniczna | Problem | Zalecane rozwiązanie | Pliki | Ryzyko |
|---|---|---|---|---|---|---|
| Nazwy w katalogu | Wolny tekst z admina: „Toyota SWE 200d BT ”, „SWE 200d Toyota ”, „Sztaplarka SWE 200D”, „Masztowy BT Toyota ” | `products.name` jedynym źródłem, H1 i `<h3>` biorą `product.model` | Tak | Nie zmieniać `products.name`. Wprowadzić warstwę prezentacji: `productTitle(product)` = `Toyota BT ` + znormalizowany kod z `normalizeModel()` + `— rok — mm — kg — mth — SKU`; nazwa marketingowa zostaje w opisie | nowy `src/utils/productTitle.ts` (na bazie `src/utils/productNormalization.ts`), `src/pages/ProductDetail.tsx`, `src/components/ui/ProductCard.tsx`, `src/components/products/SimpleRelatedCard.tsx`, `generateProductSchema.ts` | Zmiana widocznych nagłówków i `title`; wymaga akceptacji brzmienia |
| Identyfikacja | `serial_number` wypełniony i użyty w slug/SKU | schemat bazy | Nie | Pokazywać SKU jawnie w linii identyfikacyjnej karty | j.w. | — |
| Adresy | Slug generowany raz w bazie (`set_product_slug`), niezależny od zmian prezentacji | trigger DB | Nie | Bez zmian — brak zmian URL | — | — |

## Decyzje wymagające Twojej odpowiedzi

1. Polityka cen: czy dla ofert bez ceny wyświetlać „Cena na zapytanie” (proponowane), czy nie pokazywać niczego? Czy pokazywać ceny również w katalogu?
2. Czy publikować cenę brutto obok netto (baza trzyma tylko netto — brutto liczone jako netto × 1,23)?
3. Oferty sprzedane: pozostają indeksowalne czy `noindex`?
4. Format tytułu produktu — akceptujesz wzór `Toyota BT SWE 200D — 2020 — 2100 mm — 1200 kg — 4523 mth — SKU 6769116` (pełny na karcie produktu, skrócony na kafelkach)?
5. Kierunek dla SEO kart: prerender przy buildzie czy migracja na SSR?

## Zmiany bez ryzyka biznesowego (mogę wdrożyć od razu)

- Odpowiedzi FAQ obecne w DOM od początku (ukrycie wizualne, bez zmian wyglądu).
- Filtr pustych/krótkich odpowiedzi przed `FAQPage` schema.
- Porządek w `getBrand` i SKU w schema produktu.
- Wspólna funkcja `resolvePriceView` jako jedyne źródło decyzji o prezentacji ceny (UI + schema, bez zmiany zachowania).

## Kolejność wdrożenia

1. Prezentacja ceny / „Cena na zapytanie” na karcie i w katalogu (po decyzji 1–2).
2. Prerender kart produktu przy buildzie lub decyzja o SSR (po decyzji 5).
3. Ujednolicenie tytułów i linii identyfikacyjnej (po decyzji 4).
4. FAQ: DOM + filtr schema.
5. `noindex` dla sprzedanych (po decyzji 3) i ewentualna reguła 404 na serwerze produkcyjnym.

## Odpowiedź na pytanie zamykające

W obecnej architekturze (Vite SPA na hostingu Lovable) **nie** można zapewnić danych produktu w początkowym HTML ani prawdziwego HTTP 404 — hosting serwuje statyczny `index.html` z fallbackiem SPA, a cała treść i metadane powstają po uruchomieniu JavaScript. Dane w pierwszym HTML uzyskamy przez prerender kart przy buildzie (bez zmiany architektury, kosztem świeżości do kolejnej publikacji). Prawdziwy HTTP 404 wymaga warstwy serwerowej: albo reguły na serwerze domeny produkcyjnej, albo migracji na szablon SSR (TanStack Start), który rozwiązuje oba problemy jednocześnie.

# Analiza wysokiego ryzyka — prerender kart produktu (dist/ + Nginx)

Raport opisowy. Nic nie zmieniono w kodzie, bazie ani konfiguracji.

## 1. Wykonalność renderu w Node

Da się, ale nie „na wprost” — drzewo `ProductDetail` jest osadzone w `App.tsx`, którego nie można użyć w Node bez zmian. Konkretne przeszkody:

| Przeszkoda | Miejsce | Rodzaj obejścia |
|---|---|---|
| `createRoot(document.getElementById("root"))` | `src/main.tsx` | Skrypt nie może importować `main.tsx`; potrzebny osobny punkt wejścia dla renderu (np. `entry-prerender.tsx`) |
| `storage: localStorage` wykonywane przy imporcie modułu | `src/integrations/supabase/client.ts:11` | Twardy błąd w Node już przy `import`. Skrypt buildu musi używać **własnego** klienta Supabase (nowy `createClient` bez `auth.storage`), nie tego z aplikacji |
| `BrowserRouter` | `App.tsx` | Zamiana na `StaticRouter`/`createMemoryRouter` w punkcie wejścia prerenderu |
| `usePageTracking` (GA4, `window`) | `App.tsx` | Nie montować w prerenderze (osobne drzewo bez `AppRoutes`) |
| `SupabaseAuthProvider` | `App.tsx` | Pomijany — karta produktu go nie potrzebuje |
| `React.lazy` dla stron | `App.tsx` | W prerenderze importować `ProductDetail` statycznie; alternatywnie `renderToPipeableStream` z `Suspense` |
| React Query (`usePublicSupabaseProducts`, `useSupabaseFAQ`, `useProductSEO`, `useProductTranslationsDisplay`) | hooki | Dane muszą być w cache **przed** renderem: `queryClient.setQueryData(['public-products'], ...)` dla każdego klucza. Klucze trzeba odczytać z hooków i zduplikować w skrypcie — ryzyko rozjechania się kluczy |
| `subscribe()` realtime w `useEffect` | `usePublicSupabaseProducts.ts` | Efekty nie działają w `renderToString` — bez obejścia |
| `document.documentElement.lang`, `window.scrollTo`, `document.getElementById('lead-form')`, `document.body.style` | `LanguageContext`, `Footer`, `InlineContextualCTA`, `PresentationModal` | Wszystkie w `useEffect`/handlerach → nieuruchamiane przy renderze serwerowym. Bez obejścia |
| shadcn/ui (Radix: accordion, tooltip, dialog, sonner) | cała karta | Radix renderuje się w SSR; `Toaster`/`Sonner`/portale pomijamy w drzewie prerenderu |
| Galeria zdjęć | `ProductImage.tsx` — własny stan, brak embla/lightbox na starcie | Bez obejścia |
| Helmet | `ProductDetail` | `HelmetProvider` + `helmetContext.helmet` do wstrzyknięcia `<title>`, meta, canonical i JSON-LD do `<head>` szablonu |
| TS/JSX + aliasy `@/`, import CSS | cały kod | Skrypt musi być uruchamiany przez narzędzie rozumiejące konfigurację Vite (`vite build --ssr` na osobnym entry lub `vite-node`), nie przez czysty `node` |

Wniosek: wykonalne bez przeglądarki, ale wymaga **drugiego punktu wejścia** i drugiego, niezależnego klienta Supabase. Alternatywa — render przez headless Chromium na zbudowanym `dist/` — jest prostsza koncepcyjnie (zero obejść w kodzie aplikacji), kosztem zależności na Chromium w środowisku builda.

## 2. Źródło danych w trakcie buildu

- Lista i dane ofert: te same tabele co w aplikacji — `products` + `product_images`, dodatkowo `faqs`, `product_seo_settings`, `product_translations`.
- Klucz `anon` i obecne polityki publicznego odczytu wystarczają (aplikacja publiczna czyta dokładnie tak samo). Nie jest potrzebny `service_role` — i nie należy go umieszczać w kodzie builda.
- Warstwy zapytań do ponownego użycia praktycznie nie ma: logika siedzi wewnątrz hooków React Query. Do ponownego wykorzystania nadaje się jedynie mapowanie `mapSupabaseProductToProduct` z `src/types/supabase.ts` — czysta funkcja, bez zależności od przeglądarki. Zapytania SELECT trzeba w skrypcie napisać ponownie (duplikacja ~20 linii) albo wcześniej wyodrębnić je z hooków do współdzielonego modułu — to drugie jest czystsze, ale to zmiana w kodzie aplikacji.
- Przekazanie do renderu: `new QueryClient()` + `setQueryData` dla każdego klucza, następnie render drzewa z tym klientem.

## 3. Zakres stron

Stan bazy dzisiaj (44 oferty):

| Status | Tryb ceny | Liczba |
|---|---|---|
| available | show_price | 11 |
| available | inquiry_with_pricelist | 27 |
| available | inquiry_only | 4 |
| sold | inquiry_with_pricelist | 2 |

- Prerenderować: 42 oferty `available` (+ ewentualnie `reserved`, dziś 0).
- `sold`: nie prerenderować — te adresy nadal obsłuży fallback SPA (strona żyje, ruch long-tail zachowany), albo prerenderować z `noindex` jeśli chcesz zachować dane w HTML. Decyzja biznesowa (punkt 9).
- „Oferty niepubliczne” nie istnieją jako pojęcie w schemacie — brak flagi `is_published`; tryb ceny nie decyduje o publiczności.
- Przyrost `dist/`: jeden `index.html` karty to ok. 30–60 kB (treść + JSON-LD, bez zdjęć). 42 pliki → ok. 1,5–2,5 MB, czyli marginalnie wobec ok. 4,3 MB obecnego `public/`. Katalogów: 42.
- Limit jako stała w skrypcie: `MAX_PRERENDER_PAGES = 200` (z możliwością nadpisania zmienną środowiskową buildu) — ~5× zapas wobec dzisiejszego katalogu, twarde zabezpieczenie przed rozrostem.

## 4. Hydratacja i zgodność z SPA

- `main.tsx` używa `createRoot`, nie `hydrateRoot`. Skutek: React **nie hydratuje** prerenderowanego HTML — czyści `#root` i renderuje od zera. Zaleta: zero błędów mismatch. Wada: widoczna podmiana treści — prerenderowana karta zniknie na moment (spinner „Ładowanie produktu…” z `ProductDetail`), aż React Query pobierze dane. Dla botów i podglądów społecznościowych cel jest osiągnięty; dla użytkownika to krótkie mignięcie.
- Przejście na `hydrateRoot` dałoby płynność, ale wymaga zgodności znaczników i wstrzyknięcia danych do cache w HTML (`window.__QUERY_STATE__`) — istotnie większe ryzyko mismatch (język, daty, losowe elementy, `Math.random`, stany dostępności). Zalecenie na start: pozostać przy `createRoot`.
- Nawigacja wewnętrzna SPA działa bez zmian — po przejęciu przez React to nadal ten sam router; przejścia bez pełnego przeładowania.

## 5. Współpraca z Nginx

- `try_files $uri /index.html` **nie** trafi w `dist/produkty/<slug>/index.html`, bo `$uri` to katalog, a nie plik. Bez `$uri/` (lub jawnego `/index.html`) prerender pozostanie niewidoczny, mimo poprawnie wygenerowanych plików.
- Plik statyczny wygrywa z fallbackiem tylko wtedy, gdy zostanie dopasowany wcześniej w `try_files`.
- Minimalna zmiana do przekazania administratorowi:

```text
# Katalogi statyczne mają pierwszeństwo, potem fallback SPA
location / {
    try_files $uri $uri/index.html /index.html;
}

# Karty produktu: tylko istniejące prerendery; nieistniejący slug = 404
location ^~ /produkty/ {
    try_files $uri $uri/index.html =404;
}

# Katalog ofert (lista) — bez prerenderu wymaga fallbacku
location = /produkty {
    try_files /produkty/index.html /index.html;
}
```

Uwagi: reguła `=404` oznacza, że **każda** nieprerenderowana karta (w tym `sold`, jeśli je wykluczysz) zwróci 404 — to rozwiązuje soft 404, ale wymaga świadomej decyzji o ofertach sprzedanych. Domyślna strona błędu Nginx nie ma layoutu serwisu; warto dodać `error_page 404 /404.html` i wygenerować taki plik w tym samym kroku buildu.

## 6. Aktualność treści

HTML zamraża stan oferty do kolejnej publikacji. Kolejność dezaktualizacji, od najszybszej:

1. **Dostępność** — sprzedaż/rezerwacja zmienia się natychmiast; prerender może pokazywać „Dostępny od razu” dla sprzedanego egzemplarza (także w JSON-LD `availability` → ryzyko ostrzeżeń w GSC i utraty zaufania).
2. **Cena** — zmiana trybu prezentacji lub kwoty; rozbieżność ceny w JSON-LD to najpoważniejsze ryzyko formalne.
3. **Motogodziny / zdjęcia** — zmieniają się rzadko i nie wpływają na zgodność ofertową.

Ograniczenie ryzyka bez automatycznych buildów:
- Po pierwszym renderze React nadpisuje treść aktualnymi danymi z Supabase — użytkownik zawsze widzi stan bieżący; zamrożony jest wyłącznie HTML dla botów.
- Publikacja natychmiast po każdej zmianie dostępności lub ceny — jedna reguła operacyjna zamiast automatyzacji.
- Ostrożniejszy wariant: w prerenderze pomijać `offers.price` i emitować tylko `availability` z bieżącego statusu; albo pomijać cały blok `offers` i pozostawić go warstwie klienckiej. Kosztuje część korzyści SEO, eliminuje ryzyko rozbieżnej ceny.
- W stopce wygenerowanego HTML data publikacji jako komentarz — ułatwia audyt „jak stary jest ten plik”.

## 7. Ryzyko regresji

| Obszar | Ryzyko | Uwagi |
|---|---|---|
| Obecny build | Niskie–średnie | Krok dodany po `vite build`; błąd skryptu nie powinien psuć `dist/`, ale przy `&&` w skrypcie przerwie publikację. Skrypt uruchamiany osobnym polecenniem, nie wpięty w `build` |
| Deep linki | Średnie | Zależne **wyłącznie** od poprawnej reguły Nginx; zła kolejność `try_files` = 404 na istniejących ofertach |
| Panel administracyjny `/admin` | Brak | Nie jest prerenderowany; obsługiwany fallbackiem SPA — pod warunkiem że reguła `^~ /produkty/` nie obejmuje `/admin` (nie obejmuje) |
| `/oferta/:token` | Brak, jeśli fallback zachowany | Token jest dynamiczny; musi trafiać w `/index.html` |
| GA4 / Consent Mode | Niskie | Skrypty są w `index.html`; szablon prerenderu musi być tworzony z **wygenerowanego** `dist/index.html`, nie z pliku źródłowego — inaczej zgubi hashe assetów i tagi analityczne |
| Edge Function `sitemap` | Brak | Niezależna od `dist/`; zakres prerenderu warto trzymać zgodny z filtrem sitemapy (bez `sold`) |
| Nieistniejący produkt | Poprawa | 200 → 404 na poziomie serwera; gałąź „Produkt niedostępny” z `noindex` pozostaje dla przypadków fallbacku |
| Podwójne meta | Niskie | Statyczne tagi mają `data-rh="true"`; szablon prerenderu musi je **zamienić**, a nie dopisać obok |

## 8. Plan etapowy

**Etap 1 — jedna oferta testowa.** Skrypt renderuje wyłącznie slug podany w argumencie, do `dist/produkty/<slug>/index.html`. Weryfikacja: `curl` bez JS pokazuje H1, opis, parametry, dostępność i jeden blok JSON-LD `Product`; dokładnie jeden `meta[name="description"]`; w przeglądarce karta działa, konsola bez błędów, nawigacja SPA bez przeładowań.

**Etap 2 — reguła Nginx na środowisku testowym.** Weryfikacja: prerenderowany slug = 200 z pliku, nieistniejący = 404, `/produkty`, `/oferta/:token`, `/admin` = 200 przez fallback.

**Etap 3 — cały katalog z limitem.** Weryfikacja: liczba wygenerowanych plików = liczba ofert kwalifikujących się, przyrost `dist/` w oczekiwanym zakresie, wyrywkowa kontrola 5 kart (cena/„na zapytanie”, dostępność, FAQ w DOM).

**Etap 4 — FAQ, tłumaczenia, `error_page 404`.** Weryfikacja: `FAQPage` zgodny z widoczną treścią; strona 404 w layoucie serwisu.

**Etap 5 — procedura publikacji.** Krótka instrukcja: kiedy publikować po zmianie oferty; kontrola w GSC po tygodniu.

## 9. Decyzje przed wdrożeniem

1. Metoda renderu: drugi punkt wejścia + `react-dom/server` (zmiany w kodzie, brak nowych zależności systemowych) czy headless Chromium na `dist/` (bez obejść w kodzie, wymaga Chromium w środowisku builda)?
2. Oferty `sold`: pominąć w prerenderze i zwracać 404, prerenderować z `noindex`, czy pozostawić fallback SPA z 200?
3. Cena w prerenderowanym JSON-LD: pełne `offers` z ceną (ryzyko rozbieżności) czy tylko `availability`?
4. Hydratacja: pozostać przy `createRoot` (mignięcie treści, zero mismatchu) czy dążyć do `hydrateRoot` z danymi w HTML?
5. Uruchamianie: osobne polecenie po `vite build` czy wpięcie w `build` (ryzyko blokady publikacji przy błędzie)?
6. Czy administrator serwera może zmienić `try_files` i dodać `error_page` — bez tego prerender nie przyniesie żadnego efektu?
7. Zakres języków: tylko PL (obecne adresy) — potwierdzenie, że wersje EN/DE/SK/CS nie mają osobnych URL do prerenderu.

## Ocena opłacalności

Prerender w tej architekturze jest **wykonalny i opłacalny**, ale pod dwoma warunkami: (a) administrator zmieni `try_files` — bez tego nakład jest w całości bezużyteczny; (b) publikacja następuje po każdej zmianie dostępności lub ceny. Największe realne ryzyko to nie technika renderu, lecz zamrożone dane ofertowe w JSON-LD. Jeżeli warunek (a) lub (b) nie jest pewny, korzystniej ograniczyć zakres do samego `<head>` (title, description, canonical, OG) plus H1 i parametry, bez bloku `offers` z ceną — mniejsza korzyść, ale ryzyko rozbieżności praktycznie zerowe.

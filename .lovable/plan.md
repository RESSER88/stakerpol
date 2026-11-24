# Raport: SEO po stronie serwera (S1, S2, S3, L1) — tylko analiza

Nic nie zostało zmienione. Poniżej stan obecny, ryzyka i plan etapów.

## 1. Stan obecny

- **`scripts/postbuild.cjs`**: zmienia `dist/index.html` na `dist/index.php`, usuwa skrypt edytora Lovable i wstawia blok PHP na początku pliku. Blok:
  - normalizuje adres (usuwa stare prefiksy `/pl|en|cs|sk|de`),
  - ma stałą listę 6 tras z tytułami: `/`, `/produkty`, `/kontakt`, `/opinie`, `/faq`, `/prywatnosc`,
  - `/produkty/<cokolwiek>` uznaje za znaną stronę (regex), bez sprawdzania w bazie,
  - podmienia tylko `<title>`, `canonical`, `meta robots`, `og:url`. Karta produktu dostaje tytuł strony głównej, a description, og:title, og:description, og:image i twitter:* zostają domyślne z `index.html`,
  - nieznane adresy dostają `noindex, follow`, ale **zawsze HTTP 200** (blok nie wywołuje `http_response_code`).
- **`public/sitemap.php`**: pobiera `slug,id,updated_at` produktów `available|reserved`, ma timeout 5/10 s i awaryjną kopię w `sys_get_temp_dir()`. **Wysyła dziś `apikey` oraz `Authorization: Bearer <publishable>`**. Jest to niezgodne z regułą „tylko apikey” dla nowego kodu.
- **`public/robots.txt`**: dwie linie `Sitemap:`, `stakerpol.pl/sitemap.php` i `…supabase.co/functions/v1/geo-feed`.
- **`public/sitemap.xml`**: nie ma go w repozytorium. Na produkcji `/sitemap.xml` daje 200, bo fallback nginx kieruje go do `index.php`, a ten zwraca 200. Adres `sitemap.xml` występuje jeszcze w `public/llms.txt` (linia 28) i w `SEOManagerTool.tsx` (lista do sprawdzenia w panelu).
- **LocalBusiness**: `src/components/seo/LocalBusinessSchema.tsx`, używany tylko na stronie głównej (`Index.tsx`, renderowany przez JS):
  - `foundingDate: "2010"`,
  - `logo: https://stakerpol.pl/logo.png`, a w `public/` nie ma takiego pliku. Są tylko obrazy w `lovable-uploads/` (24 pliki),
  - `description`, `hasOfferCatalog`, `knowsAbout` i `serviceType` wymieniają wózki spalinowe, części i wynajem.
- **`public/_redirects`**: reguła Netlify, na nginx jej nie ma. Bez wpływu.

## 2. Dane karty produktu

Karta (`ProductDetail.tsx` + `generateProductSchema.ts`) bierze dane z tabeli `products` + `product_images`, a schemat dodatkowo z `product_seo_settings`:
- **title:** `name` (model) + `production_year` + `lift_height` mm + `lift_capacity_mast` kg + „| Stakerpol”.
- **description:** „Używany {name}”, rok, podnoszenie, udźwig, `working_hours` mth, tekst zależny od `availability_status` (available, reserved, sold) i stały dopisek.
- **og:image:** pierwsze z `product_images.image_url` (wg `display_order`), a gdy go brak, `products.image_url`.
- **JSON-LD Product:** name, brand Toyota, model (regex SWE/BT), sku, description, url, image[], additionalProperty (wysokość, udźwigi, …), productionDate, gtin/mpn z `product_seo_settings`.
- **offers:** cena tylko gdy `price_display_mode = 'show_price'` i `net_price > 0` (`resolvePriceView`). Bez ceny Product nie ma `offers`. Ta reguła zostaje bez zmian.
- **Wyszukanie produktu:** po `slug`. Gdy adres wygląda jak UUID, także po `id` (stare linki).
- **Pobranie w PHP:** `GET {SUPABASE_URL}/rest/v1/products?select=…,product_images(image_url,display_order)&slug=eq.<slug>&limit=1` z nagłówkiem `apikey: sb_publishable_…`, bez `Authorization`. Publishable key bez Bearera działa w PostgREST jako rola anon. Odczyt `products` przez anon jest dozwolony, bo tak działa dziś strona. Opcjonalnie drugie zapytanie do `product_seo_settings` (gtin/mpn). Przed wdrożeniem sprawdzę curlem, czy anon ma tam SELECT.
- **Uwaga o zgodności:** logika tytułu, opisu i schematu będzie powielona w PHP. Każda późniejsza zmiana w React wymaga zmiany w PHP. Zabezpieczenie: komentarz w obu miejscach i test porównawczy (curl HTML z serwera kontra tytuł po JS w podglądzie).

## 3. Zależności i ryzyko regresji

- **Supabase nie odpowiada lub zwraca błąd:** cURL z `CONNECTTIMEOUT 2 s` i `TIMEOUT 3 s`, wszystko w `try` z wyciszeniem ostrzeżeń. Każdy błąd daje domyślny blok SEO i **HTTP 200**, nigdy 404 ani błąd PHP. Fallback `file_get_contents` tylko przy braku cURL.
- **Czas odpowiedzi:** każda karta dostaje dodatkowe zapytanie (zwykle ok. 50–150 ms do eu Supabase). Najgorszy przypadek to +3 s do TTFB przy awarii. Zapobiega temu cache.
- **Cache:** plik JSON na slug w `sys_get_temp_dir()/stakerpol-seo/`, TTL 10 min dla trafień i 2 min dla „brak produktu” (ważne dla S2). Przy awarii użyję przeterminowanej kopii, jeśli istnieje. Nagłówki `Cache-Control` w `index.php` zostają bez zmian.
- **Treść HTML:** wszystkie wartości przez `htmlspecialchars`, a JSON-LD przez `json_encode(..., JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_HEX_TAG)` (ochrona przed `</script>`).
- **Helmet po JS:** nadpisze tagi z atrybutem `data-rh`. Nowe tagi z serwera dostaną `data-rh="true"`, żeby nie było duplikatów. JSON-LD z serwera dostanie `id`, a React doda własny. Przez krótki czas mogą istnieć dwa identyczne bloki Product. Google to toleruje, bo treść jest ta sama. Alternatywa: wyłączyć JSON-LD Product w React (zmiana w kodzie strony, decyzja niżej).
- **Build:** `postbuild.cjs` przerywa build, gdy nie rozpozna tagów. Nowe podmiany (description, og:title, og:description, og:image, twitter:*) będą mieć tę samą ochronę.

## 4. S2: skąd PHP wie, co istnieje

- **Trasy stałe:** lista z `$seoTitles` plus `/admin` i `/oferta/<token>` (zawsze 200 i noindex jak dziś). Stare adresy `/products`, `/products/:id`, `/contact`, `/testimonials`, `/privacy` dostają 200, bo React przekierowuje. Opcjonalnie w przyszłości 301 w nginx, poza zakresem.
- **`/produkty/<slug>`:** zapytanie z S1 (to samo, z cache).
  - **Brak wiersza:** HTTP 404 + `noindex, follow`, aplikacja React i tak pokaże „Produkt niedostępny”.
  - **Błąd lub timeout Supabase:** 200 z domyślnym blokiem (nigdy 404). Rozróżnienie: 404 tylko przy poprawnej odpowiedzi HTTP 200 z pustą tablicą `[]`.
  - **Produkt dodany po buildzie:** jest w bazie, więc 200. Lista nie jest zapisywana w buildzie.
- **Inne nieznane adresy:** 404 + noindex. Pliki statyczne (`/assets`, obrazy) obsługuje nginx przed fallbackiem.
- **Produkty sprzedane (`sold`):** dziś karta istnieje i jest indeksowalna z tekstem „Egzemplarz sprzedany”, ale nie ma jej w sitemapie. Do decyzji (pytanie 2).

## 5. Ryzyka SEO

- **Brak `review` i `aggregateRating`:** Google może zgłosić ostrzeżenie (nie błąd) w raporcie fragmentów rozszerzonych „Produkt”. Nie dodajemy ich bez prawdziwych opinii przypisanych do egzemplarza. Ocen nie wymyślamy.
- **Brak `offers` przy ukrytej cenie:** Product bez offers nie kwalifikuje się do wyników z ceną (merchant listing). To akceptowalne i zgodne z treścią.
- **Zgodność z widoczną treścią:** JSON-LD tylko z pól pokazanych na karcie, z tą samą regułą ceny i tym samym statusem.
- **Canonical, slugi i adresy:** bez zmian, logika `$seoCanonical` zostaje.
- **S3:** po usunięciu `geo-feed` z robots.txt Google może jeszcze przez jakiś czas pamiętać tę mapę. Warto ją usunąć ręcznie w GSC. `/sitemap.xml` może dostać 404 (z S2) albo 301 na `/sitemap.php` (pytanie 3).
- **L1:** zmiana opisu i oferty usuwa z danych frazy „wynajem”, „spalinowe” i „części”. To zgodne z faktami, bez ryzyka kary.

## 6. Plan etapów

**Etap 1 = L1 + S3**
- `LocalBusinessSchema.tsx`: `foundingDate "2008"`, logo na istniejący plik (pytanie 1), description, hasOfferCatalog, knowsAbout i serviceType ograniczone do sprzedaży i serwisu używanych elektrycznych paleciaków / wózków paletowych Toyota BT.
- `robots.txt`: usunąć linię `Sitemap: …supabase.co/functions/v1/geo-feed`.
- `/sitemap.xml`: wg pytania 3. `llms.txt` linia 28 na `/sitemap.php`.
- Testy:
  - `curl -sI https://stakerpol.pl/<logo>` daje 200,
  - `curl -s https://stakerpol.pl/robots.txt | grep Sitemap` pokazuje jedną linię,
  - `curl -sI https://stakerpol.pl/sitemap.xml` daje oczekiwany kod,
  - Rich Results Test strony głównej.

**Etap 2 = S1**
- `postbuild.cjs` rozszerzony o pobranie produktu w PHP (apikey only, timeout, cache), unikalne title, description, og:*, twitter:* i JSON-LD Product w HTML.
- Testy:
  - `curl -s https://stakerpol.pl/produkty/<slug> | grep -E '<title>|description|og:|ld\+json'` pokazuje dane wózka,
  - porównanie z kartą po JS,
  - produkt z ceną i bez ceny (offers lub jego brak),
  - symulacja awarii (zły URL Supabase w kopii testowej) daje 200 i blok domyślny.

**Etap 3 = S2**
- Kody 404 w bloku PHP wg punktu 4.
- Testy:
  - `curl -o /dev/null -w '%{http_code}'` dla `/nie-ma-takiej-strony` i `/produkty/nie-ma-6000000` daje 404 oraz `noindex`,
  - 6 tras stałych i losowe karty dają 200,
  - nowo dodany produkt w panelu daje 200 w ciągu TTL cache „brak” (do 2 min),
  - przy awarii Supabase strona daje 200.

## 7. Decyzje przed startem

1. **Logo:** którego pliku użyć? Mogę wskazać obraz z `lovable-uploads/` (ten sam co logo w nagłówku), albo Ty wgrasz `logo.png` do `public/`.
2. **Sprzedane wózki:** (a) 200 i index jak dziś, (b) 200 i noindex, (c) 410/404. Rekomenduję (a) lub (b), nie 404.
3. **`/sitemap.xml`:** 404 (po etapie 3) czy 301 na `/sitemap.php` w nginx? Rekomenduję 301 w konfiguracji nginx, którą zmieniasz Ty, bo nie ma jej w repozytorium.
4. **`sitemap.php`:** usunąć z niego nagłówek `Authorization: Bearer`, żeby był zgodny z regułą „tylko apikey”? Zmiana poza literą celu, dlatego pytam.
5. **JSON-LD Product w React:** zostawić podwójny (serwer + JS), czy w etapie 2 wyłączyć wersję z JS?
6. **Edge Function `sitemap` i panel SEO:** wpis `sitemap.xml` w `SEOManagerTool.tsx` zostaje, chyba że zdecydujesz inaczej.

# Etap 3 z 3 — treść kart i listy produktów w HTML z serwera (raport, bez wdrożenia)

## 1. Start aplikacji i ryzyko migania
- `src/main.tsx`: `createRoot(document.getElementById("root")).render(...)` — nie `hydrateRoot`. React przy starcie zastępuje całą zawartość `#root`, bez błędów hydracji (nie ma porównywania DOM).
- Ryzyko: między pierwszym malowaniem HTML z serwera a startem Reacta użytkownik zobaczy prostą wersję, potem skeleton/kartę → możliwe miganie i CLS (CLS liczy się też przed startem JS).
- Ukrycie treści (`display:none`, `visibility:hidden`, poza ekranem) — odrzucone jako cloaking.
- Bezpieczny wariant: treść serwera jest widoczna, prosta, z tymi samymi danymi co karta, w kontenerze o stałej minimalnej wysokości (`min-height:100vh`) i z obrazem z `width`/`height`. React podmienia ją całą naraz; zmiana zawartości przy zamianie korzenia nie jest przesunięciem układu wywołanym przez użytkownika, ale LCP/CLS trzeba zmierzyć (krok 2). Jeśli PageSpeed się pogorszy — fallback: tylko `<noscript>`-podobna wersja nie jest dopuszczalna dla botów JS-owych, więc zostawiamy wariant widoczny i upraszczamy go (np. bez zdjęcia).

## 2. Pola i dostęp anon
Polityki SELECT (sprawdzone w bazie): `products`, `product_images`, `product_seo_settings` — „Anyone can view…”, `qual = true`. Klucz publishable ma odczyt.

Karta — jedno zapytanie:
`products?slug=eq.<slug>&select=id,slug,name,serial_number,production_year,lift_capacity_mast,lift_capacity_initial,working_hours,lift_height,min_height,mast,battery,condition,condition_label,drive_type,free_lift,short_description,detailed_description,image_url,main_image_alt,availability_status,price_display_mode,net_price,price_currency,product_images(image_url,alt_text,display_order),product_seo_settings(gtin,mpn,price,price_currency,price_valid_until,availability,item_condition,enable_schema,delta_content)`
(dokładne pola ceny do potwierdzenia 1:1 z `resolvePriceView` w `src/utils/productPricing.ts` przy Buildzie).

Lista — jedno zapytanie:
`products?availability_status=eq.available&select=slug,name,production_year,image_url&order=created_at.desc`
(kolejność jak na `/produkty` do potwierdzenia przy Buildzie).

Zastępuje to dzisiejsze `select=slug` dla kart (jedno zapytanie zamiast dwóch).

## 3. Zgodność PHP ↔ React
Źródła reguł:
- Title: `ProductDetail.tsx` `getMetaTitle` — `"{name}[ {rok}][ — {lift_height} mm, {lift_capacity_mast} kg] | Stakerpol"`.
- Description: `getMetaDescription` — „Używany {name}, rok…, podnoszenie… mm, udźwig… kg, … mth.” + zdanie statusu (available/reserved/sold) + stały dopisek.
- og:image: pierwsze zdjęcie z galerii, inaczej `image_url`; og:image:alt = `getMainImageAlt`.
- JSON-LD: `src/utils/seo/generateProductSchema.ts` (brand, model z regexu SWE/BT, additionalProperty, offers tylko gdy cena widoczna wg `resolvePriceView`, GTIN tylko poprawny).
- Cena i status: `resolvePriceView`.
Zasada: komentarz „ZMIEŃ W OBU MIEJSCACH: scripts/postbuild.cjs” w każdym z tych plików i odwrotnie.
Test zgodności (do dodania w Buildzie): skrypt, który dla 2–3 produktów pobiera dane, liczy title/description/JSON-LD funkcjami TS i porównuje z HTML z `php -S dist/index.php` (identyczny tekst, JSON-LD porównany jako obiekt).

## 4. Czas, cache, awarie, bezpieczeństwo
- Czas: trafienie w cache ~0 ms; brak cache = 1 zapytanie (timeout jak dziś 2/3 s). Odpowiedź karty: dziś też 1 zapytanie, więc bez pogorszenia.
- Cache: plik JSON na slug w `sys_get_temp_dir()`, TTL 10 min (jest) / 2 min (brak), lista TTL 10 min. Rozmiar: karta ~3–8 KB, lista ~20–40 KB (≈123 produkty) → <1 MB łącznie. Zapis atomowy (`tempnam` + `rename`).
- Awaria Supabase / zły JSON / brak cURL: 200, dzisiejszy pusty `#root` i dzisiejsze meta — każdy krok w `try`, `@` przy I/O, brak warningów. 404 nadal tylko przy odpowiedzi 200 z `[]`.
- Escape: `htmlspecialchars($v, ENT_QUOTES|ENT_SUBSTITUTE, 'UTF-8')` dla tekstu i atrybutów; JSON-LD przez `json_encode(..., JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)`; URL zdjęć tylko `https://`; opisy jako zwykły tekst (bez HTML z bazy).

## 5. Dublowanie JSON-LD
`index.html` ma już tagi z `data-rh="true"` — react-helmet-async przy starcie usuwa tagi z tym atrybutem i wstawia swoje. Serwer wstawia meta i `<script type="application/ld+json" data-rh="true">` Product (oraz własny title) → po starcie Reacta Helmet je zastępuje, nie ma dubla. Boty bez JS widzą jeden Product. Do potwierdzenia w kroku 1 (licznik `ld+json` Product w DOM po starcie = 1).

## 6. Plan Buildu (2 kroki)
Krok 1 — karta `/produkty/<slug>`: rozszerzone zapytanie, head (title, description, og:*, twitter:*, JSON-LD z `data-rh`), treść w `#root` (H1, zdjęcie z alt i wymiarami, parametry, opis, cena wg reguły, status, linki `/produkty`, `/kontakt`), komentarze „zmień w obu miejscach”, test zgodności.
Test: `curl -A "OAI-SearchBot/1.0"` na 2 kartach → różne `<title>`, H1 i parametry w HTML, 1 JSON-LD Product; karta sprzedana/zarezerwowana; awaria Supabase → 200 i pusty `#root`; w przeglądarce 1 Product po starcie.
Krok 2 — `/produkty` (H1 + lista dostępnych: nazwa, rok, link, miniatura) i strony stałe.
Test: curl `/produkty` → H1 i linki do kart; PageSpeed mobile/desktop dla `/`, `/produkty` i karty porównany z dziś (LCP, CLS).

Strony stałe: H1 i akapity można wziąć tylko z istniejących tekstów (opisy meta z `featureFlags.ts`/`Index.tsx`, tłumaczenia PL). Jeśli dla `/faq` i `/opinie` nie ma krótkiego gotowego tekstu — pomijamy (bez nowego tekstu). Do potwierdzenia przy Buildzie.

## 7. Pytania do właściciela
1. Czy na kartach sprzedanych pokazywać w HTML z serwera pełną treść i status „sprzedany” (jak dziś po JS) — zakładam tak.
2. Lista `/produkty`: tylko `available`, czy też zarezerwowane (jak widzi użytkownik)?
3. Czy dopuszczasz `delta_content` (zatwierdzony opis AI) w treści serwera, gdy jest ustawiony?
4. Akceptujesz krótkie widoczne miganie przy starcie Reacta, jeśli PageSpeed nie pokaże pogorszenia CLS?
5. Strony stałe bez gotowego tekstu — pominąć (domyślnie tak)?

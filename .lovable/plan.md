# Raport diagnostyczny — „Generuj dostęp” (link do listy wózków dla klienta)

Analiza, bez zmian w kodzie. Wszystkie stwierdzenia poniżej wynikają z odczytu plików projektu.

## 1. Stan obecny

- Zakładka eksportu: `src/components/admin/sections/ExportSection.tsx` — trzy wiersze akcji (`ExportRow`: 01 PDF, 02 JPG, 03 XLSX), stan `filtered: Product[]`, toasty.
- Akcje: `exportProductListToPDF` i `exportProductListToJPG` w `src/utils/listExporter.ts`, `exportProductListToBrandedXLSX` w `src/utils/xlsxExporterV2.ts`.
- Filtry eksportu: `src/components/admin/sections/ExportFilterPanel.tsx`.
- Wejście panelu: `src/pages/Admin.tsx` (`case 'export'`), produkty z `useSupabaseProducts`.
- Publiczna lista i jej filtry (osobny mechanizm): `src/components/products/FilterModal.tsx` (`FilterCriteria`, `matchesCriteria`), `src/pages/Products.tsx`.

Jak przechowywane są filtry eksportu: wyłącznie jako lokalny stan Reacta w `ExportFilterPanel` (`groups`, `platform`, `availability`, `serial`, `year`, `hours`, `height`), a w górę przekazywana jest tylko już przefiltrowana tablica produktów (`onChange(filtered)`). Same kryteria nie opuszczają komponentu.

Serializowalność: wartości są prostymi typami (tablice stringów, string, pary liczb), więc dają się zapisać do JSON bez przeszkód. Wymagane jest jednak jedno uzupełnienie: `ExportFilterPanel` musi dodatkowo wystawiać obiekt kryteriów (obok listy przefiltrowanej), bo dziś nie ma go skąd wziąć. Uwaga na zakresy suwaków: ich granice liczone są z aktualnego zbioru produktów (`bounds`), więc zapisanie wartości brzegowych jako liczb utrwali „przypadkowe” progi z chwili generowania — potrzebny jest znacznik „zakres nietknięty” albo zapis granic razem z wartościami.

## 2. Źródło danych

Tak — `src/utils/exportListModel.ts` (`buildExportRows`, `EXPORT_COLUMNS`, `COMPANY`, `WAREHOUSE`, formatery, `availabilityLabel`) plus `src/utils/productNormalization.ts` mogą być jedynym źródłem prawdy dla mini-strony. `buildExportRows` zwraca dokładnie ten zakres, który wymieniasz: numer pozycji, model znormalizowany, nr seryjny, rok, motogodziny, udźwig, wysokość, maszt, bateria, dostępność, cena netto + waluta z flagą `showPrice`, `productUrl`, grupowanie po modelach i podsumowanie.

Co stoi na przeszkodzie (drobne):
- Model zawiera `mailtoHref` z adresem firmowym — na mini-stronie zamiast „Zapytaj o cenę” jako mailto sensowniej użyć neutralnej etykiety lub linku do formularza; sam model nie wymaga zmiany.
- Kolumna „Zdjęcia” w plikach jest hiperłączem do `productUrl`; na mini-stronie naturalne będzie to samo łącze (lub miniatura), ale to warstwa prezentacji.
- Filtrowanie po stronie odbiorcy musi używać tej samej logiki co panel — dziś przeliczanie kryteriów siedzi wewnątrz `ExportFilterPanel` (`filtered` w `useMemo`), więc trzeba je wyodrębnić do czystej funkcji `matchesExportCriteria(product, criteria)` w warstwie utils. Bez tego mini-strona miałaby drugą, rozjeżdżającą się implementację.

## 3. Zależności

- `exportListModel.ts` jest współdzielony przez wszystkie trzy eksporty — każda zmiana kolumn/formatowania zmienia PDF, JPG i XLSX naraz. Dlatego proponuję tylko dodawanie (funkcja dopasowania kryteriów), bez modyfikacji `EXPORT_COLUMNS`.
- `productNormalization.ts` jest używany również przez publiczną listę produktów i filtry — nie ruszamy.
- `ExportSection.tsx` / `ExportFilterPanel.tsx` używane są wyłącznie w zakładce eksportu, więc rozszerzenie panelu o czwartą akcję nie dotyka innych ekranów.
- Ryzyko regresji: zmiana kontraktu `onChange` w `ExportFilterPanel` (dodanie kryteriów) — jedyny konsument to `ExportSection`, więc ryzyko jest lokalne.

## 4. Ponowne użycie

- `ExportFilterPanel` — do wyodrębnienia logiki kryteriów i (opcjonalnie) użycia w wersji „tylko do odczytu” na mini-stronie; jego wygląd jest jednak stylem panelu admina.
- `FilterModal` + `matchesCriteria` (publiczna lista) — alternatywny, gotowy zestaw kontrolek dla odbiorcy, ale operuje na innym zestawie kryteriów niż eksport; łączenie obu zestawów w jeden byłoby oddzielnym refaktorem.
- `buildExportRows` / `EXPORT_COLUMNS` — pełne ponowne użycie dla tabeli i grup.
- `usePublicSupabaseProducts` — gotowy hook czytający produkty z publicznym RLS; mini-strona może z niego korzystać w całości (dane na żywo, bez migawki).
- Komponenty `src/components/ui/table`, `Slider`, `Input` — do złożenia widoku bez nowego designu.

## 5. Zakres zmiany

- Formularze i zapisywanie zapytań (`leads`, `useLeadSubmit`): nie dotyczy, o ile na mini-stronie nie dodajemy formularza. Do decyzji (p. 10).
- Wysyłka maili (`notify-lead`, Resend): nie dotyczy.
- Dane strukturalne i meta: dotyczy tylko negatywnie — trasa mini-strony musi mieć `noindex, nofollow` i nie może wejść do sitemapy ani do JSON-LD.
- Panel administracyjny: dotyczy — czwarta akcja w `ExportSection`, wybór okresu ważności, lista aktywnych linków (opcjonalnie), kopiowanie do schowka.
- Uprawnienia: dotyczy — generowanie linku tylko dla roli `admin` (istniejąca funkcja `has_role`), odczyt linku bez JWT przez Edge Function.
- GA4: mini-strona jest w tej samej aplikacji, więc `usePageTracking` zacznie raportować jej odsłony. Do decyzji: wyłączyć tracking na tej trasie (prywatny link handlowy) albo świadomie zostawić.

## 6. Warstwa danych

Tabela `public.shared_lists`:

| kolumna | typ | uwagi |
| --- | --- | --- |
| `id` | uuid PK, default `gen_random_uuid()` | |
| `token` | text NOT NULL UNIQUE | 32 znaki base64url z CSPRNG |
| `filters` | jsonb NOT NULL DEFAULT `'{}'` | zserializowane kryteria eksportu |
| `label` | text NULL | opis dla admina (np. nazwa klienta) |
| `created_by` | uuid NOT NULL | `auth.uid()` autora |
| `expires_at` | timestamptz NOT NULL | `now() + interval '<n> weeks'` |
| `revoked_at` | timestamptz NULL | ręczne wygaszenie |
| `view_count` | integer NOT NULL DEFAULT 0 | licznik otwarć |
| `last_viewed_at` | timestamptz NULL | opcjonalnie |
| `created_at` / `updated_at` | timestamptz NOT NULL DEFAULT `now()` | trigger `update_updated_at_column` |

Indeksy: unikalny na `token` (wystarcza do lookupu), `idx_shared_lists_expires_at` dla zadania czyszczącego, `idx_shared_lists_created_by`.

RLS: `ENABLE ROW LEVEL SECURITY`, granty **tylko** `service_role` (`GRANT ALL`) i `authenticated` (`SELECT, INSERT, UPDATE, DELETE`); **żadnego grantu dla `anon`**. Polityki: pełne CRUD dla `authenticated` pod warunkiem `public.has_role(auth.uid(), 'admin')`. Rola anonimowa nie ma dostępu do tabeli w ogóle — dane linku wyłącznie przez Edge Function z kluczem serwisowym.

Migracja: czysto addytywna (nowa tabela + trigger + polityki), odwracalna przez `DROP TABLE public.shared_lists`. Nie rusza `products` ani żadnej istniejącej polityki.

Czyszczenie wygasłych: `pg_cron` jest już w projekcie używany (istnieje zadanie `cleanup-old-handled-leads` wywołujące funkcję SQL o 3:00), więc analogicznie funkcja `public.cleanup_expired_shared_lists()` (SECURITY DEFINER, `search_path` ustawiony) usuwająca wiersze `expires_at < now()` (oraz `revoked_at` starsze niż X dni) i harmonogram dzienny. Ograniczenia: pg_cron działa z dokładnością do wpisanego harmonogramu, więc między wygaśnięciem a usunięciem wiersz jeszcze istnieje — dlatego blokada dostępu **nie może** opierać się na kasowaniu, tylko na porównaniu `expires_at` w Edge Function. Doświadczenie z tego projektu: uruchamianie cronów co minutę i logi `cron.job_run_details` / `net._http_response` wcześniej zapchały bazę do ~1 GB — harmonogram dzienny i funkcja SQL (bez `net.http_post`) są tu świadomym wyborem.

## 7. Bezpieczeństwo (odpowiedzi jednoznaczne)

- **Czy odczyt musi iść przez Edge Function z kluczem serwisowym?** Tak. Tabela `shared_lists` bez grantu dla `anon` jest nieosiągalna z przeglądarki, więc walidacja tokenu musi odbyć się w Edge Function używającej `SUPABASE_SERVICE_ROLE_KEY` (`Deno.env.get`). Funkcja przyjmuje token, zwraca wyłącznie `{ filters, expires_at }` (nigdy całego wiersza, nigdy `created_by`) i inkrementuje licznik. Same produkty mogą być czytane z frontendu kluczem publicznym — mają już politykę „Anyone can view products”, więc nie ma potrzeby proxowania listy (co potwierdza `usePublicSupabaseProducts`).
- **Enumeracja tokenów:** 32 znaki base64url (192 bity entropii) z `crypto.getRandomValues` / `crypto.randomUUID` po stronie generowania — nie `Math.random`. Unikalność wymuszona indeksem. Dodatkowo: stały, nieujawniający komunikat 404 dla wszystkich przypadków (nieistniejący / wygasły / wygaszony), brak podpowiedzi w treści błędu, oraz proste ograniczenie tempa po IP w Edge Function (świadomie prymitywne — platforma nie daje tu gotowego primitywu).
- **Weryfikacja ważności po stronie serwera:** Edge Function porównuje `expires_at > now()` i `revoked_at IS NULL` przed zwróceniem czegokolwiek; frontend nigdy nie otrzymuje danych, jeśli warunek nie jest spełniony. Data ważności nie jest zaszyta w tokenie, więc klient nie ma czego obejść ani „przestawić zegara”.
- **Czy generowanie wymaga JWT i roli admin?** Tak. Wariant prosty i wystarczający: insert z frontendu panelu przez zwykłego klienta Supabase — wtedy polityka RLS `has_role(auth.uid(),'admin')` wymusza rolę po stronie bazy. Jeśli generowanie ma iść przez Edge Function, to obowiązkowo `getClaims(token)` z nagłówka `Authorization` + sprawdzenie roli, zanim funkcja użyje klucza serwisowego.
- **Ryzyko wycieku sekretu do buildu:** przy powyższym podziale — nie ma. Klucz serwisowy żyje wyłącznie w Edge Function (`Deno.env.get`), a frontend używa już obecnego klucza publicznego z `src/integrations/supabase/client.ts`. Ryzyko powstałoby tylko, gdyby ktoś wciągnął `SERVICE_ROLE_KEY` do zmiennej `VITE_*` — tego nie robimy.

## 8. Indeksowanie

Warunek konieczny, trzy warstwy jednocześnie:
1. `noindex, nofollow, noarchive` przez `react-helmet-async` na trasie mini-strony (projekt już używa Helmeta) — plus brak canonicala i brak og:image.
2. Wpis w `public/robots.txt`: `Disallow: /s/` dla `User-agent: *` oraz dla wymienionych tam imiennie botów (Googlebot, Bingbot, GPTBot itd. mają własne bloki, więc reguła musi trafić do każdego z nich, inaczej ich nie obejmie).
3. Brak trasy w sitemapie — funkcja `supabase/functions/sitemap/index.ts` generuje URL-e z twardej listy stron plus produktów, więc nowa trasa nie pojawi się tam sama; wystarczy jej nie dodawać. To samo dotyczy `geo-feed`.

Kolizja z SPA w `dist`: brak. `public/_redirects` zawiera `/* /index.html 200`, a hosting Lovable ma wbudowany fallback SPA dla ścieżek bez rozszerzenia, więc `/s/:token` trafi do `index.html` i obsłuży ją React Router. Warunek: token nie może zawierać kropki (base64url jej nie zawiera), bo ścieżka „wyglądająca jak plik” nie dostaje fallbacku. Trasa musi też zostać dodana w `src/App.tsx` przed `path="*"`, inaczej wpadnie w `NotFound`.

## 9. Wymagania szczegółowe

- Link wygasły / wygaszony ręcznie / nieistniejący: jeden i ten sam ekran „Link jest nieaktywny” bez rozróżnienia przyczyny (przeciwdziała sondowaniu), z kontaktem telefonicznym i mailowym z `COMPANY`. Status HTTP z Edge Function: 404 dla wszystkich trzech.
- Pusty wynik filtru: komunikat „Brak pozycji spełniających kryteria” + przycisk czyszczenia filtrów odbiorcy. Rozróżnienie dwóch przypadków: brak wyników po filtrach odbiorcy (można wyczyścić) vs. zapisany filtr nie zwraca dziś nic (komunikat o kontakcie).
- Pozycja zniknęła z bazy: dane są na żywo, więc pozycja po prostu nie występuje; numeracja `buildExportRows` przelicza się od nowa i będzie ciągła. Konsekwencja do zaakceptowania: numery pozycji na mini-stronie mogą różnić się od wcześniej wysłanego XLSX-a.
- Układ mobilny: tabela dla desktopu, karty (model + nr seryjny w nagłówku, parametry w dwóch kolumnach, cena wyróżniona) na mobile — wzorem `ProductCardMobile` / `ProductsTableDesktop` z panelu. Filtry odbiorcy na mobile w wysuwanym panelu, nagłówki grup modeli przyklejone (sticky).
- Dostępność: nagłówki tabeli `<th scope="col">`, grupy jako `<caption>` lub nagłówek sekcji z `aria-labelledby`, kontrolki filtrów z `<label>`, focus widoczny, kontrast tekstu wyszarzonego nie niżej niż 4.5:1, obsługa klawiatury dla chipów (są `<button>`).
- RODO / licznik otwarć: liczymy wyłącznie zdarzenia zagregowane (`view_count`, `last_viewed_at`) — bez IP, bez user-agenta, bez identyfikatora odbiorcy. Takie dane nie są danymi osobowymi. Gdybyśmy chcieli logować IP, potrzebna byłaby podstawa prawna i wpis w polityce prywatności — proponuję tego nie robić. Rate-limiting po IP w pamięci funkcji (bez utrwalania) jest tu bezpieczny.

## 10. Plan etapowy i pytania otwarte

**Etap 1 — baza i RLS (osobno, pierwszy).** Migracja tworząca `shared_lists` z grantami, RLS i politykami admina, trigger `updated_at`, funkcja `cleanup_expired_shared_lists()` + dzienne zadanie pg_cron. Uzasadnienie: to jedyny etap wymagający zatwierdzenia migracji; reszta prac zależy od gotowego schematu, a etap jest w pełni odwracalny.

**Etap 2 — serializacja kryteriów.** Wyodrębnienie kryteriów eksportu i czystej funkcji dopasowania do `src/utils/` (bez zmian w `EXPORT_COLUMNS` i bez ruszania PDF/JPG/XLSX), rozszerzenie `ExportFilterPanel` o zwracanie kryteriów. Uzasadnienie: gwarantuje, że mini-strona i XLSX są z definicji zgodne.

**Etap 3 — Edge Function odczytu.** `shared-list` z kluczem serwisowym: walidacja tokenu, `expires_at`, `revoked_at`, inkrement licznika, jednolite 404, minimalna odpowiedź.

**Etap 4 — akcja „Generuj dostęp” w panelu.** Czwarty wiersz w `ExportSection`, wybór 1–4 tygodni, insert, kopiowanie linku, lista aktywnych linków z możliwością wygaszenia.

**Etap 5 — mini-strona.** Trasa `/s/:token` w `App.tsx`, `noindex` przez Helmet, wpisy w `robots.txt`, widok desktop + mobile na `buildExportRows`, filtry odbiorcy, stany brzegowe i dostępność.

**Decyzje do podjęcia przed startem:**
1. Prefiks trasy — proponuję `/s/:token`; alternatywa `/oferta/:token`.
2. Czy mini-strona ma zawierać formularz zapytania (wtedy wchodzi `leads` i `source`), czy tylko telefon/mail.
3. Czy „Zapytaj o cenę” ma pozostać `mailto`, czy neutralną etykietą bez adresu.
4. Czy na mini-stronie mają być miniatury zdjęć, czy tylko odnośnik do karty produktu.
5. Czy pozycje sprzedane mają być widoczne, jeśli zapisany filtr je obejmował.
6. Czy pokazywać odbiorcy datę ważności linku.
7. Czy wyłączyć GA4 na tej trasie.
8. Czy potrzebna jest lista aktywnych linków z ręcznym wygaszaniem już w pierwszym wdrożeniu (Etap 4), czy wystarczy samo generowanie.
9. Zakresy suwaków: zapisywać wartości brzegowe czy znacznik „bez ograniczenia”.
10. Czy w nagłówku mini-strony ma być blok magazynu z linkiem do map, jak w eksportach.

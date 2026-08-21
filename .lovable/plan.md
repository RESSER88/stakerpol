# Synchronizacja zapytań Supabase → leadbox (Tailscale)

Raport wyłącznie analityczny. Nie wprowadzono żadnych zmian w kodzie, bazie, RLS ani Edge Functions.

## Część A — tabela zapytań

Jedna tabela: `public.leads`. (Historyczna `public.price_inquiries` istnieje, ale formularze zapisują dziś wyłącznie do `leads`.)

| Kolumna | Typ | Uwagi |
|---|---|---|
| id | uuid | klucz główny, default `gen_random_uuid()` |
| created_at | timestamptz NOT NULL | znacznik utworzenia, default `now()` |
| name | text | może być NULL |
| phone | text | nullable (po ostatniej migracji) |
| email | text | nullable |
| message | text | |
| source | text NOT NULL | np. `product_page`, `home_hero_form` |
| product_id | uuid | FK → `products.id` |
| page_url | text | |
| user_agent | text | |
| rodo_accepted | boolean NOT NULL | |
| status | text NOT NULL | `new` / `handled` |
| handled_at | timestamptz | ustawiane triggerem |
| sold_at | timestamptz | oznaczenie sprzedaży |

Ograniczenie: `leads_contact_check` — `phone IS NOT NULL OR email IS NOT NULL`.

Jednoznaczny identyfikator rekordu: `id` (uuid, klucz główny, unikalny indeks `leads_pkey`). To jest właściwy klucz deduplikacji po stronie leadboksu.

Indeksy: `leads_pkey` (unique na `id`), `idx_leads_created_at` (btree `created_at DESC`) — tak, indeks na znaczniku czasu istnieje, `idx_leads_source`, `idx_leads_status`, `idx_leads_sold_at` (partial).

## Część B — co dzieje się przy zapisie

1. `trg_leads_notify` — AFTER INSERT ON leads → funkcja `public.notify_lead_created()`. Buduje payload JSON (dane leada + nazwa i nr seryjny produktu), wysyła synchroniczny `public.http_post` na `https://<ref>.supabase.co/functions/v1/notify-lead`. Błędy tłumione (`EXCEPTION WHEN OTHERS → RAISE WARNING`), więc nie blokują zapisu.
2. `trg_set_lead_handled_at` — BEFORE UPDATE ON leads → `public.set_lead_handled_at()`. Ustawia `handled_at = now()` przy zmianie statusu na `handled`, zeruje przy cofnięciu. Nie działa przy INSERT.
3. Edge Function `notify-lead` (`supabase/functions/notify-lead/index.ts`) — wysyła e-mail przez Resend na `info@stakerpol.pl`; jeśli ustawiony sekret `LEAD_WEBHOOK_URL`, robi dodatkowo `POST` z pełnym payloadem leada na ten adres. Dziś ten sekret nie jest ustawiony w projekcie.
4. pg_cron: dwa zadania, żadne nie dotyczy zapisu: `cleanup-old-handled-leads` (codziennie 03:00, anonimizuje leady starsze niż 24 miesiące) i `cleanup-expired-shared-lists` (03:15).
5. Realtime: tabela `leads` **nie** jest w publikacji `supabase_realtime` (są tam tylko `products`, `product_images`, `product_benefits`).

Istotne dla celu: anonimizacja po 24 miesiącach nadpisuje `name`, `email`, `message` — leadbox powinien być traktowany jako archiwum docelowe.

## Część C — dostęp odczytowy z zewnątrz

Polityki na `leads` (wszystkie dla roli `public`, czyli dotyczą też `anon` i `authenticated`):
- SELECT — `has_role(auth.uid(), 'admin')`
- UPDATE — `has_role(auth.uid(), 'admin')`
- DELETE — `has_role(auth.uid(), 'admin')`
- INSERT — `with_check: true` (dowolny, w tym anonimowy)

Uprawnienia tabelowe: `anon`, `authenticated`, `service_role` mają SELECT/INSERT/UPDATE (grant), więc decyduje RLS.

Odpowiedź wprost: **klient z kluczem anon nie odczyta zapytań** — RLS przepuści SELECT tylko dla zalogowanego użytkownika z rolą `admin` w `user_roles`. Odczyt zewnętrzny jest dziś możliwy w dwóch trybach: (a) REST z kluczem `service_role` (omija RLS — klucz nigdy nie może opuścić prywatnego serwera), (b) REST z tokenem sesji konta admina (JWT wygasa i wymaga odświeżania).

MCP w trybie read-only: to narzędzie interaktywne, uwierzytelniane sesją człowieka, bez gwarancji dostępności, bez wersjonowanego kontraktu i bez kontroli błędów/retry. Nie nadaje się jako trwały, automatyczny kanał synchronizacji. Właściwym kanałem jest REST (PostgREST) z osobnym poświadczeniem trzymanym na serwerze leadboksu — najlepiej dedykowane konto techniczne, nie klucz `service_role`.

## Część D — mechanizmy wychodzące z bazy

Dostępne oba: `pg_net` 0.14.0 (schemat `extensions`) i `http` 1.6 (schemat `public`).

Użycie dziś: `http` jest realnie używany — `notify_lead_created()` wywołuje `public.http_post`. `pg_net` jest zainstalowany, ale nie jest nigdzie wywoływany. Uwaga: `http` jest synchroniczny i blokuje transakcję INSERT; `pg_net` jest asynchroniczny (kolejka) i lepiej nadaje się do powiadomień wychodzących.

## Część E — konsekwencje odpytywania co 5 minut

1. Wywołania: 12/h × 24 × ~30 = **~8 640 zapytań/miesiąc**. Odpowiedź pusta to `[]` + nagłówki, ok. 0,5–1 kB na wywołanie → **rząd kilku–kilkunastu MB/miesiąc**. Ponad 99,9% odpowiedzi będzie pustych (7 leadów/mies.).
2. Limity/koszt: pomijalne. Zapytanie `created_at > $1 order by created_at` korzysta z `idx_leads_created_at`, czyli index scan na tabeli o kilkunastu wierszach — obciążenie bazy nieodczuwalne. Transfer i liczba żądań są głęboko poniżej progów planów Supabase. Realny koszt to nie zasoby, a szum.
3. Logi: to jest główny minus. ~8,6 tys. wpisów miesięcznie w logach API zdominuje logi projektu i praktycznie uniemożliwi ręczne przeglądanie ruchu (diagnostyka błędów, wykrywanie nadużyć). Da się to złagodzić stałym, rozpoznawalnym nagłówkiem `User-Agent` (np. `leadbox-sync/1`), żeby móc filtrować.
4. Rekomendacja interwału przy 7 leadach/mies.: **co 15 minut w godzinach 7:00–20:00 czasu polskiego, co 60 minut poza tym** (~700–800 wywołań/mies., spadek o ~90%). Opóźnienie do 15 minut jest bez znaczenia, bo powiadomienie e-mail o leadzie i tak przychodzi natychmiast. Okno zapytania: `created_at > last_seen - 5 minut` (bufor na rozjazd zegarów), deduplikacja po `id`.
5. Nasłuch zamiast odpytywania: tak — Supabase Realtime (WebSocket) oraz `LISTEN/NOTIFY` przez bezpośrednie połączenie Postgres. Oba działają jako połączenie **wychodzące** z leadboksu, więc nie wymagają publicznego adresu ani wyjątku w Tailscale. Odporność: przy zerwaniu połączenia zdarzenia z okresu rozłączenia są **bezpowrotnie tracone** — Realtime nie ma bufora ani odtwarzania. Dlatego nasłuch nigdy nie może być jedynym kanałem; wymaga uzupełniającego odpytywania „nadrabiającego” po każdym ponownym połączeniu. Dodatkowo `leads` trzeba by dopisać do publikacji `supabase_realtime`, a Realtime respektuje RLS — potrzebny byłby token z rolą admina.

## Część F — warianty realizacji

### Wariant 1 — odpytywanie REST z leadboksu (pull)

1. Leadbox uruchamia lokalny scheduler, który co 15 minut woła PostgREST: `GET /rest/v1/leads?created_at=gt.<last_seen>&order=created_at.asc`, z poświadczeniem trzymanym lokalnie. Wynik zapisuje do własnej tabeli i przesuwa znacznik `last_seen`. Cała inicjatywa jest po stronie leadboksu.
2. Kolejność zmian: (a) utworzyć w Supabase konto techniczne z rolą `admin` w `user_roles` (albo świadomie użyć `service_role` tylko lokalnie), (b) napisać skrypt synchronizacji i tabelę stanu w leadboksie, (c) uruchomić harmonogram, (d) jednorazowy backfill istniejących ~15 rekordów.
3. Migracja/RLS: nie wymaga. Obecne polityki wystarczają dla roli admin i dla `service_role`.
4. Publiczny adres leadboksu: nie wymaga. Ruch wyłącznie wychodzący.
5. Główne ryzyko: przechowywanie mocnego poświadczenia (`service_role` lub konto admin) na serwerze leadboksu oraz szum w logach Supabase.
6. Deduplikacja: `id` jako klucz główny w leadboksie + `INSERT ... ON CONFLICT (id) DO NOTHING`. Znacznik czasu służy tylko do zawężenia okna, nie do tożsamości rekordu.
7. Przestój kilku godzin: całkowicie nieszkodliwy. Po powrocie pierwsze odpytanie pobiera wszystko od `last_seen`. To jedyny wariant, który nadrabia zaległości bez dodatkowej logiki.

### Wariant 2 — webhook z bazy (push) do Tailscale

1. Do `notify_lead_created()` (lub osobnego triggera na `pg_net`) dochodzi drugie żądanie na endpoint leadboksu; alternatywnie wystarczy ustawić sekret `LEAD_WEBHOOK_URL`, który Edge Function `notify-lead` już obsługuje. Lead trafia do leadboksu w sekundach po zapisie.
2. Kolejność: (a) wystawić endpoint odbiorczy w leadboksie z weryfikacją współdzielonego sekretu, (b) udostępnić go dla ruchu z internetu (Tailscale Funnel lub reverse proxy), (c) ustawić sekret `LEAD_WEBHOOK_URL`, (d) test na leadzie kontrolnym.
3. Migracja/RLS: nie wymaga, jeśli korzystamy z istniejącego `LEAD_WEBHOOK_URL`. Wymaga migracji, jeśli chcemy własny trigger na `pg_net`.
4. Publiczny adres: **tak, wymaga** — to zderza się wprost z założeniem, że serwer nie przyjmuje połączeń z internetu.
5. Główne ryzyko: brak gwarancji dostarczenia (jedna próba, błąd tłumiony) plus konieczność wystawienia usługi na zewnątrz, czyli nowa powierzchnia ataku.
6. Deduplikacja: payload zawiera `id` — `ON CONFLICT (id) DO NOTHING`.
7. Przestój kilku godzin: **leady są tracone bezpowrotnie**, nie ma ponowień ani kolejki. Wymaga awaryjnego odpytywania, czyli i tak Wariantu 1 w tle.

### Wariant 3 — nasłuch Realtime z odpytywaniem nadrabiającym (hybryda)

1. Leadbox utrzymuje wychodzące połączenie WebSocket do Supabase Realtime i reaguje na INSERT w `leads` natychmiast. Równolegle raz na godzinę wykonuje odpytywanie REST jak w Wariancie 1, żeby nadrobić zdarzenia utracone przy rozłączeniach. Nasłuch daje niskie opóźnienie, odpytywanie daje kompletność.
2. Kolejność: (a) Wariant 1 w całości jako fundament, (b) migracja dopisująca `leads` do publikacji `supabase_realtime`, (c) klient WebSocket z auto-reconnect, (d) po każdym reconnect wymuszone odpytywanie nadrabiające.
3. Migracja/RLS: **tak** — wymaga migracji (`ALTER PUBLICATION supabase_realtime ADD TABLE public.leads`). Polityki RLS bez zmian, ale token musi mieć rolę admina.
4. Publiczny adres: nie wymaga.
5. Główne ryzyko: najwięcej części ruchomych i utrzymania (sesja WebSocket, odświeżanie tokenu, reconnect) przy 7 leadach miesięcznie — złożoność nieproporcjonalna do korzyści.
6. Deduplikacja: `id` + `ON CONFLICT DO NOTHING`; przy hybrydzie ten sam lead niemal na pewno przyjdzie dwoma kanałami, więc deduplikacja jest tu obowiązkowa, nie opcjonalna.
7. Przestój kilku godzin: bezpieczny — zdarzenia Realtime przepadają, ale odpytywanie nadrabiające po starcie pobierze wszystko od `last_seen`.

## Rekomendacja

**Wariant 1 — odpytywanie REST z leadboksu.** Jako jedyny spełnia twardy warunek braku połączeń przychodzących do serwera w Tailscale i jednocześnie gwarantuje kompletność danych po dowolnie długim przestoju, bez żadnej migracji ani zmiany RLS. Przy 7 leadach miesięcznie opóźnienie 15 minut jest bez znaczenia (e-mail o leadzie przychodzi natychmiast), a Realtime dodałby złożoność bez realnej korzyści.

## Do rozstrzygnięcia przed wdrożeniem

- Poświadczenie: dedykowane konto techniczne z rolą `admin` (JWT wymaga odświeżania) czy `service_role` zamknięty na prywatnym serwerze? Rekomendacja: konto techniczne.
- Anonimizacja po 24 miesiącach — czy leadbox ma być archiwum trwałym, odpornym na czyszczenie w Supabase?

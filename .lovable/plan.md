# Raport diagnostyczny — druga aplikacja na tej samej bazie Postgres

Tryb wyłącznie do odczytu. Nie wprowadzono żadnych zmian: brak migracji, brak edycji plików, brak zmian konfiguracji.

## Część A — obecne zużycie połączeń

Parametry instancji (Postgres 17.4):

| Parametr | Wartość |
|---|---|
| `max_connections` | **60** |
| `superuser_reserved_connections` | 3 (→ realnie **57** slotów dla zwykłych ról) |
| `statement_timeout` (globalny) | 120 000 ms (2 min) |
| `idle_in_transaction_session_timeout` (globalny) | 0 = wyłączony |
| `shared_buffers` | 28 672 × 8 kB = **224 MB** |
| `work_mem` | ~2,1 MB |

Migawka `pg_stat_activity` w chwili badania — 24 backendy, z tego 8 to procesy wewnętrzne Postgresa (background writer, checkpointer, walwriter, archiver, autovacuum launcher, logical replication launcher, pg_cron launcher, worker pg_net), które **nie zajmują** slotów z `max_connections`.

Realnie zajęte sloty klienckie: **16**.

| Kto | `usename` / `application_name` | Slotów | Stan |
|---|---|---|---|
| PostgREST — obsługuje stronę i panel admina | `authenticator` / `postgrest` | **3** | idle (pula stała) |
| Realtime (4 typy procesów + walsender) | `supabase_admin` / `realtime_*` | 7 | idle/active |
| Storage API | `supabase_storage_admin`, `pgbouncer` | 3 | idle |
| Monitoring platformy | `supabase_admin` / `postgres_exporter` | 1 | idle |
| Narzędzia deweloperskie / MCP / to zapytanie | `supabase_read_only_user` / `mgmt-api` | 1 | active |
| Sesja serwisowa | `supabase_admin` (bez nazwy aplikacji) | 1 | idle |

Rozbicie na pytane kategorie:
- **Strona stakerpol.pl i panel administracyjny: 3 slotów łącznie**, wspólna pula PostgREST. Nie rosną z liczbą odwiedzających — to jest cała pointa PostgREST.
- **Edge Functions (`notify-lead`, `sitemap`, `geo-feed`, `shared-list` itd.): 0 slotów na stałe.** Łączą się przez PostgREST/pooler tylko na czas wywołania; w migawce nic nie było aktywne.
- **Narzędzia deweloperskie: 1 slot**, doraźnie.
- **Pooler:** ta instancja korzysta z Supavisora/pgbouncera po stronie platformy; w bazie widać po nim jeden slot (`usename = pgbouncer` przy Storage API). Pooler nie utrzymuje stałej dużej puli w tej konfiguracji — dominującym konsumentem jest PostgREST.

**Wolne slotów: ok. 41 z 57.** Limity ról: wszystkie `rolconnlimit = -1` (bez limitu). To jest istotne dla Części D.

## Część B — jak łączy się strona

- Frontend **nie łączy się z Postgresem bezpośrednio.** Używa `@supabase/supabase-js` → HTTPS → PostgREST (`/rest/v1/...`). Plik konfiguracji klienta: `src/integrations/supabase/client.ts` (URL projektu + klucz publishable/anon, `persistSession: true`).
- Nie ma i nie może mieć puli połączeń w przeglądarce — każdy odwiedzający to żądanie HTTP, nie sesja bazodanowa. Tysiąc jednoczesnych odwiedzających nadal przechodzi przez tę samą 3-slotową pulę PostgREST, kolejkując się na poziomie HTTP.
- Panel administracyjny działa identycznie (ten sam klient, dodatkowo sesja JWT z rolą `admin`).
- Ograniczenie liczby jednoczesnych żądań po stronie aplikacji: **brak jawnego.** Limitują: pula PostgREST i rate limiting platformy Supabase, nie kod projektu.
- Wyjątek: `notify_lead_created()` woła `public.http_post` **synchronicznie wewnątrz transakcji INSERT**, przez rozszerzenie `http`. To nie zajmuje dodatkowego slotu, ale wydłuża transakcję na czas odpowiedzi Edge Function.

## Część C — ryzyko wyczerpania slotów

Wprost: jeżeli druga aplikacja zajmie wszystkie wolne slotów, **strona i panel przestaną odczytywać dane, a formularz zapytania przestanie zapisywać.**

Mechanika i objawy:
1. PostgREST trzyma już swoje 3 połączenia otwarte, więc **normalny ruch strony jest odporny** — dopóki jego pula żyje, nie potrzebuje nowych slotów. To jest naturalny bufor.
2. Ryzyko materializuje się w dwóch sytuacjach: gdy PostgREST musi odtworzyć połączenie (restart, deploy, zerwanie sieci) i nie dostanie slotu, albo gdy pula PostgREST próbuje się rozszerzyć pod obciążeniem.
3. Odwiedzający zobaczy wtedy błąd HTTP **500/503** z PostgREST, w treści `remaining connection slots are reserved` / `too many clients already` (SQLSTATE `53300`). W UI: puste listy produktów, komunikat błędu ładowania.
4. **Formularz zapytania: tak, przestanie działać** — INSERT do `public.leads` idzie tą samą drogą. Lead nie zapisze się i nie wyśle e-maila. Dla serwisu z 7 leadami miesięcznie oznacza to realną utratę zapytania, bez śladu w bazie.
5. Drugi, groźniejszy scenariusz niż zwykłe wyczerpanie: **`idle in transaction` bez limitu.** Globalny `idle_in_transaction_session_timeout = 0` znaczy, że jedno zawieszone połączenie drugiej aplikacji, które otworzyło transakcję i nie zamknęło jej, może trzymać slot i blokady w nieskończoność. Przy puli 2–4 połączeń to jest bardziej prawdopodobna awaria niż przekroczenie 57 slotów.

Ocena przy podanym profilu (1 użytkownik, kilkanaście zapytań dziennie, pula 2–4): ryzyko wyczerpania slotów jest **niskie** — 4 z 41 wolnych. Realne ryzyko to nie liczba połączeń, a długie transakcje i brak limitów na nowej roli.

## Część D — bezpieczniki

Wszystkie poniższe dotyczą **wyłącznie nowej roli** i nie zmieniają zachowania `authenticator` (PostgREST), więc nie ruszają strony.

### 1. `CONNECTION LIMIT` na roli — najważniejszy, wykonać obowiązkowo

```sql
ALTER ROLE leadbox_app CONNECTION LIMIT 5;
```

Skutek: rola fizycznie nie może otworzyć więcej niż 5 sesji; szósta dostaje `too many connections for role`. To zamienia awarię całego projektu w awarię tylko drugiej aplikacji — dokładnie to, o co chodzi.
Skutek uboczny: przy limicie zbyt ciasnym wobec puli aplikacji (np. limit 4 przy puli 4 plus jedna sesja diagnostyczna) własne narzędzia diagnostyczne nie wejdą. Stąd 5, nie 4.
**Bezpieczne dla strony: tak, w pełni.** Dotyczy tylko nowej roli.

### 2. `statement_timeout` i `idle_in_transaction_session_timeout` na roli — wykonać obowiązkowo

```sql
ALTER ROLE leadbox_app SET statement_timeout = '15s';
ALTER ROLE leadbox_app SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE leadbox_app SET lock_timeout = '5s';
```

Skutek: żadne zapytanie drugiej aplikacji nie zajmie CPU dłużej niż 15 s; porzucona otwarta transakcja jest ubijana po 30 s, co uwalnia slot i zwalnia blokady; `lock_timeout` zapobiega długiemu czekaniu na blokadę. Dla porównania: PostgREST (`authenticator`) ma już `statement_timeout=8s` i `lock_timeout=8s`, więc nowa rola z 15 s jest ustawiona łagodniej niż strona, ale nadal ograniczona — w przeciwieństwie do domyślnego globalnego 120 s.
Skutek uboczny: długi raport lub jednorazowy import w drugiej aplikacji zostanie przerwany. Rozwiązanie bez ruszania roli: `SET statement_timeout = '5min';` w obrębie tej jednej sesji.
Ustawienia wchodzą w życie przy **następnym** logowaniu roli, nie dla trwających sesji.
**Bezpieczne dla strony: tak.** `ALTER ROLE ... SET` nie dotyka innych ról ani ustawień globalnych.

### 3. Ograniczenia po stronie poolera — przydatność ograniczona

Druga aplikacja ma łączyć się poolerem **sesyjnym** (port 5432 Supavisora). W trybie sesyjnym połączenie klienta jest przypięte do backendu na cały czas trwania sesji, więc pooler nie multipleksuje i nie daje oszczędności slotów — 4 połączenia klienta to 4 slotów w bazie. Osobne per-tenant limity Supavisora nie są konfigurowalne z poziomu SQL, tylko z dashboardu platformy, i mają granulację projektu, nie roli.
Wniosek: pooler traktować jako wygodę połączeniową, a **nie** jako bezpiecznik. Zabezpieczeniem jest `CONNECTION LIMIT` na roli, bo działa w bazie i nie da się go obejść zmianą trybu połączenia.
Jeżeli druga aplikacja nie potrzebuje `LISTEN/NOTIFY`, kursorów ani `SET` sesyjnych, warto rozważyć pooler transakcyjny (port 6543) — wtedy 4 połączenia klienta zużywają mniej slotów. To decyzja po stronie tamtej aplikacji.

### 4. Uzupełniająco — izolacja uprawnień (nie wydajnościowa, ale w tym samym poleceniu)

```sql
REVOKE ALL ON SCHEMA public FROM leadbox_app;
GRANT USAGE ON SCHEMA leadbox TO leadbox_app;
```

Bez tego nowa rola dziedziczy dostęp do `public` i może w nim zapisywać, obchodząc RLS (RLS nie działa na rolę będącą właścicielem tabeli ani na rolę z `BYPASSRLS`). Nowa rola **nie może** mieć `BYPASSRLS` ani `SUPERUSER`.

## Część E — obciążenie zapytaniami

Osobny schemat to izolacja **nazw**, nie zasobów. Wszystko poniżej jest wspólne:

- **CPU:** wspólne. Kilkanaście zapytań dziennie jest nieodczuwalne. Zagrożeniem jest pojedyncze ciężkie zapytanie (raport, `seq scan` po dużej tabeli), które na małej instancji potrafi wysycić rdzeń i wydłużyć czas odpowiedzi strony. Dokładnie temu służy `statement_timeout` z Części D.
- **Pamięć:** `shared_buffers` = 224 MB wspólne. Duży odczyt w nowym schemacie **wypłukuje z cache** strony tabel `products` i `product_images`, co przy następnym wejściu na stronę oznacza odczyt z dysku. To najbardziej realny, choć przejściowy, wpływ na odczuwalną szybkość strony. Przy kilkunastu zapytaniach dziennie: pomijalny. `work_mem` (2,1 MB) jest per operacja sortowania — równoległe ciężkie sortowania w drugiej aplikacji mnożą zużycie pamięci.
- **Autovacuum:** launcher jest jeden i wspólny; obsługuje wszystkie schematy. Intensywne UPDATE/DELETE w nowym schemacie generują martwe wiersze i mogą **opóźnić** vacuum tabel w `public`. Przy tym wolumenie nierealne, ale warto obserwować, jeśli druga aplikacja zacznie prowadzić własną kolejkę zadań z częstymi UPDATE.
- **WAL:** wspólny strumień, `max_wal_size` = 1 GB. Zapisy w nowym schemacie trafiają do tego samego WAL i tej samej replikacji logicznej (`realtime_replication_connection` jest aktywny). Duża jednorazowa operacja zapisu może wywołać wymuszony checkpoint i chwilowy skok opóźnień dla wszystkich, w tym dla strony. Osobna uwaga: jeśli tabele nowego schematu nie znajdą się w publikacji `supabase_realtime` (a nie powinny), nie obciążą dodatkowo dekodowania logicznego.

Podsumowanie: przy podanym profilu ruchu wpływ na wydajność `public` jest **praktycznie zerowy**. Ryzyko nie skaluje się z liczbą zapytań, a z ich ciężkością — dlatego limity czasowe są ważniejsze od limitu połączeń.

## Część F — monitorowanie

Bieżące zużycie slotów:

```sql
select
  (select setting::int from pg_settings where name='max_connections')            as max_conn,
  (select setting::int from pg_settings where name='superuser_reserved_connections') as reserved,
  count(*) filter (where backend_type='client backend')                          as used_client,
  (select setting::int from pg_settings where name='max_connections')
    - (select setting::int from pg_settings where name='superuser_reserved_connections')
    - count(*) filter (where backend_type='client backend')                      as free
from pg_stat_activity;
```

Rozbicie na role i aplikacje (kto zjada slotów):

```sql
select usename, application_name, state, count(*),
       max(now() - state_change) as longest_in_state
from pg_stat_activity
where backend_type = 'client backend'
group by 1,2,3
order by 4 desc;
```

Wykrywanie porzuconych transakcji — pierwsza rzecz do sprawdzenia przy problemach:

```sql
select pid, usename, application_name, state,
       now() - xact_start as xact_age, left(query, 120) as query
from pg_stat_activity
where state = 'idle in transaction'
order by xact_start;
```

Gdzie zobaczysz ostrzeżenia o wyczerpywaniu połączeń:
- **Supabase Dashboard → Logs → Postgres Logs** — komunikaty `FATAL: remaining connection slots are reserved for roles with the SUPERUSER attribute` oraz `FATAL: too many connections for role "..."`. Filtrować po `error_severity = 'FATAL'`.
- **Dashboard → Logs → API (PostgREST)** — po stronie strony objawi się jako 500/503 na `/rest/v1/...`.
- **Dashboard → Reports → Database** — wykres liczby połączeń w czasie; najlepszy do wykrycia trendu narastania.
- **W projekcie:** panel administracyjny ma `HealthCheck` (`src/components/monitoring/HealthCheck.tsx`) wołający `public.health_check()`, ale ta funkcja **nie raportuje połączeń** — zwraca liczbę produktów i zapytań. Nie licz na nią jako alarm o slotach.
- Alarmy proaktywne (powiadomienie o wysokim zużyciu połączeń) w tym projekcie nie są dziś skonfigurowane.

## Wątpliwości i pytania

1. **Tryb poolera.** Piszesz o poolerze sesyjnym — czy druga aplikacja rzeczywiście potrzebuje trybu sesyjnego (`LISTEN/NOTIFY`, kursory, `SET` na sesję)? Jeśli nie, tryb transakcyjny zużyje mniej slotów.
2. **Nazwa nowej roli i schematu** — nie znam ich; w Części D użyłem `leadbox_app`. Podaj docelowe nazwy przed wykonaniem czegokolwiek.
3. **Czy nowa rola ma mieć jakikolwiek dostęp do `public.leads`** (np. odczyt do synchronizacji), czy schemat będzie zapełniany innym kanałem? Ma to wpływ na granty i na ocenę bezpieczeństwa.
4. **Charakter zapytań drugiej aplikacji** — „kilkanaście dziennie" nie mówi nic o ich ciężkości. Czy planowane są raporty, agregacje albo jednorazowe importy? Od tego zależy dobór `statement_timeout`.
5. **Nie mam wglądu w konfigurację Supavisora** (rozmiar puli po stronie platformy, limity per projekt). Te wartości widać wyłącznie w dashboardzie Supabase — warto je odczytać przed podłączeniem.
6. Migawka `pg_stat_activity` to jedna chwila, przy niskim ruchu. Nie znam szczytowego zużycia slotów. Dashboard → Reports → Database pokaże historię i to jest wiarygodniejsza podstawa niż ten pojedynczy pomiar.

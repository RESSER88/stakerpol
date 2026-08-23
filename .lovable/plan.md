# Plan — nowy schemat `leadbox` (4 tabele) dla zewnętrznego narzędzia handlowego

Tryb planu. Nic nie zostało wykonane: brak migracji, brak zmian w plikach, brak zmian w bazie.

Założenia wyjściowe (potwierdzone odczytem projektu): schemat `public` zawiera m.in. `leads` z RLS (SELECT/UPDATE/DELETE tylko dla roli `admin` przez `has_role`), trigger `trg_leads_notify` → `notify_lead_created()` → Edge Function `notify-lead`, oraz dwa zadania pg_cron. Nowy schemat nie dotyka żadnego z tych elementów.

## 1. Kolejność operacji

Cała migracja jest jedną transakcją SQL. Kolejność nie jest kosmetyczna — chroni przed okresem, w którym dane byłyby czytelne bez polityk.

1. **`CREATE SCHEMA leadbox;`** — musi być pierwsze, bo wszystko dalej się w nim tworzy. Odwracalne (`DROP SCHEMA`).
2. **Odebranie domyślnych uprawnień do schematu:** `REVOKE ALL ON SCHEMA leadbox FROM PUBLIC;` — wykonywane natychmiast po utworzeniu, przed jakąkolwiek tabelą, żeby żadna tabela nie powstała w schemacie z szerokim dostępem. Odwracalne.
3. **`CREATE TABLE leadbox.<T1..T4>`** — cztery tabele w kolejności zależności (najpierw tabele bez kluczy obcych, potem te, które się do nich odwołują), z `id uuid primary key default gen_random_uuid()`, `created_at`/`updated_at timestamptz not null default now()`. Odwracalne (`DROP TABLE`), ale **usunięcie tabeli usuwa dane** — nieodwracalne dla treści wpisanych po wdrożeniu.
4. **`ALTER TABLE leadbox.<T> ENABLE ROW LEVEL SECURITY;` dla wszystkich czterech** — **przed** jakimkolwiek `GRANT` i przed wystawieniem schematu w API. To jest kluczowy punkt kolejności: tabela z grantem, ale bez włączonego RLS, jest otwarta. Odwracalne.
5. **`CREATE POLICY` dla każdej tabeli** — polityki oparte na `public.has_role(auth.uid(), 'admin')`, dla roli `authenticated`, osobno dla SELECT/INSERT/UPDATE/DELETE (lub jedna `FOR ALL`). Nadal przed grantami. Odwracalne.
6. **`GRANT USAGE ON SCHEMA leadbox TO authenticated, service_role;`** — bez `anon`. Bez `USAGE` PostgREST nie zobaczy schematu w ogóle. Odwracalne.
7. **`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA leadbox TO authenticated;` + `GRANT ALL ... TO service_role;`** — dopiero teraz, gdy RLS i polityki już obowiązują. Odwracalne.
8. **Trigger `updated_at`** — `BEFORE UPDATE ... EXECUTE FUNCTION public.update_updated_at_column()` na każdej tabeli (funkcja już istnieje, nie tworzymy nowej). Odwracalne.
9. **`NOTIFY pgrst, 'reload schema';`** — przeładowanie cache PostgREST, na końcu transakcji. Odwracalne (bezstanowe).
10. **Dashboard: Settings → API → Exposed schemas → dodać `leadbox`** — **ręczny krok użytkownika, wykonywany po zatwierdzonej migracji, nie przez migrację.** Musi być ostatni: dopóki schemat nie jest wystawiony, PostgREST go nie obsługuje, więc żadne okno ekspozycji bez RLS nie może wystąpić. Odwracalne (usunięcie z listy).

Nieodwracalne w praktyce: dane wprowadzone do tabel `leadbox` po wdrożeniu (rollback = utrata) oraz wpis migracji w historii migracji projektu.

## 2. Analiza wpływu

| Element | Wpływ | Uzasadnienie |
|---|---|---|
| Formularze zapytań | **Nie** | Zapisują do `public.leads` przez klienta z kluczem anon. Nowy schemat nie zmienia tabeli, polityk ani grantów w `public`. |
| Panel administracyjny | **Nie** | Odczytuje `public.leads` i `public.products`. Domyślny schemat klienta Supabase to `public`; zapytania nie zmieniają ścieżki. |
| Trigger `trg_leads_notify` | **Nie** | Trigger jest przypisany do `public.leads` i wywołuje `public.http_post`. Nowy schemat nie modyfikuje ani triggera, ani `search_path` funkcji. |
| Edge Function `notify-lead` | **Nie** | Otrzymuje payload HTTP i wysyła e-mail przez Resend. Nie odwołuje się do schematów bazy. |
| Wygenerowane typy TypeScript | **Tak, ale nieszkodliwie** | Po wystawieniu `leadbox` w Exposed schemas generator dopisze nowy blok schematu do `src/integrations/supabase/types.ts`. Istniejące typy `public` pozostają bez zmian, więc kod frontendu nie wymaga poprawek. |
| Budowanie projektu | **Nie** | Do `types.ts` dochodzą wyłącznie nowe deklaracje typów; nic nie jest usuwane ani zawężane, więc `tsc` i `vite build` przechodzą jak dotąd. |

## 3. Ryzyko bezpieczeństwa

Klucz anon jest publiczny i widoczny w kodzie strony — trzeba założyć, że każdy może nim wołać PostgREST.

Po dopisaniu `leadbox` do Exposed schemas niezalogowany klient z kluczem anon może **wysłać** żądania w postaci `GET /rest/v1/<tabela>` z nagłówkiem `Accept-Profile: leadbox` (oraz `Content-Profile: leadbox` dla zapisu). Co je blokuje, w dwóch niezależnych warstwach:

1. **Brak grantów dla roli `anon`** — nie nadajemy `USAGE` na schemat ani żadnych uprawnień tabelowych roli `anon`. Skutek: żądanie kończy się błędem uprawnień (`42501` / `permission denied for schema leadbox`) jeszcze przed oceną RLS. To jest warstwa zasadnicza.
2. **RLS + polityki wymagające `has_role(auth.uid(), 'admin')`** — nawet gdyby ktoś w przyszłości omyłkowo nadał grant roli `anon`, `auth.uid()` dla anona jest `NULL`, więc `has_role` zwraca `false` i wynik to pusta tablica. To warstwa zapasowa.

Konto techniczne z rolą `admin` działa jako `authenticated` z wpisem w `public.user_roles`, więc przechodzi obie warstwy.

**Okno bez ochrony:** powstałoby, gdyby tabele były osiągalne przez API, a RLS/polityki jeszcze nie obowiązywały. Zamykamy je dwoma decyzjami: (a) w migracji `ENABLE ROW LEVEL SECURITY` i `CREATE POLICY` wykonują się **przed** `GRANT`, a cała migracja jest jedną transakcją — nie istnieje moment, w którym grant jest widoczny bez polityki; (b) dopisanie schematu do Exposed schemas jest krokiem **po** zatwierdzonej i wykonanej migracji, więc przed tym momentem PostgREST fizycznie nie obsługuje tego schematu. Odwrotna kolejność (najpierw ekspozycja w dashboardzie, potem migracja) tworzyłaby realne okno i jest niedopuszczalna.

Dodatkowo: nie umieszczamy w `leadbox` żadnych sekretów ani kluczy; poświadczenie konta technicznego zostaje wyłącznie na serwerze w Tailscale.

## 4. Wycofanie

Kolejność odwrotna do wdrożenia:

1. Dashboard: Settings → API → Exposed schemas → usunąć `leadbox`. Robione pierwsze, żeby odciąć dostęp przez API przed zmianami w bazie.
2. `REVOKE ALL ON ALL TABLES IN SCHEMA leadbox FROM authenticated, service_role;`
3. `REVOKE USAGE ON SCHEMA leadbox FROM authenticated, service_role;`
4. `DROP SCHEMA leadbox CASCADE;` — usuwa cztery tabele, ich polityki i triggery.
5. `NOTIFY pgrst, 'reload schema';`
6. Odświeżyć typy TypeScript, aby usunąć blok `leadbox` z `types.ts`.

Nieodwracalnie zmienione: dane wprowadzone do tabel `leadbox` (przepadają razem z `DROP SCHEMA CASCADE`) oraz wpis migracji w historii projektu. Schemat `public` i jego dane nie są dotykane na żadnym etapie ani wdrożenia, ani wycofania.

## 5. Weryfikacja po wdrożeniu

Schemat `public` nienaruszony:
- `select table_name from information_schema.tables where table_schema='public' order by 1;` — lista identyczna jak przed migracją (18 tabel).
- `select policyname, cmd from pg_policies where schemaname='public' and tablename='leads';` — nadal 4 polityki (3× admin, 1× publiczny INSERT).
- `select tgname from pg_trigger where tgrelid='public.leads'::regclass and not tgisinternal;` — nadal `trg_leads_notify` i `trg_set_lead_handled_at`.
- Test czynnościowy: wysłać zapytanie z formularza na stronie i sprawdzić, czy rekord powstał i czy przyszedł e-mail.

Tabele `leadbox` istnieją i są zabezpieczone:
- `select table_name from information_schema.tables where table_schema='leadbox';` — cztery tabele.
- `select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='leadbox';` — `relrowsecurity = true` dla wszystkich czterech.
- `select tablename, policyname, cmd from pg_policies where schemaname='leadbox';` — polityki na każdej tabeli.
- `select grantee, privilege_type, table_name from information_schema.role_table_grants where table_schema='leadbox';` — **brak wiersza z `anon`**.
- `select has_schema_privilege('anon','leadbox','USAGE');` — musi zwrócić `false`.

Klucz anon nic nie odczyta (test z zewnątrz, bez logowania):
- `curl -s -H "apikey: <anon>" -H "Authorization: Bearer <anon>" -H "Accept-Profile: leadbox" "https://peztqgfmmnxaaoapzpbw.supabase.co/rest/v1/<tabela>?select=*"` — oczekiwany błąd uprawnień lub `[]`, **nigdy** wiersz z danymi. Powtórzyć dla wszystkich czterech tabel.
- Ten sam `curl` z tokenem konta technicznego — musi zwrócić dane. Bez tego kanał synchronizacji nie działa.

## 6. Wątpliwości — potrzebuję odpowiedzi przed napisaniem migracji

1. **Cztery tabele nie są zdefiniowane.** Nie znam ich nazw, przeznaczenia ani kolumn. Bez tego nie napiszę `CREATE TABLE`. Potrzebuję dla każdej: nazwa, rola w procesie i lista pól (albo zgoda, że zaproponuję strukturę na podstawie celu synchronizacji leadów).
2. **Relacja do `public.leads`.** Czy tabela lustrzana ma trzymać `id` z `public.leads` jako klucz główny (naturalna deduplikacja) i czy ma mieć klucz obcy do `public.leads`? Klucz obcy wiąże schematy i utrudni niezależne czyszczenie — domyślnie odradzam, ale to decyzja biznesowa.
3. **Kierunek zapisu.** Czy zewnętrzne narzędzie tylko czyta z `leadbox`, czy również zapisuje (notatki, statusy)? To decyduje, czy grant to `SELECT` czy pełny CRUD.
4. **Kto zapełnia `leadbox`.** Czy dane wpadają tam automatycznie z `public.leads` (trigger lub zadanie pg_cron — nowy mechanizm, do zaplanowania osobno), czy narzędzie samo je tam wpisuje po odczycie z `public.leads`?
5. **Konto techniczne.** Czy już istnieje w `auth.users` z wpisem `admin` w `public.user_roles`? Jeśli nie, trzeba je utworzyć — to osobny krok poza migracją.
6. **Model uprawnień.** Czy dostęp do `leadbox` ma być zawężony do jednego konkretnego konta technicznego (polityka na konkretny `user_id`), czy wystarczy „każdy admin”? Druga opcja jest prostsza, pierwsza szczelniejsza.
7. **Anonimizacja po 24 miesiącach** (`cleanup_old_handled_leads`) czyści `public.leads`. Czy `leadbox` ma być z tego wyłączony jako archiwum trwałe? Ma to skutki dla RODO i wymaga świadomej decyzji.

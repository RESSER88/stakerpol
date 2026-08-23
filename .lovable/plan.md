# Raport diagnostyczny — utworzenie schematu `leadbox` i nowej roli bazodanowej

Tryb wyłącznie do odczytu. Nie wprowadzono żadnych zmian: brak migracji, brak edycji plików, brak zmian konfiguracji.

Założenia przyjęte za twoje: schemat `leadbox` **nie** będzie wystawiony w Settings → API → Exposed schemas, schemat `public` nie jest modyfikowany, zewnętrzna aplikacja łączy się bezpośrednio własną rolą.

## Część A — wpływ nowego schematu i nowej roli

| Element | Wpływ | Uzasadnienie |
|---|---|---|
| Formularze zapytań | **Nie** | Zapis idzie przez PostgREST kluczem anon do `public.leads`. Nowy schemat nie zmienia tej tabeli, jej polityk ani grantów. Nowa rola jest osobnym podmiotem — nie odbiera niczego rolom istniejącym. |
| Panel administracyjny | **Nie** | Czyta `public.leads`, `public.products`, `public.user_roles`. Domyślny schemat klienta Supabase to `public`; PostgREST nie zobaczy nawet `leadbox`, bo nie będzie wystawiony. |
| Trigger `trg_leads_notify` | **Nie** | Przypisany do `public.leads`, wywołuje `public.notify_lead_created()` → `public.http_post`. Utworzenie nowego schematu nie zmienia definicji triggera ani `search_path` funkcji (`SET search_path TO 'public'`). Nowy schemat nie wchodzi w żaden `search_path`. |
| Edge Functions | **Nie** | `notify-lead`, `sitemap`, `geo-feed`, `shared-list`, funkcje tłumaczeń — wszystkie operują na `public` przez PostgREST lub klienta z kluczem service_role. Żadna nie odwołuje się do nowego schematu i żadna nie wylicza listy schematów. |
| Zadania pg_cron | **Nie** | Dwa aktywne zadania: `cleanup-old-handled-leads` (03:00) i `cleanup-expired-shared-lists` (03:15). Wołają funkcje z jawnym prefiksem `public.` i operują tylko na `public.leads` / `public.shared_lists`. Nowy schemat i nowa rola są dla nich niewidoczne. |
| Wygenerowane typy TypeScript | **Nie** | Szczegóły w Części B. Generator wypisuje wyłącznie schematy wystawione w API. |
| Budowanie projektu | **Nie** | `src/integrations/supabase/types.ts` pozostanie bajt w bajt taki sam, więc `tsc` i `vite build` nie mają czego zauważyć. Warto odnotować, że `src/types/supabase.ts` sięga wyłącznie po `Database['public']['Tables']`, więc nawet gdyby typy się rozrosły, kod nie wymagałby zmian. |
| Realtime | **Nie** | Publikacja `supabase_realtime` zawiera dziś tylko `products`, `product_images`, `product_benefits`. Nowy schemat nie jest do niej dopisywany, więc dekodowanie logiczne i slot replikacyjny nie zyskują dodatkowej pracy. |

Jedyna niezerowa, ale niezależna od schematu ścieżka wpływu: nowa rola zużywa slotów z wspólnego `max_connections = 60` (dziś zajęte ~16 z 57 dostępnych). To kwestia połączeń, nie istnienia schematu — analizowana w poprzednim raporcie.

## Część B — typy TypeScript

Wprost: **nie, schemat niewystawiony w Exposed schemas nie pojawi się w wygenerowanym pliku typów.**

Powód: typy generowane są z introspekcji przez PostgREST/Management API i obejmują wyłącznie schematy z listy Exposed schemas (dziś: `public`). Obiekty w `leadbox` będą dla tego mechanizmu nieistniejące — nie zobaczy ich ani jako tabel, ani jako typów, ani jako relacji.

Potwierdzam: **regeneracja typów po tej migracji nie jest potrzebna.** Plik `src/integrations/supabase/types.ts` nie zmieni się w żaden sposób i nie ma powodu go dotykać. Konsekwencja praktyczna, którą trzeba przyjąć świadomie: zewnętrzna aplikacja nie dostanie typów z tego projektu — musi zarządzać własnym opisem schematu.

## Część C — skutki `DROP SCHEMA leadbox CASCADE` + `DROP ROLE`

Wprost: **nie, ta operacja nie może dotknąć niczego w schemacie `public`** — pod jednym warunkiem, opisanym na końcu tej sekcji.

`CASCADE` w `DROP SCHEMA` usuwa obiekty **zależne od usuwanego schematu**, a nie obiekty, od których ten schemat zależy. Kierunek zależności jest tu decydujący. Jeżeli tabela w `leadbox` ma klucz obcy do `public.leads`, to `leadbox` zależy od `public`, więc `DROP SCHEMA leadbox CASCADE` usunie ten klucz obcy razem z tabelą i **nie tknie** `public.leads` ani jednego wiersza.

Zostanie usunięte:
- cztery tabele w `leadbox` wraz z całą zawartością (dane bezpowrotnie),
- ich indeksy, klucze główne i ograniczenia, w tym klucze obce wychodzące do `public` (usuwane jest ograniczenie po stronie `leadbox`, nie tabela docelowa),
- polityki RLS założone na te tabele,
- triggery założone na te tabele — także te wywołujące funkcje z `public` (np. `public.update_updated_at_column()`); ginie trigger, funkcja w `public` zostaje nienaruszona,
- sekwencje, typy i funkcje utworzone w `leadbox`,
- sam schemat.

Potwierdzam, że **nie ucierpi**: żadna tabela, funkcja, trigger, polityka, sekwencja ani wiersz w `public`, `auth`, `storage` czy `extensions`. `DROP ROLE` usuwa wyłącznie tę jedną rolę i jej członkostwa; nie zmienia uprawnień ani ustawień pozostałych ról.

Dwa warunki, których trzeba dopilnować, bo tylko one mogłyby ten obraz zmienić:
1. **`DROP ROLE` nie wykona się, dopóki rola jest właścicielem obiektów lub posiada nadane uprawnienia.** Właściwa kolejność to: najpierw `REASSIGN OWNED BY` / `DROP OWNED BY <rola>`, potem `DROP SCHEMA`, na końcu `DROP ROLE`. Jeżeli rola dostanie w międzyczasie jakiekolwiek granty w `public`, `DROP OWNED BY` je odbierze — to jedyny moment styku z `public` w całej procedurze i jest on zamierzony (odbiera uprawnienia usuwanej roli, nie zmienia uprawnień innych).
2. **Żaden obiekt w `public` nie może odwoływać się do `leadbox`** — żadnego widoku, funkcji ani klucza obcego w tym kierunku. Dopóki tego przestrzegasz (a taki jest plan), `CASCADE` nie ma z `public` czego usunąć. Zależność w odwrotnym kierunku jest bezpieczna.

## Część D — zależności odwrotne istniejące dziś w bazie

Sprawdzone bezpośrednio w katalogu systemowym. Tak, takie powiązania już występują — trzy, wszystkie do schematów systemowych Supabase:

1. **Klucz obcy międzyschematowy — jeden:** `public.user_roles.user_id` → `auth.users.id` (`user_roles_user_id_fkey`). To jedyny FK w bazie przekraczający granicę schematu.
2. **Funkcje w `public` odwołujące się do innych schematów — dwie:**
   - `public.handle_new_user()` — czyta `auth.users` (`SELECT COUNT(*) FROM auth.users`) i jest podpięta triggerem `on_auth_user_created` **na tabeli w schemacie `auth`**. To najsilniejsze istniejące powiązanie międzyschematowe w tym projekcie.
   - `public.get_current_user_role()` — ma `SET search_path TO ''` i odwołuje się do `auth.uid()`.
   - Uzupełniająco: pozostałe funkcje (`has_role`, `notify_lead_created`, polityki RLS) używają `auth.uid()` przez wbudowany mechanizm, ale nie sięgają do tabel `auth` bezpośrednio.
3. **Widoki i widoki zmaterializowane w `public`: brak** — zero obiektów `relkind in ('v','m')`. Nie ma więc ryzyka kaskadowego usunięcia widoku zależnego od czegokolwiek.
4. **Rozszerzenie `http` znajduje się w schemacie `public`** (nietypowe, udokumentowane w `PRODUCTION_READINESS_REPORT.md` jako świadomie zostawione). `pg_net` jest w `extensions`. Oznacza to, że `public` zawiera obiekty rozszerzenia — nieistotne dla `leadbox`, ale istotne, gdyby kiedykolwiek rozważać operacje na całym schemacie `public`.

Wniosek dla oceny ryzyka: baza już żyje z powiązaniami międzyschematowymi i działa stabilnie. Dodanie schematu bez powiązań wstecznych jest operacyjnie łagodniejsze niż to, co już istnieje.

## Część E — nowa rola z uprawnieniem LOGIN

Odpowiedź: **nie, dodanie nowej roli nie zmienia niczego w uprawnieniach ani limitach ról `authenticator`, `anon`, `authenticated`, `service_role` i `postgres`.**

Uzasadnienie po elementach:
- `CREATE ROLE` tworzy nowy, niezależny podmiot. Uprawnienia w Postgresie są nadawane wprost albo dziedziczone przez członkostwo — nowa rola nie staje się członkiem żadnej istniejącej roli, dopóki nie wykonasz jawnego `GRANT <rola> TO <rola>`. Tego robić nie należy.
- Stan obecny limitów, dla porównania: wszystkie role logujące się mają `rolconnlimit = -1` (bez limitu). `authenticator` ma własne ustawienia `statement_timeout=8s`, `lock_timeout=8s`, `session_preload_libraries=safeupdate`. `ALTER ROLE <nowa> SET ...` zapisuje ustawienia **wyłącznie dla nowej roli** w `pg_db_role_setting` i nie modyfikuje wpisu `authenticator`.
- Nałożenie `CONNECTION LIMIT` na nową rolę również nie zmienia limitów pozostałych — działa tylko w jedną stronę, chroniąc wspólną pulę.

Trzy rzeczy, które **mogłyby** wpłynąć na stronę i których trzeba unikać kategorycznie:
1. `SUPERUSER` lub `BYPASSRLS` na nowej roli — omija RLS na `public.leads`, czyli wprost łamie ochronę danych klientów.
2. `GRANT authenticated TO <nowa rola>` (lub `anon`, `service_role`) — nowa rola dziedziczyłaby uprawnienia strony i widziała `public` przez jej polityki.
3. `ALTER DEFAULT PRIVILEGES` w schemacie `public` albo granty na `public` dla nowej roli — jedyna droga, którą nowa rola mogłaby zapisywać do tabel strony. Domyślnie każda rola ma jednak `USAGE` na `public` z uprawnień `PUBLIC`, więc dla pełnej izolacji rozważ `REVOKE ALL ON SCHEMA public FROM <nowa rola>` — to polecenie dotyczy tylko tej roli i nie odbiera niczego rolom strony.

## Część F — czego nie mogę potwierdzić z poziomu tego projektu

1. **Konfiguracja Supavisora / poolera** — rozmiar puli po stronie platformy, tryb (sesyjny/transakcyjny) i limity per projekt widać wyłącznie w dashboardzie Supabase. Nie mam do nich wglądu przez SQL.
2. **Rzeczywista treść listy Exposed schemas.** Wnioskuję z faktu, że wygenerowane typy zawierają tylko `public`, ale samej wartości ustawienia nie widzę. Jeżeli ktoś wystawił coś jeszcze, moja odpowiedź w Części B wymaga weryfikacji w dashboardzie.
3. **Definicje czterech tabel `leadbox`** — nie znam ich nazw ani kolumn, więc ocena w Części C opiera się na regułach `DROP SCHEMA CASCADE`, a nie na konkretnym DDL. Jeśli któraś tabela miałaby zawierać coś więcej niż tabele i triggery (np. własną publikację logiczną albo funkcję wywoływaną z `public`), wnioski trzeba przeliczyć.
4. **Szczytowe zużycie połączeń.** Migawka `pg_stat_activity` to jedna chwila przy niskim ruchu (16 z 57 slotów). Historii nie mam — jest w dashboardzie: Reports → Database.
5. **Uprawnienia twojego konta do `CREATE ROLE`.** Rola `postgres` w Supabase nie jest superuserem; tworzenie ról zwykle działa, ale nie mogę tego potwierdzić bez wykonania operacji, czego w tym trybie nie robię.
6. **Zachowanie generatora typów po stronie platformy Lovable/Supabase.** Opisuję jego udokumentowane zachowanie (tylko wystawione schematy); nie mam dostępu do jego implementacji, więc jeśli po migracji plik typów jednak się zmieni, jest to sygnał do sprawdzenia, a nie awaria.
7. **Polityka backupów i PITR** dla tego projektu — istotna, gdyby `DROP SCHEMA CASCADE` miał być wykonany po wprowadzeniu danych. Widać ją tylko w dashboardzie.

## Ocena końcowa ryzyka

Ryzyko dla strony i panelu: **niskie i dobrze ograniczone.** Operacja jest addytywna — nie modyfikuje żadnego istniejącego obiektu. Trzy realne wektory ryzyka to: nadmiarowe uprawnienia nowej roli (`SUPERUSER`/`BYPASSRLS`/członkostwo w rolach strony), zużycie wspólnych slotów połączeń oraz porzucone transakcje przy globalnym `idle_in_transaction_session_timeout = 0`. Wszystkie trzy są kontrolowane ustawieniami zakładanymi wyłącznie na nowej roli, bez dotykania czegokolwiek, z czego korzysta strona.

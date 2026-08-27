# Panel przejmuje LeadBoxa — odpowiedzi i plan wdrożenia

## Stan potwierdzony odczytem z bazy (27.08.2026)

- `products`: 45; `net_price` w 41. Tryby ceny: `inquiry_with_pricelist` 32, `show_price` 12, `inquiry_only` 1.
- `leads`: 15, z czego **9 ma adres e-mail w kolumnie `phone`** — pułapka z dokumentu potwierdzona.
- `shared_lists`: 3, z tego **1 już po `expires_at`** — czyli najbliższy przebieg `cleanup-expired-shared-lists` (03:15) fizycznie ją usunie. Krok 0 jest pilny.
- `price_inquiries`: **1 wiersz**, nie 0 (dokument mówi 0).
- `cron.job`: dwa zadania — `cleanup-old-handled-leads` (0 3 * * *), `cleanup-expired-shared-lists` (15 3 * * *).
- RLS: `shared_lists` — cztery polityki tylko dla `authenticated`; `anon` nie ma żadnej. `leads` — INSERT publiczny, reszta admin. Publiczny widok oferty faktycznie idzie przez Edge Function `shared-list` na `SUPABASE_SERVICE_ROLE_KEY`.

## Odpowiedzi na pytania „Do ustalenia z Lovable"

**1. Wciąganie zgłoszeń: trigger czy przycisk?**
Zgoda z rekomendacją — przycisk. Import robi Edge Function `leads-intake` wywoływana z panelu (autoryzacja sesją admina, w środku `service_role`). Logika dopasowania jest wtedy jednym miejscem w kodzie, łatwym do poprawienia i uruchomienia ponownie. Idempotencja przez `UNIQUE (lead_id) WHERE lead_id IS NOT NULL` na `contact_activities`. Po dwóch tygodniach ta sama funkcja może zostać wołana triggerem — bez przepisywania logiki.

**2. `shared_list_views` — pełny UA i IP?**
Rekomendacja: **bez IP**, UA tylko jako skrót (`device`: mobile/desktop + rodzina przeglądarki, plus opcjonalnie `ua_hash`). IP to dana osobowa i wymagałaby zapisu w polityce prywatności oraz retencji; sygnały z sekcji „Zakładka Oferty" (Ogląda / Cisza / Wygasa) potrzebują wyłącznie `viewed_at`. Surowy UA zostawiamy jedynie, jeśli chcesz rozróżniać „otwierał z telefonu na budowie" — wtedy z retencją 90 dni.

**3. Publiczny widok oferty i `archived_at`**
Tak, to Edge Function `shared-list` na `service_role` — potwierdzone. Funkcja dziś odrzuca link przy `revoked_at IS NOT NULL` i po `expires_at`, zwracając 404 z komunikatem „Link jest nieaktywny." Po zmianie dojdzie `archived_at` do zapytania i rozróżnienie komunikatów: wygasła / unieważniona / zarchiwizowana — komunikat, nigdy błąd techniczny. Zmiana jest w jednym pliku.

**4. `pg_dump` — schemat, funkcje, triggery, RLS**
Nie da się tego zdjąć kluczem `service_role` ani REST-em; potrzebne jest połączenie Postgresowe. Hasło do bazy i connection string bierzesz z panelu Supabase (Settings → Database), nie z Lovable — my nie mamy dostępu do hasła. Rekomendacja: `pg_dump --schema-only` cyklicznie (raz w tygodniu, obok cronu z JSON-em) — schemat zmienia się rzadko, ale kopia sprzed migracji jest dokładnie tym, czego brakuje przy odtwarzaniu. Dane osobowe zostają w kopii JSON.

**5. Retencja**
`cleanup_old_handled_leads` zostaje wyłącznie na `leads` — potwierdzam: nowe tabele nie wchodzą w jego zakres i nie dopisujemy ich tam. Ale to jest decyzja do wypowiedzenia w polityce prywatności: skrzynka anonimizuje się po 24 miesiącach, kartoteka klientów nie. Proponuję osobne, jawne zadanie dla `contacts` (np. anonimizacja po 36 miesiącach od ostatniej aktywności) — do ustalenia liczby, nie do przemilczenia.

**6. Wycena i termin**
Kroki 0–6 to sześć etapów wdrożeniowych, każdy w osobnym zleceniu, każdy z warunkiem wyjścia z Twojej tabeli. Nie podaję ryczałtu — pracujemy etapami, po każdym etapie sprawdzasz warunek wyjścia z telefonu.

## Uwagi, które zmieniają dokument

- **Krok 0 wykonać natychmiast.** Jedna oferta jest już po terminie; przy najbliższym 03:15 przepada razem z licznikiem odsłon. `cleanup_expired_shared_lists` zamieniamy z `DELETE` na `UPDATE ... SET archived_at = now()`, kasowanie fizyczne dopiero po 12 miesiącach od archiwizacji.
- **`handle_new_user` i konto Michała** — potwierdzam: nowe konto dostanie rolę `user` i zobaczy „brak uprawnień". Wpis w `user_roles` trzeba poprawić po założeniu konta. Zrobię to jednym zapytaniem, gdy konto powstanie.
- **`price_inquiries`** ma jeden wiersz — do przejrzenia przed uznaniem tabeli za martwą.
- **Normalizacja telefonu**: wartość z `@` nie wchodzi do normalizacji telefonu, wchodzi do `email_norm`. To jeden warunek w jednej funkcji `public.norm_phone` / `public.norm_email` — inwariant 1 realizowany na poziomie bazy, nie w kodzie panelu.
- **Bezpieczeństwo dostępu**: panel jest publicznie w internecie i po tej zmianie stoi za nim komplet danych osobowych. Supabase Auth wspiera MFA (TOTP) — warto włączyć przy obu kontach; to konfiguracja w Supabase plus ekran w panelu.

## Kolejność prac (po stronie Lovable)

| # | Etap | Warunek wyjścia |
|---|---|---|
| 0 | `cleanup_expired_shared_lists` → `archived_at`; kolumna `archived_at` na `shared_lists` | wygasły link nadal w bazie następnego dnia po 03:15 |
| 1 | Migracja: `contacts`, `contact_activities`, `shared_list_views`, rozszerzenie `shared_lists` (`contact_id`, `note`, `sent_at`, `channel`, `renewed_from`), funkcje normalizujące, indeksy częściowe, RLS tylko dla admina | zero grantów dla `anon`; `role_table_grants` dla `anon`/`authenticated` bez uprawnień poza `authenticated` |
| 3 | Zakładka Kontakty + karta kontaktu + formularz rozmowy (~1,5 ekranu, pola 44 px, pigułki 36 px, steppery wyszarzone, pasek zapisu z safe-area) | rozmowa zapisana z telefonu |
| 4 | Lista „do kogo dzwonić dziś" — jeden warunek `ukryty = false AND data_sprzedazy IS NULL` w widoku SQL, nie powielany | „nie wracać" zapisuje NULL i nie tworzy daty |
| 5 | Zakładka Oferty: wybór kontaktu, notatka, kanał, `sent_at`, odnawianie (`renewed_from`), sygnały Ogląda / Cisza / Wygasa, archiwum; Edge Function czyta `archived_at` | wysłana oferta widoczna w historii kontaktu |
| 6 | Edge Function `leads-intake` + przycisk „Wciągnij zgłoszenia" | dwukrotne wciągnięcie daje tyle samo kontaktów; lead Tomasza Rapy — numer z treści zostaje w historii, nie w polu telefonu |

Kroki 2, 7, 8, 9 są po Twojej stronie (konto Michała, konto techniczne, cron kopii na Pi, wygaszenie LeadBoxa).

## Techniczne szczegóły migracji z kroku 1

- Wszystkie trzy nowe tabele: `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated`, `GRANT ALL ... TO service_role`, **bez `anon`**, RLS włączony, polityki `has_role(auth.uid(),'admin')` na wszystkie operacje.
- Brak `CHECK` z `now()` (niedozwolone jako immutable) — walidacje czasowe triggerem.
- `krok` jako `text` z `CHECK` na listę wartości bez `kupil`; sprzedaż wyłącznie w `data_sprzedazy` (inwariant 8, 13).
- `contact_activities.lead_id` bez FK (świadomie — anonimizacja i kasowanie w skrzynce nie mogą kaskadować), z unikalnym indeksem częściowym.
- `shared_lists.contact_id` i `renewed_from` z FK `ON DELETE SET NULL`.
- Indeksy częściowe: `(email_norm) WHERE ukryty = false`, `(telefon_norm) WHERE ukryty = false`, `(termin_followup) WHERE ukryty = false AND data_sprzedazy IS NULL`.
- Widok `public.v_followup_today` domykający inwariant 10 — jedno miejsce z warunkiem wypadania z listy.

## Zakres pierwszego zlecenia

Proponuję puścić **kroki 0 i 1** od razu (nic nie psują, a krok 0 ratuje dane dziś wieczorem), a interfejs (3–6) budować po nich, etap po etapie.

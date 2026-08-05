# Raport: przekroczony Database Size (0,98 GB / 0,5 GB)

## 1. Zadania cron (`cron.job`)

| jobid | nazwa | harmonogram | aktywne | polecenie |
|---|---|---|---|---|
| 1 | process-translations-every-minute | `* * * * *` | tak | `net.http_post` -> Edge Function `translation-worker` (nagłówek Authorization = **service_role key wpisany na stałe w treści zadania**) |
| 2 | process-translations-1min | `* * * * *` | tak | `net.http_post` -> ta sama funkcja `translation-worker` (nagłówek z anon key) |
| 3 | cleanup-old-handled-leads | `0 3 * * *` | tak | `SELECT public.cleanup_old_handled_leads()` |

Wpisy w `cron.job_run_details`:

- job 1: 510 964 wpisy, najstarszy 2025-08-15 13:45 UTC, najnowszy 2026-08-05 09:48. Statusy: 354 453 `failed`, 156 510 `succeeded`.
- job 2: 508 322 wpisy, najstarszy 2025-08-17 09:47 UTC. Statusy: 351 811 `failed`, 156 510 `succeeded`.
- job 3: 104 wpisy, najstarszy 2026-04-24 03:00, wszystkie `succeeded`.

Razem ok. 1 019 390 wierszy — to jest źródło 806 MB tabeli + 22 MB indeksu PK. Dwa zadania minutowe działają równolegle od roku i **dublują się** (to samo wywołanie tej samej funkcji), a większość ich uruchomień kończy się błędem.

## 2. Źródło wywołań HTTP

Tak. Zadania 1 i 2 wywołują Edge Function przez `pg_net` (`net.http_post`), każde raz na minutę, czyli ok. 2 880 wywołań HTTP na dobę. Dodatkowo trigger `notify_lead_created` używa rozszerzenia `http` (nie `pg_net`) — nie zapisuje nic w `net._http_response`.

`net._http_response` ma obecnie tylko **720 wierszy** (od 2026-08-05 03:50 do 09:49) — pg_net sam czyści odpowiedzi po ok. 6 godzinach. Fizyczne 164 MB to więc nie dane, a **puchnięcie tabeli (dead tuples / bloat)** po roku wstawiania i usuwania ~3 tys. wierszy dziennie przez oba zadania minutowe. Tak — odpowiadają za to zadania 1 i 2.

## 3. Przeznaczenie zadań

- **job 1 i job 2 (translation-worker)** — miały przetwarzać kolejkę tłumaczeń DeepL (`translation_jobs`). Obecnie: `FEATURES.DEEPL_ENABLED = false` w `src/config/featureFlags.ts`, `translation_jobs` = 0 wierszy, `product_translations` = 0 wierszy. To **pozostałość po wcześniejszych pracach nad tłumaczeniami AI**; job 2 jest ponadto duplikatem joba 1 (różni się tylko kluczem w nagłówku). Praktycznie nic nie wnoszą do działania serwisu.
- **job 3 (cleanup-old-handled-leads)** — codzienne usuwanie leadów oznaczonych jako `handled` starszych niż 60 dni. Potrzebne, działa poprawnie, koszt zerowy (104 wpisy).

Brak zadań cron dla sitemap, geo-feed czy powiadomień — te działają na żądanie (Edge Functions), więc ich nic nie dotyczy.

## 4. Zależności od logów

**Nie.** W repozytorium (frontend, panel admina, Edge Functions) nie ma ani jednego odwołania do `cron.job_run_details` ani do `net._http_response` — wyszukiwanie po całym projekcie nie zwraca żadnych trafień poza samą migracją zakładającą cron. Nie istnieją też widoki w `public` czytające te tabele. Usunięcie ich zawartości nie zepsuje żadnej funkcji aplikacji; stracisz wyłącznie historię diagnostyczną uruchomień cron.

## 5. Tabele aplikacji (rozmiar z indeksami / wiersze)

| tabela | rozmiar | wiersze | retencja |
|---|---|---|---|
| translation_logs | 1 368 kB | 1 731 | brak — rośnie bez ograniczeń (obecnie martwe, bo DeepL wyłączony) |
| translation_jobs | 904 kB | 0 | brak, ale puste (bloat po starych zadaniach) |
| product_translations | 48 kB | 0 | nie dotyczy |
| price_inquiries | 64 kB | 1 | brak — rośnie bez ograniczeń (wolno) |
| leads | 112 kB | 13 | jest — job 3, 60 dni od `handled_at` |
| product_images | 520 kB | 374 | powiązane z produktami |
| social_media_posts | 88 kB | 77 | czyszczone przy resecie rotacji |
| products | 672 kB | 43 | nie dotyczy |

Wniosek: **wszystkie tabele aplikacji razem to poniżej 4 MB**. Problem w 100% leży w tabelach systemowych `cron` i `net`. Bez retencji rosną teoretycznie `translation_logs` i `price_inquiries`, ale w tym tempie są nieistotne.

## 6. Możliwości odzyskania miejsca (od najbezpieczniejszej)

1. **Wyłączenie duplikatu — job 2 (`process-translations-1min`)**. Zysk natychmiastowy: 0 MB, ale zatrzymuje ~50% dalszego przyrostu. Przestaje działać: nic (job 1 robi to samo).
2. **Wyłączenie job 1** — zatrzymuje cały przyrost `cron.job_run_details` i `net._http_response`. Zysk: 0 MB od razu, ~2 MB/dobę zaoszczędzone. Przestaje działać: automatyczne przetwarzanie kolejki tłumaczeń DeepL — dziś i tak wyłączone flagą, do ręcznego uruchomienia zostaje przycisk w panelu (`processPendingTranslations`).
3. **Czyszczenie `cron.job_run_details`** (usunięcie wpisów starszych niż np. 7 dni). Zysk: ~820 MB (tabela + PK) — czyli praktycznie cały problem. Przestaje działać: nic; tracisz historię uruchomień cron w podglądzie Supabase.
4. **`translation_logs`** — usunięcie starych logów tłumaczeń. Zysk: ~1 MB. Przestaje działać: nic funkcjonalnego, tracisz historię wywołań DeepL.
5. **`VACUUM FULL net._http_response`** (lub `TRUNCATE`) — odzyskanie 164 MB bloatu. Ryzyko: `VACUUM FULL` blokuje tabelę na wyłączny lock i przepisuje ją; przy tej wielkości to sekundy, ale w tym czasie każde `net.http_post` (czyli m.in. trigger cron) czeka. `TRUNCATE` usuwa też odpowiedzi na trwające żądania.
6. **Usunięcie zadań cron (`cron.unschedule`)** — najbardziej nieodwracalne. Przestaje działać: automatyczne tłumaczenia (job 1/2) — a job 3 **musi zostać**, bo to jedyna retencja leadów.

### O odzyskiwaniu miejsca na dysku

Samo `DELETE` nie zwraca miejsca Supabase — wiersze stają się martwe, a rozmiar bazy w raporcie nadal pokazuje ~1 GB do czasu VACUUM. Dlatego po dużym usuwaniu z `cron.job_run_details` konieczny jest `VACUUM FULL` (lub `TRUNCATE`, który od razu zwalnia pliki i nie wymaga VACUUM). Skutki: `VACUUM FULL` bierze `ACCESS EXCLUSIVE LOCK`, wymaga chwilowo dodatkowego miejsca równego rozmiarowi tabeli i unieważnia statystyki. Na tabelach `cron`/`net` nie ma to wpływu na front, bo aplikacja z nich nie czyta.

## Rekomendowana kolejność

1. Wyłączyć job 2 (duplikat), potem job 1 — zatrzymanie przyrostu u źródła.
2. `TRUNCATE cron.job_run_details` (albo DELETE + `VACUUM FULL`) — odzysk ~820 MB.
3. `TRUNCATE net._http_response` — odzysk ~164 MB bloatu, bez VACUUM FULL.
4. Zostawić job 3 bez zmian.
5. Opcjonalnie: dodać retencję dla `translation_logs`, gdy tłumaczenia zostaną kiedyś włączone ponownie.

Po krokach 1–3 baza powinna spaść z ~0,98 GB do ok. 10–15 MB, czyli daleko poniżej limitu Free.

> Uwaga bezpieczeństwa (poza zakresem zadania, ale istotna): treść joba 1 zawiera zapisany na stałe **service_role key** w `cron.job.command`, a ten sam klucz trafił do pliku migracji w repozytorium.

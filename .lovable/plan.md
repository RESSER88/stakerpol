# Etap 3 — zatrzymanie na warunku wejścia + plan wykonania

## Odpowiedź na pytanie o bazę

Tak — panel i strona pracują na jednej, tej samej bazie Supabase (projekt `peztqgfmmnxaaoapzpbw`). Nie ma „starej" i „nowej" wersji danych: `products`, `leads`, `shared_lists` to te same tabele, z których korzysta publiczna strona. Nowe zakładki dokładają obok tabele robocze, nie kopiują danych. Dlatego kryterium „Eksport generuje PDF/JPG/XLSX dla 45 produktów" i tak jest spełnione — to ten sam katalog.

## Warunek rozpoczęcia NIE jest spełniony — zatrzymuję się

Odczyt schematu (`information_schema.columns`, 27.08.2026) pokazuje, że **etapy 0 i 1 nie zostały wdrożone**:

- `shared_lists` ma dokładnie 11 kolumn: `id, token, filters, label, created_by, expires_at, revoked_at, view_count, last_viewed_at, created_at, updated_at`. **Brak** `archived_at`, `contact_id`, `note`, `sent_at`, `channel`, `renewed_from`.
- Tabele `contacts`, `contact_activities`, `shared_list_views` **nie istnieją**.

Etapu 3 nie da się zrobić „na zapas": każde z pięciu kryteriów akceptacji dotyka kolumn i tabel, których nie ma. Zgodnie z Twoim zapisem „nie realizuj kolejnych etapów w tej samej odpowiedzi" nie wchodzę też samowolnie w zakres etapów 0–1 bez decyzji.

Do tego doszła rzecz pilna: jedna oferta jest już po `expires_at`, a `cleanup-expired-shared-lists` (pg_cron, 03:15) kasuje takie wiersze fizycznie. Do czasu etapu 0 każda wygasła oferta traci historię odsłon bezpowrotnie.

## Propozycja: wykonać etap 0 + 1 teraz, jedną migracją

Zakres migracji (bez zmian w kodzie panelu, bez ryzyka dla strony):

1. `shared_lists`: `archived_at timestamptz`, `contact_id uuid → contacts`, `note text`, `sent_at timestamptz`, `channel text CHECK (email|whatsapp|sms|telefon)`, `renewed_from uuid → shared_lists`. Wszystkie nullowalne, więc istniejące 3 linki i logika slug/`expires_at` zostają nietknięte.
2. `cleanup_expired_shared_lists()` przepisana z `DELETE` na `UPDATE ... SET archived_at = now()`; fizyczne kasowanie dopiero po 12 miesiącach od archiwizacji.
3. `public.norm_phone(text)` i `public.norm_email(text)` — jedna funkcja normalizacji (inwariant 1); `norm_phone` zwraca NULL dla wartości zawierającej `@`.
4. `public.contacts` — kolumny dokładnie z Twojego dokumentu (`osoba`, `firma`/`firma_norm`, `telefon`/`telefon_norm`, `email`/`email_norm`, `zrodlo`, `krok` z `CHECK` bez wartości `kupil`, `termin_followup`, `data_sprzedazy`, `udzwig_kg`, `wysokosc_m`, `sprawdz_duplikat`, `ukryty`, `utworzony_przez`, `zaktualizowany_przez`, znaczniki czasu). Indeksy częściowe po `email_norm`, `telefon_norm` i `termin_followup` z warunkami z inwariantów 2 i 10.
5. `public.contact_activities` — `contact_id` (FK), `typ` (`telefon|formularz|oferta|sprzedaz|ukrycie|notatka`), `data`, `tresc`, `wynik`, `sku`, `utworzony_przez`, `lead_id` (bez FK) + `UNIQUE (lead_id) WHERE lead_id IS NOT NULL` (idempotencja importu), `shared_list_id` (FK).
6. `public.shared_list_views` — `shared_list_id` (FK), `viewed_at`, `device` (skrót UA). Bez IP.
7. Dla każdej nowej tabeli: `GRANT ... TO authenticated` + `GRANT ALL TO service_role`, **zero grantów dla `anon`**, RLS włączony, polityki `has_role(auth.uid(),'admin')` na wszystkie operacje.
8. Widok `public.v_followup` z jednym warunkiem `ukryty = false AND data_sprzedazy IS NULL`.

Weryfikacja po migracji: `role_table_grants` dla `anon` zwraca zero wierszy dla nowych tabel; wygasła oferta następnego dnia po 03:15 nadal jest w bazie z wypełnionym `archived_at`.

## Etap 3 — plan, do wykonania po migracji

Zakres i pliki (bez odstępstw od Twojej specyfikacji):

- `src/components/admin/layout/types.ts`, `AdminSidebar.tsx`, `AdminBottomNav.tsx` — nowa numeracja 01–07, pozycje `offers` i `contacts`; `inquiries` znika z menu, ale zostaje jako wartość sekcji, żeby stary adres kierował na widok ZAPYTANIA wewnątrz Ofert (przekierowanie, nie 404).
- `src/pages/Admin.tsx` — routing sekcji.
- Nowy `src/components/admin/sections/OffersSection.tsx` — pasek trzech widoków w konwencji z Zapytań (NOWA / WYSŁANE / ZAPYTANIA).
- Nowy `OfferNewView.tsx` — przeniesiony formularz z `SharedListAccess.tsx` (logika slug i `expires_at` skopiowana bez zmian) + pola: nazwa (wymagana), telefon (wymagany), notatka, kanał. Zapis przez funkcję bazodanową `create_offer(...)` — jedna transakcja: dopasowanie/utworzenie `contacts`, `shared_lists`, `contact_activities`.
- Nowy `OfferSentView.tsx` — lista z sortowaniem `last_viewed_at desc nulls last, sent_at desc`, statusy linku, sygnały ogląda/cisza/wygasa, „pokaż archiwalne", „Nowy link" z `renewed_from`.
- `InquiriesSection.tsx` — bez zmian w treści; dochodzi przycisk „Wciągnij do kontaktów".
- Nowa Edge Function `leads-intake` — dopasowanie `email_norm` → `telefon_norm`, nigdy nie nadpisuje `krok` ani `termin_followup`, idempotentna przez unikalny indeks na `lead_id`.
- Nowy `ContactsSection.tsx` + `ContactCard.tsx` — kartoteka, filtr źródła, wyszukiwarka, karta kontaktu współdzielona z widokiem WYSŁANE.
- `ExportSection.tsx` — usunięcie sekcji „Generuj dostęp online" i „Aktywne linki"; `SharedListAccess.tsx` zostaje wygaszony po przeniesieniu.

Mobile: pola 44 px, pigułki wyboru 36 px, pasek zapisu z `safe-area-inset-bottom` — jak w formularzu rozmowy z dokumentu.

## Decyzja do podjęcia

Zatwierdź ten plan, żebym wykonał **etap 0 + 1 (migracja)**. Etap 3 przyjdzie w kolejnym zleceniu, już z warunkiem wejścia spełnionym.

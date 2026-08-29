# Trzy funkcje bazy danych — jedna migracja

Zero zmian w `src/`, zero zmian w Edge Functions, zero zmian w schemacie `leads`.

Weryfikacja przed zmianą: `NewOfferView.tsx` woła `supabase.rpc('create_offer', { _token, _filters, _nazwa, _telefon, _email, _tygodnie, _notatka, _kanal })` — czyli **argumentami nazwanymi**, więc dopisanie opcjonalnego parametru na końcu nie łamie tego wywołania.

## 1. create_offer — jeden nowy parametr

`public.create_offer(..., _kanal text default null, _renewed_from uuid default null)`

- Jedyna zmiana w ciele: `shared_lists.renewed_from = _renewed_from` przy wstawianiu oferty.
- Walidacja, advisory lock, dopasowanie kontaktu po telefonie/e-mailu, wpis do `contact_activities` — bez zmian.
- Uprawnienia i `SET search_path = public` odtworzone tak jak dziś.

## 2. import_lead_to_contact(_lead_id uuid)

Zwraca `contact_id uuid, kontakt_nowy boolean`.

Kolejność działań:
1. Pobranie wiersza z `leads`; brak → `RAISE EXCEPTION`.
2. Idempotencja: jeśli w `contact_activities` istnieje już wiersz z tym `lead_id`, zwróć jego `contact_id` i `kontakt_nowy = false` — bez żadnych zapisów.
3. Advisory lock na znormalizowanym e-mailu / telefonie / id zgłoszenia.
4. Dopasowanie kontaktu: najpierw `norm_email(leads.email)`, potem `norm_phone(leads.phone)` (funkcje bez zmian — `norm_phone` zwraca NULL dla wartości z `@`).
5. Brak trafienia → nowy kontakt: `zrodlo = 'www'`, `osoba = leads.name`, `telefon = leads.phone` (surowe), `email = leads.email`, `krok = 'nowy'`.
6. Trafienie → uzupełnienie wyłącznie pustych pól (`osoba`, `telefon`, `email` przez `coalesce`), `sprawdz_duplikat = true`; `krok` i `termin_followup` nietknięte.
7. Wpis historii: `typ = 'formularz'`, `lead_id = _lead_id`, `tresc = leads.message`, `data = leads.created_at`.

Wyjątek naruszenia unikalnego indeksu `contact_activities_lead_id_uniq` obsłużony (`WHEN unique_violation`) — zwraca istniejący `contact_id`, więc dwa równoległe wywołania też są bezpieczne.

## 3. log_contact_activity(...)

Sygnatura zgodna ze zleceniem, z jednym dodatkowym parametrem na końcu:

```text
_contact_id uuid, _typ text, _tresc text default null, _wynik text default null,
_krok text default null, _termin_followup date default null,
_data_sprzedazy date default null, _udzwig_kg integer default null,
_wysokosc_m numeric default null, _wyczysc_termin boolean default false
```

Wybrane podejście do rozróżnienia „nie zmieniaj" od „wyczyść": **osobny parametr boolean** `_wyczysc_termin` (czytelniejszy od sentinela z datą-magiczną i opisany w komentarzu funkcji). `_termin_followup = null` + `_wyczysc_termin = false` → pole bez zmian; `_wyczysc_termin = true` → `termin_followup = NULL`.

- `UPDATE contacts` w jednej instrukcji: każda kolumna przez `coalesce(_param, kolumna)`, plus reguła czyszczenia terminu; `zaktualizowany` obsłuży istniejący trigger.
- `_krok = 'kupil'` → `RAISE EXCEPTION` (wartość niedopuszczalna; dozwolone wartości pilnuje też `contacts_krok_check`).
- `INSERT INTO contact_activities (contact_id, typ, tresc, wynik, data)` w tej samej transakcji; `_typ` walidowany istniejącym CHECK-iem.
- Brak kontaktu o podanym id → `RAISE EXCEPTION`.

## Uprawnienia (wszystkie trzy funkcje)

`SECURITY INVOKER`, `SET search_path = public`, `REVOKE ALL ... FROM PUBLIC, anon`, `GRANT EXECUTE ... TO authenticated`.

## Weryfikacja po migracji

Na testowym zgłoszeniu z `leads` (w transakcji z rollbackiem):
- `import_lead_to_contact` dwa razy na tym samym `_lead_id` → identyczny `contact_id`, drugi raz `kontakt_nowy = false`, jeden wiersz w historii.
- `log_contact_activity` → zmieniony `krok` i `termin_followup` kontaktu oraz nowy wiersz w `contact_activities` z jednego wywołania.

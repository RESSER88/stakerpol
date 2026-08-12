# Oznaczanie zapytań zakończonych sprzedażą

Cel: odwracalna akcja „Kupił” przy zapytaniu obsłużonym oraz sprzedaż widoczna w statystykach — bez zmiany działania zakładek Nowe / Obsłużone / Wszystkie i bez nowej zakładki.

## Wybrany wariant

Nowa, domyślnie pusta kolumna znacznikowa z datą oznaczenia sprzedaży (`sold_at`), zamiast nowej wartości statusu. „Sprzedane” pozostaje podzbiorem „obsłużonych”, więc licznik obsłużonych i filtry zakładek działają bez zmian.

## Zakres

### 1. Baza danych
- Dodanie kolumny `sold_at` (data i godzina, domyślnie pusta) w tabeli zapytań.
- Indeks częściowy dla wierszy z ustawioną datą sprzedaży.
- Bez zmian w ograniczeniu statusu, triggerze `handled_at` i politykach dostępu — obecna polityka aktualizacji dla administratora obejmuje nową kolumnę.

### 2. Lista zapytań (widok Obsłużone)
- Pobieranie nowej kolumny w zapytaniu listy oraz w typie wiersza.
- Nowa akcja przy wierszu, widoczna tylko dla zapytań obsłużonych, obok „Cofnij” i „Usuń”:
  - stan wyjściowy: „Kupił” — ustawia datę sprzedaży na teraz,
  - stan oznaczony: „Cofnij sprzedaż” — czyści datę (odwracalność),
  - blokada przycisku w trakcie zapisu, komunikat toast po zapisie, aktualizacja wiersza lokalnie bez przeładowania listy.
- Oznaczony wiersz dostaje dyskretną etykietę „Sprzedane” obok źródła zapytania oraz wyróżniony wskaźnik statusu, w istniejącej stylistyce widoku.

### 3. Statystyki
- Dwa liczniki w siatce górnej: „Obsłużone” (bez zmian) oraz nowy „Zakończone sprzedażą”.
- Wykres: w każdym słupku wyróżniony udział sprzedaży (segment dolny w mocniejszym akcencie, część obsłużona bez zmian).
- Podpowiedź po najechaniu: do istniejącej warstwy dopisana liczba sprzedaży dla danego okresu, np. „maj 2026 — 12 zapytań, 3 sprzedaże”.

## Szczegóły techniczne

- Migracja: `ALTER TABLE public.leads ADD COLUMN sold_at timestamptz` + `CREATE INDEX ... WHERE sold_at IS NOT NULL`. Bez zmiany `leads_status_check` i funkcji `set_lead_handled_at()`.
- `src/components/admin/sections/InquiriesSection.tsx`: rozszerzenie interfejsu `Lead` i listy kolumn w `select` (linia 51), nowy handler `toggleSold` obok `markHandled` (wzorowany na nim: `updating`, obsługa błędu, toast), nowy przycisk w bloku akcji (linie 273–304). Bez zmian w `StatusFilter`, `TabValue`, filtrze `.eq('status', filter)`, paginacji i usuwaniu.
- `src/components/admin/sections/InquiryStats.tsx`: `sold_at` w `select` i w `StatRow`, `soldCount` w `stats`, pole `sold` w `Bucket` i jego zliczanie w obu gałęziach (12 miesięcy oraz 7/30 dni), słupek jako kontener z dwoma segmentami, rozszerzony tekst aktywnej podpowiedzi.
- Kolory wyłącznie z istniejących tokenów widoku (`editorial-ink`, `editorial-accent`, `editorial-muted`).

## Poza zakresem

- Nowa zakładka filtrująca sprzedane.
- Zmiany w statusach, usuwaniu zapytań, powiadomieniach o nowym zapytaniu i eksportach.

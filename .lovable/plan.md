# Leadbox — komplet danych zapytania w panelu

## Cel
Sekcja „Zapytania” w panelu pokazuje pełny obraz zgłoszenia: dane kontaktowe, datę zgłoszenia, status reakcji wraz z datą obsłużenia oraz dane techniczne (przeglądarka/urządzenie). Zakres wyłącznie prezentacyjny.

## Ustalenia
- Imię i nazwisko pozostają w jednym polu `name` — bez migracji, bez zmian w formularzach publicznych.
- Do widoku dochodzą: data obsłużenia (`handled_at`, plus data sprzedaży z `sold_at`) oraz `user_agent`.
- `page_url` i `rodo_accepted` pozostają poza zakresem.

## Zakres zmian
Jeden plik: `src/components/admin/sections/InquiriesSection.tsx`.

1. Zapytanie do bazy: dodać `user_agent` do listy kolumn w `select` (pozostałe potrzebne pola — `handled_at`, `sold_at` — są już pobierane).
2. Typ `Lead`: dodać `user_agent: string | null`.
3. Karta zapytania — w wierszu metadanych pod nazwą, w istniejącym stylu (`text-xs text-editorial-muted`):
   - gdy status = obsłużone: „Obsłużone: {data i godzina}” z `handled_at`,
   - gdy `sold_at` niepuste: przy istniejącej plakietce „Sprzedane” dodać datę sprzedaży.
4. Dane techniczne: `user_agent` jako skrócony, jednolinijkowy wpis w sekcji rozwijanej — widoczny po kliknięciu „Rozwiń”, żeby nie zaśmiecać listy. Jeśli zapytanie nie ma wiadomości, przycisk rozwijania i tak ma być dostępny, gdy istnieje `user_agent`.
5. Formatowanie dat: ten sam wzorzec co obecna data zgłoszenia — `toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })`.

## Poza zakresem
- Brak migracji bazy i zmian RLS — wszystkie potrzebne kolumny już istnieją, a administrator ma pełny odczyt.
- Bez zmian w formularzach publicznych, w Edge Function `notify-lead`, w treści maila Resend, w `InquiryStats.tsx` i w kaflach `DashboardSection.tsx`.
- Bez zmian logiki statusów, triggera `set_lead_handled_at` i anonimizacji po 24 miesiącach.

## Weryfikacja
Podgląd sekcji „Zapytania” w panelu na szerokości mobilnej (360 px) i desktopowej: data obsłużenia widoczna tylko dla obsłużonych, rozwijanie pokazuje dane techniczne, układ listy i typografia bez regresji.

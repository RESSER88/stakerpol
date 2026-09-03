# Cytat dnia w panelu — pobierany z zewnątrz

## Dlaczego przesłany kod nie zadziała

Sprawdzone na żywo:

- `https://dailystoic.pl` odpowiada `Content-Type: text/html` i pełną stroną HTML. `odpowiedz.json()` rzuci wyjątek za każdym razem, więc zobaczysz wyłącznie komunikat błędu.
- `/api/quote`, `/api`, `/quote.json`, `/api/v1/quote` na tej domenie zwracają 404 — publicznego API JSON tam nie ma.
- Pola `quote`, `author`, `book` nie istnieją w żadnej odpowiedzi tego serwisu.
- Serwer nie wysyła nagłówka `Access-Control-Allow-Origin`, więc przeglądarka zablokuje to żądanie z panelu jeszcze przed parsowaniem odpowiedzi. Dotyczy to tak samo wersji w czystym HTML, jak i przesłanej później wersji w React — obie trafią w gałąź błędu.
- Kolory (`#f7fafc`, `#2d3748`, `bg-slate-50`, `border-blue-500`) nie są tokenami projektu i łamią wdrożony tryb nocny panelu.

## Rozwiązanie: prawdziwe API + tłumaczenie na polski

Sprawdziłem działające, darmowe API bez klucza:

- `https://zenquotes.io/api/today` — zwraca poprawny JSON, jeden cytat na dobę, z polem `date` (dziś: `2026-09-03`).
- `https://stoic.tekloon.net/stoic-quote` — działający JSON ze stoikami (Marek Aureliusz, Seneka, Epiktet), jako rezerwa.

Oba są angielskie, więc polski tekst dorobimy przez DeepL, który już jest w tym projekcie (klucze w tabeli `deepl_api_keys`, wykorzystywane przez funkcję `auto-translate`).

### Nowa Edge Function `quote-of-the-day`

1. Pobiera cytat dnia z ZenQuotes; przy błędzie lub pustej odpowiedzi próbuje `stoic.tekloon.net`; przy podwójnej porażce zwraca zapasowy cytat wpisany w kodzie funkcji, więc panel nigdy nie pokazuje pustego bloku.
2. Tłumaczy tekst cytatu na polski przez DeepL (`EN -> PL`), tym samym mechanizmem odczytu klucza co `auto-translate`. Nazwiska autorów zostają bez tłumaczenia.
3. Cache w pamięci isolate na klucz daty (`YYYY-MM-DD`) — kolejne wejścia do panelu w tym samym dniu nie zużywają limitu DeepL.
4. Zwraca `{ text, author, source, date, lang }`. Funkcja publiczna, bez weryfikacji JWT, bo nie dotyka danych firmowych.

### Interfejs panelu

5. Nowy komponent `src/components/admin/editorial/QuoteOfTheDay.tsx` — pobiera dane przez `supabase.functions.invoke('quote-of-the-day')`, trzyma wynik w `sessionStorage` pod kluczem dnia, żeby przeklikiwanie zakładek nie generowało kolejnych żądań. W trakcie pobierania pokazuje delikatny szkielet, przy porażce po prostu nie renderuje bloku (żadnych czerwonych błędów w panelu).
6. Umieszczenie w `DashboardSection.tsx` pod powitaniem „Dobry wieczór." i licznikiem nowych zapytań, przed paskiem statystyk.
7. Wygląd w konwencji editorial: lewa kreska `border-editorial-accent`, tło `bg-editorial-line/20`, cytat `font-editorial italic text-editorial-ink`, autor wersalikami `text-editorial-muted` z trackingiem. Wyłącznie tokeny, zero inline styli — tryb nocny działa automatycznie.

## Zakres

Jedna nowa Edge Function, jeden nowy komponent, jedna wstawka w `DashboardSection.tsx`. Zero migracji, zero zmian w bazie, zero zmian na stronie publicznej, zero dotykania `create_offer`, `log_contact_activity` i pozostałych funkcji.

## Warunek zaliczenia

Sekcja Start panelu pokazuje polski cytat z autorem, pobrany z zewnętrznego serwisu; ten sam cytat utrzymuje się przez cały dzień; awaria zewnętrznego API nie psuje wyglądu panelu; blok czyta się poprawnie w trybie dziennym i nocnym.

# Cytat dnia w panelu administracyjnym

## Ocena przesłanego kodu

Kod w obecnej formie nie zadziała. Weryfikacja na żywo:

- `https://dailystoic.pl` odpowiada `Content-Type: text/html` i pełną stroną HTML, nie JSON-em. `odpowiedz.json()` rzuci wyjątek już przy pierwszym uruchomieniu, więc użytkownik zawsze zobaczy „Nie udało się pobrać cytatu”.
- Endpointy `/api/quote`, `/api`, `/quote.json`, `/api/v1/quote` zwracają 404 — publicznego API JSON pod tą domeną nie ma.
- Pola `dane.quote`, `dane.author`, `dane.book` nie istnieją w żadnej odpowiedzi.
- Inline kolory (`#f7fafc`, `#2d3748`, `#2b6cb0`) i `font-family: sans-serif` łamią wdrożony tryb nocny panelu i typografię editorial.
- `<script>` z `document.getElementById` to wzorzec statycznego HTML, nie React — w tym projekcie musi to być komponent.

## Co zbuduję zamiast tego

Wbudowana lista cytatów w aplikacji, wybierana deterministycznie po dacie. Zero zależności od zewnętrznych serwisów, działa offline, ten sam cytat przez cały dzień dla wszystkich, brak opóźnienia i migotania.

1. **Nowy plik `src/data/quotes.ts`** — tablica ~40 polskich cytatów (stoicy i klasyka: Marek Aureliusz, Seneka, Epiktet), każdy jako `{ text, author, source? }`.
2. **Nowy komponent `src/components/admin/editorial/QuoteOfTheDay.tsx`** — liczy indeks z dnia roku (`dayOfYear % quotes.length`), więc cytat zmienia się raz na dobę i jest stabilny w obrębie dnia.
3. **Umieszczenie w `DashboardSection.tsx`** — bezpośrednio pod powitaniem „Dobry wieczór.” i licznikiem nowych zapytań, przed paskiem statystyk.
4. **Wygląd zgodny z panelem** — lewa kreska w `border-editorial-accent`, tło `bg-editorial-line/20`, tekst `font-editorial italic text-editorial-ink`, autor małymi wersalikami `text-editorial-muted` z trackingiem, jak pozostałe podpisy w panelu. Bez inline styli, wyłącznie tokeny, więc tryb nocny działa automatycznie.

## Zakres

Wyłącznie interfejs panelu. Zero migracji, zero zmian w bazie, zero Edge Functions, zero wpływu na stronę publiczną.

## Warunek zaliczenia

Sekcja Start panelu pokazuje polski cytat z autorem pod powitaniem; cytat nie zmienia się przy odświeżeniu strony w tym samym dniu; blok czyta się poprawnie w trybie dziennym i nocnym.

## Alternatywa, jeśli wolisz cytaty z zewnątrz

Można zrobić funkcję Edge, która raz na dobę pobiera stronę dailystoic.pl, wyciąga cytat z meta tagów `og:description` i cache'uje wynik. Działałoby, ale zepsuje się przy każdej zmianie layoutu tamtej strony i wprowadza stan „ładowanie” w panelu. Powiedz, jeśli mimo tego chcesz tę drogę.

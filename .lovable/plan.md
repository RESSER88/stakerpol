# Polski cytat dnia w panelu — proxy przez Edge Function

## Co potwierdziłem na żywo

`https://dailystoic.pl/quote/text_pl.json` zwraca `HTTP 200`, `Content-Type: application/json` i pola `title`, `quote`, `description` po polsku (sprawdzone dzisiaj, plik z datą wczorajszą — treść zmienia się codziennie).

Ale w odpowiedzi **nie ma nagłówka `Access-Control-Allow-Origin`**. Przeglądarka zablokuje żądanie z `stakerpol.pl`, więc oba przesłane warianty (Server Component i `'use client'`) nie zadziałają:
- wariant Next.js — projekt to czyste SPA na Vite, nie ma runtime'u serwerowego ani `next: { revalidate }`,
- wariant kliencki — padnie na CORS.

Rozwiązaniem jest cienki serwer pośredniczący. Mamy już Supabase Edge Functions, więc to jedno małe wywołanie.

## Wymagania, jakie stawiam tej funkcji

1. **Zero zapisu w bazie.** Bez tabeli, bez migracji, bez kolumn. Funkcja tylko pobiera i oddaje.
2. **Publiczna, bez tokena.** Dopisana do `supabase/config.toml` jako `verify_jwt = false`, żeby nie wymagała sesji.
3. **Cache po stronie brzegu.** Odpowiedź z `Cache-Control: public, max-age=3600, s-maxage=86400` — kolejne wywołania tego samego dnia idą z cache CDN, nie z funkcji.
4. **Cache po stronie panelu.** Wynik w `localStorage` pod `stakerpol-quote-RRRR-MM-DD`, stare klucze kasowane. Efekt: **jedno wywołanie funkcji na przeglądarkę na dobę**, nie na każde wejście.
5. **Timeout i cicha awaria.** 4 s po stronie panelu (`AbortController`), 6 s po stronie funkcji. Przy błędzie komponent nie renderuje nic — panel wygląda jak wcześniej, żadnych czerwonych ramek.
6. **Zero wpływu na stronę publiczną.** Komponent żyje tylko w `DashboardSection.tsx`, czyli w lazy-ładowanym chunku `/admin`. Bundle strony publicznej i jej czasy ładowania na telefonie nie zmieniają się o nic.
7. **Sanityzacja i limit.** Funkcja przepuszcza wyłącznie `title`, `quote`, `description`, przycina `description` do rozsądnej długości i odrzuca odpowiedź bez `quote`.
8. **Tokeny projektu, nie `blue`/`neutral`.** Wygląd wyłącznie na `editorial-*`, żeby tryb nocny panelu działał automatycznie.

## Co powstanie

1. **`supabase/functions/daily-quote/index.ts`** — obsługa `OPTIONS`, `fetch` do `dailystoic.pl/quote/text_pl.json`, walidacja, nagłówki CORS i cache, przy błędzie `200` z `{"ok":false}` (żeby panel nie logował błędów w konsoli).
2. **Wpis w `supabase/config.toml`** — `[functions.daily-quote] verify_jwt = false`.
3. **Przepisany `src/components/admin/editorial/QuoteOfTheDay.tsx`** — zamiast DummyJSON woła nasz endpoint, pokazuje `title` (wersaliki, mały tracking), `quote` (kursywa, `font-editorial`) i `description` zwinięty do dwóch linii z rozwinięciem po kliknięciu.
4. **DummyJSON i angielski cytat znikają.**

## Zakres

Jedna nowa Edge Function, jedna linia w `config.toml`, jeden przepisany komponent. Zero migracji, zero zmian w bazie, zero DeepL, zero zmian na stronie publicznej, zero dotykania `create_offer`, `log_contact_activity`, `import_lead_to_contact` i funkcji `shared-list`.

## Warunek zaliczenia

Sekcja Start panelu pokazuje polski cytat stoicki z tytułem i komentarzem; ten sam cytat trzyma się przez cały dzień i przy powtórnych wejściach nie wywołuje funkcji ponownie; awaria źródła nie zmienia wyglądu panelu; strona publiczna nie wykonuje żadnego dodatkowego żądania.

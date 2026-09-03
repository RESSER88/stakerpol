# Cytat dnia w panelu — z zewnątrz, po angielsku, zero obciążenia

## Dlaczego przesłany kod (obie wersje) nie zadziała

Sprawdzone na żywo:

- `https://dailystoic.pl` odpowiada `Content-Type: text/html` i pełną stroną HTML. `response.json()` rzuci wyjątek za każdym razem — wersja HTML pokaże komunikat błędu, wersja React zawsze wejdzie w gałąź `error`.
- `/api/quote`, `/api`, `/quote.json`, `/api/v1/quote` na tej domenie zwracają 404. Publicznego API JSON tam nie ma.
- Serwer nie wysyła nagłówka `Access-Control-Allow-Origin`, więc przeglądarka zablokuje żądanie jeszcze przed parsowaniem.
- Kolory (`#f7fafc`, `bg-slate-50`, `border-blue-500`) nie są tokenami projektu i łamią wdrożony tryb nocny panelu.

## Wybrane API — jedyne, które spełnia Twoje warunki

Przetestowałem trzy kandydatury pod kątem CORS z `https://stakerpol.pl`:

| API | JSON | CORS z przeglądarki | Werdykt |
|---|---|---|---|
| `zenquotes.io/api/today` | tak | brak nagłówków CORS | odrzucone — wymagałoby Edge Function |
| `stoic.tekloon.net/stoic-quote` | tak | brak nagłówków CORS | odrzucone — jak wyżej |
| `dummyjson.com/quotes` | tak | `access-control-allow-origin: https://stakerpol.pl` | **wybrane** |

DummyJSON ma 1454 cytaty i obsługuje `skip`, więc da się wybrać cytat deterministycznie po dniu roku:

```text
GET https://dummyjson.com/quotes?limit=1&skip=<dzień roku>&select=quote,author
-> {"quotes":[{"id":247,"quote":"...","author":"Muhammad Ali"}],"total":1454,...}
```

Cytaty zostają po angielsku. DeepL nie jest używany w żadnym miejscu tej funkcji.

## Analiza wydajności — Twój najważniejszy warunek

1. **Strona publiczna: zerowy wpływ.** Komponent renderuje się tylko w `DashboardSection.tsx`, czyli w sekcji Start panelu pod `/admin`. Trasa panelu jest już lazy-ładowana osobnym chunkiem (widoczne w błędzie dynamicznego importu `src/pages/Admin.tsx`), więc kod cytatu nigdy nie trafia do bundle'a strony publicznej. Żadnego wpływu na LCP, CLS ani INP na telefonie klienta.
2. **Supabase: zerowy wpływ.** Bez Edge Function, bez tabeli, bez migracji, bez zapisu. Żądanie idzie z przeglądarki wprost do DummyJSON, więc nie zużywa ani jednego wywołania funkcji ani połączenia z bazą. To był powód odrzucenia ZenQuotes.
3. **Panel: pomijalny koszt.** Jedno żądanie GET, odpowiedź ~200 bajtów, `select=quote,author` obcina zbędne pola. Wysyłane po pierwszym renderze w `useEffect`, nigdy nie blokuje wyświetlenia panelu.
4. **Jedno żądanie na dobę, nie na wejście.** Wynik zapisuję w `localStorage` pod kluczem `stakerpol-quote-<RRRR-MM-DD>`. Kolejne wejścia do panelu tego samego dnia czytają z pamięci przeglądarki, zero ruchu sieciowego. Stary klucz z poprzedniego dnia jest usuwany, więc nic nie rośnie.
5. **Awaria lub wolna odpowiedź nie boli.** Blok renderuje się tylko po udanym pobraniu; przy błędzie, timeoucie 4 s (`AbortController`) albo pustej odpowiedzi komponent nie renderuje nic — bez czerwonych ramek i bez skakania layoutu. Miejsce w pionie rezerwuje szkielet o stałej wysokości.
6. **Bez wycieku po odmontowaniu.** `useEffect` zwraca cleanup przerywający żądanie, tak jak w Twojej wersji React.

## Co powstanie

1. **Nowy komponent `src/components/admin/editorial/QuoteOfTheDay.tsx`** — logika z punktów 3-6 powyżej.
2. **Wstawka w `DashboardSection.tsx`** — pod powitaniem „Dobry wieczór." i licznikiem nowych zapytań, przed paskiem statystyk.
3. **Wygląd w konwencji editorial** — lewa kreska `border-editorial-accent`, tło `bg-editorial-line/20`, cytat `font-editorial italic text-editorial-ink`, autor wersalikami `text-editorial-muted` z trackingiem. Wyłącznie tokeny, zero inline styli i zero klas `slate`/`blue`, więc tryb nocny działa automatycznie.

## Zakres

Jeden nowy plik i jedna wstawka. Zero migracji, zero zmian w bazie, zero Edge Functions, zero DeepL, zero zmian na stronie publicznej, zero dotykania `create_offer`, `log_contact_activity` i `import_lead_to_contact`.

## Warunek zaliczenia

Sekcja Start panelu pokazuje angielski cytat z autorem, pobrany z zewnętrznego serwisu; ten sam cytat utrzymuje się przez cały dzień i przy powtórnych wejściach nie generuje nowego żądania; strona publiczna nie wykonuje żadnego dodatkowego żądania ani nie rośnie w bundle'u; awaria API nie zmienia wyglądu panelu.

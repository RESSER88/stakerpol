

## Diagnoza: strona produktu nie odświeża się po zapisie w adminie

### Przyczyna główna (potwierdzona)

Sprawdziłem w bazie publikację `supabase_realtime`:

```
SELECT * FROM pg_publication_tables WHERE pubname='supabase_realtime';
→ [] (pusta)
```

**Żadna tabela nie jest dodana do publikacji realtime.** W konsekwencji:

- W `src/hooks/usePublicSupabaseProducts.ts` jest subskrypcja `postgres_changes` na `products` i `product_images` z wywołaniem `refetch()` — ale **nigdy się nie odpala**, bo Postgres nie wysyła zmian dla tych tabel.
- W `src/hooks/useSupabaseProducts.ts` (panel admina) ta sama subskrypcja również nie działa.
- Inwalidacja `queryClient.invalidateQueries({ queryKey: ['public-products'] })` w mutacjach `addProduct/updateProduct/deleteProduct` działa **tylko w tej samej instancji aplikacji** (ten sam tab/SPA). Jeśli admin i strona produktu są w osobnych kartach/oknach, mają osobne `QueryClient` i invalidacja jednego nie wpływa na drugi — dlatego strona pokazuje stare dane.

### Przyczyny pomocnicze

W `usePublicSupabaseProducts.ts`:
- `staleTime: 5 * 60 * 1000` (5 minut) — przez 5 minut React Query nie pobiera świeżych danych.
- `refetchOnWindowFocus: false` — powrót na kartę nie wymusza odświeżenia.

Łącznie: brak realtime + 5 min stale + brak refetch on focus = strona pokazuje cache aż do twardego F5.

### Plan naprawy

#### 1. Włączyć realtime na tabelach (migracja SQL)

Dodać `products`, `product_images`, `product_benefits` do publikacji `supabase_realtime` oraz ustawić `REPLICA IDENTITY FULL`, żeby payload zawierał pełny wiersz:

```sql
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.product_images REPLICA IDENTITY FULL;
ALTER TABLE public.product_benefits REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_images;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_benefits;
```

To naprawia główny przypadek: użytkownik ma otwartą stronę produktu, w drugim oknie zapisuje w adminie → karta publiczna dostaje event i odświeża dane w 1–2 s.

#### 2. Zaostrzyć cache na stronie publicznej (`src/hooks/usePublicSupabaseProducts.ts`)

- `staleTime: 30 * 1000` (30 s) zamiast 5 min — kompromis między wydajnością a świeżością.
- `refetchOnWindowFocus: true` — powrót na kartę po edycji w adminie wymusza pobranie świeżych danych. To działa nawet gdyby realtime padł.
- `refetchOnMount: 'always'` dla pewności przy nawigacji wewnątrz SPA.

#### 3. Bezpiecznik dla `ProductDetail` (`src/pages/ProductDetail.tsx`)

Dodać `refetch()` przy zmianie `id` w `useEffect`, żeby kliknięcie linka do produktu zawsze pobrało aktualne dane (jeśli stare są starsze niż `staleTime`). React Query i tak to zrobi przy `refetchOnMount: 'always'`, ale jawne wywołanie nie zaszkodzi.

### Odpowiedź na pytanie z zgłoszenia

**Czy to wystąpi też na produkcji?** Tak — to nie jest problem HMR. Realtime nie jest skonfigurowany w bazie (zweryfikowane), `staleTime` i brak refetch on focus są ustawione w kodzie i działają identycznie na dev i prod. Dlatego na produkcji efekt będzie ten sam: do 5 min lub do twardego odświeżenia widać stare dane.

### Pliki do edycji

- nowa migracja `supabase/migrations/<timestamp>_enable_realtime_products.sql` — dodanie tabel do publikacji + REPLICA IDENTITY FULL
- `src/hooks/usePublicSupabaseProducts.ts` — `staleTime`, `refetchOnWindowFocus`, `refetchOnMount`
- `src/pages/ProductDetail.tsx` — opcjonalny `refetch()` przy zmianie `id`

### QA po wdrożeniu

1. Otwórz stronę produktu w karcie A. W karcie B w adminie zmień Slogan i zapisz → karta A aktualizuje się bez F5 w ciągu 1–2 s (realtime).
2. Wyłącz realtime (np. tryb offline subskrypcji): edytuj w adminie, wróć na kartę A (focus) → dane się odświeżają (refetchOnWindowFocus).
3. Nawiguj wewnątrz SPA: lista produktów → klik w produkt po edycji → świeże dane (refetchOnMount: always + krótki staleTime).
4. Sprawdzić w konsoli logi `Public products realtime update detected:` po zapisie — wcześniej ich nie było.


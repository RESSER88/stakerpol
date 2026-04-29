## Cel

W modalu „Filtruj produkty" (`FilterModal`) na samym dole — pod istniejącymi suwakami (Rok, Motogodziny, Wysokość podnoszenia), a **nad** licznikiem „Znaleziono produktów" — dodać dodatkową sekcję wyszukiwania po **numerze seryjnym**. Działanie analogiczne do panelu admina: wpisanie np. `6865256` filtruje listę produktów do tych, których numer seryjny zawiera tę frazę. Wygląd spójny z resztą modalu, identyczny na desktopie i mobile.

## Zakres zmian

Jeden plik: `src/components/products/FilterModal.tsx`.

Brak zmian w `ProductFilter.tsx`, brak zmian w `Products.tsx`, brak nowych komponentów.

## Szczegóły implementacji

1. **Import**: dodać `Input` z `@/components/ui/input` oraz ikonę `Search` z `lucide-react`.

2. **Stan filtra**: rozszerzyć `useState` o pole `serial: ''`. Reset (`handleReset`) również czyści `serial` do pustego stringa.

3. **Logika filtrowania** (`useMemo` dla `filteredProducts`):
   - Pobrać `product.specs?.serialNumber` jako string.
   - Porównanie: `productSerial.toLowerCase().includes(query.toLowerCase().trim())`.
   - Jeśli pole puste → warunek pomijany (jak przy pozostałych filtrach).
   - Łączone z istniejącymi warunkami operatorem AND.

4. **UI sekcji** (`FilterFields`, na samym dole, **przed** blokiem „Znaleziono produktów"):
   - Spójna struktura z innymi sekcjami: `<div className="space-y-3">` + `<Label className="text-sm font-medium">`.
   - Etykieta: „Numer seryjny" (PL) — dla pełnej spójności i prostoty hardcodowane PL (zgodnie z core memory: strona PL-only, przełącznik języka usunięty wcześniej).
   - `<Input>` z ikoną `Search` po lewej (`relative` wrapper, `Search` `absolute left-3`, padding `pl-10`).
   - Placeholder: „np. 6865256".
   - Atrybuty: `inputMode="search"`, `autoComplete="off"`, `maxLength={64}` (walidacja długości — bezpieczeństwo).
   - Po wpisaniu znaków pod inputem mała etykieta-podpowiedź `text-xs text-muted-foreground`: „Wyszukiwanie częściowe — wystarczy fragment numeru".

5. **Zachowanie**:
   - Filtrowanie odbywa się reaktywnie w `useMemo` (licznik „Znaleziono produktów" aktualizuje się natychmiast podczas pisania).
   - Lista na stronie aktualizuje się dopiero po kliknięciu „Zastosuj filtry" (zachowanie spójne z pozostałymi filtrami — bez zmian w mechanizmie apply).

6. **Spójność desktop ↔ mobile**: pole jest częścią `FilterFields`, który jest renderowany w obu wariantach (`Sheet` na mobile, `Dialog` na desktopie) — automatycznie wygląda tak samo.

## Co się NIE zmienia

- Logika suwaków Rok / Motogodziny / Wysokość — bez zmian.
- Mechanizm apply / reset / licznik — bez zmian (tylko rozszerzony o pole `serial`).
- `ProductFilter.tsx`, `Products.tsx` — bez zmian.
- Translations — nie dodajemy nowych kluczy, używamy hardcoded PL (zgodnie z faktycznym stanem strony PL-only).

## Walidacja / bezpieczeństwo

- `maxLength={64}` na inpucie.
- `.trim()` przed dopasowaniem.
- Brak interpolacji do SQL/URL — czyste filtrowanie po stronie klienta na już pobranych danych.

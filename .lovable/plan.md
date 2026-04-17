

## Plan: Dodać sekcję "Nie wiesz od czego zacząć?" na stronę główną

Komponent `ContactConversionCards` już istnieje i jest zoptymalizowany — wstawimy go bezpośrednio na stronie głównej zaraz po hero, żeby zachować spójność i uniknąć duplikacji kodu.

### Lokalizacja na Home
W `src/pages/Index.tsx` umieszczę `<ContactConversionCards />` **bezpośrednio po sekcji Hero**, przed sekcją "About". Logika:
- Hero → mocne CTA wizualne
- **Conversion Cards** → 3 ścieżki konwersji dla niezdecydowanych (telefon / formularz / callback)
- About → kim jesteśmy
- Why Choose Us
- Featured Products
- FAQ
- CTA

### Plik do edycji
- `src/pages/Index.tsx` — dodać import + render `<ContactConversionCards />` po sekcji hero

### Bez zmian
- `ContactConversionCards.tsx` — używamy 1:1 (już ma `bg-gray-50`, `py-8`, navy nagłówek, pomarańczowe/zielone CTA — pasuje do reszty Home)
- Strona /contact — sekcja zostaje też tam (świadoma duplikacja, bo na Home pełni rolę pierwszego punktu konwersji, a na /contact rozszerza opcje)
- CallbackMiniForm wewnątrz komponentu działa przez edge function `notify-lead` — bez zmian

### Uwaga
Na Home przycisk "Wyślij opis magazynu" (karta 2) prowadzi do `#form` (anchor) — na Home nie ma elementu o tym id, więc kliknięcie nic nie zrobi. **Naprawię:** zmienię ten link żeby na Home prowadził do `/contact#form`. Najprostsze rozwiązanie: dodać prop `formHref` do `ContactConversionCards` z domyślną wartością `#form` i przekazać `/contact#form` z Index.tsx.


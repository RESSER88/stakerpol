

## Plan zmian: Ukrycie przełącznika języka i naprawa linku "Jak dojechać"

### Zadanie 1: Ukrycie przełącznika języka w nawigacji

**Plik:** `src/components/layout/Header.tsx`

**Zmiany:**
- Usunąć komponent `<LanguageSwitcher />` z nawigacji desktopowej (linia 47)
- Usunąć komponent `<LanguageSwitcher />` z sekcji mobilnej (linia 59)

Strona pozostanie w języku polskim, przełącznik nie będzie widoczny ani na desktopie, ani na mobile.

### Zadanie 2: Naprawa linku "Jak dojechać"

**Plik:** `src/components/products/ProductAboutSection.tsx`

**Zmiany:**
- Zmienić stałą `DIRECTIONS_URL` (linia 8-9) z obecnego adresu:
  ```
  https://www.google.com/maps/dir/?api=1&destination=ul.+Mi%C4%99dzyle%C5%9Bna+115,+32-095+Celiny,+Polska
  ```
  na nowy:
  ```
  https://maps.app.goo.gl/AerTrGnXriJWsvqf6
  ```

Link już ma ustawione `target="_blank"` i `rel="noopener noreferrer"`, więc otworzy się w nowej karcie automatycznie. Zmiana dotyczy wszystkich stron produktów globalnie.


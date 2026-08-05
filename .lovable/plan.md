# Dymek „Zapytaj nas" przy pływającym widżecie — ustalenia i weryfikacja

Zgodnie z prośbą: bez zmian w kodzie. Poniżej ustalenia z odczytu plików, historii repozytorium i sprawdzenia strony w przeglądarce, oraz kroki potwierdzające przed jakąkolwiek poprawką.

## Co ustalono

- Dymek nie jest osobnym komponentem. To `<span>` z tekstem „Zapytaj nas" wewnątrz `src/components/contact/FloatingContactBubble.tsx`, renderowany warunkiem `!isOpen`, pozycjonowany `absolute -left-24 bottom-3` względem kontenera `fixed bottom-6 right-6 z-[9999]`.
- Widoczność zależy wyłącznie od tego, czy widżet jest zamknięty, oraz od breakpointu: kontener ma `hidden md:flex`, więc poniżej 768 px cały widżet z dymkiem nie istnieje. Brak warunku czasowego, scrolla i `localStorage`. Timer 8 s dotyczy tylko pulsowania głównego przycisku.
- Historia: `git log -S "Zapytaj nas"` wskazuje jeden commit — utworzenie widżetu (`32feb06`). Dymek nigdy nie był usunięty. Ostatnia zmiana pliku (`5586a52`, 6 maja) to tylko podmiana linku polityki prywatności.
- Pliki ostatniego wdrożenia (`src/hooks/useLeadSubmit.ts`, `src/components/products/PriceInquiryModal.tsx`) nie są importowane przez widżet ani przez `Layout`. Widżet używa `useContactForm`, którego nie zmieniano.
- Sprawdzenie w przeglądarce na bieżącym kodzie przy 1280 px: element „Zapytaj nas" istnieje w DOM, jest widoczny, pozycja x≈1108, y≈1736 — obok okrągłego przycisku w prawym dolnym rogu.

## Wniosek

W bieżącym kodzie dymek na desktopie działa. Skoro na Twoim ekranie go nie ma, przyczyna leży poza kodem widżetu — najprawdopodobniej oglądana wersja nie jest bieżąca (podgląd starszego commitu lub opublikowana wersja bez ostatnich zmian), albo widżet jest w stanie otwartym, albo okno jest węższe niż 768 px.

## Kroki potwierdzające (bez zmian w kodzie)

1. Otworzyć bieżący podgląd (nie podgląd historycznego commitu) w oknie ≥ 1024 px, nie klikając widżetu, i sprawdzić prawy dolny róg.
2. W DevTools sprawdzić, czy `span` z tekstem „Zapytaj nas" istnieje w DOM:
   - istnieje, ale niewidoczny → problem z CSS lub nakładką (np. banner cookies),
   - nie istnieje → widżet jest otwarty (`isOpen === true`) albo aktywny jest breakpoint mobilny.
3. Porównać podgląd z adresem opublikowanym. Jeśli dymek jest w podglądzie, a nie na produkcji, brakuje publikacji.

## Dalsze działania

Żadnych zmian w kodzie nie wprowadzam. Po wskazaniu wyniku kroku 2 przygotuję konkretną poprawkę, jeśli będzie potrzebna.

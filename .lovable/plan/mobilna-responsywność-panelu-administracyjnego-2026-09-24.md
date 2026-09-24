# Mobilna responsywność panelu administracyjnego

## Zakres

- W `Admin.tsx` resetować pozycję strony natychmiast po każdej zmianie sekcji oraz wyłączyć przypadkowe przywracanie starego scrolla po przeładowaniu `/admin`.
- W dolnej nawigacji pozostawić dokładnie pięć nazw bez numeracji, użyć czytelnego tekstu bezszeryfowego `text-xs`, zachować duże pola dotykowe i dodać bezpieczny odstęp na dolną belkę gestów.
- Rozszerzyć ustawienie viewportu o `viewport-fit=cover`.
- Na mobilnym dashboardzie zmniejszyć pionowe odstępy, zachowując dotychczasową wartość na desktopie.
- Zachować trzy kolumny statystyk, zmniejszyć rozstrzelenie etykiet na telefonach i utrzymać obecny wygląd desktopowy.

## Szczegóły techniczne

- Zmiany obejmą wyłącznie istniejące pliki: `Admin.tsx`, `AdminBottomNav.tsx`, `DashboardSection.tsx`, `index.html` oraz listę zadań.
- Nie będą zmieniane dane, API, Supabase, routing ani logika biznesowa.
- Desktopowe klasy pozostaną bez zmian albo zostaną jawnie przywrócone wariantem `lg:`.

## Weryfikacja

- Sprawdzić przejście Produkty → przewinięcie → Start i potwierdzić `window.scrollY === 0`.
- Sprawdzić przeładowanie `/admin` pod kątem przywracania starej pozycji.
- Sprawdzić menu i dashboard w viewportach 320×850, 360×850, 390×850, 412×915 i 430×932: brak ucięć, wielokropków, nachodzenia i poziomego scrolla.
- Sprawdzić bezpieczny dolny odstęp oraz wygląd etykiety „NOWE ZAPYTANIA” przy 360 i 412 px.
- Uruchomić kontrolę typów i lint dla zmienionych plików.
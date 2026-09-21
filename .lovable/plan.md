# Plan: „Zapytania” jako główna sekcja panelu admina

## Cel
Przeniosę istniejący widok „Zapytania” z zakładki wewnątrz „Oferty” do głównej nawigacji panelu administracyjnego.

Końcowa kolejność będzie:

```text
01 Start
02 Produkty
03 Zapytania
04 Oferty
05 Eksport
06 Kontakty
07 SEO
08 FAQ
```

Na mobile dolna nawigacja będzie zawierała:

```text
01 Start | 02 Produkty | 03 Zapytania | 04 Oferty | 05 Eksport
```

## Zakres zmian

1. **Główna lista sekcji panelu**
   - Dodam `Zapytania` jako osobną sekcję administracyjną.
   - Przesunę numerację kolejnych pozycji bez zmiany stylu sidebaru.

2. **Widok „Zapytania”**
   - Wykorzystam istniejący komponent zapytań.
   - Nie będę tworzyć drugiego, niezależnego widoku.
   - Kliknięcie `03 Zapytania` pokaże ten sam obecny ekran zapytań.

3. **Widok „Oferty”**
   - Usunę zakładkę/przycisk `Zapytania` z wnętrza sekcji `Oferty`.
   - Sekcja `Oferty` pozostanie dla tworzenia nowej oferty i listy wysłanych ofert.
   - Nie zmienię funkcji tworzenia, edycji ani wysyłania ofert.

4. **Przejścia z innych miejsc panelu**
   - Linki lub akcje prowadzące dziś do `Oferty → Zapytania` przestawię na nową główną sekcję `Zapytania`.
   - Przycisk generowania oferty z zapytania nadal przeniesie dane do formularza nowej oferty.

5. **Mobile**
   - Dolny pasek będzie miał 5 pozycji zamiast 4.
   - Zachowam stałe pozycjonowanie na dole, aktualny styl, aktywny stan i numerację.
   - Dostosuję szerokości elementów, aby uniknąć ucinania tekstu i poziomego przewijania.
   - Zachowam bezpieczny odstęp od dolnego paska systemowego.

## Czego nie zmienię

- Bazy danych.
- API i funkcji Supabase.
- Formularzy zapytań.
- Sposobu zapisywania zapytań.
- Filtrów, statusów i danych klientów.
- Funkcji produktów, eksportu, kontaktów, SEO i FAQ.
- Wyglądu panelu poza układem nawigacji wymaganym w tym zadaniu.

## Szczegóły techniczne

Sprawdziłem obecną strukturę: panel admina działa jako jedna trasa `/admin`, a sekcje są przełączane lokalnym stanem. Główna lista sekcji jest w jednym typie/listingu, a widok zapytań istnieje już jako komponent używany wewnątrz `Oferty`.

Planowana zmiana techniczna:

- rozszerzyć typ sekcji admina o `inquiries`,
- dodać `Zapytania` do listy sekcji między `Produkty` i `Oferty`,
- dodać renderowanie istniejącego widoku zapytań jako osobnej sekcji,
- usunąć zakładkę `Zapytania` z lokalnych zakładek sekcji `Oferty`,
- zaktualizować akcje, które wcześniej ustawiały `Oferty → Zapytania`,
- rozszerzyć mobilny dolny pasek do pierwszych 5 pozycji.

## Weryfikacja

Po wdrożeniu sprawdzę:

- desktop: kolejność pozycji i przejście jednym kliknięciem do `Zapytania`,
- mobile: 5 pozycji w dolnym pasku bez poziomego scrolla,
- sekcja `Oferty`: brak zakładki `Zapytania`, pozostają `Nowa` i `Wysłane`,
- generowanie oferty z zapytania nadal działa przez istniejący przepływ,
- brak zmian w danych i formularzach.

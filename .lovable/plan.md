# Etap 5 — uporządkowanie sekcji „Oferty”

## Zakres
- Zachować obecne zakładki „Nowa” i „Wysłane” oraz wszystkie istniejące operacje na ofertach.
- Zmienić wyłącznie prezentację widoku „Wysłane”; bez zmian w bazie, RPC, RLS, danych, tokenach, linkach i trackingu.
- Pozostawić `OfferEditDialog` bez przebudowy i nie tworzyć równoległego widoku ani nowego systemu statusów.

## Widok „Wysłane”
- Oprzeć podział na istniejącym `offerState`: `aktywna` i `wygasa` pozostają na głównej liście, a `zatrzymana`, `wygasla` i `archiwalna` trafiają do sekcji „Zakończone i archiwalne”.
- Główną listę pokazać jako pierwszą. Sekcję zakończoną wyświetlić niżej z licznikiem i domyślnie zwinąć; wyszukiwanie obejmie obie części.
- Zachować istniejące grupowanie po kontakcie, ale rozdzielić wynik na podstawie statusu reprezentującej oferty.

## Pojedyncza oferta
- Uporządkować kolejność: nazwa lub identyfikator, kontakt albo „Brak przypisanego kontaktu”, status, otwarcia, data wysłania, ważność, akcje.
- Przenieść akcje do osobnego, zawijającego się wiersza, aby nazwa miała pełną szerokość na telefonie.
- Ujednolicić przypisanie kontaktu, kopiowanie, edycję, zatrzymanie, archiwizację i usuwanie jako jednakowe małe przyciski ikonowe z nazwą dostępną dla czytników i tooltipem.
- Nie zmieniać warunków dostępności ani działania żadnej akcji.

## Weryfikacja
- Sprawdzić TypeScript, lint i spójność zmian.
- Sprawdzić w podglądzie telefon i desktop: brak poziomego przewijania, domyślne zwinięcie i rozwijanie zakończonych ofert oraz czytelność kart.
- Zweryfikować podział statusów bez modyfikowania rekordów. Operacje zapisu wymagające logowania sprawdzić w zakresie dostępnym dla zewnętrznego Supabase; pozostałe wskazać do ręcznego testu.

## Pliki
- `src/components/admin/sections/offers/SentOffersView.tsx` — główna zmiana układu i podział listy.
- `src/components/admin/sections/OffersSection.tsx` — tylko jeśli potrzebna będzie drobna korekta oprawy zakładki „Wysłane”.
- `src/components/admin/sections/offers/OfferEditDialog.tsx` — bez przebudowy; zmiana tylko wtedy, gdy okaże się konieczna dla spójności ikonowego przypisania kontaktu.

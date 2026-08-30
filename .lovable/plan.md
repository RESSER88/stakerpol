# Odpowiedzi na trzy pytania + jedna poprawka komunikatu

## 1. Firma zapisywana osobnym update() — obsługa błędu

Stan potwierdzony w kodzie (`NewOfferView.tsx`, linie 104–116): błąd drugiego zapisu **nie jest przemilczany**. Jeśli `update({ firma })` na `contacts` zawiedzie, pokazuje się czerwony toast „Oferta utworzona, firma niezapisana” z treścią błędu z bazy. Oferta i link powstają normalnie (transakcja `create_offer` już się zakończyła), więc proces nie jest przerywany.

Czego brakuje: komunikat nie mówi użytkownikowi, co ma zrobić dalej.

Zmiana do wykonania (jedna, wyłącznie tekst komunikatu w `NewOfferView.tsx`):

- Treść toastu: „Oferta i kontakt zostały utworzone, ale nazwy firmy nie udało się zapisać. Uzupełnij ją ręcznie na karcie kontaktu (zakładka Kontakty).”
- Techniczny komunikat błędu z bazy zostaje dopisany na końcu opisu, żeby nie tracić informacji diagnostycznej.
- Bez zmian: sygnatura `create_offer`, kolejność operacji, walidacja, obsługa kolizji tokenu.

## 2. Status pozostałych czterech punktów zlecenia

Wszystkie cztery są **wykonane** — potwierdzone odczytem plików w tej turze:

- Punkt 3 — chip terminu powrotu w WYSŁANE: `SentOffersView.tsx` dociąga `termin_followup` z kontaktu, funkcja `followUpOf` wyznacza próg, chip dla dziś/przeszłości ma czerwoną obwódkę z pulsowaniem i `motion-reduce:animate-none`.
- Punkt 4 — etykieta przycisku: w wierszu oferty widnieje „Zatrzymaj” (dawniej „Zatrzymaj dostęp”); pełne „Zatrzymaj dostęp” zostało tylko w potwierdzeniu akcji.
- Punkt 5 — „brak otwarć”: sygnał zwraca `{ label: 'brak otwarć', tone: 'off' }` (szara plakietka) w miejsce dawnego „–”.
- Punkt 7 — PROGRESS.md: wpis z datą 2026-08-30 istnieje i wymienia wszystkie zmiany oraz listę rzeczy nietkniętych.

## 3. Edycja kontaktu — status deklaratywny

Zgadza się. Edycja pól osoba / firma / telefon / e-mail na karcie kontaktu została **napisana i przechodzi typecheck, ale nie była klikana na żywo** — nie ma dowodu z uruchomionej aplikacji, że zapis utrzymuje się po odświeżeniu. Traktujemy ten punkt jako otwarty do Twojego ręcznego testu na telefonie. W tym planie nie zamykam go i nie dopisuję go do PROGRESS.md jako zweryfikowanego.

## Zakres techniczny

- Zmiana wyłącznie w `src/components/admin/sections/offers/NewOfferView.tsx` (treść jednego toastu).
- Zero migracji, zero zmian w bazie, zero zmian w Edge Functions, zero zmian w `SentOffersView.tsx` i `ContactCard.tsx`.

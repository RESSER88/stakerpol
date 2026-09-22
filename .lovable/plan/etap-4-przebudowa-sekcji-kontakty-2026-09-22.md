# ETAP 4 — przebudowa sekcji „Kontakty”

## Cel
Uporządkować istniejącą sekcję „Kontakty” jako szybkie miejsce pracy z człowiekiem: dane kontaktowe, etap kontaktu, termin i powód powrotu, przypisane oferty oraz jedna historia aktywności. Bez zmian w modelu danych i bez rozbudowy do pełnego CRM.

## Zakres zmian

### 1. Lista kontaktów
- Przebudować istniejący `ContactsSection`, bez tworzenia drugiej listy.
- W każdym wierszu pokazać w czytelnej kolejności: osobę, firmę, dostępny telefon/e-mail, KROK, następny kontakt z krótkim powodem oraz liczbę ofert.
- Nie wyświetlać zastępczych tekstów dla brakującego telefonu lub e-maila.
- Zachować jedno wyszukiwanie po osobie, firmie, telefonie i e-mailu.
- Zastąpić niepotrzebne filtrowanie źródła prostym filtrem KROK opartym na istniejących wartościach i wspólnej mapie etykiet.
- Dobrać układ mobilny i desktopowy bez poziomego przewijania i bez zwiększania gęstości informacji.

### 2. Karta kontaktu
- Uporządkować istniejący `ContactCard`; nie tworzyć równoległego widoku kontaktu.
- Nagłówek: osoba, firma, dostępny telefon/e-mail, KROK i jedna akcja edycji.
- Edycja obejmie wyłącznie: osobę, firmę, telefon, e-mail, KROK, datę i powód następnego kontaktu, z istniejącą walidacją.
- Wydzielić czytelną sekcję „Następny kontakt” z tekstem „Brak zaplanowanego kontaktu” przy braku daty oraz małą edycją daty i powodu bez zapisywania rozmowy.
- Usunąć z tej sekcji niepowiązane parametry maszyny, bez zmiany ich zapisu w formularzu rozmowy.

### 3. Oferty kontaktu
- W `ContactCard` pokazać tylko oferty z istniejącej relacji `shared_lists.contact_id`.
- Każdy krótki wiersz pokaże nazwę/identyfikator, datę utworzenia, wspólny stan oferty i istniejącą liczbę otwarć.
- Kliknięcie wiersza wykorzysta istniejący `OfferEditDialog`; nie powstanie drugi widok ani formularz oferty.
- Zachować istniejące akcje kopiowania linku i odnowienia, bez zmian w `create_offer` i logice tokenów.
- Oferty bez kontaktu pozostaną poza kartą i nie będą automatycznie przypisywane.

### 4. Jedna historia i formularz rozmowy
- Zachować `contact_activities` jako jedyne źródło zapisanych aktywności.
- Utrzymać zabezpieczenie przed podwójnym wpisem oferty: aktywność powiązana przez `shared_list_id` ma pierwszeństwo, a wpis zastępczy pojawia się wyłącznie dla historycznej oferty bez takiej aktywności.
- Uporządkować oś czasu i subtelnie oznaczyć powiązaną ofertę.
- Zachować istniejący `CallForm` jako formularz zapisu rozmowy/aktywności.
- Nie tworzyć drugiego formularza rozmowy.
- Termin i powód następnego kontaktu mają być możliwe do zmiany bez tworzenia nowej aktywności.
- Mały mechanizm edycji w `ContactCard` wykorzysta istniejące pola i logikę, bez tworzenia drugiego systemu historii.

### 5. Dodawanie i bezpieczne usuwanie
- Zachować istniejący minimalny `AddContactDialog`: Osoba, Firma, Telefon, E-mail.
- Zachować ukrywanie kontaktu oraz potwierdzane usunięcie z liczbą ofert i wpisów historii.
- Nie zmieniać relacji, zachowania ofert ani historii podczas tych operacji.

## Konkretne pliki do modyfikacji
- `src/components/admin/sections/ContactsSection.tsx` — główna lista kontaktów, wyszukiwanie i filtrowanie.
- `src/components/admin/sections/contacts/ContactCard.tsx` — istniejąca karta kontaktu; rozbudować i uporządkować, nie tworzyć drugiej karty.
- `src/components/admin/sections/contacts/CallForm.tsx` — istniejący formularz rozmowy/aktywności; wykorzystać istniejący mechanizm, jeżeli jest potrzebny.
- `src/components/admin/sections/offers/OfferEditDialog.tsx` — poza zakresem Etapu 4; nie zmieniać.

## Ograniczenia techniczne
- Bez migracji, nowych tabel, pól, RPC, zmian RLS i zmian istniejących danych.
- Bez zmian w leadach, publicznych linkach, trackingu, generowaniu ofert i `OfferEditDialog`.
- Istniejące narzędzia etykiet, statusów, wyszukiwania i walidacji pozostają źródłem prawdy.

## Zasada implementacyjna
Najpierw wykorzystać istniejące komponenty, hooki, helpery, zapytania i funkcje. Jeżeli istniejąca funkcja działa, uporządkować jej UI zamiast zastępować ją nową implementacją.

Nie tworzyć równoległych kart kontaktu, list kontaktów, formularzy rozmowy, historii, mechanizmów wyszukiwania ani mechanizmów statusów.

Jeżeli istniejąca architektura uniemożliwi wykonanie punktu bez zmiany backendu, zatrzymać tę część prac i zgłosić konkretny brak zamiast samodzielnie zmieniać backend.

## Weryfikacja
- Sprawdzić typy i pełny build projektu przez mechanizm projektu.
- Sprawdzić widok desktopowy i mobilny oraz brak poziomego przewijania.
- Zweryfikować: wyszukiwanie po osobie i firmie, filtr KROK, otwarcie karty, edycję danych/KROK/terminu/powodu, dodanie kontaktu, oferty i ich otwarcie w istniejącej edycji, jedną historię bez duplikatów oraz brak automatycznego przypisania osieroconej oferty.
- Jeżeli zalogowany test pozostanie niedostępny z powodu zewnętrznego logowania, jasno wskazać, które interakcje wymagają ręcznego potwierdzenia.

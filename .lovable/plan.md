# Oferty i Zapytania — jeden przepływ od zapytania do oferty

## Co się zmieni dla Ciebie

1. **Zapytania → „Wygeneruj ofertę”**
   Przycisk „Wciągnij do kontaktów” znika. W jego miejscu pojawia się „Wygeneruj ofertę”.
   Klik przenosi do widoku nowej oferty z już wpisanymi danymi z zapytania: nazwa, telefon,
   e-mail, treść wiadomości w notatce oraz maszyna, o którą pytał klient (filtr ustawiony na
   numer seryjny tego produktu). Nic nie trzeba przepisywać ręcznie.
   Po zapisaniu oferty zapytanie zostaje automatycznie oznaczone jako obsłużone, a oferta
   dopina się do istniejącego kontaktu, jeśli ten telefon lub e-mail już jest w kartotece.

2. **Telefon i e-mail przestają blokować**
   Do utworzenia oferty wystarczy nazwa. Telefon i e-mail są opcjonalne (wymagamy tylko, by
   podać przynajmniej jedno z nich, jeśli chcesz mieć jak wysłać ofertę — brak obu też
   przechodzi i można uzupełnić później).

3. **Edycja już utworzonej oferty**
   W „Wysłane” każdy wiersz dostaje ikonę edycji. Otwiera okno, w którym można poprawić:
   nazwę klienta, firmę, telefon, e-mail, notatkę i kanał. Zapis aktualizuje istniejącą
   ofertę i kontakt — nie tworzy nowej oferty. Dane wpisane wcześniej pozostają.

4. **Kanał = skąd pochodzi klient**
   Nowa lista: Facebook, YouTube, Instagram, Allegro, OLX, Google, ChatGPT, Powracający, Inne.
   Po wybraniu „Inne” pojawia się pole „Skąd?” na własny wpis (Polecenie, Baner, Targi…).
   Kanał jest dostępny i przy tworzeniu, i przy edycji oferty. Jeżeli zapytanie ze strony nie
   mówi, skąd przyszedł klient (formularze na stronie tego nie wiedzą), pole zostaje puste
   i można je uzupełnić później przy edycji.

Wygląd panelu, układ zakładek i pozostałe funkcje zostają bez zmian.

## Szczegóły techniczne

### Migracja bazy
- `public.create_offer(...)`: usunięcie warunku „Telefon jest wymagany”; wymagana pozostaje
  tylko `_nazwa`. Dodanie parametru `_firma text DEFAULT NULL` (zapisywany na kontakcie przy
  tworzeniu, dziś robiony osobnym UPDATE-em w UI). Dopasowanie kontaktu po `telefon_norm`,
  a gdy brak telefonu — po `email_norm`; gdy brak obu, tworzony jest nowy kontakt.
  Dodanie parametru `_kanal_detail text DEFAULT NULL`.
- `shared_lists`: nowa kolumna `channel_detail text` (treść pola „Skąd?”).
- `shared_lists_channel_check`: zamiana listy dozwolonych wartości na
  `facebook, youtube, instagram, allegro, olx, google, chatgpt, powracajacy, inne`
  z zachowaniem starych wartości (`email, whatsapp, sms, telefon`), żeby istniejące wiersze
  przeszły walidację.
- `sent_at` ustawiane jak dotąd, gdy kanał jest podany.

### Frontend
- `src/components/admin/sections/offers/offerChannels.ts` (nowy) — lista kanałów i etykiet,
  wspólna dla tworzenia i edycji.
- `InquiriesSection.tsx` — usunięcie `importToContacts` i przycisku „Wciągnij do kontaktów”;
  nowy przycisk „Wygeneruj ofertę” wywołujący `onGenerateOffer(lead)`.
- `OffersSection.tsx` — stan `prefill` (dane zapytania); po kliknięciu w Zapytaniach
  przełącza widok na „Nowa” i przekazuje prefill do `NewOfferView`.
- `NewOfferView.tsx` — przyjmuje `prefill` (nazwa, firma, telefon, e-mail, notatka,
  `criteria.serial` z numeru seryjnego produktu z zapytania, `leadId`); `canSubmit` bez
  wymogu telefonu; nowy selektor kanału + warunkowe pole „Skąd?”; po sukcesie, jeśli był
  `leadId`, ustawia `leads.status = 'handled'` i zapisuje `lead_id` w powiązanym wpisie
  historii kontaktu.
- `src/components/admin/sections/offers/OfferEditDialog.tsx` (nowy) — okno edycji oferty:
  pola label/firma/telefon/e-mail/notatka/kanał + „Skąd?”; zapis to `update` na
  `shared_lists` (label, note, channel, channel_detail) oraz na `contacts`
  (osoba, firma, telefon, email). Bez tworzenia nowej oferty.
- `SentOffersView.tsx` — ikona „Edytuj ofertę” w wierszu, otwarcie `OfferEditDialog`,
  odświeżenie listy po zapisie. Pozostałe akcje (kopiowanie linku, Zatrzymaj, karta
  kontaktu) bez zmian.
- `ContactCard.tsx` — wywołanie `create_offer` przy „Nowy link” dostaje `_firma` i kanał
  z bieżącej oferty (bez zmian w wyglądzie).

### Weryfikacja
- `npx tsgo --noEmit`.
- Playwright: zapytanie → „Wygeneruj ofertę” → sprawdzenie prefillu i zapisu bez telefonu;
  „Wysłane” → edycja oferty → uzupełnienie telefonu i kanału „Inne” + „Skąd?” → zapis.

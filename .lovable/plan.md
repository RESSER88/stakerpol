# Raport diagnostyczny — Kontakty / Oferty / Historia (bez zmian w kodzie)

Analiza wykonana na aktualnym kodzie i na żywym schemacie Supabase (`peztqgfmmnxaaoapzpbw`). Nie modyfikowano plików, danych, schematu, RLS ani UI.

## 1. Kod i komponenty

| Element | Plik | Dane / zapytania | Akcje |
|---|---|---|---|
| Ekran + lista Kontakty | `src/components/admin/sections/ContactsSection.tsx` | `contacts` (select: id, osoba, firma, telefon, email, zrodlo, krok, termin_followup; filtr `ukryty=false`), potem `contact_activities` (contact_id, data) dla „ostatni kontakt” | szukanie lokalne (osoba/firma/telefon), filtr źródła telefon/www, otwarcie karty |
| Karta kontaktu | `src/components/admin/sections/contacts/ContactCard.tsx` | 3 zapytania równolegle: `contacts` (+udzwig_kg, wysokosc_m), `shared_lists` po `contact_id`, `contact_activities` po `contact_id` | edycja inline 4 pól (`update contacts`), kopiowanie linku, „Nowy link” = RPC `create_offer` z `_renewed_from` |
| Edycja kontaktu | ta sama karta, `saveFields()` (l. 208–227) | `contacts.update` (osoba, firma, telefon, email) | brak osobnego formularza |
| Dodaj kontakt | **NIE ISTNIEJE** jako formularz | kontakt powstaje tylko w RPC `create_offer` lub `import_lead_to_contact` | — |
| Zapis rozmowy | `src/components/admin/sections/contacts/CallForm.tsx` | RPC `log_contact_activity` (krok, termin_followup, data_sprzedazy, udzwig_kg, wysokosc_m, tresc) | jeden wpis historii + aktualizacja kontaktu |
| Ekran Oferty | `src/components/admin/sections/offers/OffersSection.tsx` | zakładki NOWA / WYSŁANE | przenoszenie prefill z Zapytań |
| Nowa oferta | `offers/NewOfferView.tsx` | RPC `create_offer` (token, filters, nazwa, telefon, email, tygodnie, notatka, kanal, kanal_detail, firma); po sukcesie `leads.update status='handled'` | tworzy ofertę + kontakt + wpis historii w jednej transakcji |
| Lista wysłanych ofert | `offers/SentOffersView.tsx` | `shared_lists` + embed `contacts(osoba, firma, telefon, email, termin_followup, krok)`, dodatkowo `contact_activities` (ostatnia aktywność) | grupowanie po `contact_id`, „Zatrzymaj” (`revoked_at`), kopiuj link, edycja, otwarcie ContactCard |
| Edycja oferty | `offers/OfferEditDialog.tsx` | `shared_lists.update` (label, note, channel, channel_detail) + `contacts.update` (osoba, firma, telefon, email) | dwa osobne UPDATE, nie transakcja |
| Karta oferty | **NIE ISTNIEJE** osobno — „oferta bieżąca” jest sekcją karty kontaktu (l. 389–428) | — | — |
| Historia oferty | brak osobnego widoku; historia jest wyłącznie na karcie kontaktu | — | — |
| Zapytania | `sections/InquiriesSection.tsx`, `InquiryStats.tsx`, `leadSources.ts` | `leads` (status, sold_at, delete) | „Wygeneruj ofertę” → prefill do NewOfferView |

Komponenty współdzielone: `@/components/ui/dialog`, `alert-dialog`, `hooks/use-toast`, `utils/offerToken.ts` (`buildToken`, `buildUrl`), `utils/contactSearch.ts` (`matchesContactQuery`, `normalizeQuery`), `offers/offerChannels.ts`, `offers/types.ts` (`OfferPrefill`).

## 2. Model danych — ustalenia

A. Oferta **nie** duplikuje danych klienta w osobnych kolumnach. `shared_lists` ma tylko: `token, filters, label, created_by, expires_at, revoked_at, archived_at, view_count, last_viewed_at, sent_at, channel, channel_detail, contact_id, note, renewed_from, created_at, updated_at`. Nie ma kolumn telefon / e-mail / WWW / firma. Jedyna redundancja to `label` (tekstowa kopia nazwy klienta z momentu utworzenia) i `note`.

B. Relacja istnieje: `shared_lists.contact_id → contacts.id ON DELETE SET NULL`, indeks `shared_lists_contact_id_idx`. `company_id` nie istnieje.

C. Tabeli **Firma nie ma**. Firma to `contacts.firma` (text) + kolumna generowana `contacts.firma_norm = norm_company(firma)` (lower + zwinięte spacje), indeks częściowy `contacts_firma_norm_idx WHERE ukryty=false`.

D. Tak, ta sama osoba może istnieć wielokrotnie. Dopasowanie w `create_offer` / `import_lead_to_contact` działa tylko po `telefon_norm` i `email_norm`; gdy telefon wpisany opisowo („nie ma tel”) albo brak obu, tworzony jest nowy rekord. Realny przykład w bazie: dwa rekordy `osoba='ghghg'`, telefon `hghg` (`df3cc152…`, `e52a24bf…`) — `norm_phone` zwraca `+` bez cyfr/NULL, więc scalenie nie nastąpiło.

## 3. Duplikaty i skala (dane produkcyjne, 22.09.2026)

- `contacts`: 10 rekordów, 0 ukrytych, 7 bez firmy, 5 bez e-maila, 0 bez telefonu (ale telefon zawiera wartości nie-telefoniczne: `hghg`, `nie ma tel`, `autosilnikiopole@gmail.com`), 2 z terminem powrotu, 0 ze sprzedażą.
- Duplikaty: 0 po `telefon_norm`, 0 po `email_norm`, 0 po `firma_norm`; 1 para po `lower(osoba)` = „ghghg”. Warianty nazw firm typu „Sp. z o.o.” / „sp zoo” — brak w danych (7 z 10 kontaktów nie ma firmy w ogóle), więc problem jest teoretyczny, ale `norm_company` **nie** usuwa form prawnych (tylko lower + spacje), czyli takich wariantów nie połączy.
- Stabilny identyfikator scalania: `contacts.id` (UUID) + FK z `shared_lists` i `contact_activities` — scalanie technicznie bezpieczne, bo wystarczy przepisać `contact_id`.
- `shared_lists`: 28 rekordów, **18 bez `contact_id`** (oferty utworzone przed etapem leadboksu lub poza RPC), 18 zarchiwizowanych, 11 zatrzymanych, tylko 2 z `sent_at`.
- `contact_activities`: 21 wpisów — 10 `oferta` (wszystkie z `shared_list_id`), 9 `telefon`, 2 `formularz` (z `lead_id`).
- `shared_list_views`: 172. `leads`: 16 (0 `new`). `price_inquiries`: 1.

## 4. Etykiety i statusy — rzeczywiste źródła

| Etykieta UI | Źródło | Typ | Zapis w bazie | Wyliczana |
|---|---|---|---|---|
| NOWY / OFERTA / ODDZWONIĆ / PORÓWNUJE / CENA / NIEAKTUALNE | `contacts.krok` | text, NOT NULL, default `nowy`, CHECK na 6 wartości | tak | mapowanie etykiet w `ContactsSection.tsx` l. 19–26 i `ContactCard.tsx` l. 65–72 |
| AKTYWNA / ZATRZYMANA / WYGASŁA / WYGASA ZA X DNI / ARCHIWALNA | `shared_lists.expires_at`, `revoked_at`, `archived_at` | timestamptz | tylko daty | tak — `stateOf()` w `SentOffersView.tsx` l. 69–83 i `offerState()` w `ContactCard.tsx` l. 86–91 (dwie niezależne implementacje, `wygasa za X dni` tylko w liście ofert) |
| ZADZWOŃ DZIŚ | `contacts.termin_followup` | date | data | tak — `callToday()` `SentOffersView.tsx` l. 58–64 |
| źródło: telefon / www | `contacts.zrodlo` | text, CHECK (`telefon`,`www`) | tak | nie |
| Kanał (Facebook/OLX/…) | `shared_lists.channel` + `channel_detail` | text, CHECK na 13 wartości | tak | nie |
| Statusy zapytań (nowe/obsłużone/sprzedane) | `leads.status` (CHECK `new`/`handled`), `handled_at`, `sold_at` | text/timestamptz | tak | „sprzedane” = `sold_at IS NOT NULL` |

Jednoznacznie: `OFERTA / NOWY / CENA` **nie są statusem oferty ani źródłem kontaktu** — to `contacts.krok`, czyli etap sprzedażowy kontaktu. Źródło kontaktu to osobne pole `contacts.zrodlo`.

## 5. Historia

To **wariant B: jedna tabela + doklejanie ofert w kodzie**. `ContactCard.tsx` l. 170–206 buduje `timeline` z:

1. `contact_activities` (typ ∈ telefon, formularz, oferta, sprzedaz, cofniecie_sprzedazy, ukrycie, notatka; klucze `contact_id`, opcjonalnie `lead_id`, `shared_list_id`) — sortowanie po `data`.
2. `shared_lists` — każda oferta poza „bieżącą” dodana syntetycznie jako „Oferta utworzona / odnowiona / zatrzymana”, znacznik czasu `revoked_at ?? archived_at ?? created_at`. Powiązanie z kontaktem: `shared_lists.contact_id`.

Skutek: wpisy o ofertach pojawiają się podwójnie — raz jako rekord `contact_activities.typ='oferta'` (wstawiany przez `create_offer`), raz jako pozycja syntetyczna z `shared_lists`.

Brak w historii: otwarcia oferty (`shared_list_views`, 172 rekordy — pokazywane tylko jako licznik `view_count`), zmiany statusów zapytań (`leads.status`/`sold_at` — nie logowane do `contact_activities`), edycje oferty i kontaktu (`OfferEditDialog` nie zapisuje aktywności).

## 6. Termin powrotu

- Przechowywanie: wyłącznie `contacts.termin_followup` (date, nullable), indeks `contacts_followup_idx WHERE ukryty=false AND data_sprzedazy IS NULL`. Zapisywany przez RPC `log_contact_activity` (`_termin_followup`, `_wyczysc_termin`).
- Powód powrotu: **brak dedykowanego pola**. Faktycznie treść rozmowy trafia do `contact_activities.tresc`, a etap do `contacts.krok`. „Powód” — NIE USTALONO jako odrębna encja; nie istnieje.
- Należy do kontaktu, nie do oferty. Oferta ma tylko `expires_at` (ważność linku) — to inne pojęcie.
- Ekran Kontakty i ekran Oferty pokazują **ten sam** `contacts.termin_followup` (Oferty przez embed `contacts(termin_followup)`).
- Termin może istnieć bez oferty — tak (kontakt z `krok='nowy'` i terminem nie wymaga `shared_lists`).

## 7. Zależności systemowe

| Funkcja | Plik | Tabela | Pola |
|---|---|---|---|
| Formularze na stronie publicznej (5 miejsc) | `hooks/useLeadSubmit.ts`, `hooks/useContactForm.ts`, `contact/ContactLeadForm.tsx`, `contact/ContactConversionCards.tsx`, `home/HomeHeroForm.tsx`, `products/PresentationModal.tsx` | `leads` (INSERT, rola public) | phone, email, name, message, source, product_id, page_url, user_agent, rodo_accepted |
| Powiadomienie o leadzie | trigger `trg_leads_notify` → `notify_lead_created()` → `supabase/functions/notify-lead/index.ts` | `leads` | wszystkie pola |
| Licznik nowych zapytań | `hooks/useNewLeadsCount.ts` | `leads` | status |
| Zapytania + statystyki | `sections/InquiriesSection.tsx`, `InquiryStats.tsx` | `leads` | status, handled_at, sold_at, source, created_at |
| Generowanie oferty | `offers/NewOfferView.tsx` → RPC `create_offer` | `shared_lists`, `contacts`, `contact_activities`, `leads` | jak w RPC |
| Publiczna strona oferty + tracking otwarć | `supabase/functions/shared-list/index.ts`, `src/pages/SharedOffer.tsx` | `shared_lists` (token, filters, expires_at, revoked_at), `shared_list_views` | token → filtry → produkty |
| Zamówienie z oferty | `shared-offer/OfferOrderSheet.tsx` + `notify-lead` (gałąź `offer_order`) | `leads` | dane z formularza |
| Eksporty XLSX/PDF/JPG | `utils/listExporter.ts`, `xlsxExporterV2.ts`, `pdfGenerator.ts`, `exportListModel.ts`, `sections/ExportSection.tsx` | **tylko `products`** | brak pól kontaktu/oferty |
| Wyszukiwanie | `utils/contactSearch.ts` | in-memory na `contacts` | osoba, firma, telefon, email |
| Dashboard | `sections/DashboardSection.tsx` | `products`, licznik leadów | — |
| n8n | NIE USTALONO — brak jakiegokolwiek odwołania w repo |
| `import_lead_to_contact` | **funkcja istnieje w bazie, ale nie jest wywoływana z kodu** (po zamianie na „Wygeneruj ofertę”) | — | — |
| `v_followup_today` | widok istnieje, **nie używany w kodzie** | — | — |

Wrażliwe na zmianę relacji oferta → kontakt: `SentOffersView.load()` (embed `contacts(...)` i grupowanie po `contact_id`), `ContactCard.load()` (`eq('contact_id')`), `OfferEditDialog.save()` (dwa UPDATE), RPC `create_offer` (matching + INSERT), `contact_activities.shared_list_id`. Eksporty i publiczna oferta są odporne — nie znają kontaktu.

## 8. Do ponownego użycia

`utils/contactSearch.ts` (normalizacja + dopasowanie), `utils/offerToken.ts`, `offers/offerChannels.ts`, `offers/types.ts`, funkcje SQL `norm_phone/norm_email/norm_company`, RPC `log_contact_activity` (już jest wspólnym wejściem do historii), komponenty `ui/dialog` i `ui/alert-dialog`, `use-toast`, stepper + pigułki z `CallForm.tsx`. Brakuje jednego wspólnego: formatera stanu oferty (zduplikowany w 2 plikach), mapy etykiet `krok` (zduplikowana w 2 plikach), komponentu danych kontaktowych (powtórzony w `ContactCard` i `OfferEditDialog`).

## 9. Warstwa danych — Supabase (skrót istotnych faktów)

- `contacts`: PK `id` (uuid default gen_random_uuid); osoba/firma/telefon/email nullable; `firma_norm`, `telefon_norm`, `email_norm` — **GENERATED ALWAYS**; `zrodlo` NOT NULL default `telefon` CHECK (telefon,www); `krok` NOT NULL default `nowy` CHECK (6 wartości); `termin_followup` date; `data_sprzedazy` date; `udzwig_kg` int CHECK >0; `wysokosc_m` numeric CHECK >0; `sprawdz_duplikat`, `ukryty` bool NOT NULL default false; `utworzony/zaktualizowany` timestamptz default now(); CHECK `contacts_kontakt_check` (telefon lub email lub osoba lub firma); trigger `contacts_set_zaktualizowany`. Brak UNIQUE na telefonie/e-mailu.
- `contact_activities`: PK id; FK `contact_id → contacts ON DELETE CASCADE`; FK `shared_list_id → shared_lists ON DELETE SET NULL`; `lead_id` uuid **bez FK**, z UNIQUE indeksem częściowym `WHERE lead_id IS NOT NULL` (idempotencja importu); CHECK `typ` na 7 wartości; indeksy `(contact_id, data DESC)`, `(shared_list_id)`.
- `shared_lists`: PK id; UNIQUE `token`; FK `contact_id → contacts ON DELETE SET NULL`; FK `renewed_from → shared_lists ON DELETE SET NULL`; CHECK `channel` na 13 wartości; indeksy: token, contact_id, expires_at, created_by, częściowy `active_idx WHERE archived_at IS NULL`; trigger `update_shared_lists_updated_at`.
- `shared_list_views`: PK id; FK `shared_list_id ON DELETE CASCADE`; indeks `(shared_list_id, viewed_at DESC)`.
- `leads`: PK id; FK `product_id → products ON DELETE SET NULL`; CHECK `leads_contact_check` (phone lub email), CHECK `status ∈ (new, handled)`, limity długości; triggery `trg_leads_notify`, `trg_set_lead_handled_at`.
- Funkcje: `create_offer(11 arg)` — jedna wersja, SECURITY INVOKER, advisory lock, matching po telefonie→e-mailu, INSERT kontaktu + oferty + aktywności; `import_lead_to_contact`; `log_contact_activity`; `cleanup_expired_shared_lists` (archiwizacja, DELETE dopiero po 12 miesiącach); `norm_phone/norm_email/norm_company` IMMUTABLE. Widok `v_followup_today` (definicja nieczytelna przez `information_schema` dla tej roli — NIE USTALONO pełnej treści).
- Relacja oferta → kontakt **już istnieje**. Potencjalna migracja dotyczyłaby: (a) wyodrębnienia tabeli `companies` i przepisania 3 niepustych `contacts.firma`, (b) dopisania `contact_id` do 18 ofert historycznych — problematyczne, bo jedynym śladem jest `shared_lists.label` (nazwy typu „Wszystkie”, „Gdanskokolice”, „882773707”), (c) ewentualnego pola „powód powrotu”. Migracja byłaby odwracalna, gdyby dodawała kolumny i nie usuwała `contacts.firma` ani `shared_lists.label`.

## 10. Bezpieczeństwo

RLS włączony na wszystkich 6 tabelach. `contacts`, `contact_activities`, `shared_lists`, `shared_list_views`: pełny CRUD tylko dla `authenticated` z `has_role(auth.uid(),'admin')`; INSERT do `shared_lists` dodatkowo wymaga `created_by = auth.uid()`. `leads` i `price_inquiries`: INSERT dla `public` (`true`), SELECT/UPDATE/DELETE tylko admin. Role z `user_roles` + `has_role` (SECURITY DEFINER) — model poprawny. Publiczna oferta czyta `shared_lists` wyłącznie przez edge function `shared-list` (service role), nie przez RLS. Rozdzielenie kontaktów i ofert **nie wymagałoby zmian w autoryzacji**, o ile nowa tabela firm dostanie analogiczne polityki admin-only i GRANT-y. Storage policies nie dotyczą tego przepływu.

## 11. Integralność danych

- Oferty bez kontaktu: **18 z 28**.
- Kontakty bez oferty: 3 z 10 (`88df9697`, `c5a416e1`, `8d281305` — dwa z www, bez powiązanej oferty).
- Oferty bez firmy: wszystkie poza tymi, których kontakt ma firmę (firma tylko u 3 kontaktów).
- Kontakty bez firmy: 7 z 10. Bez e-maila: 5. Bez osoby: 0.
- Niepełne/zaśmiecone dane: 3 kontakty z telefonem, który nie jest telefonem (`hghg`, `nie ma tel`, adres e-mail w polu telefon) — dla nich `telefon_norm` jest NULL lub `+`, czyli deduplikacja nie działa.
- Duplikaty tej samej osoby: 1 para („ghghg”). Skala problemu obecnie niska (baza w większości testowa), ale mechanizm dopuszcza duplikaty przy braku poprawnego telefonu/e-maila.

## 12. Źródło prawdy dla każdego pola

| Informacja | Obecna tabela | Obecne pole | Docelowy właściciel | Uwagi |
|---|---|---|---|---|
| Imię | contacts | osoba (imię+nazwisko razem) | Kontakt | brak rozbicia imię/nazwisko |
| Nazwisko | contacts | osoba | Kontakt | DO DECYZJI czy rozdzielać |
| Firma | contacts | firma, firma_norm (generated) | DO DECYZJI (Firma vs Kontakt) | brak tabeli firm; 3/10 wypełnione |
| Stanowisko | — | brak | Kontakt | pole nie istnieje |
| Telefon | contacts | telefon, telefon_norm | Kontakt | brak walidacji formatu |
| E-mail | contacts | email, email_norm | Kontakt | brak walidacji |
| WWW | — | brak | DO DECYZJI | pole nie istnieje |
| Notatka | shared_lists | note (per oferta) | DO DECYZJI | kontakt nie ma własnej notatki |
| Status sprzedażowy | contacts | krok, data_sprzedazy | Kontakt | `leads.sold_at` to osobny, niepowiązany znacznik |
| Termin powrotu | contacts | termin_followup | Kontakt | jedno pole, wyświetlane na 2 ekranach |
| Powód powrotu | contact_activities | tresc/wynik (pośrednio) | DO DECYZJI | brak dedykowanego pola |
| Historia rozmowy | contact_activities | typ, data, tresc, wynik | Aktywność | już wspólna tabela |
| Status oferty | shared_lists | expires_at/revoked_at/archived_at | Oferta | wyliczany w kodzie, nie zapisany |
| Data wysłania | shared_lists | sent_at (2/28), created_at | Oferta | UI pokazuje `created_at` jako „wysłano” |
| Data ważności | shared_lists | expires_at | Oferta | — |
| Otwarcia | shared_lists / shared_list_views | view_count, last_viewed_at / viewed_at, device | Oferta | szczegóły z views nieużywane w UI |
| Zapytanie z WWW | leads | status, handled_at, sold_at | DO DECYZJI | tylko luźno wiązane przez contact_activities.lead_id |

## 13. Proponowana kolejność techniczna (do decyzji, nie do wykonania)

Podział z zadania pasuje, z jedną korektą: relacja oferta → kontakt już istnieje, więc ETAP 1 nie jest budową relacji, a porządkowaniem.

- ETAP 0 — snapshot `contacts`, `contact_activities`, `shared_lists`, `shared_list_views`, `leads`; spis rekordów problematycznych (18 ofert bez kontaktu, 3 kontakty z fałszywym telefonem).
- ETAP 1 — decyzja o encji Firma + ewentualne dodatki pól (`powód powrotu`, WWW, stanowisko, notatka kontaktu) jako kolumny dodawane, nie zmieniane.
- ETAP 2 — mapowanie danych: 3 firmy, 1 para duplikatów, oferty osierocone (ręcznie lub pozostawione bez kontaktu).
- ETAP 3 — kompatybilność: `create_offer`, `log_contact_activity`, `import_lead_to_contact`, `SentOffersView` embed, edge function `shared-list`.
- ETAP 4 — UI Kontaktów (dodanie brakującego formularza „Dodaj kontakt”).
- ETAP 5 — UI Ofert (wspólny formater stanu oferty, jedno miejsce edycji danych kontaktu).
- ETAP 6 — historia: usunięcie podwójnych wpisów ofert, wciągnięcie otwarć i zmian statusu zapytań; rozdzielenie aktywności kontakt/oferta przez już istniejące `contact_activities.shared_list_id`.
- ETAP 7 — regresja: publiczna oferta po tokenie, tracking otwarć, generowanie oferty z zapytania, zatrzymanie linku, eksporty, powiadomienia Resend.

## 14. Ryzyka, decyzje, braki

A. Ryzyka: (1) `OfferEditDialog` robi 2 osobne UPDATE — możliwy stan połowiczny; (2) `label` na ofercie rozjeżdża się z `contacts.osoba` po edycji kontaktu; (3) matching kontaktów zależy od `norm_phone`, które przy śmieciowym telefonie zwraca NULL/`+` → duplikaty; (4) `firma_norm`, `telefon_norm`, `email_norm` są GENERATED — zmiana `norm_*` wymaga przepisania kolumn; (5) `contact_activities ON DELETE CASCADE` — usunięcie kontaktu niszczy całą historię; (6) 18 ofert bez `contact_id` zniknie z każdego widoku grupowanego po kontakcie; (7) dwie niezależne implementacje stanu oferty rozjadą się przy zmianie reguł; (8) `cleanup_expired_shared_lists` kasuje oferty po 12 miesiącach — historia ofert w karcie kontaktu jest nietrwała; (9) `leads.sold_at` i `contacts.data_sprzedazy` to dwa niezależne „sprzedane”; (10) `import_lead_to_contact` i `v_followup_today` to martwy kod w bazie — łatwo je uznać za działającą ścieżkę.

B. Nie decydować bez dodatkowej informacji: czy Firma ma być encją (kilka osób w jednej firmie?); czy „powód powrotu” to tekst wolny czy słownik; czy notatka należy do kontaktu czy oferty; czy `leads` ma zostać osobnym lejkiem czy zostać wciągnięte do kontaktów; czy rozbijać `osoba` na imię/nazwisko.

C. Braki do bezpiecznej migracji: pełna definicja `v_followup_today`; czy n8n lub inna integracja zewnętrzna czyta te tabele (w repo brak śladu); pochodzenie 18 ofert bez kontaktu; reguła identyfikacji firmy (NIP?); zasada retencji (obecnie 12 miesięcy) po zmianie modelu.

D. Nie usuwać: `contacts.firma` (jedyne źródło firmy), `shared_lists.label` i `note` (jedyny ślad klienta dla ofert bez kontaktu), `contact_activities` w całości, `shared_list_views` (172 zdarzenia), `leads.sold_at`/`handled_at`, `shared_lists.token` (link u klienta), `renewed_from`.

E. Testy po migracji: otwarcie `/oferta/:token` (aktywna, wygasła, zatrzymana), licznik otwarć, „Wygeneruj ofertę” z zapytania (bez telefonu i bez e-maila), odnowienie oferty z karty kontaktu, zapis rozmowy z terminem i z „Nie wracać”, edycja oferty i kontaktu, grupowanie w WYSŁANE, wyszukiwanie po telefonie/e-mailu, eksporty PDF/XLSX/JPG, powiadomienia o nowym zapytaniu i zamówieniu z oferty.

---

## STAN OBECNY
Oferta jest już powiązana z kontaktem relacyjnie (`shared_lists.contact_id`), a historia ma jedną tabelę (`contact_activities`). Duplikacja jest ograniczona do `shared_lists.label` i `note` oraz do kodu (dwa formatery stanu, dwie mapy etykiet, dwa formularze danych kontaktowych).

## CO JEST JUŻ DOBRZE
Relacja oferta → kontakt z FK i indeksem; `create_offer` jako jedna transakcja (oferta + kontakt + aktywność); wspólna tabela aktywności z rozróżnieniem `lead_id` / `shared_list_id`; kolumny normalizacyjne GENERATED; RLS admin-only na wszystkich tabelach; archiwizacja zamiast kasowania linków.

## CO JEST ZDUPLIKOWANE
`shared_lists.label` vs `contacts.osoba`; wpisy o ofertach w historii (rekord `typ='oferta'` + pozycja syntetyczna ze `shared_lists`); `stateOf` / `offerState`; mapa `KROK_LABELS` w 2 plikach; edycja danych kontaktu w `ContactCard` i `OfferEditDialog`; dwa znaczniki sprzedaży (`leads.sold_at`, `contacts.data_sprzedazy`).

## CO JEST NIEJASNE
Definicja `v_followup_today` (NIE USTALONO); pochodzenie 18 ofert bez `contact_id`; obecność integracji n8n (brak śladu w repo — NIE USTALONO); status `import_lead_to_contact` (martwa funkcja czy planowana ścieżka); brak pól: firma jako encja, WWW, stanowisko, powód powrotu, notatka kontaktu.

## CO TRZEBA ZDECYDOWAĆ
Czy Firma zostaje polem, czy staje się encją; właściciel notatki; czy „powód powrotu” dostaje własne pole; czy `leads` łączy się z kontaktami automatycznie; czy `label` oferty przestaje być kopią nazwy klienta.

## REKOMENDOWANA KOLEJNOŚĆ PRAC
0 snapshot → 1 decyzje modelowe (tylko dodawanie kolumn) → 2 mapowanie 3 firm, 1 duplikatu i 18 osieroconych ofert → 3 dostosowanie `create_offer` / widoków / edge function → 4 UI Kontaktów (dodaj kontakt) → 5 UI Ofert (wspólne formatery) → 6 jedna historia bez podwójnych wpisów + termin powrotu z powodem → 7 regresja listy z sekcji 14E.

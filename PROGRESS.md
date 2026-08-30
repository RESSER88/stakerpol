# PROGRESS

## Notatki dla odtwarzającego bazę

- `_tygonie_dummy_check` — sztuczne ograniczenie pomocnicze przy parametrze `_tygodnie` funkcji `create_offer`; to wyłącznie notatka dla osoby odtwarzającej bazę z migracji, nie zadanie do wykonania, bo panel i tak podaje wartość 1–4.

## Dwa środowiska, jedna baza

- `stakerpol.pl` (produkcja) i `takerpol.lovable.app` (wersja robocza) korzystają z tej samej bazy Supabase.
- Stare oferty (np. „Raxmet wszystkie”) powstały starym mechanizmem generowania linków na produkcji, sprzed istnienia `contact_id` — pusty kontakt w tych wierszach jest prawidłowy i nie wymaga naprawy.
- Dopóki przebudowa panelu nie trafi na `stakerpol.pl`, produkcja nadal generuje oferty starym mechanizmem, więc **nowe wiersze bez `contact_id` mogą pojawiać się dalej — to nie jest regresja**.

## 2026-08-30 — poprawki panelu (wyłącznie interfejs, zero migracji)

- Menu: `adminSections` już zawierało `contacts` w kolejności `start, products, offers, export, contacts, seo, faq`; menu boczne (desktop) renderuje wszystkie siedem pozycji. Winowajcą braku dostępu na mobile był `AdminTopBar.tsx` z zaszytymi na sztywno pozycjami „05 SEO” i „06 FAQ” — menu „więcej” liczy teraz pozycje spoza dolnego paska z `adminSections`, więc Kontakty są dostępne również na telefonie.
- `NewOfferView.tsx`: opcjonalne pole „Firma” pod „Nazwa”. Sygnatura `create_offer` **nietknięta** — firma zapisywana osobnym `update()` na `contacts` po utworzeniu oferty (RPC zwraca `contact_id`).
- `ContactCard.tsx`: edycja inline pól osoba / firma / telefon / e-mail z zapisem przez `supabase.from('contacts').update()` (przyciski „Zapisz dane” / „Anuluj” pojawiają się przy zmianie).
- `SentOffersView.tsx`: dociągnięte `termin_followup` i `krok` z kontaktu; chip terminu (czerwony + pulsująca obwódka dla dziś/przeszłości, bursztynowy do 3 dni, szary dalej, brak chipa przy `NULL`), pulsowanie wyłączone przy `prefers-reduced-motion: reduce`.
- `SentOffersView.tsx`: przycisk „ZATRZYMAJ DOSTĘP” → „ZATRZYMAJ”; brak otwarć pokazuje szarą plakietkę „brak otwarć” zamiast „–”.
- Bez zmian: `create_offer`, `import_lead_to_contact`, `log_contact_activity`, Edge Functions, `CallForm.tsx`, logika sygnałów ogląda/cisza/wygasa, `renewed_from`, import leadów.

## 2026-08-30 — nazewnictwo sygnałów (interfejs, zero migracji)

- `OffersSection.tsx`: usunięty zdublowany nagłówek „— Oferty” (breadcrumb w górnym pasku wystarcza); przełącznik NOWA/WYSŁANE/ZAPYTANIA i wyszukiwarka bez zmian.
- `SentOffersView.tsx`: chip terminu dziś/przeszłość → „Zadzwoń dziś”, pulsowanie przeniesione z całego wiersza na sam chip (wzorzec `animate-pulse` używany już w `DashboardSection.tsx` i `InquiriesSection.tsx`), `motion-reduce:animate-none` zachowane. Chip bursztynowy (do 3 dni) bez zmian.
- `SentOffersView.tsx`: sygnał „ogląda” → „oglądał” (warunek bez zmian: otwarcie w ciągu 48 h). Jedno pojęcie dla braku otwarć: „brak otwarć”.

### Notatka na przyszłość — prawdziwe „ktoś ogląda TERAZ”

Maciej chce docelowo wykrywanie obecności na żywo na publicznej stronie oferty (`/oferta/:token`): heartbeat z tej strony przez kanał realtime Supabase i wskaźnik obecności w panelu. To osobna, spora funkcja — świadomie odłożona. Dzisiejsza zmiana to wyłącznie uczciwe nazewnictwo na bazie istniejących danych (`view_count`, `last_viewed_at`), bez realtime.

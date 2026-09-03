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

## 2026-09-03 — weryfikacja sesji + licznik nowych zapytań

### Część 0 — co powstało poza treścią zleceń

- **„Cytat dnia” (`src/components/admin/editorial/QuoteOfTheDay.tsx`)** — powstał na wyraźną prośbę w czacie, ale nie było go w żadnym zleceniu pisanym. Renderowany tylko w `DashboardSection.tsx` (Start), pobierany raz na dobę z własnej Edge Function `daily-quote` (proxy do `dailystoic.pl`, bo źródło nie wysyła CORS), cache w `localStorage` pod `stakerpol-quote-pl-YYYY-MM-DD`. To celowa funkcja, nie placeholder. Zero zapisu w bazie, zero żądań ze stron publicznych. Nagłówek nad blokiem to komentarz „Ciekawostka dnia” w kodzie.
- **Tryb ciemny/jasny** — `src/hooks/useAdminTheme.ts` + przełączniki w `AdminSidebar.tsx` (desktop) i `AdminTopBar.tsx` (mobile). Również powstał z rozmowy, nie ze zlecenia pisanego.
- Poza tym nie znaleziono treści tekstowych ani funkcji, o które nie było prośby.

### Część 0 — wynik weryfikacji trybu ciemnego

- **Mechanizm:** Tailwind class-based (`darkMode: ["class"]`), klasa `dark` na `document.documentElement`. Preferencja w `localStorage` pod kluczem `stakerpol-admin-theme` (`light | dark | system`), **żadnej kolumny w bazie**. Tryb `system` reaguje na `prefers-color-scheme`.
- **Kontrast:** wszystkie sekcje panelu (Start, Produkty, Oferty, Kontakty, Eksport, SEO, FAQ) używają tokenów `editorial-*` / shadcn, które mają warianty w bloku `.dark` w `src/index.css` (`--editorial-bg`, `-ink`, `-muted`, `-line`, `-accent`, `-ok`, `-bad`, `-onink`). Nie znaleziono białego tekstu na białym tle ani odwrotnie w panelu. Jedyne zaszyte na sztywno kolory poza tokenami: `PDFQuoteGenerator.tsx` (`text-white` na granatowym tle — czytelne w obu trybach) i `#ffffff` jako tło płótna canvas w `ProductImageManager.tsx` (nie interfejs). Weryfikacja statyczna po kodzie — nie oglądano panelu na żywo w obu trybach.
- **Publiczna strona oferty `/oferta/:token`:** problemu **nie stwierdzono**. Klasa `dark` jest nadawana wyłącznie przez `useAdminTheme`, użyty tylko w `AdminLayout`, i zdejmowana w funkcji czyszczącej `useEffect` przy odmontowaniu panelu. Wejście na `/oferta/:token` bezpośrednio lub po opuszczeniu panelu daje wygląd jasny, niezależnie od preferencji admina. Zostaje jedno teoretyczne ryzyko do sprawdzenia na żywo: gdyby kiedyś `AdminLayout` i strona publiczna były zamontowane jednocześnie, klasa jest globalna — dziś taki układ nie występuje.

### ZAMKNIĘTE I POTWIERDZONE NA ŻYWO

- `create_offer`, `import_lead_to_contact`, `log_contact_activity`
- Zakładka Oferty (NOWA/WYSŁANE/ZAPYTANIA), zakładka Kontakty w menu
- Karta kontaktu: edycja, oś czasu, „Nowy link”, „Wciągnij do kontaktów”
- Grupowanie WYSŁANE po kontakcie, sortowanie po aktywności, wyszukiwarka
- Tryb ciemny/jasny — mechanizm i zakres opisane wyżej; **nieoglądany na żywo w obu trybach**, potwierdzony wyłącznie z kodu

### WYSŁANE, CZEKAJĄ NA TEST NA ŻYWO

- Kompaktowy widok/edycja danych kontaktowych, stepper wysokości 0,1 m
- Lista WYSŁANE: jedno źródło prawdy dla otwarć, max dwie plakietki

### ZROBIONE W TYM ZLECENIU

- `src/hooks/useNewLeadsCount.ts` — jedno źródło liczby zapytań `leads.status = 'new'` (sam odczyt `count`).
- `src/components/admin/editorial/PulseDot.tsx` — wspólne pulsowanie (`animate-pulse` + `motion-reduce:animate-none`), ten sam wzorzec co chip „Zadzwoń dziś”.
- Start: karta „Nowe zapytania” przy liczbie > 0 pokazuje liczbę w kolorze akcentu i pulsującą kropkę; przy 0 wygląda jak dotąd.
- Klik karty → zakładka Oferty otwarta od razu na widoku ZAPYTANIA (`OffersSection` przyjmuje `initialView`).
- Plakietka z liczbą + kropka przy „Oferty” w menu bocznym oraz kropka nad „Oferty” w pasku mobilnym.
- Bez zmian: `create_offer`, `log_contact_activity`, `import_lead_to_contact`, Edge Functions, logika sortowania i sygnałów w WYSŁANE, karta kontaktu.

### ZAPLANOWANE, JESZCZE NIE ZLECONE

- Prawdziwe wykrywanie „ktoś ogląda ofertę TERAZ” — duża, osobna funkcja, świadomie odłożona

### POZA TOBĄ (Maciej + Pi, nie Lovable)

- leaked password protection w Supabase — status nieznany
- wymiana tokena GitHub sprzed wycieku — status nieznany
- etap G: konto techniczne + rozszerzenie `eksport_supabase.py`
- etap H: cron kopii na Pi + próbne odtworzenie
- etap I: wygaszenie LeadBoxa — TYLKO po zaliczonym etapie H

### UWAGA METODOLOGICZNA

Cała dzisiejsza sesja szła bez Claude Code — bez niezależnego odczytu bazy weryfikującego raporty. Gdy Claude Code wróci, pierwszy krok: `get_diff` na wszystkich dzisiejszych commitach + odczyt `adminSections`, `pg_proc` i `pg_policies`, żeby potwierdzić zgodność z tym wpisem.

docs/plan_panel.md nigdy nie powstał (plan z 28.08 zakładał jego utworzenie, ale sesja została przerwana wcześniej) — jedynym źródłem prawdy o stanie i historii projektu jest ten plik, PROGRESS.md.

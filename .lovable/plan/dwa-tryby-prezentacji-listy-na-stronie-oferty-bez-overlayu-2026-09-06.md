# Dwa tryby prezentacji listy na stronie oferty (bez overlayu)

## KROK 0 — wynik weryfikacji (potwierdzone w kodzie)

1. Pliki:
   - lista produktów renderowana jest bezpośrednio w `src/pages/SharedOffer.tsx` (dwa bloki: tabela desktop `hidden md:block`, wiersze mobilne `md:hidden`) — nie ma osobnego komponentu listy,
   - karta trybu zdjęciowego: `src/components/shared-offer/OfferPhotoCard.tsx`,
   - overlay pełnoekranowy: `src/components/shared-offer/OfferPhotoBrowser.tsx` (`fixed inset-0 z-50`, scroll-snap, licznik `n / N`, X, własny pasek Zadzwoń/Zapytaj),
   - przycisk „Przeglądaj ze zdjęciami”: `SharedOffer.tsx`, w rzędzie z podsumowaniem `model.summary` (dziś `hidden md:inline-flex`, czyli na telefonie w ogóle niewidoczny).
2. Przycisk zamówienia: `Zamawiam` w `OfferPhotoCard.tsx` to zwykły `mailto:` budowany lokalnie funkcją `buildOrderMailto(row)` na adres `COMPANY.email` (temat „Zamówienie - model nr seryjny”, w treści dane wózka, cena, link do karty i puste pola faktura/wysyłka/kontakt). Zero Edge Function, zero bazy. **Zostaje bez zmian** — przeniosę tę samą funkcję do nowej karty. Osobno w `ExportRow` istnieje nieużywane w tym miejscu `mailtoHref` — nie tykam.
3. Udźwig: pole `row.mastLiftingCapacity` z `exportListModel.ts`, formatowane `formatCapacity` (`1600kg`); w liście tekstowej jest to kolumna „Udźwig” w tabeli desktop. Ten sam format wejdzie do czwartego kafla w trybie zdjęciowym.

Jedna rozbieżność do zgłoszenia: w `OfferPhotoCard.tsx` **nie ma techniki „blurred background fill”** — zdjęcie to `object-contain` na białym tle. Nie mam czego „wykorzystać”, więc dodam rozmyte tło w nowej karcie jeden raz (to samo zdjęcie jako `absolute inset-0 object-cover blur-xl scale-110`, nad nim ostre `object-contain`).

## Co zniknie

- Przycisk „Przeglądaj ze zdjęciami” i stan `photoMode` jako overlay.
- `OfferPhotoBrowser.tsx` (usunięty plik) — cała ścieżka pełnoekranowa, licznik `n / 42`, X, scroll-snap pionowy, jego własny pasek CTA (dolny pasek strony `ProductStickyBar` zostaje i działa niezależnie).

## Przełącznik trybu

W miejscu dawnego przycisku (rząd z podsumowaniem, nad rzędem filtrów) dwie małe ikony w jednej grupie: `LayoutGrid`/`Image` (widok zdjęciowy) i `List` (widok listy), `role="group"` + `aria-pressed`, aktywna z tłem navy i białą ikoną. Widoczne też na telefonie. Domyślnie: **LISTA**. Stan lokalny `viewMode: 'list' | 'photo'`, bez przeładowania i bez zmian w URL.

## Tryb LISTA

- Wiersz mobilny i wiersz tabeli desktop dostają z lewej miniaturę `images[0]` (`h-12 w-12 md:h-11 md:w-11`, `rounded-md object-cover`, `loading="lazy"`, fallback: neutralny kwadrat z ikoną). Reszta treści, kolejność, formaty liczb i grupowanie — bez zmian.
- Link „Karta produktu” w tabeli desktop oraz link „Zdjęcia” w wierszu mobilnym zamieniam na okrągły przycisk-strzałkę (`ChevronRight` w tle `bg-stakerpol-navy/10`), z tym samym `href={row.productUrl}`, `target="_blank"`, `rel="noopener noreferrer"` i `aria-label="Karta produktu"`.

## Tryb ZDJĘCIE

Nowy komponent `src/components/shared-offer/OfferPhotoListCard.tsx`, renderowany w normalnym przepływie (`space-y-6`, jedna karta pod drugą, zwykłe przewijanie strony, bez `snap`, bez `100dvh`), zasilany tą samą przefiltrowaną i posortowaną listą `photoRows` + `imageById`:

- obszar zdjęcia `aspect-[4/3]`, rozmyte tło + ostre zdjęcie `object-contain`,
- lewy górny róg: znacznik dostępności; prawy górny: licznik zdjęć produktu „3/8”,
- strzałki lewo/prawo na zdjęciu przełączają **tylko zdjęcia tego produktu** (indeks w stanie karty, zawijanie na końcach; przewijanie palcem poziome zostaje),
- znak wodny „STAKERPOL” w tej samej pozycji i stylu co dziś (`absolute left-3 top-14`, `tracking-[0.3em]`, `text-white/70`, cień),
- pod zdjęciem: model + pomarańczowa kreska, linia rok · nr seryjny · mth,
- rząd czterech danych z ikonami: UDŹWIG (`Package`, `mastLiftingCapacity`), WYS. KONSTR. (`MoveVertical`), PODNOSZENIE (`ArrowUpFromLine`), BATERIA (`BatteryCharging`) — formaty jak dziś, brak wartości → `—`,
- niżej: „Karta produktu →” po lewej (ten sam URL), cena netto większą czcionką po prawej (lub „Cena na zapytanie”),
- na dole `grid grid-cols-2 gap-2`: „Zamawiam” (pomarańczowy, `Mail`, dzisiejszy `mailto:`) i „Zadzwoń” (ciemny, `Phone`, `tel:` z `COMPANY_PHONE_TEL`),
- brak sekcji atutów, brak raportu technicznego i leasingu,
- pierwsze dwie karty `eager`, pozostałe `lazy`.

## Bez zmian

Nagłówek strony, rząd filtrów i jego logika sticky, sortowanie, licznik „Łącznie pozycji…”, `ProductStickyBar` na dole, adnotacja prawna, `PriceInquiryModal`, eksporty JPG/PDF/XLSX, `exportListModel.ts`, Edge Function `shared-list`, RPC, migracje.

## Zakres techniczny

Zmiany: `src/pages/SharedOffer.tsx`, nowy `src/components/shared-offer/OfferPhotoListCard.tsx`, usunięcie `src/components/shared-offer/OfferPhotoBrowser.tsx`; `OfferPhotoCard.tsx` — usunięty razem z overlayem, jego `buildOrderMailto` przenoszę bez zmiany treści maila. Weryfikacja: `npx tsgo --noEmit` + podglądowy test na aktywnym tokenie oferty (oba tryby, strzałki zdjęć, przycisk-strzałka w liście).

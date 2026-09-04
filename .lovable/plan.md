# Raport diagnostyczny — ikony przy pozycjach oferty (/oferta/:token)

Tylko analiza. Nie zmieniano żadnego pliku, nie uruchamiano migracji.

## 1. Stan obecny — struktura wiersza

Cała strona jest w jednym pliku: `src/pages/SharedOffer.tsx`.

Desktop (`<tr>`, ~linie 494–535): kolumny generowane z `EXPORT_COLUMNS`
(`src/utils/exportListModel.ts`): Nr, Model, Nr seryjny, Rok, Godziny, Udźwig,
Podnoszenie (`row.liftHeight`), Wys. konstr. (`row.minHeight`), Maszt,
Bateria (`row.battery`), Dostępność, Cena, Waluta, Zdjęcia.
Status i cena to dwie osobne komórki: `<td><StatusTag/></td>` a następnie
`<td colSpan={2}><PriceCell/></td>`. Kolejność: status po lewej, cena po prawej
— ale w osobnych komórkach, nie w jednej linii.

Mobile (`<article>`, ~linie 580–607), dwa rzędy:
- rząd 1: `flex justify-between` — numer + `inlineParams` (rok, mth oraz te
  parametry z `COMMON_PARAM_KEYS`, których nie przejął nagłówek grupy) po lewej,
  `StatusTag` po prawej;
- rząd 2: `flex justify-between` — nr seryjny + link „Zdjęcia" po lewej,
  `PriceCellMobile` po prawej.

Zatem dziś „Dostępny" jest w innej linii niż cena (rząd 1 vs rząd 2).
To odrębna zmiana: przeniesienie `StatusTag` do rzędu drugiego, bezpośrednio
przed komponentem ceny.

Ważne: parametry mogą nie być w wierszu wcale — `getGroupCommonParams`
(`src/utils/sharedOffer/groupCommonParams.ts`) wynosi udźwig, podnoszenie,
wys. konstr., maszt i baterię do nagłówka grupy, gdy są identyczne we wszystkich
pozycjach grupy. Ikony w wierszu wymagają decyzji: albo duplikować wartość
w wierszu, albo dodać ikony również w pasku nagłówka grupy.

## 2. Źródło danych — wysokość podnoszenia

- Kolumna: `public.products.lift_height`, typ `numeric` (mm).
- Mapowanie: `specs.liftHeight` (`src/types/supabase.ts`), następnie
  `ExportRow.liftHeight = formatLift(...)` → format `2.10m` (metry, 2 miejsca).
- Dostępne per pojedynczy produkt (`row.liftHeight`); grupowo pojawia się tylko
  wtedy, gdy jest jednakowe w całej grupie (`commonKeys`).
- Wypełnienie (odczyt produkcyjny): 47 produktów w tabeli, `lift_height`
  niepuste w 47/47, `min_height` 47/47, `battery` niepuste 47/47, z czego 46
  pasuje do wzorca „NNN Ah" używanego przez `normalizeBattery` — 1 rekord
  wyświetli się jako „—".

## 3. Zależności w widoku mobilnym

Interaktywne elementy w obrębie pojedynczej oferty:
- link „Zdjęcia" (`target="_blank"`, ikona `ExternalLink`, ring focus),
- `PriceCellMobile` — przy braku ceny to przycisk otwierający
  `PriceInquiryModal`.
Poza wierszem, ale nakładające się wizualnie: przyciski sortowania (h-11),
sticky nagłówek grupy (`STICKY_GROUP_TOP = 60`), stały `ProductStickyBar`
(„Zadzwoń"/„Zapytaj", dolny padding `72px + safe-area`) oraz
`FloatingContactBubble`. Brak rozwijania/zwijania i brak własnej obsługi dotyku.

Ryzyka przy dodaniu trzech kafli z ikonami:
- oba rzędy to `flex justify-between gap-2`; dodanie trzech kafli w tym samym
  rzędzie ściśnie link „Zdjęcia" i przycisk ceny, obniżając ich obszar dotyku
  poniżej wygodnego minimum na ekranach ~360 px (bieżący viewport 384 px);
- `truncate` na numerze seryjnym zacznie ucinać wcześniej;
- bezpieczniej: osobny, trzeci rząd na ikony, bez elementów klikalnych,
  co nie zmienia obecnych targetów dotyku;
- przy ~45 pozycjach to ~135 dodatkowych SVG — nadal akceptowalne, ale lista
  nie ma paginacji ani wirtualizacji, więc renderuje się w całości.

## 4. Ponowne użycie

Istnieje gotowy wzorzec „ikona + wartość + podpis":
`src/components/products/ProductKeySpecsBar.tsx` — siatka komórek
`{ Icon, value, label }` (`MoveVertical`, `Calendar`, `Clock`, `Package`),
ikona 18 px, wartość mono/bold, podpis 9 px uppercase.
Nie jest to jednak komponent współdzielony (przyjmuje `Product`, nie
`ExportRow`, i używa tokenów `text-ink`/`red-accent` karty produktu, a strona
oferty używa `stakerpol-navy`/`gray`). Do ponownego użycia trzeba by wydzielić
mały bezstanowy komponent kafla; nie ma dziś hooka do tego celu.
Ikon dla baterii/podnoszenia jeszcze nie użyto — `lucide-react` jest już
zainstalowany (`BatteryCharging`, `MoveVertical`, `ArrowUpFromLine`).

## 5. Zakres zmiany

Nie dotyczy: formularzy (poza istniejącym `PriceInquiryModal`, bez zmian),
wysyłki e-maili, danych strukturalnych/meta (strona ma `noindex, nofollow`),
panelu admina, uprawnień/RLS, RPC (`create_offer`, `log_contact_activity`,
`import_lead_to_contact`), Edge Functions ani GA4 — w `SharedOffer.tsx`
i `ProductStickyBar.tsx` nie ma żadnych wywołań `gtag`/`trackEvent`.

Uwaga: `EXPORT_COLUMNS` jest współdzielone z eksportami PDF/JPG/XLSX, więc
zmiany wizualne należy trzymać w `SharedOffer.tsx`, bez modyfikacji modelu
eksportu.

## Wnioski do ewentualnego zlecenia (bez przebudowy działających elementów)

1. Trzy kafle ikon w osobnym rzędzie w `<article>` (mobile) i, jeśli trzeba,
   ikony w nagłówkach kolumn desktopu — bez zmian w `EXPORT_COLUMNS`.
2. Osobna zmiana: przeniesienie `StatusTag` do rzędu z ceną, przed kwotą.
3. Decyzja: co pokazać, gdy parametr został wyniesiony do nagłówka grupy.

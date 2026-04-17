
## Plan: Pełna specyfikacja na stronie produktu — 5 pogrupowanych bloków

### Mapowanie pól DB → grupa
Wszystkie pola istnieją w tabeli `products` — **bez zmian schematu DB**.

| UI brief | Pole DB | Pole TS (`product.specs`) |
|---|---|---|
| Wysokość podnoszenia | `lift_height` | `liftHeight` |
| Wysokość konstrukcyjna | `min_height` | `minHeight` |
| Wolny skok | `free_lift` | `freeStroke` |
| Typ masztu | `mast` | `mast` |
| Udźwig — maszt | `lift_capacity_mast` | `mastLiftingCapacity` |
| Udźwig — wstępne | `lift_capacity_initial` | `preliminaryLiftingCapacity` |
| Wymiary | `dimensions` | `dimensions` |
| Koła | `wheels` | `wheels` |
| Składany podest | `foldable_platform` | `operatorPlatform` |
| Typ napędu | `drive_type` | `driveType` |
| Bateria | `battery` | `battery` |
| Prostownik / wstępne podnoszenie | `initial_lift` | `preliminaryLifting` |
| Rok produkcji | `production_year` | `productionYear` |
| MTH | `working_hours` | `workingHours` |
| Numer seryjny | `serial_number` | `serialNumber` |
| Stan ogólny | `condition` | `condition` |
| Opcje dodatkowe | `additional_options` | `additionalOptions` |

Brief wymienia `support_arms_lifting` (boolean) — **nie ma tego pola w bazie**. Pomijam (grupa 5 pokaże tylko `additionalOptions`, jeśli istnieje). Jeśli klient potrzebuje, dodamy kolumnę w follow-upie.

`additionalDescription` — usuwany ze specyfikacji (brief: zduplikowane Q&A z FAQ).

### Pliki do zmiany

**1. `src/components/products/ModernSpecificationsTable.tsx`** — pełny rewrite
- Usuwam: toggle „Pokaż/Ukryj dodatkowe specyfikacje", `ExpandableText` z `additionalDescription`, podział main/extended
- Nowa struktura: 5 grup renderowanych przez wewnętrzny komponent `SpecGroup`
- Helper `formatPL(n)` — `Intl.NumberFormat('pl-PL')` (spacja jako separator)
- Helper `formatValue(value, unit)` — łączy liczbę z jednostką
- Filtr pustych wierszy (`!value || value.trim() === ''` → skip)
- Filtr pustych grup (jeśli wszystkie wiersze puste → cała grupa ukryta)
- Domyślnie rozwinięte: grupy 1-3. Grupy 4-5 ukryte za przyciskiem „Pokaż pełną specyfikację (+N parametrów) ↓"
- Stylowanie zgodne z briefem: `border #E5E1D8`, header bg `#FAF8F3`, ikony `text-[#C8102E]`, wartości `font-mono font-bold`, labele `text-[#5B5B5B]`
- Ikony Lucide: `MoveVertical` (udźwig/wysokość), `Ruler` (wymiary), `BatteryCharging` (napęd), `Clock` (stan), `Plus` (dodatkowe)

**2. `src/components/products/ProductInfo.tsx`** — drobna zmiana
- Usuwam blok „Detailed Description" (ten z `additionalDescription` na górze) — brief jasno mówi, że Q&A z opisu jest zduplikowane z FAQ. Sama specyfikacja z `ModernSpecificationsTable` zostaje
- CTA + przyciski + nagłówek „Specifications" bez zmian

**3. `src/utils/translations/products.ts`** — dodanie kluczy (PL/EN/DE/CS/SK):
- `specGroupLiftCapacity` — „Udźwig i wysokość"
- `specGroupDimensions` — „Wymiary i konstrukcja"
- `specGroupDrive` — „Napęd i zasilanie"
- `specGroupHistory` — „Stan i historia"
- `specGroupExtras` — „Wyposażenie dodatkowe"
- `specShowFull` — „Pokaż pełną specyfikację"
- `specHideFull` — „Zwiń specyfikację"
- `specParamsCount` — „parametrów" (do interpolacji `+N parametrów`)

### Bez zmian
- DB schema, RLS, `Product` TS interface, FAQ sekcja, CTA, RelatedProducts, ProductHeader, kolory tokenów
- Tłumaczenia istniejących nazw parametrów (`t('liftHeight')` itd.) — używamy nadal

### Uwagi
- Grupa 5 (Wyposażenie dodatkowe) pokaże tylko `additionalOptions` — bez `support_arms_lifting` (pole nie istnieje w DB). Jeśli grupa będzie pusta, ukryje się automatycznie.
- Liczbowe pola (`liftHeight`, `mastLiftingCapacity`, itd.) są w bazie typu `numeric`, ale w TS jako `string` — `formatPL` parsuje string→number→format.
- Walidacja: jeśli wartość nie jest liczbą (np. `dimensions: "1900/770"`), wyświetlam raw string + jednostkę.

### Pliki (lista finalna)
1. `src/components/products/ModernSpecificationsTable.tsx` — rewrite (5 grup, formatPL, toggle)
2. `src/components/products/ProductInfo.tsx` — usunięcie bloku „Detailed Description"
3. `src/utils/translations/products.ts` — +8 kluczy × 5 języków

# Ukrycie bloku ceny, gdy cena nie jest prezentowana

## Cel
Na podstronie produktu blok „CENA NETTO / Zapytaj o ofertę” ma nie pojawiać się wcale, gdy konkretna cena nie jest prezentowana. Gdy cena jest prezentowana — blok bez zmian. Przyciski kontaktowe pod blokiem bez zmian w każdym wariancie.

## Decyzje
- Gdy cena jest ukryta, blok nie renderuje się w całości — także informacja o leasingu.
- Tryb „Pokaż cenę” z pustym (lub zerowym) polem ceny traktowany jest jak brak ceny — blok również się nie renderuje.

## Zakres zmiany
Jeden plik: `src/components/products/ProductPriceBlock.tsx`.

Komponent zwraca `null`, gdy warunek prezentacji ceny nie jest spełniony (tryb inny niż „Pokaż cenę” albo cena pusta/zerowa). W przeciwnym razie renderuje dotychczasowy blok bez żadnych zmian wizualnych, wraz z leasingiem, jeśli jest wypełniony.

## Poza zakresem (bez zmian)
- Dane strukturalne JSON-LD (`generateProductSchema.ts`) — mają własną, poprawną logikę.
- Eksporty PDF / XLSX / JPG (`exportListModel.ts`, `listExporter.ts`, `xlsxExporterV2.ts`).
- Feed (`geo-feed`), panel administracyjny, zdarzenia GA4.
- `ProductCTAButtons`, sticky bar, karty produktu na liście.

## Kryteria akceptacji
- Tryb „Tylko zapytanie” i „Zapytanie i cennik”: brak bloku ceny; odstępy w kolumnie hero pozostają spójne, przyciski kontaktowe widoczne.
- Tryb „Pokaż cenę” z ceną > 0: blok jak dotychczas, z leasingiem jeśli wypełniony.
- Tryb „Pokaż cenę” z pustą ceną: brak bloku.

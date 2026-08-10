# Mobilny widok udostępnionej listy — nagłówek grupy, sticky, „Zdjęcia”, sortowanie

Zmiany dotyczą wyłącznie gałęzi mobilnej strony `/oferta/:token`. Gałąź desktopowa (tabela) i eksporty PDF/XLSX/JPG pozostają bez zmian.

## 1. Wspólne parametry w nagłówku grupy (mobile)
- W `src/utils/exportListModel.ts` dodać **nowe, opcjonalne** pole w `ExportGroup`: `common` z wartościami tych parametrów, które są identyczne dla wszystkich pozycji grupy (udźwig, podnoszenie, maszt, bateria). Pole addytywne — eksporty go nie czytają, `EXPORT_COLUMNS` i `ExportRow` bez zmian.
- Nagłówek grupy mobilnej pokazuje `group.label · liczba` oraz wspólne parametry w jednej linii chipów.
- Karta pozycji na mobile pomija parametry przejęte przez nagłówek; zawsze zostają: rok, motogodziny, nr seryjny, dostępność, cena.

## 2. Sticky nagłówek grupy + chowany pasek filtrów (mobile)
- Nowy hook `src/hooks/useScrollDirection.ts` (kierunek przewijania z progiem, bez zależności).
- Pasek filtrów (dziś przycisk „Filtry” w kontenerze) staje się `sticky top-0` i przesuwa się poza ekran przy przewijaniu w dół, wraca przy przewijaniu w górę.
- Nagłówek grupy pozostaje `sticky` pod paskiem filtrów; wysokość offsetu ustalona jedną stałą, aby oba elementy nie nakładały się.
- Warstwy: pasek filtrów `z-30`, nagłówek grupy `z-20` (poniżej `Sheet` = `z-50`).

## 3. Odsyłacz „Zdjęcia”
- W karcie mobilnej przenieść istniejący link (`row.productUrl`, nowa karta) z dolnego paska do wiersza z numerem seryjnym i zmienić etykietę na „Zdjęcia”. Bez zmian adresu i bez zmian w desktopie.

## 4. Sortowanie po stronie odbiorcy
- Kontrolka `Select` w tym samym pasku co „Filtry” (mobile) oraz w panelu filtrów desktop.
- Opcje: domyślne (jak dziś), rok malejąco/rosnąco, motogodziny rosnąco/malejąco, cena rosnąco/malejąco (pozycje bez ceny na końcu).
- Sortowanie stosowane w `SharedOffer.tsx` na `group.rows` przy renderze — grupy i numeracja z `buildExportRows` zostają nietknięte.

## Zakres techniczny
- Pliki: `src/pages/SharedOffer.tsx`, `src/components/shared-offer/SharedOfferFilters.tsx`, `src/utils/exportListModel.ts` (dodanie pola), nowy `src/hooks/useScrollDirection.ts`.
- Bez zmian: Edge Function `shared-list`, zapytania o produkty, schemat bazy, RLS, maile, meta/JSON-LD, GA4 (trasa nadal bez raportowania odsłon), panel administracyjny, eksporty PDF/XLSX/JPG.

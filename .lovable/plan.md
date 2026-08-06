# Zmiana etykiety opcji trybu ceny

## Cel
W panelu administracyjnym (Rozdział 04 — Cena & Leasing) etykieta opcji `inquiry_with_pricelist` ma brzmieć „Zapytanie a cena w cenniku" zamiast „Zapytanie i cennik".

## Zakres
- Jedna zmiana tekstu w `src/components/admin/editor/chapters/Chapter04_Pricing.tsx` (lista opcji selecta).
- Wartość `inquiry_with_pricelist` zapisywana w bazie pozostaje bez zmian.
- Pozostałe opcje, podpowiedzi (hints), logika prezentacji ceny, układ pól — bez zmian.

## Weryfikacja zależności
Etykieta „Zapytanie i cennik" występuje tylko w tym jednym pliku — nie pochodzi ze wspólnej stałej ani mapy tłumaczeń. Identyfikator `inquiry_with_pricelist` jest używany w `src/types/supabase.ts` i `src/utils/exportListModel.ts`, ale wyłącznie jako wartość logiczna (bez etykiety), więc zmiana tekstu nie ma tam wpływu.

## Pliki do zmiany
- `src/components/admin/editor/chapters/Chapter04_Pricing.tsx`

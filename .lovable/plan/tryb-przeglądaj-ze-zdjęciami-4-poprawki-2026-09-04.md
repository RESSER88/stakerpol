# Tryb "Przeglądaj ze zdjęciami" — 4 poprawki

Stan potwierdzony w kodzie: `OfferPhotoBrowser.tsx` dostaje dziś `imageById: Map<string, string|undefined>` (tylko pierwsze zdjęcie, `SharedOffer.tsx` linia 307-309), watermark jest w prawym dolnym rogu obrazu, a `ExportRow` ma już gotowe `productUrl` (adres karty produktu) — nie trzeba nowej logiki adresów.

## 1. Znak wodny STAKERPOL

W `OfferPhotoCard.tsx` przenoszę watermark z `bottom-2 right-3` na lewy górny róg obrazu, na wysokości mniej więcej pod przyciskiem X / licznikiem (`absolute left-3 top-14`), nadal `position: absolute` w kontenerze zdjęcia, półprzezroczysty, bez zmiany typografii.

## 2. Link "Karta produktu"

W linii z dostępnością i ceną: po lewej stronie hiperłącze **Karta produktu** prowadzące do `row.productUrl` (`target="_blank"`, `rel="noopener"`), po prawej — jak dziś — dostępność i cena. Bez zmiany treści i formatu liczb.

## 3. Karuzela wszystkich zdjęć produktu

- `SharedOffer.tsx`: zamiast pojedynczego zdjęcia przekazuję do przeglądarki mapę `productId -> string[]` (wszystkie `product.images`, fallback `product.image`).
- `OfferPhotoCard.tsx`: kontener zdjęcia staje się poziomym torem `overflow-x-auto snap-x snap-mandatory` (jedno zdjęcie = `w-full snap-center`), przesuwanie palcem lewo/prawo. Pionowy scroll-snap kart zostaje bez zmian (`overscroll-contain` na torze, żeby gest poziomy nie przeskakiwał karty).
- Kropki-wskaźniki liczby zdjęć na dole obrazu; pierwsze zdjęcie eager, pozostałe `loading="lazy"`.

## 4. CTA "Zamawiam" na dole karty

Po lewej stronie na dole karty przycisk **Zamawiam**, który otwiera `mailto:` (adres firmowy z `COMPANY.email`) z gotowym szkicem:

- temat: `Zamówienie - {model} {nr seryjny}`
- treść: model, rok, nr seryjny, mth, wys. konstr., podnoszenie, bateria, cena (lub "cena na zapytanie"), link do karty produktu,
- oraz puste pola do uzupełnienia: dane do faktury, adres wysyłki, osoba kontaktowa (imię, telefon, e-mail).

## Zakres techniczny

Pliki: `src/components/shared-offer/OfferPhotoCard.tsx`, `src/components/shared-offer/OfferPhotoBrowser.tsx`, `src/pages/SharedOffer.tsx` (tylko przekazanie listy zdjęć).

Nie ruszam: eksportów JPG/PDF/XLSX, `exportListModel.ts`, filtrów, Edge Function `shared-list`, RPC, migracji, przycisku X i licznika "n/N", formatów liczb.

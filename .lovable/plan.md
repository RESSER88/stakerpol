# Zapytania: adres e-mail w kolumnie `phone`

## Odpowiedzi na pytania (stan potwierdzony w kodzie i danych)

**(1) Tak — wspólny komponent.** Zgłoszenia `product_page` i `product_list` pochodzą z `InquiryModal`, który korzysta z hooka `useContactForm` z **jednym polem kontaktu** ("Telefon lub e-mail"). Ten sam hook obsługuje też `contact_page`/`homepage`. Pozostałe źródła (`home_hero_form`, `product_page_inline`) używają innych formularzy z osobnymi polami telefonu i e-maila — dlatego tam nie ma zjawiska.

**(2) Nie, przyczyną jest kod, nie sama restrykcja NOT NULL.** W `useContactForm` zapis wygląda tak: `email` = wartość pola tylko gdy rozpoznano e-mail, natomiast `phone` = **zawsze** surowa wartość pola kontaktu. Czyli e-mail jest kopiowany do `phone` bezwarunkowo. Ograniczenie NOT NULL na `phone` sprawia jedynie, że nie da się dziś zapisać samego NULL bez zmiany schematu.

**Dane (potwierdzone zapytaniem):** `product_page` 8 rekordów / 6 z adresem w `phone`, `product_list` 3 / 3, pozostałe źródła 0. Najstarszy przypadek 13.05.2026.

## Proponowana zmiana (do zatwierdzenia)

1. **Migracja:** `public.leads.phone` → dopuszczenie NULL (`DROP NOT NULL`). Bez zmiany typu i nazwy kolumny.
2. **Kod (`src/hooks/useContactForm.ts`):** rozdzielenie wartości — gdy pole kontaktu jest e-mailem: `email` = adres, `phone` = NULL; gdy jest numerem: `phone` = numer, `email` = NULL. Usunięcie obecnego bezwarunkowego przypisania `phone: formData.contact`.
3. **Panel admina:** widok zapytań pokazuje kontakt z `phone` **lub** `email`, żeby wiersze bez telefonu nie wyglądały na puste.
4. **Dane historyczne:** opcjonalne czyszczenie — dla rekordów gdzie `phone = email` ustawić `phone = NULL`. Do decyzji, bo wpływa na Wasz import (patrz niżej).

## Wpływ na import po Waszej stronie

Po zmianie: adres pojawi się **wyłącznie** w `email`, a `phone` będzie NULL dla zgłoszeń wysłanych e-mailem. Import musi więc dopuszczać `phone = NULL` i traktować `email` jako jedyny kontakt. Treść zgłoszenia w `message` (z linią "Email:" / "Telefon:") pozostaje bez zmian.

## Pytanie decyzyjne

Czy czyścić 9 rekordów historycznych (usunąć duplikat adresu z `phone`), czy zostawić je bez zmian i zmienić tylko format nowych zgłoszeń?

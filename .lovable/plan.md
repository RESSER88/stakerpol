# Plan SEO dla STAKERPOL — oparty na prawdziwych danych z Google Search Console

## Co pokazują Twoje dane (ostatnie 28 dni, prosto z GSC)

**Połączenie działa** — usługa `https://stakerpol.pl/` zweryfikowana, pełny dostęp.

### Strony (wyświetlenia → kliknięcia → pozycja)

| Strona | Wyśw. | Klik. | Pozycja |
|---|---|---|---|
| Strona główna | 2 080 | 14 | 13,2 |
| /produkty (katalog) | 713 | 3 | 12,8 |
| SWE 200D (6579281) | 34 | 3 | 6,3 |
| SWE 200D (6774106) | 71 | 2 | 4,9 |
| SWE 200D (6524383) | 39 | 2 | 3,7 |
| SWE 100 (6305917) | 23 | 2 | 4,8 |
| /faq | 100 | 0 | 5,8 |

### Frazy

- „stakerpol" — poz. 1, 5 kliknięć (marka działa).
- „paleciak elektryczny toyota" — **87 wyświetleń, poz. 10,9, tylko 1 kliknięcie**.
- „paleciaki elektryczne" — poz. 6,3.
- Reszta to pojedyncze wyświetlenia na frazy modelowe (bt staxio, swe 100, swe140).

## Wnioski — dlaczego ten plan

1. **Strona główna i katalog mają razem ~2 800 wyświetleń, ale stoją na pozycji ~13** (druga strona wyników) — stąd prawie zerowe kliknięcia. To największy rezerwuar ruchu: wystarczy wejść do top 5, żeby kliknięcia wzrosły kilkukrotnie.
2. **Karty produktów, które mają treść, rankują świetnie** (poz. 4–6 i CTR 3–9%). Problem: jest ich za mało i część to stare adresy `/products/` (np. 6301428) zamiast `/produkty/`.
3. **FAQ ma 100 wyświetleń i 0 kliknięć** — treść jest, ale nie pracuje na sprzedaż.
4. Semrush potwierdza potencjał: „paleciak elektryczny" 6 600 szukań/mies., „paleciak" 9 900/mies., niska trudność (13/100).

## Co robimy (3 kroki)

### Krok 1 — Wzmocnienie strony głównej i katalogu (największy efekt, najmniej pracy)

- Krótkie, rzeczowe teksty pod frazy „paleciak elektryczny", „wózek paletowy elektryczny", „paleciak elektryczny toyota" — na stronie głównej i /produkty.
- Cel: przesunąć 2 800 wyświetleń z pozycji 13 do top 5.
- Bez zmiany wyglądu — tylko treść w istniejących sekcjach.

### Krok 2 — Unikalne opisy kart produktów z AI (Ty akceptujesz każdy)

- Przycisk „Generuj opis" w panelu → podgląd → „Akceptuj" / „Odrzuć". Nic nie publikuje się automatycznie.
- Opis = 2–4 zdania o konkretnym egzemplarzu (maszt, udźwig, zastosowanie), widoczny dla klienta i Google.
- Zaczynamy od wózków z wyświetleniami w GSC (SWE 200D, SWE 120L, SWE 140) i od karty 6301428, która dziś stoi na starym adresie.

### Krok 3 — Porządek techniczny + pomiar

- Przekierowania starych adresów `/products/...` → `/produkty/...` (Google widzi obie wersje).
- Raz w miesiącu raport z GSC: frazy, pozycje, kliknięcia → decyzja o kolejnych kartach.

## Czego NIE robimy

- Nie zmieniamy wyglądu, układu ani funkcji strony.
- Nie tworzymy bloga ani nowych stron.
- Nic nie publikujemy bez Twojej akceptacji.
- Nie ruszamy bazy poza jednym polem na zatwierdzony opis.

## Szczegóły techniczne

- Kolumna `delta_content` w `product_seo_settings` + tabela `product_ai_drafts` (robocze wersje, tylko admin).
- Generowanie przez Edge Function z Twoim kluczem API (OpenAI lub Claude — wybór przy wdrożeniu); klucz nigdy nie trafia do przeglądarki.
- Przekierowania 301 w konfiguracji hostingu.
- Oczekiwany efekt: wzrost kliknięć w 2–4 miesiące, mierzony w GSC.

## Kolejność wdrożenia

1. Krok 1 (treści strony głównej i katalogu) — najszybszy efekt.
2. Krok 2 na 5 wózkach z największą liczbą wyświetleń — test.
3. Krok 3 + reszta oferty po potwierdzeniu efektu.

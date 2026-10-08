# Plan SEO dla STAKERPOL — oparty na realnych danych

## Skąd te dane i dlaczego ten plan

Dane z Semrush (Google PL, październik 2026):

- stakerpol.pl: **26 fraz, ~25 wizyt/mies.** — prawie cały ruch to fraza markowa „stakerpol” (96%).
- Karty produktów są zaindeksowane, ale stoją na pozycjach **11–52** (np. „paleciak elektryczny toyota bt" poz. 11, „swe140" poz. 23, „wózek paletowy elektryczny wysokiego podnoszenia" poz. 52).
- Tymczasem rynek szuka: **„paleciak elektryczny" 6 600/mies., „paleciak" 9 900/mies., „wózek paletowy" 3 600/mies.** — a trudność frazy „wózek paletowy elektryczny" to tylko **13/100 (niska)**.

**Wniosek:** Google widzi stronę, ale karty produktów nie mają treści, za którą mogłyby wygrać z konkurencją. To nie problem techniczny — to problem treści. Dlatego plan koncentruje się na treści kart produktów i strony katalogu, nie na nowych funkcjach.

## Co robimy (3 kroki, po kolei)

### Krok 1 — Unikalne opisy na kartach produktów (największy efekt)

Obecnie ~40 wózków tego samego modelu ma niemal identyczną treść — Google traktuje je jako duplikaty i nie pokazuje wysoko.

- Do każdej karty produktu dodajemy krótki (2–4 zdania), rzeczowy akapit: do czego ten konkretny egzemplarz się nadaje (maszt, wysokość, udźwig, podest, zastosowanie w magazynie/naczepie).
- Generowany przez AI, ale **zawsze po Twojej akceptacji w panelu** — przycisk „Generuj opis" → podgląd → „Akceptuj" / „Odrzuć". Nic nie publikuje się automatycznie.
- Treść jest widoczna dla klienta i dla Google.
- Zaczynamy od wózków, które już są na pozycjach 11–30 (np. SWE 140, SWE 120L) — one najszybciej przeskoczą do top 10.

### Krok 2 — Wzmocnienie strony katalogu /produkty

- Krótki tekst na stronie listy produktów pod frazy „paleciak elektryczny", „wózek paletowy elektryczny" (6 600 + 1 600 wyszukań/mies., niska konkurencja).
- Nagłówki i opisy sekcji zgodne z tym, czego ludzie realnie szukają.

### Krok 3 — Pomiar i decyzje co miesiąc

- Podpięcie Google Search Console do projektu (konto już połączone w Lovable — trzeba je powiązać z tym projektem).
- Raz w miesiącu: lista fraz, pozycje, kliknięcia → decyzja, które karty wzmocnić następne.

## Czego NIE robimy

- Nie zmieniamy wyglądu strony, układu kart ani funkcji.
- Nie tworzymy nowych stron ani bloga.
- Nie publikujemy niczego bez Twojej akceptacji.
- Nie ruszamy bazy danych poza jednym nowym polem na zatwierdzony opis.

## Szczegóły techniczne

- Nowa kolumna `delta_content` w `product_seo_settings` (opis publikowany) + tabela `product_ai_drafts` (robocze wersje, tylko dla admina).
- Generowanie przez Edge Function z Twoim kluczem API (OpenAI lub Claude — do wyboru przy wdrożeniu), klucz nigdy nie trafia do przeglądarki.
- Oczekiwany efekt: realny wzrost widoczności w 3–6 miesięcy, mierzony w Search Console.

## Kolejność wdrożenia

1. Podpięcie GSC do projektu (5 min, bez kodu).
2. Krok 1 na 3–5 wybranych wózkach jako test.
3. Po potwierdzeniu efektu — reszta oferty + Krok 2.

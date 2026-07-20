# Plan: utworzenie `PROTOKOL_UZGODNIEN.md`

Utworzę nowy plik `PROTOKOL_UZGODNIEN.md` w katalogu głównym repozytorium, oparty na moim wcześniejszym raporcie audytowym (3 problemy: udźwig, ALT, migracja URL), zaktualizowany o wszystkie 10 uwag redakcyjnych.

## Struktura nowego dokumentu

1. **Nagłówek / metryka** — tytuł, data, strony uzgodnienia, przedmiot audytu.
2. **Rozdział 1 — Błąd danych produktu (udźwig 1200 vs 2000 kg)** — bez zmian merytorycznych względem audytu; formalny język protokołu.
3. **Rozdział 2 — Automatyczne generowanie ALT dla zdjęć** — przeredagowany zgodnie z uwagą #1:
   - jasno zapisane, że audyt rekomendował **rozwiązanie hybrydowe (Opcja D)**,
   - podstawą jest **automatyczny generator ALT z danych produktu**,
   - administrator ma **możliwość ręcznej edycji** ALT,
   - **AI jako opcja** dla wybranych przypadków, nie jako podstawa,
   - usunięcie sformułowań typu „rekomendacja audytora (AI) odrzucona" i zastąpienie ich formułą uzgodnioną w uwadze #2.
4. **Rozdział 3 — Zmiana adresów URL** — zgodnie z uwagą #3:
   - `/paleciaki` jako **najbardziej obiecujący kierunek**, a nie „zatwierdzony warunkowo",
   - **ostateczna decyzja po analizie danych** z: Google Search Console, Google Keyword Planner, Senuto, Ahrefs,
   - decyzja **oparta na danych, nie na intuicji**,
   - konsekwentne używanie terminu **„Nawigacja okruszkowa (Breadcrumbs)"** (uwaga #5),
   - **usunięcie punktu** o refaktorze `ProductPage → PalletTruckPage`, `ProductsList → PalletTruckList` (uwaga #6).
5. **Rozdział 4 (NOWY) — Ocena ryzyka migracji URL** (uwaga #4):
   - migracja URL to jedyna zmiana mogąca wpłynąć na pozycje w Google,
   - powinna być wykonana jako **osobny etap projektu**,
   - poprzedzona wdrożeniem poprawek niskiego ryzyka,
   - zakres: przekierowania 301, monitoring GSC, monitoring indeksacji, monitoring ruchu organicznego.
6. **Rozdział 5 (NOWY) — Zakres zmian niewymagających migracji SEO** (uwaga #7):
   - poprawa wyświetlania parametrów produktu,
   - ujednolicenie komponentów,
   - wdrożenie generatora ALT,
   - poprawa danych Schema.org,
   - poprawa metadanych obrazów,
   - podkreślenie: mogą zostać wdrożone niezależnie od migracji URL.
7. **Rozdział 6 — Tabela priorytetów** (uwaga #8) — dokładnie wg podanej treści (P0–P4).
8. **Rozdział 7 — Wniosek końcowy** (uwaga #9) — formalne podsumowanie w tonie protokołu, bez języka marketingowego:
   - audyt prawidłowo identyfikuje główne problemy techniczne,
   - wymaga doprecyzowania strategii ALT,
   - migracja URL powinna zostać poprzedzona analizą danych SEO,
   - pozostałe rekomendacje uznano za zasadne,
   - kolejność wdrożenia powinna minimalizować ryzyko dla SEO.
9. **Załącznik — Lista zmian względem raportu audytowego** (uwaga #10, kontrola jakości) — krótka lista wszystkich 10 wprowadzonych korekt względem pierwotnego audytu.

## Reguły stylistyczne dokumentu

- Formalny, protokolarny język (bez emoji, bez języka marketingowego, bez „🚀", „✅").
- Zachowana pełna treść — bez skracania, bez dopisywania własnych założeń.
- Spójna numeracja rozdziałów (1–7 + załącznik).
- Konsekwentne pojęcie **„Nawigacja okruszkowa (Breadcrumbs)"** w całym dokumencie.
- Wszystkie „kategoryczne" sformułowania („odrzucona", „zatwierdzona") zastąpione formułami typu „po analizie uznano, że…", „obecnie uznaje się za najbardziej obiecujące…".
- Brak sprzecznych zapisów między rozdziałami (rozdział 4 spójny z rozdziałem 3, rozdział 5 spójny z tabelą priorytetów P0–P3).

## Kontrola jakości (przed oddaniem)

Po napisaniu przejdę dokument i sprawdzę:
- spójność numeracji rozdziałów i podpunktów,
- spójność terminologii („Nawigacja okruszkowa (Breadcrumbs)", „generator szablonowy ALT", „migracja URL"),
- spójność decyzji między rozdziałami (np. rozdz. 2 vs załącznik, rozdz. 3 vs rozdz. 4),
- brak sprzecznych zapisów,
- zgodność z dobrymi praktykami SEO (301, canonical, sitemap, GSC),
- profesjonalny styl dokumentacji technicznej.

Na końcu dokumentu (załącznik) załączę listę 10 wprowadzonych zmian względem pierwotnego audytu.

## Zakres pracy

- **Nowy plik:** `PROTOKOL_UZGODNIEN.md` (ok. 350–500 linii Markdown).
- **Bez zmian w kodzie aplikacji** — to wyłącznie dokument.
- **Bez modyfikacji** istniejących raportów (`RAPORT_OPTYMALIZACJI.md`, `PRODUCTION_READINESS_REPORT.md` itd.).

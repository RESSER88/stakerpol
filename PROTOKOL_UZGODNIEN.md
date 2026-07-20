# PROTOKÓŁ UZGODNIEŃ

**Przedmiot:** Wyniki audytu technicznego i SEO serwisu stakerpol.pl oraz uzgodnienia dotyczące zakresu, kolejności i sposobu wdrożenia zmian.

**Data sporządzenia:** 20 lipca 2026 r.

**Strony uzgodnienia:**
- Zamawiający: Stakerpol (właściciel serwisu stakerpol.pl).
- Wykonawca: zespół techniczny odpowiedzialny za rozwój i utrzymanie serwisu.

**Podstawa uzgodnień:** raport audytowy obejmujący trzy zagadnienia — (1) błąd prezentacji parametru udźwigu na karcie produktu, (2) strategia opisów alternatywnych (ALT) dla zdjęć produktów, (3) migracja adresów URL na polskojęzyczne.

**Charakter dokumentu:** protokół uzgodnień. Zapisy zawarte w niniejszym dokumencie mają charakter roboczych ustaleń kierunkowych; ostateczne decyzje wdrożeniowe podejmowane są przez Zamawiającego na podstawie danych i analiz wskazanych w treści protokołu.

---

## Rozdział 1. Błąd danych produktu — udźwig 1200 kg vs 2000 kg

### 1.1 Opis problemu

Na liście produktów prezentowana jest poprawna wartość parametru „udźwig na maszcie" (`mastLiftingCapacity`), np. 1200 kg. Po wejściu w kartę produktu, w pasku kluczowych parametrów, w miejscu tego samego parametru wyświetlana jest wartość wyższa (np. 2000 kg), pochodząca w rzeczywistości z pola „udźwig wstępny" (`preliminaryLiftingCapacity`). Powoduje to rozbieżność informacji handlowo-technicznej pomiędzy widokiem listy a widokiem szczegółowym.

### 1.2 Ustalona przyczyna

Analiza kodu źródłowego potwierdziła, że komponent paska kluczowych parametrów w widoku szczegółowym (`src/components/products/ProductKeySpecsBar.tsx`) wyznacza wyświetlaną wartość udźwigu jako maksimum z dwóch pól:

```
capacity = Math.max(mastLiftingCapacity, preliminaryLiftingCapacity)
```

Komponent karty produktu na liście (`src/components/ui/ProductCard.tsx`) prezentuje bezpośrednio wartość `mastLiftingCapacity`. Rozjazd wynika zatem z odmiennej logiki wyboru pola w dwóch niezależnie zaimplementowanych komponentach prezentujących ten sam parametr. Pełna tabela specyfikacji (`ModernSpecificationsTable.tsx`) prezentuje oba pola poprawnie w osobnych wierszach.

### 1.3 Uzgodniony sposób naprawy

1. **Poprawka punktowa** — w komponencie `ProductKeySpecsBar.tsx` należy pobierać wyłącznie wartość `mastLiftingCapacity`, analogicznie do karty listy. Poprawka nie wymaga zmian w bazie danych ani w warstwie translacji.
2. **Ujednolicenie komponentów (etap docelowy)** — uzgodniono kierunek wydzielenia wspólnego komponentu prezentującego pasek czterech kluczowych parametrów (wysokość, rok, motogodziny, udźwig), używanego jednocześnie w karcie listy, w widoku szczegółowym oraz w kartach produktów powiązanych. Celem jest wyeliminowanie ryzyka analogicznych rozbieżności w przyszłości.

### 1.4 Ocena wpływu

- **Ryzyko wdrożeniowe:** bardzo niskie — zmiana wyłącznie w warstwie prezentacji.
- **Wpływ na SEO:** neutralny.
- **Wpływ na wydajność:** brak.
- **Wpływ biznesowy:** bardzo wysoki — usunięcie realnego błędu merytorycznego prezentowanego klientowi.

---

## Rozdział 2. Automatyczne generowanie opisów ALT dla zdjęć produktów

### 2.1 Stan obecny

Zdjęcia produktów są renderowane z opisem alternatywnym równym wyłącznie modelowi produktu (np. „SWE 200D"). W konsekwencji wszystkie zdjęcia danego produktu mają identyczny opis alternatywny, brakuje kontekstu technicznego oraz informacji o miejscu zdjęcia w galerii. Sytuacja ta ogranicza zarówno dostępność serwisu dla osób korzystających z czytników ekranu, jak i widoczność treści graficznych w Google Images.

### 2.2 Rekomendacja audytu

Audyt przedstawił porównanie czterech wariantów rozwiązania (A — opis ręczny, B — generator szablonowy z danych produktu, C — generator oparty o model AI vision, D — rozwiązanie hybrydowe). **Rekomendacją audytu jest wariant hybrydowy (Opcja D)**, w którym:

- podstawą jest **automatyczny generator opisów ALT budowany z danych produktu** (model, rok produkcji, wysokość podnoszenia, udźwig, cechy dodatkowe, numer zdjęcia w galerii),
- administrator ma **możliwość ręcznej edycji** wygenerowanego opisu w panelu zarządzania produktem (opcjonalne pole nadpisujące),
- **model AI (vision)** pozostaje **opcjonalnym dodatkiem dla wybranych, szczególnych przypadków** (np. materiały marketingowe wymagające bogatszego opisu wizualnego), a nie podstawą całego systemu.

### 2.3 Uzgodnienia dotyczące strategii ALT

Po analizie uznano, że dla obecnej skali katalogu (rzędu 30 produktów, wiele zdjęć na produkt) bardziej odpowiednim rozwiązaniem podstawowym będzie **generator szablonowy z możliwością ręcznej edycji**, ponieważ:

- zapewnia natychmiastowe, deterministyczne i unikalne opisy dla wszystkich zdjęć bez konieczności ręcznego uzupełniania,
- eliminuje ryzyko halucynacji charakterystycznych dla modeli generatywnych,
- pozostaje zgodny z zaleceniami wyszukiwarek dotyczącymi opisowych i unikalnych opisów alternatywnych,
- ma niskie i przewidywalne koszty utrzymania.

**Wykorzystanie modelu AI pozostaje opcją zarezerwowaną dla wybranych przypadków** — takich jak zdjęcia hero czy materiały marketingowe, w których dodatkowy kontekst wizualny może przynieść wymierną wartość. Możliwość włączenia tej opcji nie jest przedmiotem obecnego etapu wdrożenia.

### 2.4 Zakres wdrożenia (etap pierwszy)

1. Dodanie opcjonalnej kolumny `alt_text` w tabeli `product_images` (ręczna nadpiska).
2. Implementacja funkcji pomocniczej budującej domyślny opis alternatywny na podstawie danych produktu i indeksu zdjęcia.
3. Podpięcie funkcji w komponentach prezentujących zdjęcia produktowe (`ProductImage`, `ProductCard`, `SimpleRelatedCard`, `OptimizedImage`).
4. Dodanie edytowalnego pola opisu alternatywnego w panelu zarządzania zdjęciami produktu.

### 2.5 Ocena wpływu

- **Ryzyko wdrożeniowe:** niskie — zmiana obejmuje warstwę prezentacji oraz opcjonalne pole w bazie danych.
- **Wpływ na SEO:** pozytywny — poprawa widoczności w Google Images oraz zgodność z dobrymi praktykami dotyczącymi treści alternatywnych.
- **Wpływ na dostępność:** pozytywny — poprawa doświadczenia użytkowników korzystających z czytników ekranu.
- **Wpływ na wydajność:** brak.

---

## Rozdział 3. Zmiana adresów URL na polskojęzyczne

### 3.1 Stan obecny

W serwisie stakerpol.pl aktualnie indeksowane są między innymi następujące adresy: `/products`, `/products/:slug` (ok. 30 kart produktów), `/testimonials`, `/contact`, `/faq`, `/privacy`. Adresy definiowane są w routerze aplikacji, uwzględniane w mapie strony generowanej przez funkcję brzegową, w tagach kanonicznych, w schema Nawigacja okruszkowa (Breadcrumbs) oraz w linkach wewnętrznych rozproszonych w wielu plikach źródłowych.

### 3.2 Rozważany kierunek zmian

Analizowany jest kierunek migracji na polskojęzyczne, krótsze i bardziej opisowe adresy — przykładowo:

| Adres obecny | Adres rozważany | Uzasadnienie kierunkowe |
|---|---|---|
| `/products` | `/paleciaki` | Krótki, opisowy, zawiera polskie słowo kluczowe zgodne z pozostałą terminologią serwisu. |
| `/products/:slug` | `/paleciaki/:slug` | Zachowanie hierarchii poniżej strony kategorii. |
| `/testimonials` | `/opinie` | Naturalna polska forma. |
| `/contact` | `/kontakt` | Naturalna polska forma. |

**Wariant `/paleciaki` obecnie wydaje się najbardziej obiecującym kierunkiem** dla strony kategorii, ze względu na spójność z terminologią używaną już w serwisie („paleciaki elektryczne BT Toyota") oraz z rozpoznawalnym polskim zapytaniem produktowym.

### 3.3 Warunki podjęcia decyzji

**Ostateczna decyzja co do docelowego brzmienia adresów zostanie podjęta dopiero po przeprowadzeniu analizy danych SEO.** Analiza powinna być oparta na danych, a nie na intuicji, i obejmować co najmniej następujące źródła:

- **Google Search Console** — udział poszczególnych obecnych adresów w ruchu organicznym, obserwowane zapytania wejściowe, pozycje i klikalność (CTR).
- **Google Keyword Planner** — potencjał wyszukiwań dla wariantów „paleciak", „paleciaki", „wózek paletowy", „wózki paletowe" oraz zapytań pokrewnych.
- **Senuto** — widoczność serwisu i konkurencji w polskim indeksie, analiza fraz brandowych i kategorii.
- **Ahrefs** — profil linków przychodzących kierujących do obecnych adresów oraz analiza fraz konkurencji.

Wynik analizy powinien wskazać zarówno rekomendowane brzmienie adresów, jak i uzasadnienie decyzji poparte danymi (wolumen zapytań, konkurencyjność, spójność z profilem linków).

### 3.4 Zakres techniczny migracji (po podjęciu decyzji)

Uzgodniony zakres techniczny migracji, do zrealizowania po zapadnięciu decyzji o kierunku:

1. Rejestracja nowych tras w routerze aplikacji obok tras obecnych.
2. Wdrożenie **przekierowań 301** ze starych adresów na nowe — na poziomie warstwy hostingowej/brzegowej, w sposób zgodny z dobrymi praktykami wyszukiwarek.
3. Aktualizacja tagów kanonicznych (`canonical`) oraz meta `og:url` we wszystkich podstronach objętych migracją.
4. Aktualizacja mapy strony (sitemap) — wyłącznie nowe adresy w mapie strony; adresy stare pozostają dostępne wyłącznie jako źródło przekierowań 301.
5. Aktualizacja Nawigacji okruszkowej (Breadcrumbs), zarówno w warstwie prezentacji, jak i w danych strukturalnych (`BreadcrumbList`).
6. Aktualizacja linków wewnętrznych w kodzie źródłowym (nagłówek, stopka, sekcje strony głównej, przyciski wezwania do działania, dane strukturalne produktu).
7. Ponowne przesłanie mapy strony w Google Search Console oraz — w miarę potrzeby — użycie mechanizmów inspekcji adresów w Search Console dla adresów kluczowych.

---

## Rozdział 4. Ocena ryzyka migracji URL

Migracja adresów URL, opisana w rozdziale 3, jest **jedyną spośród uzgadnianych zmian, która może wpłynąć na pozycje serwisu w Google**. Pozostałe uzgodnione zmiany (rozdział 1 — poprawa prezentacji parametru udźwigu, rozdział 2 — wdrożenie generatora opisów alternatywnych) nie zmieniają adresów zasobów, struktury nawigacji ani struktury danych, i nie niosą istotnego ryzyka dla widoczności organicznej.

W związku z powyższym uzgodniono następujące zasady:

1. **Migracja adresów URL zostanie potraktowana jako osobny, wyodrębniony etap projektu.** Nie zostanie wdrożona łącznie z poprawkami niskiego ryzyka, aby zapewnić jednoznaczną atrybucję ewentualnych zmian widoczności do konkretnego zakresu prac.
2. **Wcześniej wdrożone zostaną poprawki niskiego ryzyka**, opisane w rozdziale 5 („Zakres zmian niewymagających migracji SEO"), tak aby wartość biznesowa audytu została dostarczona bez ekspozycji na ryzyko SEO.
3. **Zakres etapu migracji obejmuje w szczególności:**
   - wdrożenie przekierowań **301** ze wszystkich starych adresów na odpowiadające im nowe,
   - **monitoring Google Search Console** (raport pokrycia, raport skuteczności, inspekcja adresów, ewentualne błędy indeksacji),
   - **monitoring indeksacji** (weryfikacja, czy nowe adresy są prawidłowo pobierane, indeksowane i klasyfikowane; weryfikacja czy stare adresy są prawidłowo obsługiwane przez przekierowania 301),
   - **monitoring ruchu organicznego** w Google Analytics 4 oraz w Google Search Console w perspektywie 30–90 dni od wdrożenia.

Uzgodniono, że w razie stwierdzenia istotnych, trwałych spadków widoczności lub ruchu organicznego, których nie można wyjaśnić czynnikami zewnętrznymi, podjęte zostaną działania korygujące (rewizja mapowania przekierowań, ponowne zgłoszenie mapy strony, kontakt z odpowiednimi narzędziami Google Search Console).

---

## Rozdział 5. Zakres zmian niewymagających migracji SEO

Do zakresu zmian, które **mogą zostać wdrożone niezależnie od migracji adresów URL** i nie niosą istotnego ryzyka dla widoczności organicznej, należą między innymi:

- **Poprawa wyświetlania parametrów produktu** — punktowa korekta prezentacji udźwigu na karcie produktu (rozdział 1).
- **Ujednolicenie komponentów prezentujących parametry produktu** — wydzielenie wspólnego komponentu paska kluczowych parametrów, eliminujące ryzyko analogicznych rozbieżności w przyszłości.
- **Wdrożenie generatora opisów alternatywnych (ALT)** — automatyczne opisy budowane z danych produktu, z możliwością ręcznej nadpiski przez administratora (rozdział 2).
- **Poprawa danych Schema.org** — utrzymywanie i doprecyzowanie danych strukturalnych `Product`, `BreadcrumbList`, `FAQPage` w zakresie zgodnym z aktualną prezentacją serwisu.
- **Poprawa metadanych obrazów** — właściwe atrybuty opisowe, wymiary, formaty i zachowanie zgodności ze zdjęciami produktowymi.

Podkreśla się, że **wszystkie powyższe zmiany mogą zostać wdrożone niezależnie od migracji adresów URL** i powinny zostać zrealizowane w pierwszej kolejności. Dzięki temu wartość biznesowa audytu zostanie dostarczona bez konieczności oczekiwania na wynik analizy danych SEO wymaganej przed migracją adresów.

---

## Rozdział 6. Tabela priorytetów

Uzgodniona kolejność wdrożenia, wynikająca z ustaleń zawartych w rozdziałach 1–5:

| Priorytet | Zadanie | Ryzyko | Wpływ |
|-----------|---------|--------|-------|
| P0 | Naprawa błędu udźwigu | Bardzo niskie | Bardzo wysoki |
| P1 | Wdrożenie generatora ALT | Niskie | Wysoki |
| P2 | Nawigacja okruszkowa (Breadcrumbs) + Schema.org | Niskie | Średni |
| P3 | Analiza słów kluczowych | Brak | Bardzo wysoki |
| P4 | Migracja URL | Średnie | Wysoki |

Zadanie P3 („Analiza słów kluczowych") stanowi warunek wstępny dla zadania P4 („Migracja URL") i obejmuje analizę danych, o której mowa w rozdziale 3.3 (Google Search Console, Google Keyword Planner, Senuto, Ahrefs). Zadanie P4 zostanie podjęte wyłącznie po przedstawieniu wyników analizy i podjęciu decyzji o docelowym brzmieniu adresów.

---

## Rozdział 7. Wniosek końcowy

W wyniku analizy raportu audytowego stwierdza się, co następuje:

1. **Audyt prawidłowo identyfikuje główne problemy techniczne** serwisu w zakresie prezentacji danych produktowych, dostępności zdjęć oraz spójności adresacji zasobów.
2. **Rekomendacja dotycząca opisów alternatywnych wymaga doprecyzowania strategii** — jako rozwiązanie podstawowe przyjmuje się generator szablonowy z możliwością ręcznej edycji, z zastrzeżeniem możliwości wykorzystania modelu AI dla wybranych przypadków w przyszłości.
3. **Migracja adresów URL powinna zostać poprzedzona analizą danych SEO** opartą na źródłach wskazanych w rozdziale 3.3, a decyzja o docelowym brzmieniu adresów podjęta na podstawie tej analizy.
4. **Pozostałe rekomendacje audytu uznano za zasadne** i przyjęto do wdrożenia w zakresie opisanym w rozdziałach 1, 2 i 5.
5. **Kolejność wdrożenia**, przyjęta w rozdziale 6, została zaprojektowana w sposób minimalizujący ryzyko dla widoczności organicznej serwisu — poprzez wcześniejsze zrealizowanie zmian niskoryzykowych i wyodrębnienie migracji adresów jako osobnego etapu poprzedzonego analizą danych.

Niniejszy protokół stanowi podstawę do przygotowania szczegółowego harmonogramu prac wdrożeniowych.

---

## Załącznik. Lista zmian względem raportu audytowego (kontrola jakości)

Poniższa lista dokumentuje zmiany redakcyjne i merytoryczne wprowadzone w niniejszym protokole względem pierwotnego raportu audytowego:

1. **Doprecyzowanie strategii ALT (rozdz. 2)** — zapis „Rekomendacja audytora: Generowanie opisów ALT przy pomocy AI" zastąpiony opisem rekomendacji hybrydowej (Opcja D): generator szablonowy z danych produktu jako podstawa, ręczna edycja przez administratora, wykorzystanie AI wyłącznie jako opcja dla wybranych przypadków.
2. **Złagodzenie kategorycznych sformułowań (cały dokument)** — zwroty typu „Rekomendacja audytora (AI) odrzucona" zastąpione sformułowaniami w konwencji uzgodnień kierunkowych, np. „Po analizie uznano, że dla obecnej skali katalogu bardziej odpowiednim rozwiązaniem będzie generator szablonowy z możliwością ręcznej edycji, natomiast wykorzystanie AI pozostaje opcją dla wybranych przypadków".
3. **Rozdział o URL (rozdz. 3)** — zapis „Kierunek `/paleciaki` zatwierdzony warunkowo" zastąpiony sformułowaniem, że `/paleciaki` obecnie wydaje się najbardziej obiecującym kierunkiem, a ostateczna decyzja zostanie podjęta na podstawie analizy danych z Google Search Console, Google Keyword Planner, Senuto oraz Ahrefs.
4. **Dodano nowy rozdział „Ocena ryzyka migracji URL" (rozdz. 4)** — po rozdziale dotyczącym migracji adresów, zawierający zapisy o wyodrębnieniu migracji jako osobnego etapu, kolejności względem zmian niskoryzykowych oraz zakresie monitoringu (301, GSC, indeksacja, ruch organiczny).
5. **Ujednolicenie terminologii „Breadcrumbs" (cały dokument)** — wszystkie wystąpienia terminu „Breadcrumby" zastąpione konsekwentnym zapisem „Nawigacja okruszkowa (Breadcrumbs)".
6. **Usunięcie punktu o refaktoryzacji nazw komponentów** — pominięto zapisy typu `ProductPage → PalletTruckPage`, `ProductsList → PalletTruckList`, jako niezwiązane z SEO, indeksacją ani doświadczeniem użytkownika, a przez to nienależące do przedmiotu protokołu.
7. **Dodano nowy rozdział „Zakres zmian niewymagających migracji SEO" (rozdz. 5)** — obejmujący poprawę prezentacji parametrów, ujednolicenie komponentów, generator ALT, Schema.org i metadane obrazów, z podkreśleniem możliwości wdrożenia niezależnie od migracji adresów.
8. **Dodano tabelę priorytetów (rozdz. 6)** — w układzie P0–P4 zgodnym z uzgodnionym zakresem, ryzykiem i wpływem.
9. **Dodano wniosek końcowy (rozdz. 7)** — sformułowany w konwencji formalnego podsumowania protokołu, bez języka marketingowego.
10. **Kontrola jakości** — przeprowadzono weryfikację spójności numeracji rozdziałów, terminologii („Nawigacja okruszkowa (Breadcrumbs)", „generator szablonowy ALT", „migracja URL"), spójności decyzji między rozdziałami (rozdz. 2 vs załącznik, rozdz. 3 vs rozdz. 4, rozdz. 5 vs tabela priorytetów) oraz zgodności z dobrymi praktykami SEO (przekierowania 301, tagi kanoniczne, mapa strony, Google Search Console). Nie stwierdzono zapisów sprzecznych.

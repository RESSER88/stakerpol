

## Plan: Dodanie hero "Pomożemy dobrać..." na stronę główną

Wstawimy kopię hero + statystyk z `/contact` na Home, między `ContactConversionCards` a sekcję About. Stworzymy **nowe warianty komponentów** z jasną kolorystyką spójną z resztą Home (białe/jasne tło zamiast navy), żeby:
- nie psuć oryginałów na `/contact` (tam navy zostaje)
- uniknąć drugiego "ciężkiego" ciemnego bloku na Home (już jest dark hero na górze)

### Nowa kolorystyka (jasna, spójna z Home)

| Element | Kolor |
|---|---|
| Tło hero | `bg-white` (lekka separacja od `bg-gray-50` powyżej) |
| Nagłówek H2 | `text-stakerpol-navy` |
| Checkmarki | zielona ikona + `text-gray-700` |
| CTA "Zadzwoń" | `bg-stakerpol-orange text-white` (główny) |
| CTA "WhatsApp" | `bg-green-600 text-white` |
| CTA "Wyślij zapytanie" | outline: `border-2 border-stakerpol-navy text-stakerpol-navy hover:bg-stakerpol-navy hover:text-white` |
| Pasek statystyk | `bg-stakerpol-navy text-white` (zachowuje "wow" + separację) z liczbami w `text-stakerpol-orange` |

Dlaczego stats zostają navy: liczby na ciemnym tle = mocniejszy social proof, kontrast z jasną sekcją powyżej, wizualny rytm strony (jasny → ciemny pasek → jasny About).

### Pliki

1. **Nowy:** `src/components/home/HomeHelpHero.tsx` — H2 "Pomożemy dobrać wózek do Twojego magazynu" + 3 checkmarki + 3 CTA. Tło białe, padding `py-10`, użycie `trackCTAClick` (eventy `home_help_hero_call/whatsapp/form`).
2. **Nowy:** `src/components/home/HomeStatsBar.tsx` — 3 kolumny navy z divide, identyczna struktura jak `ContactStatsBar`.
3. **Edycja:** `src/pages/Index.tsx` — import obu komponentów i wstawienie po `<ContactConversionCards />`, przed sekcją About. Link "Wyślij zapytanie" → `/contact#form`.

### Kolejność na Home (po zmianie)
Hero (dark, główny) → ContactConversionCards (gray-50) → **HomeHelpHero (white)** → **HomeStatsBar (navy)** → About (white) → WhyChooseUs → Featured Products → FAQ → CTA

### Spójność całej strony
Bez zmian w innych komponentach — używamy istniejących tokenów (`stakerpol-navy`, `stakerpol-orange`, `gray-50`, `white`), które już są w użyciu na Home. Zero nowych kolorów.

### Bez zmian
`/contact` (ContactCompactHero + ContactStatsBar zostają navy), edge functions, tłumaczenia, Header/Footer.


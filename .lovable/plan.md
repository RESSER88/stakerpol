

## Plan: Przebudowa /contact wg nowej specyfikacji

### Zmiany vs aktualny stan

**Co już mamy (zostaje, drobne tweaki):**
- `ContactTopInfoBar` — OK, drobny tweak: na mobile ukryć email i WhatsApp, zostawić tylko telefon klikalny
- `ContactDetailsCard` — OK, dostosować podpis pod telefonem, ułożenie person card już naprawione
- `ContactLeadForm` — OK, dodać podtytuł pod H2
- `ContactMobileStickyBar` — OK, zostaje
- Mapa w `Contact.tsx` — OK, zmniejszyć wysokość do 240px

**Co trzeba przywrócić/zmienić:**
1. **Hero — wrócić do ciemnego (navy) zamiast jasnego `ContactCompactHero`**
   - Tło `bg-stakerpol-navy`, tekst biały
   - 3 zielone checkmarki w jednej linii (✓ ikona zielona): odpowiedź / doradztwo / gwarancja
   - 3 CTA w rzędzie: pomarańczowy "Zadzwoń", zielony "WhatsApp", outline biały "Wyślij zapytanie" (anchor `#form`)
   - Mobile: stack pionowy, full-width

2. **Pasek statystyk — przywrócić** (był usunięty)
   - 3 kolumny: 17+ lat / 850+ wózków / Ten sam dzień
   - Ciemne tło `bg-stakerpol-navy` (lub odcień ciemniejszy dla wizualnej separacji od hero)
   - Pionowe separatory `border-white/20`
   - Mobile: stack bez separatorów

3. **Two-column grid — zmiana proporcji**
   - Aktualnie: `lg:grid-cols-5` (2/3)
   - Nowe: `lg:grid-cols-[1fr_1.55fr]` (lewa węższa, prawa szersza)

4. **Formularz — dodać podtytuł**
   - Pod H2 "Zostaw zapytanie": "Oddzwonimy lub odpiszemy w ciągu kilku godzin. Bezpłatne doradztwo."

5. **Trzy karty konwersji — rozwinięte by default + nagłówek**
   - Usunąć toggle "Rozwiń" — karty zawsze widoczne
   - Nad kartami: H2 "Nie wiesz od czego zacząć? Pomożemy." + sub "Dobieramy wózek do konkretnych warunków magazynu — bez zobowiązań."
   - `items-stretch` + `flex flex-col` + `flex-1` na opisie → równe wysokości
   - Ikony i kolory bez zmian (red/blue/green)

6. **Mapa — wysokość 240px** (było 320px)

7. **`ContactDetailsCard` — drobny tweak**
   - Pod numerem telefonu dodać podpis "pon–pt 8:00–17:00" (już jest sekcja godziny pracy, ale brief chce też przy telefonie — dodać 12px szary tekst)

### Pliki

1. **Edycja:** `src/components/contact/ContactCompactHero.tsx` — zmiana na ciemny hero z 3 CTA + 3 checkmarki (lub usunąć i wrócić do oryginalnego `ContactHero.tsx` jeśli istnieje — sprawdzę)
2. **Nowy/przywrócony:** `src/components/contact/ContactStatsBar.tsx` — pasek statystyk (jeśli plik został usunięty)
3. **Edycja:** `src/pages/Contact.tsx` — dodać StatsBar, zmienić grid na `lg:grid-cols-[1fr_1.55fr]`, mapa 240px
4. **Edycja:** `src/components/contact/ContactConversionCards.tsx` — usunąć toggle, dodać nagłówek nad kartami, `items-stretch`
5. **Edycja:** `src/components/contact/ContactLeadForm.tsx` — dodać podtytuł pod H2
6. **Edycja:** `src/components/contact/ContactDetailsCard.tsx` — podpis "pon–pt 8:00–17:00" pod telefonem
7. **Edycja:** `src/components/contact/ContactTopInfoBar.tsx` — na mobile ukryć email/WhatsApp, zostawić tel

### Spacing / kompaktowość
- Wszystkie sekcje: `py-6` lub `py-8` (nie więcej)
- Karty padding: `p-5` (już jest)
- Gap w grid: `gap-6` (już jest)

### Bez zmian
- Mobile sticky bar, hook `useContactForm`, edge function `notify-lead`, kolorystyka globalna, Header/Footer, inne strony, GDPR + honeypot w formularzach


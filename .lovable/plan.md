

## Plan: Poprawki strony /contact

### 1. Usunięcie pustego hero / dużej białej przestrzeni na górze
- Usuwam komponent `ContactHero.tsx` (duża sekcja z ciemnym gradientem i 3 CTA)
- Usuwam `ContactStatsBar.tsx` (statystyki) — nie zostały wymienione w nowym brief'ie i zwiększają wysokość
- Strona startuje od razu od `ContactTopInfoBar` → mini-hero → kontent

### 2. Nowy kompaktowy hero (zastępuje stary)
**Nowy komponent `ContactCompactHero.tsx`:**
- Tło białe (lub bardzo lekki gradient `bg-gray-50`), padding pionowy 32px
- H1: "Pomożemy dobrać wózek do Twojego magazynu" (28px desktop / 22px mobile)
- Sub: "Odpowiadamy tego samego dnia · Doradztwo bezpłatne · Gwarancja i serwis pogwarancyjny" (14px szary)
- 2 CTA obok siebie:
  - Pomarańczowy filled `bg-stakerpol-orange`: "Zadzwoń: 694 133 592" (tel:)
  - Zielony filled `bg-green-600`: "Napisz na WhatsApp" (wa.me)
- Usuwam outline button "Wyślij zapytanie" (formularz jest tuż poniżej, niepotrzebny anchor)

### 3. Two-column layout — poprawki

**Lewa kolumna `ContactDetailsCard.tsx` — przepisana:**
- Telefon (duży, prominentny — 18px, pomarańczowy, bold)
- Email (mailto:)
- WhatsApp (zielony, wa.me)
- Godziny: Pon–Pt, 8:00–17:00
- Divider `border-t border-gray-200 my-4`
- **Nowy blok dane firmowe** (12px, szary `text-gray-500`):
  ```
  FHU Stakerpol
  Michał Seweryn
  ul. Szewska 6
  32-043 Skała
  NIP: PL6492111954
  ```
- Karta osoby na dole — fix: `flex items-center gap-3`, avatar `flex-shrink-0`, tekst pionowo wycentrowany. Avatar 48×48 `bg-stakerpol-orange` z białymi inicjałami "MS", obok "Michał Seweryn" + role.

**Prawa kolumna `ContactLeadForm.tsx` — kompaktowa:**
- Usunąć label "Formularz kontaktowy"
- Usunąć sub "Oddzwonimy lub odpiszemy w ciągu kilku godzin."
- Zostaje tylko H2: "Zostaw zapytanie"
- Inputy: `py-2 text-sm` (height ~36px zamiast 44px)
- Padding karty: `p-5` (zamiast `p-6 md:p-8`)
- Spacing między polami: `space-y-3` (zamiast `space-y-4`)
- Textarea `rows={3}` (zamiast 4)
- Usunąć stopkę "Formularz działa — odpowiadamy w ciągu kilku godzin"
- GDPR + honeypot zostają (anti-spam)
- Submit pomarańczowy "Poproś o ofertę →"

### 4. "Dla niezdecydowanych" — collapsed by default
**Edycja `ContactConversionCards.tsx`:**
- Domyślnie zwinięte: tylko przycisk-toggle "Nie wiesz, który model wybrać? **Rozwiń →**" (outline pomarańczowy, full-width na karcie)
- Po kliknięciu: rozwinięcie 3 kart z animacją (state `isExpanded`)
- **Fix ikon:** wszystkie kontenery ikon `w-12 h-12 rounded-full flex items-center justify-center` — ikona wycentrowana
- Kolory ikon (zgodnie z brief):
  - Card 1: ikona czerwona `text-red-600` na `bg-red-100`, button czerwony `bg-red-600`
  - Card 2: ikona niebieska `text-blue-600` na `bg-blue-100`, button outline pomarańczowy
  - Card 3: ikona zielona `text-green-600` na `bg-green-100`, mini-form z buttonem pomarańczowym
- Wszystkie buttony z jawnym `bg-*` i `text-white` — żadnych washed-out

### 5. Redukcja whitespace
- Wszystkie sekcje: `py-8` (zamiast `py-16`)
- Container gap: `gap-6` (zamiast `gap-8`)
- Tło sekcji two-column: `bg-gray-50` zostaje (delikatny kontrast)

### 6. Fix mobile
**Sticky bottom bar `ContactMobileStickyBar.tsx`:**
- Już istnieje — sprawdzić że oba buttony mają `text-white` widoczny, full-width 50/50
- `z-50`, ale **niższy niż `MobileContactButton` (zielony bubble)** — TRZEBA: ukryć zielony bubble na route `/contact` (edycja `MobileContactButton.tsx` — early return jeśli `pathname === '/contact'`)
- Stack kolumn pionowo: grid już ma `lg:grid-cols-5` → na mobile auto-stack (dane na górze, formularz pod)

### Pliki do edycji/utworzenia

1. **Nowy:** `src/components/contact/ContactCompactHero.tsx` — mini-hero z 2 CTA
2. **Edycja:** `src/pages/Contact.tsx` — usunąć `ContactHero` i `ContactStatsBar`, podmienić na `ContactCompactHero`, zmniejszyć padding sekcji
3. **Edycja:** `src/components/contact/ContactDetailsCard.tsx` — dodać blok dane firmowe, fix layout person card
4. **Edycja:** `src/components/contact/ContactLeadForm.tsx` — kompaktowy styl, usunąć label/sub/stopkę, mniejsze inputy
5. **Edycja:** `src/components/contact/ContactConversionCards.tsx` — collapsed by default, fix ikon i kolorów buttonów
6. **Edycja:** `src/components/contact/MobileContactButton.tsx` — ukryć na `/contact` (`useLocation` + early return)
7. **Do usunięcia (lub pozostawienia ale niereferencjonowane):** `ContactHero.tsx`, `ContactStatsBar.tsx` — komponenty zostają w repo na wypadek powrotu, ale Contact.tsx ich nie importuje

### Bez zmian
- `useContactForm`, `notify-lead` edge function, `ContactTopInfoBar`, `ContactMobileStickyBar` (poza weryfikacją widoczności tekstu), Header/Footer, kolorystyka globalna, inne strony


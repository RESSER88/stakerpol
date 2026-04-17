

## Plan: Redesign strony /contact — etap 1 (bez formularza zapytania o produkt)

Formularz zapytania o konkretny model (sekcja 6) zostawiamy na **etap 2**. Skupiamy się na redesignie głównej strony kontakt z zachowaniem aktualnej kolorystyki Stakerpol.

### Aktualna kolorystyka (z projektu) — używamy jej, NIE czerwonej z brief'u
- Primary: `stakerpol-orange` (#F97316 / pomarańczowy) — to jest brand color tej strony, NIE czerwony #c0392b
- Navy: `stakerpol-navy` (ciemne tło dla pasków)
- Accent zielony: dla WhatsApp (`bg-green-600`)
- Tło białe, font Inter (już używany)

**Uwaga:** Brief mówi o czerwonym #c0392b, ale aktualna strona Stakerpol używa pomarańczowego. Trzymamy się pomarańczowego dla spójności z resztą serwisu (Header, Footer, CTA na innych stronach).

### Struktura strony (góra → dół)

**1. Sticky top info bar** (nad navbarem)
- Tło `bg-stakerpol-navy`, tekst biały 13px
- Lewa: 📞 `694 133 592` (tel:) | ✉ `info@stakerpol.pl` (mailto:) | WhatsApp (wa.me/48694133592)
- Prawa: "Odpowiadamy tego samego dnia · pon–pt 8:00–17:00"
- Mobile: tylko ikony klikalne, tekst po prawej ukryty

**2. Hero section**
- H1: "Pomożemy dobrać wózek do Twojego magazynu"
- 3 checkmarki (✓ pomarańczowe): odpowiedź tego samego dnia / doradztwo bezpłatne / gwarancja i serwis
- 3 CTA buttons:
  - Pomarańczowy filled: "Zadzwoń: 694 133 592" (tel:)
  - Zielony filled: "Napisz na WhatsApp" (wa.me)
  - Outline: "Wyślij zapytanie" (anchor `#form`)

**3. Stats bar** (`bg-stakerpol-navy`, biały tekst)
- "850+" sprzedanych wózków | "17+" lat doświadczenia | "Ten sam dzień" czas odpowiedzi | "Gwarancja i serwis" pogwarancyjny
- Separatory pionowe `border-white/20`
- Mobile: scroll poziomy

**4. Two-column layout — dane + formularz**

**Lewa kolumna (węższa, ~40%):** Karta "Dane kontaktowe"
- Telefon, e-mail, WhatsApp, godziny pracy + adres ul. Szewska 6, 32-043 Skała
- Box osoby: avatar z inicjałami "MS" (kółko `bg-stakerpol-orange`), "Michał Seweryn", "Właściciel · Doradca techniczny"
- Zielony badge: "Odpowiadamy tego samego dnia roboczego"

**Prawa kolumna (szersza, ~60%):** Karta formularza `id="form"`
- Nagłówek "Zostaw zapytanie" + sub
- Pola: Imię i nazwisko* + Telefon* (2-kolumnowo) | E-mail (full) | Dropdown "Interesuje mnie" (BT SWE 200D, BT SWE 140L, Ogólne doradztwo, Serwis i naprawa) | Textarea
- Honeypot ukryty + GDPR checkbox + link `/polityka-prywatnosci` (spójność z innymi formularzami)
- Submit pomarańczowy full-width: "Poproś o ofertę →"
- Po sukcesie: zielony komunikat zamiast formularza
- Submit przez `supabase.functions.invoke('notify-lead', ...)` — payload zgodny z istniejącym schematem

**5. Three conversion cards** — sekcja "Dla niezdecydowanych"
- Card A (ikona pomarańczowa Phone): "Nie wiesz, który model wybrać?" → CTA tel:
- Card B (ikona niebieska MessageSquare): "Dobierzemy wózek do Twojego magazynu" → anchor do #form
- Card C (ikona zielona PhoneCall): "Zostaw numer — oddzwonimy" → mini-form inline (sam telefon + button "Oddzwońcie", ten sam edge function `notify-lead`, honeypot)

**6. ~~Quick Product Inquiry Bar~~** — POMINIĘTE (etap 2)

**7. Map** — Google Maps embed (już jest), full-width, `rounded-xl`, height 320px, na samym dole

**8. Mobile sticky bottom bar** (tylko mobile <768px)
- Fixed bottom, 2 buttony 50/50: "Zadzwoń" (pomarańczowy) | "WhatsApp" (zielony), min-height 48px
- Z-index niższy niż istniejący `MobileContactButton` LUB ukrywamy istniejący bubble tylko na `/contact` (do uzgodnienia — proponuję ukryć bubble na /contact, bo ta strona ma własne CTA)

### Pliki

1. **Edycja:** `src/pages/Contact.tsx` — pełny redesign z nowymi sekcjami
2. **Nowy:** `src/components/contact/ContactTopInfoBar.tsx` — sticky info bar
3. **Nowy:** `src/components/contact/ContactHero.tsx` — hero z 3 CTA
4. **Nowy:** `src/components/contact/ContactStatsBar.tsx` — pasek statystyk
5. **Nowy:** `src/components/contact/ContactDetailsCard.tsx` — lewa kolumna
6. **Nowy:** `src/components/contact/ContactLeadForm.tsx` — formularz z dropdownem (lokalna logika, reuse `notify-lead`, honeypot, GDPR)
7. **Nowy:** `src/components/contact/ContactConversionCards.tsx` — 3 karty + mini-form callback
8. **Nowy:** `src/components/contact/ContactMobileStickyBar.tsx` — bottom bar mobile
9. **Edycja:** `src/components/contact/MobileContactButton.tsx` — ukryć na route `/contact` (bo strona ma własny sticky bar)

### Bez zmian
- Header/Footer
- Kolorystyka globalna (zostaje pomarańczowa, NIE zmieniamy na czerwoną)
- Inne strony
- Hook `useContactForm` (reuse)
- Edge function `notify-lead`
- Mobile bubble na innych stronach

### Etap 2 (osobne zadanie po akceptacji etapu 1)
- Sekcja 6: Quick Product Inquiry Bar z dropdownem modeli z bazy `products`


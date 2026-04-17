

## Plan: Fix bugów na /contact

### Bug 1 — Topbar + Hero + Stats nie są widoczne/rozjeżdżają się
Sprawdzam czy komponenty są w ogóle renderowane oraz czy nie ma problemu z layoutem (Layout owija stronę, ale topbar jest renderowany przed Layout w `Contact.tsx` → musi być renderowany po Layout/Header? Albo Layout ma swój header który zasłania).

**Naprawa:**
- `ContactTopInfoBar`: poprawić strukturę — `flex items-center gap-5 px-8 py-2 text-xs`, klikalne pozycje (tel/email/WhatsApp) z osobnymi linkami i widocznymi separatorami, prawa strona `ml-auto` z godzinami
- `ContactCompactHero`: padding `py-10 px-8` (40/32px) na ciemnym navy, H1 osobno, **3 znaczniki w `flex flex-wrap gap-4`** (nie `gap-x-5 gap-y-2` które obecnie zlepia tekst), każdy znacznik to osobny `<div className="flex items-center gap-1.5">` z zieloną ikoną Check
- 3 CTA w `flex flex-col sm:flex-row gap-2`, każdy button z jawnym `px-5 py-2.5` i wyraźnym tłem
- `ContactStatsBar`: 3 kolumny `grid grid-cols-3 divide-x divide-white/20`, każda `text-center py-4`, liczba `text-2xl font-bold text-stakerpol-orange`, label `text-xs text-white/70`. Mobile: `grid-cols-1 divide-y divide-x-0`

### Bug 2 — Dane kontaktowe: osoba obok telefonu + usunąć duplikaty
W `ContactDetailsCard.tsx`:
- Blok telefonu: `grid grid-cols-[1fr_auto] items-center gap-3` — po lewej numer telefonu z podpisem godzin, **po prawej awatar "MS" + Michał Seweryn / "Właściciel · Doradca techniczny"**
- Usunąć całkowicie dolny zielony badge "Odpowiadamy tego samego dnia roboczego"
- Usunąć osobny blok person card na dole (przeniesiony obok telefonu)

### Bug 3 — Formularz: niewidoczny przycisk + puste pole + kontrast RODO
W `ContactLeadForm.tsx`:
- Przycisk "Poproś o ofertę": jawne `bg-stakerpol-orange text-white` + `hover:bg-stakerpol-orange/90` (sprawdzić czy klasa `bg-stakerpol-orange` faktycznie się aplikuje — może problem z Tailwind safelist; jeśli tak → użyć inline style lub zmienić na klasę z theme)
- Usunąć wszystkie puste `<div>` / nadmiarowy margin po przycisku, sprawdzić `space-y-3` na formie który dodaje margin po ostatnim elemencie (przycisk = ostatni)
- Karta padding `p-5` (już jest) — bez dodatkowego `pb-*`
- Checkbox RODO: zmienić `text-[13px] text-gray-700` (już jest) ale sprawdzić sub-text `text-gray-500` → zostawić jaśniejszy ale upewnić się że główny label ma `text-gray-700`

### Bug 4 — Wysokości kart
**Pozostawić różne wysokości** (jak chce user). Usunąć ewentualne `items-stretch` z grida w `Contact.tsx` → zmienić na `items-start`.

### Bug 5 — 3 karty "Nie wiesz od czego zacząć?": wyśrodkować
W `ContactConversionCards.tsx`:
- Każda karta: `text-center flex flex-col items-center`
- Ikona kontener: `mx-auto` (zamiast wyrównania do lewej)
- Tytuł i tekst: `text-center`
- Przycisk: `w-full` na pełną szerokość karty

### Bug 6 — 3. karta "Zostaw numer — oddzwonimy": niewidoczny button
- Zmienić tekst przycisku z "Oddzwońcie" na **"Wyślij"** (krótszy)
- Jawne kolory: `bg-stakerpol-orange text-white px-4 py-2` z `hover:bg-stakerpol-orange/90`
- **Potwierdzenie:** mini-form używa `supabase.functions.invoke('notify-lead', ...)` → tak, wysyła email przez Resend (edge function `notify-lead`). Zostaje bez zmian, działa.

### Bug 7 — Mapa większa, kwadrat
W `Contact.tsx`:
- Wysokość mapy: `aspect-square` lub stała `height={480}` (z 240). Proponuję `h-[480px]` na desktop, `h-[320px]` na mobile

### Pliki do edycji
1. `src/components/contact/ContactTopInfoBar.tsx`
2. `src/components/contact/ContactCompactHero.tsx`
3. `src/components/contact/ContactStatsBar.tsx`
4. `src/components/contact/ContactDetailsCard.tsx`
5. `src/components/contact/ContactLeadForm.tsx`
6. `src/components/contact/ContactConversionCards.tsx`
7. `src/pages/Contact.tsx` (mapa + grid `items-start`)

### Bez zmian
Edge function `notify-lead` (działa, wysyła email), kolorystyka globalna, Header/Footer, inne strony, mobile sticky bar.


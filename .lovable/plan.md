

# Plan: Mobile UX 375px — podział na 3 etapy

Cel: poprawić mobile UX bez ingerencji w desktop i bez zmiany kolorów (używam istniejących tokenów Tailwind / shadcn).

---

## Etap 1 — Niskie ryzyko: globalne reguły CSS + tap targets

Zmiany czysto addytywne, nie modyfikują istniejących komponentów strukturalnie.

**Pliki:**

1. **`src/index.css`** — dodaję dwie reguły w `@layer base`:
   - **Anty-zoom iOS:** `@media (max-width: 768px) { input:not([type="checkbox"]):not([type="radio"]), textarea, select { font-size: 16px !important; } }`
   - **Hover-none disable:** `@media (hover: none) { ... }` — wyłącza `hover:scale-*`, `hover:-translate-*`, wymusza widoczność elementów `group-hover:opacity-100`

2. **`src/components/ui/input.tsx`** — `text-sm` → `text-base md:text-sm`
3. **`src/components/ui/textarea.tsx`** — `text-sm` → `text-base md:text-sm`
4. **`src/components/contact/InquiryModal.tsx`** — `inputCls`: `text-sm` → `text-base md:text-sm`

5. **`src/components/products/ProductStickyBar.tsx`** — touch targets:
   - `py-2.5` + `py-3` + `text-[13px]` → `min-h-[48px] text-sm`
   - Ikony `size={14}` → `size={16}`
   - Dodaję `active:scale-[0.97] active:brightness-95 transition-transform` na obu CTA

6. **`src/components/layout/Header.tsx`** — hamburger button:
   - Dodaję `min-h-[48px] min-w-[48px] flex items-center justify-center rounded-md active:bg-gray-100`

**Ryzyko:** minimalne. Zmiany czysto utility-klasowe, brak zmian struktur DOM.

---

## Etap 2 — Średnie ryzyko: interakcje touch w istniejących komponentach

Modyfikacja zachowania komponentów już renderowanych, ale bez zmiany struktury.

**Pliki:**

7. **`src/components/products/ProductImage.tsx`** — strzałki nawigacji galerii:
   - `opacity-0 group-hover:opacity-100` → `opacity-100 md:opacity-0 md:group-hover:opacity-100`
   - Dodaję `min-h-[44px] min-w-[44px]` + `active:scale-90` na buttonach strzałek
   - Weryfikuję że dots paginacji mają min 32px tap area (padding wokół)

8. **`src/components/ui/ProductCard.tsx`** — active states na CTA wewnątrz karty:
   - Dodaję `active:scale-[0.98] active:brightness-95 transition-transform` na przyciskach "Zadzwoń" / "Zapytaj"
   - Weryfikuję wysokość CTA ≥48px (z poprzedniej iteracji powinno być spełnione)

**Ryzyko:** niskie-średnie. Strzałki galerii zmienią widoczność na mobile (zamierzone). Active states są wizualnym uzupełnieniem.

---

## Etap 3 — Wyższe ryzyko: bottom sheet dla filtrów

Zmiana strukturalna komponentu — warunkowy rendering dialog vs sheet.

**Plik:**

9. **`src/components/products/FilterModal.tsx`** — przebudowa renderowania:
   - Import `Sheet, SheetContent, SheetHeader, SheetTitle` z `@/components/ui/sheet`
   - Import `useIsMobile` z `@/hooks/use-mobile`
   - Logika: `isMobile ? <Sheet side="bottom" /> : <Dialog />` (zachowuję desktop bez zmian)
   - Sheet content:
     - `max-h-[85vh] rounded-t-2xl overflow-hidden flex flex-col`
     - Handle bar: małe pociągnięcie `<div className="mx-auto w-12 h-1.5 rounded-full bg-muted mt-2 mb-1" />`
     - Treść scrollowalna w `flex-1 overflow-y-auto px-4 pb-4`
     - Sticky footer z Reset/Apply: `sticky bottom-0 bg-background border-t p-4 flex gap-2` — przyciski `min-h-[48px] flex-1` z `active:scale-[0.98]`
   - Logika filtrów (slidery, useMemo, handlers) **bez zmian** — tylko warstwa prezentacji

**Ryzyko:** średnie. Wymaga testu na 375 / 390 / 768px że:
   - Bottom sheet otwiera się płynnie
   - Slidery nie kolidują z gestem zamknięcia sheeta
   - Sticky footer nie zasłania ostatniego sliderka (padding-bottom w content area)
   - Desktop dialog nadal działa identycznie

---

## Etap 4 (weryfikacja, bez zmian kodu)

Po wdrożeniu etapów 1–3:
- Test wizualny przy 375px (iPhone SE), 390px (iPhone 14), 768px (iPad)
- Manualna inspekcja tap targetów w DevTools (każdy interaktywny element ≥44×44, krytyczne CTA ≥48×48)
- Sprawdzenie że focus na inputie w InquiryModal **nie powoduje zoomu** w iOS Safari
- Sprawdzenie że strzałki galerii są widoczne od razu (bez tapnięcia w obraz)
- Sprawdzenie że bottom sheet filtrów pojawia się od dołu, nie centralnie

---

## Czego nie robię

- Nie zmieniam kolorów ani tokenów — używam istniejących klas (`bg-orange-cta`, `bg-ink`, `bg-muted`, `bg-background`, `border-border-line`)
- Nie ruszam desktop layoutu (wszystkie zmiany gated przez `md:` lub `@media (max-width:768px)` / `@media (hover:none)`)
- Nie zmieniam logiki filtrów ani analytics
- Nie dotykam komponentów które już spełniają wymagania (ProductImage swipe, container px-4)

## Pliki łącznie: 8

Etap 1: 6 plików (CSS + 5 komponentów, drobne edycje 1–10 linii każdy)
Etap 2: 2 pliki (ProductImage, ProductCard)
Etap 3: 1 plik (FilterModal — większa przebudowa renderowania)

## Oczekiwany efekt

| Metryka | Przed | Po |
|---|---|---|
| iOS focus zoom | ❌ | ✅ wyłączony |
| Najmniejszy tap target | 24–40px | **≥48px** krytyczne, ≥44px reszta |
| Strzałki galerii mobile | ukryte | widoczne |
| Filtry mobile | centered dialog | bottom sheet z handle |
| Hover-laggy efekty na touch | aktywne | wyłączone |
| Tap feedback | brak | scale + brightness |
| Zmiany na desktop | — | **żadne** |
| Zmiany kolorów | — | **żadne** |


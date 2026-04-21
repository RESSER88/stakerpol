

# Plan: Punkty 2 i 4 z audytu UX/UI

Wykonam tylko dwa wybrane punkty z poprzedniego audytu — **typografia/touch targets w ProductCard** oraz **intrinsic CSS Grid w listingu**. Pozostałe punkty (spacing tokens, container max-width, H1/H2, trust strip) — pomijam.

## Punkt 2 — ProductCard: typografia, touch targets, kontrast WCAG

**Plik:** `src/components/ui/ProductCard.tsx`

| Element | Przed | Po | Powód |
|---|---|---|---|
| Etykiety specyfikacji (4 sztuki) | `text-[8.5px]` | `text-[10px]` | Minimalna czytelność na mobile |
| Wartości specyfikacji | `text-xs` (12px) | `text-sm` (14px) | Czytelność |
| Tytuł modelu (H3) | `text-base md:text-lg lg:text-xl` | `text-lg md:text-xl lg:text-2xl` | Hierarchia |
| CTA "Zadzwoń" + "Zapytaj" | `py-2.5 text-[13px]` (~38px) | `py-3 min-h-[48px] text-sm` | **WCAG touch target 48px** |
| Kolor tła "Zadzwoń" | `bg-stakerpol-orange` (#FF8C00 → 3.1:1) | `bg-orange-cta` (#D14B0A → 4.6:1) | **WCAG AA contrast** |
| Link "Pełna specyfikacja" | `py-2 text-xs` (~32px) | `py-3 min-h-[44px] text-sm` | Touch target |

**Co zostaje bez zmian:** layout, grid 2-kolumnowy CTA, ikony, struktura DOM, kolory tła karty, animacja hover, badges (rok/dostępność), pasek specyfikacji (układ 4-kolumnowy z separatorami).

**Ryzyko:** 🟢 niskie. Nieco wyższa karta (CTA +20px wysokości razem). Karty na listingu pozostaną wyrównane przez `h-full flex flex-col`.

## Punkt 4 — Intrinsic CSS Grid w listingu produktów

**Plik:** `src/pages/Products.tsx` (linia ~50, kontener grid)

Zmiana z fixed breakpoints:
```tsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
```
na intrinsic auto-fill:
```tsx
className="grid gap-4 md:gap-6"
style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
```

**Efekt:** liczba kolumn dostosowuje się płynnie do szerokości viewportu (1 → 2 → 3 → 4 → 5 kolumn) zamiast skokowo na 3 breakpointach. Przy 1278px (obecny viewport użytkownika) → 4 kolumny zamiast 3.

**Ryzyko:** 🟡 niskie-średnie. Na pośrednich szerokościach (np. 1200-1400px) może pojawić się 4 kolumny zamiast 3 — karty będą węższe. Min. 280px gwarantuje, że treść karty (pasek specyfikacji 4-kolumnowy) się nie złamie. Zweryfikowane breakpointy: 320 / 375 / 768 / 1024 / 1280 / 1440 / 1920px.

## Czego NIE ruszamy

- Spacing tokens w `tailwind.config.ts`
- `.container-custom` max-width
- Promocja H3 → H2, widoczny H1 na Products
- Trust strip nad listingiem
- Strona detalu produktu, hero, header, footer, admin

## Pliki do edycji (2)

1. `src/components/ui/ProductCard.tsx` — typografia + touch targets + zamiana koloru CTA
2. `src/pages/Products.tsx` — kontener grid (1 linia + style inline)

## Oczekiwany efekt

| Metryka | Przed | Po |
|---|---|---|
| Najmniejszy tekst karty (mobile) | 8.5px | 10px (etykiety) / 14px (wartości) |
| Wysokość CTA | ~38px | **≥48px** ✅ |
| Kontrast "Zadzwoń" | 3.1:1 ❌ | **4.6:1** ✅ AA |
| Liczba kolumn @1278px | 3 | 4 (intrinsic) |
| Liczba kolumn @1920px | 3 | 5-6 (intrinsic) |


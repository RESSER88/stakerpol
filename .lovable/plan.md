

# Plan naprawczy wydajności (PageSpeed 73 → cel 88+)

## Postęp dotychczasowy
TBT spadło z 280 ms → 150 ms ✓ (po wyłączeniu polling). LCP nadal 4,7 s — wymaga code-splittingu i przyspieszenia ścieżki krytycznej.

## Diagnoza pozostałych problemów

| Problem | Wpływ | Źródło |
|---|---|---|
| Bundle `index-mTUYe_3q.js` = 132 KB, **70 KB nieużywane** | LCP +1,5 s | Wszystkie strony eager w `App.tsx` |
| 6 podstron ładowanych razem ze stroną główną | FCP +200 ms | `Products`, `ProductDetail`, `Contact`, `FAQ`, `Testimonials`, `NotFound` |
| `console.log` w `usePublicSupabaseProducts` w produkcji | TBT mały | logger.log na hot path |
| Linki social w Footer bez `aria-label` | A11y -3 pkt | Facebook/Instagram ikony bez nazw |
| Niski kontrast na CTA "Zapytaj 🇵🇱" w headerze | A11y -4 pkt | kolory tła/tekstu |

## Plan zmian (3 kroki, rosnące ryzyko)

### KROK 1 — Code-splitting podstron (BEZPIECZNE, największy zysk)
**Plik:** `src/App.tsx`

Zamiana:
```tsx
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Testimonials from "./pages/Testimonials";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
```
na:
```tsx
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const NotFound = lazy(() => import("./pages/NotFound"));
```
Owinąć całe `<Routes>` w jedno wspólne `<Suspense fallback={...}>` (zamiast lokalnego dla Admin).

**Co zmienia:**  
- Initial JS bundle: 132 KB → ~70 KB (-47%)
- LCP estymacja: 4,7 s → 3,0–3,3 s
- FCP: 2,4 s → 1,9 s

**Co zostaje bez zmian:** wygląd, działanie, routing, Index ładuje się tak samo.

**Ryzyko:** **bardzo niskie**. Pierwsza nawigacja do podstrony pokaże krótki spinner (200–400 ms na 4G). Strona główna nie ma spinnera — Index jest eager.

### KROK 2 — Wyciszenie loggera w produkcji (BEZPIECZNE, mały zysk)
**Plik:** `src/utils/logger.ts` (jeśli już tak działa — pominąć)

Sprawdzić czy `logger.log` w produkcji jest no-op. Jeśli nie — opakować w `if (import.meta.env.DEV)`.

**Co zmienia:** mniej work na main thread w prod, czyściejsza konsola użytkownika.  
**Ryzyko:** **zerowe** — tylko logi deweloperskie.

### KROK 3 — Naprawa accessibility (BEZPIECZNE, +3-4 pkt A11y)
**Plik:** `src/components/layout/Footer.tsx`

Dodać `aria-label="Facebook"` i `aria-label="Instagram"` do linków social w stopce. Brak zmian wizualnych.

**Co zmienia:** A11y 93 → ~96.  
**Ryzyko:** **zerowe**.

## Czego NIE ruszamy (i dlaczego)

| Element | Powód |
|---|---|
| Czcionka `CameraPlay.woff2` (131 KB z `cdn.gpteng.co`) | Injektowana przez `gptengineer.js` — wymóg platformy Lovable, brak kontroli |
| `gptengineer.js` script tag | Zabronione przez politykę Lovable |
| Realtime WebSocket Supabase | Krytyczny dla synchronizacji z adminem; błędy `ERR_NAME_NOT_RESOLVED` w logach to artefakt środowiska Lighthouse, nie produkcji |
| Hero `<img>` LCP | Już zoptymalizowane w poprzedniej iteracji |
| Animacje akordeonu, fonty Google, refetchInterval | Już zoptymalizowane wcześniej |
| SSR / pre-render / Service Worker | Duża zmiana architektury — wykracza poza "bezpieczne" |

## Oczekiwany wynik

| Metryka | Obecnie | Po wdrożeniu |
|---|---|---|
| Performance | 73 | **86–90** |
| LCP | 4,7 s | **2,8–3,2 s** |
| FCP | 2,4 s | **1,8 s** |
| TBT | 150 ms | **100–130 ms** |
| Initial JS transfer | 208 KB | **130–145 KB** |
| Accessibility | 93 | **96** |

## Pliki do edycji

1. **`src/App.tsx`** — `lazy()` dla 6 podstron + globalne `<Suspense>`
2. **`src/utils/logger.ts`** — guard produkcyjny (jeśli brak)
3. **`src/components/layout/Footer.tsx`** — `aria-label` dla ikon social

**Zero zmian wizualnych. Zero zmian w działaniu funkcji.**




# Analiza audytu i plan dalszej optymalizacji (78 → cel 88+)

## Co pokazuje raport — interpretacja

| Metryka | Wynik | Ocena |
|---|---|---|
| Performance | **78** | Bez zmian vs poprzedni audyt — żadna z ostatnich zmian nie dała pomiaru w Lighthouse |
| LCP | 3,8 s | Bez zmian (preload był już wcześniej) |
| **TBT** | **210 ms** ↑ z 150 ms | **Regres** — code-splitting dodał Suspense overhead |
| FCP | 2,3 s | Bez zmian |
| CLS | 0 | OK |

**Ważne — wynik 78 nie jest gorszy, jest taki sam.** Lighthouse waha się ±3-5 punktów między uruchomieniami. To nie regres, to szum pomiarowy. Ale **TBT 210 vs 150 ms to realna degradacja** wymagająca uwagi.

## Diagnoza pozostałych wąskich gardeł

### 1. LCP load delay = 2720 ms — preload NIE działa optymalnie (KRYTYCZNE)
W `index.html` (linia 33) jest preload z `imagesrcset="...webp"`. **Problem:** użycie `imagesrcset` z jednym URL bez breakpointów może powodować, że przeglądarka czeka na CSS żeby ustalić, czy obraz jest faktycznie potrzebny. Dodatkowo obraz jest ukryty pod `-z-10` z `aria-hidden="true"` co Chrome może deprioritetyzować jako element dekoracyjny.

### 2. TBT regres (150 → 210 ms) — Suspense + zbyt wiele providerów
W `App.tsx` (linie 67-85) struktura: ErrorBoundary → QueryClient → Language → Tooltip → Helmet → BrowserRouter → SupabaseAuth → Suspense → Routes. Każda warstwa to osobny render. `usePageTracking` (linia 35) wywoływany przy każdej zmianie route.

### 3. Podwójne zapytanie FAQ (REALNY BUG)
`useSupabaseFAQ` (linia 197-199) ma `useEffect(() => fetchFAQs())` **bez języka**, a `HomeFAQ` (linia 16-18) wywołuje `fetchFAQs(language)`. **Wynik: 2 requesty do Supabase** (widoczne w network: `?order=display_order.asc` + `?language=eq.pl`). Pierwszy ściąga ~80 KB wszystkich języków bez powodu.

### 4. `usePublicSupabaseProducts` — niepotrzebne zapytanie na stronie głównej?
Strona główna używa do wyświetlenia 4 featured products. Ściąga się 28 KB products + 19 KB images = **47 KB** tylko dla 4 kafelków. Można ograniczyć `limit(20)` w query.

### 5. CSS render-blocking (18 KB, 150 ms)
Tailwind output. Można dodać `media="print" onload="this.media='all'"` trick lub critical CSS inline — ale to **ryzyko FOUC**.

### 6. Bundle nieużywany JS w `index-X.js` = 41 KB (40%)
Ciągle ładowane na home: schema generators, `usePageTracking` wywołuje `trackPageView`, `useProductTranslationIntegration` w Layout.

## Plan zmian — 4 kroki posortowane wg ROI/ryzyka

### KROK 1 — Naprawa podwójnego fetchu FAQ (BEZPIECZNE, szybki zysk)
**Plik:** `src/hooks/useSupabaseFAQ.ts`

Usunąć `useEffect(() => { fetchFAQs(); }, [])` (linie 197-199). Wywołanie bez języka jest niepotrzebne — wszystkie konsumenty (`HomeFAQ`, strona FAQ, admin) wywołują `fetchFAQs(lang)` samodzielnie.

**Zysk:** -1 request, -80 KB transferu, -50 ms TBT.  
**Ryzyko:** 🟢 Niskie. Jeśli jakiś komponent polegał na auto-fetchu — pokaże pustą listę dopóki nie wywoła `fetchFAQs()`. Trzeba sprawdzić: `FAQManager`, `FAQList`, `FAQ.tsx` (strona).

### KROK 2 — Limit produktów na stronie głównej (BEZPIECZNE)
**Plik:** `src/hooks/usePublicSupabaseProducts.ts`

Dodać parametr `limit` do hooka (default `undefined` = bez zmian). W `Index.tsx` użyć `limit(8)` — wystarczy do 4 featured + zapas.

**Alternatywa bezpieczniejsza:** zostawić bez zmian (strony Products i tak potrzebują wszystkich produktów, a cache jest 5 min — drugi request się nie wykona).

**Rekomendacja:** **POMIŃ** — cache działa, zysk marginalny, ryzyko że strona Products nie dostanie pełnej listy.

### KROK 3 — Optymalizacja preload obrazu hero (BEZPIECZNE, największy zysk LCP)
**Plik:** `index.html` linia 33

Obecnie:
```html
<link rel="preload" as="image" href="..." fetchpriority="high" type="image/webp" imagesrcset="..." imagesizes="100vw">
```

Zmienić na prostszą formę bez `imagesrcset` (jeden URL, bez wariantów):
```html
<link rel="preload" as="image" href="/lovable-uploads/cba7623d-...webp" fetchpriority="high" type="image/webp">
```

**Plik:** `src/pages/Index.tsx` — zmienić `aria-hidden="true"` + `alt=""` na `alt="Wózki paletowe Toyota BT"`. Chrome traktuje aria-hidden + empty alt jako element dekoracyjny i może obniżyć priorytet.

**Zysk:** LCP load delay 2720 ms → ~1500 ms (LCP całkowity 3,8 s → ~2,5 s).  
**Ryzyko:** 🟢 Zerowe wizualnie. Drobna zmiana semantyki — `alt` z treścią jest lepszy SEO/A11y.

### KROK 4 — Wyciszenie loggera w hot path produkcyjnym (BEZPIECZNE)
**Plik:** `src/hooks/usePublicSupabaseProducts.ts`

Linie 18, 51, 63, 76, 93, 100 — wszystkie `logger.log()`. Logger ma już guard produkcyjny, ale wywołania funkcji `performance.now()` (linie 19, 50) wykonują się zawsze. Owinąć cały blok pomiaru w `if (import.meta.env.DEV)`.

**Zysk:** -5-10 ms TBT.  
**Ryzyko:** 🟢 Zerowe.

## Czego NIE ruszamy (analiza ryzyka)

| Element | Powód | Co się stanie jeśli ruszysz |
|---|---|---|
| **`HelmetProvider` lazy** | Krytyczne dla SEO — meta tagi muszą być w pierwszym renderze | Google crawler nie zobaczy title/description przez 200-500 ms |
| **Critical CSS inline** | Tailwind generuje dynamicznie, ryzyko desync | Migotanie stylów (FOUC) przy każdej aktualizacji |
| **GTM dalsza redukcja** | Już opóźnione przez `requestIdleCallback` | Złamanie analytics Consent Mode |
| **Czcionka CameraPlay (gpteng.co)** | Wymóg platformy Lovable | Utrata Lovable Tagger |
| **Realtime WebSocket Supabase** | Krytyczny dla sync z adminem | Admin musiałby ręcznie F5 |
| **CSS purge -15 KB** | Tailwind już purguje, reszta to klasy używane na podstronach | Brak utility klas na Products/FAQ |
| **Service Worker / SSR** | Ogromna zmiana architektury | Tygodnie pracy, ryzyko bugów cache |
| **Dalsze splittowanie komponentów** | Już zlazowane na poziomie route | Migotanie UI, więcej Suspense overhead (przyczyna obecnego wzrostu TBT!) |

## Oczekiwany wynik

| Metryka | Teraz | Po krokach 1, 3, 4 |
|---|---|---|
| Performance | 78 | **84-88** (uwaga: ±5 to szum Lighthouse) |
| LCP | 3,8 s | **2,5-2,8 s** |
| TBT | 210 ms | **140-160 ms** |
| Requesty Supabase initial | 4 (FAQ x2) | **3** |
| Initial transfer | 308 KB | **~225 KB** |

## Pliki do edycji
1. **`src/hooks/useSupabaseFAQ.ts`** — usuń auto-fetch w `useEffect`
2. **`index.html`** — uprość preload (usuń `imagesrcset`/`imagesizes`)
3. **`src/pages/Index.tsx`** — popraw `alt` na opisowy, usuń `aria-hidden`
4. **`src/hooks/usePublicSupabaseProducts.ts`** — owinięcie pomiarów `performance.now()` w guard DEV

## Ważna uwaga o pomiarach

**Wynik Lighthouse ±5 pkt to normalny szum.** Aby wiarygodnie ocenić zmianę, uruchom audyt **3 razy** i weź medianę. Pojedynczy pomiar 78 vs 78 oznacza "bez różnicy" lub "różnica w granicach błędu". **TBT 150 → 210 ms (+40%) to natomiast realny sygnał** wymagający uwagi (przyczyna: dodatkowa warstwa Suspense + lazy chunki przy code-splittingu).

## Co sprawdzić ręcznie (poza kodem)

1. **Cache nagłówków HTTP** — wszystkie assety mają `Cache-Control: None`. To problem hostingu Lovable, nie kodu. **Nie do naprawienia z naszej strony** — przy custom domain + CDN (Cloudflare) można ustawić `max-age=31536000` dla `/assets/*`.
2. **Czy preview vs published różnią się?** Audyt robiony na `stakerpol.lovable.app` (published). Sprawdź czy `lovable-uploads/cba7623d` faktycznie zwraca 200 z prawidłowym `Content-Type: image/webp`.
3. **Test 3x na PSI** — jednorazowy wynik nie jest miarodajny.


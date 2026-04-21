

# Analiza wyników PageSpeed (73 → 78) i plan dalszych optymalizacji

## Co się poprawiło ✓
| Metryka | Poprzednio | Teraz | Zmiana |
|---|---|---|---|
| Performance | 73 | **78** | +5 |
| LCP | 4,7 s | **3,8 s** | -0,9 s |
| FCP | 2,4 s | **2,3 s** | -0,1 s |
| Initial JS | 132 KB | **104 KB** | -28 KB |
| Accessibility | 93 | **96** | +3 |

Code-splitting i `aria-label` zadziałały. LCP wciąż jednak za wysoki — wąskim gardłem jest **2720 ms "resource load delay"** dla obrazu hero.

## Diagnoza pozostałych problemów

### 1. Obraz hero czeka 2,7 s zanim zacznie się ładować (KRYTYCZNE)
Mimo `fetchpriority="high"` i `loading="eager"`, obraz `cba7623d-...webp` startuje dopiero po pobraniu CSS i głównego JS. Powód: **brak `<link rel="preload" as="image">` w `index.html`** — przeglądarka odkrywa obraz dopiero po sparsowaniu React.

### 2. TBT wzrosło 150 → 210 ms
Lazy chunki dorzuciły overhead inicjalizacji Suspense. Drobny regres, ale akceptowalny przy zysku LCP.

### 3. Bundle `index-X-ujMmPG.js` = 104 KB, **41 KB nieużywane**
Główna strona wciąż ciągnie kod, który nie jest potrzebny w pierwszym renderze: `react-helmet-async`, schema generators, `usePageTracking`, providers.

### 4. GTM (171 KB, 220 ms main thread)
Ładowane w `<body>` async — działa, ale ciężkie. Można opóźnić do `requestIdleCallback`.

### 5. CSS 18 KB, 15 KB nieużywane
Tailwind generuje klasy używane tylko przez podstrony.

## Plan zmian (3 kroki, posortowane wg ROI / ryzyka)

### KROK 1 — Preload obrazu hero w `<head>` (NAJWIĘKSZY ZYSK, ZERO RYZYKA)
**Plik:** `index.html`

Już istnieje `<link rel="preload" as="image" href="...cba7623d...">` ✓ — sprawdzić, czy ścieżka i atrybuty są zgodne z faktycznym `<img>`. Dodać `fetchpriority="high"` do tagu preload (jeśli brak) oraz `imagesrcset` / `imagesizes` dla wariantu mobile.

**Dodatkowo w `src/pages/Index.tsx`**: obecny `<img>` ma `object-position: center` — przy mobile obraz może być za duży. Dodać atrybuty `width` i `height` (np. 1920×1080) dla zarezerwowania przestrzeni i szybszego layoutu.

**Zysk:** LCP 3,8 s → **2,5–2,8 s**.  
**Ryzyko:** zerowe.

### KROK 2 — Opóźnienie GTM do `requestIdleCallback` (ŚREDNI ZYSK, NISKIE RYZYKO)
**Plik:** `index.html`

Obecnie `<script async src="...gtag/js">` ładuje się natychmiast. Owinąć w:
```html
<script>
  (function(){
    var load = function(){
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=G-SM784ZRC5E';
      document.head.appendChild(s);
    };
    if ('requestIdleCallback' in window) {
      requestIdleCallback(load, { timeout: 3000 });
    } else {
      setTimeout(load, 2000);
    }
  })();
</script>
```
Consent Mode default zostaje w `<head>` bez zmian.

**Zysk:** TBT -50 ms, FCP -100 ms.  
**Ryzyko:** **niskie** — GA4 zarejestruje page_view z 2-sekundowym opóźnieniem. Dla witryny B2B z średnim czasem sesji 1-2 min — nieistotne. **Co może popsuć:** gdyby ktoś wszedł i natychmiast wyszedł (<2 s), event się nie zarejestruje. Dla bounce rate to drobne zaniżenie liczby sesji — akceptowalne.

### KROK 3 — Wydzielenie ciężkich providerów z initial bundle (MAŁY ZYSK, ŚREDNIE RYZYKO)
**Plik:** `src/App.tsx`

`HelmetProvider`, `usePageTracking`, schema components są ładowane natychmiast. Można:
- Zostawić bez zmian (najbezpieczniej)
- LUB lazy-loadować `HelmetProvider` przez dynamiczny import (ryzyko: SEO meta-tagi pojawią się 100-200 ms później — może wpłynąć na crawl Google)

**Rekomendacja: NIE ruszać.** Zysk ~10-15 KB nie wart ryzyka SEO.

## Czego NIE ruszamy (ryzyko > zysk)

| Element | Powód NIE-tknięcia | Co by się stało gdyby tknąć |
|---|---|---|
| Czcionka `CameraPlay.woff2` (131 KB, gpteng.co) | Wymóg platformy Lovable | Złamanie integracji Lovable Tagger |
| `gptengineer.js` script | Polityka Lovable | Utrata edycji wizualnej |
| Realtime Supabase WebSocket | Synchronizacja admin↔public | Admin musiałby ręcznie odświeżać |
| `HelmetProvider` w App | Krytyczne dla SEO meta-tagów | Google indexer może nie zobaczyć title/description |
| CSS purge (15 KB) | Tailwind już purguje; reszta to dynamiczne klasy | Random utility klasy znikłyby z runtime |
| SSR / pre-render | Ogromna zmiana architektury | Przepisanie całej app |
| Service Worker | Złożoność cache invalidation | Stare wersje strony u użytkowników |
| Dalsze code-splitting komponentów (np. ProductCard) | Już zlazowane na poziomie route | Migotanie UI, dodatkowe Suspense overhead |
| Inline krytyczny CSS | Manualna konserwacja, ryzyko desync | FOUC przy zmianach klas Tailwind |

## Oczekiwany wynik po krokach 1+2

| Metryka | Teraz | Po wdrożeniu |
|---|---|---|
| Performance | 78 | **86–90** |
| LCP | 3,8 s | **2,5–2,8 s** |
| FCP | 2,3 s | **1,9–2,1 s** |
| TBT | 210 ms | **140–170 ms** |
| Initial JS transfer | 180 KB | **160 KB** |

## Pliki do edycji
1. **`index.html`** — zweryfikować `<link rel="preload" as="image">` z `fetchpriority="high"`; opóźnić GTM przez `requestIdleCallback`
2. **`src/pages/Index.tsx`** — dodać `width` i `height` do hero `<img>`

**Zero zmian wizualnych. Zero zmian funkcjonalnych poza opóźnieniem GA4 o ~2 s.**

## Ocena ryzyka — podsumowanie

| Krok | Zysk | Ryzyko | Rekomendacja |
|---|---|---|---|
| 1. Preload hero + width/height | ⭐⭐⭐⭐⭐ | 🟢 zerowe | **Zrób** |
| 2. GTM przez requestIdleCallback | ⭐⭐⭐ | 🟡 niskie (analytics +2s opóźnienia) | **Zrób, jeśli akceptujesz drobne zaniżenie liczby sesji <2s** |
| 3. Lazy HelmetProvider | ⭐ | 🔴 średnie (SEO) | **Nie ruszaj** |


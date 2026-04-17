
## Plan: Lista produktów — czystszy nagłówek, sticky filtr na mobile, portretowe zdjęcia kart

### 1. `src/pages/Products.tsx` — usunięcie nagłówka i opisu
Usuwam:
- `<h1>` „Wózki elektryczne" (`t('electricTrolleys')`)
- `<p>` z opisem (`getPageDescription()`) widoczny pod H1
- Cały kontener `flex justify-between` z H1 + ikoną Shield (admin) — ikona admin przeniesiona dyskretnie do stopki sekcji albo zostaje, ale bez paska H1. **Decyzja:** zostawiam ikonę Shield jako mały przycisk w prawym górnym rogu sekcji (absolute), żeby admin miał wejście, ale wizualnie nie przeszkadzała.

Na górze sekcji zostaje tylko `<ProductFilter>` (przycisk „Filtruj") wyśrodkowany — bez zmian w samym komponencie.

SEO: H1 nadal potrzebny dla SEO → dodaję ukryty wizualnie `<h1 className="sr-only">` z tekstem „Wózki widłowe BT Toyota – oferta", żeby nie tracić rankingu.

### 2. Pływający przycisk filtra (mobile, sticky)
Nowy element renderowany **tylko na mobile** (`md:hidden`), `position: fixed`, `right: 16px`, `top: 50%`, `translate-y-[-50%]`, `z-40`:
- Okrągły przycisk 56×56px, `bg-stakerpol-orange text-white`, `shadow-lg`, ikona `Filter` (lejek) z `lucide-react`
- Klik → otwiera ten sam `FilterModal` co główny przycisk (przekazuję ten sam stan przez podniesienie do `Products.tsx` lub renderuję drugi `ProductFilter` z tym samym propsem)

Implementacja: refaktor `ProductFilter` lub po prostu dodać drugą instancję — prościej dodać drugi `<ProductFilter>` z klasą `md:hidden fixed right-4 top-1/2 -translate-y-1/2 z-40` i nadpisać styl przycisku w samym `ProductFilter` przez nowy prop `variant="floating"`.

**Wybór:** dodaję prop `variant?: 'default' | 'floating'` do `ProductFilter`. `floating` renderuje okrągły przycisk z samą ikoną (bez tekstu). Główny przycisk filtra na desktop pozostaje wyśrodkowany na górze; na mobile główny przycisk znika (`hidden md:flex`), a pływający (`md:hidden`) jest zawsze widoczny po prawej.

### 3. `src/components/ui/ProductCard.tsx` — portretowe zdjęcie
- Zmiana `aspect-[4/3]` → `aspect-[3/4]` w kontenerze obrazu
- Zmiana propsa `aspectRatio="4:3"` → `aspectRatio="3:4"` w `<OptimizedImage>` (jeśli komponent obsługuje; jeśli nie — zostaje string informacyjny, kluczowa jest klasa Tailwind)
- Bez zmian: chipy (top-left ROK / top-right Dostępny), tytuł, pasek 4 specyfikacji, CTA, „Pełna specyfikacja"
- `sizes` propa zostawiam jak jest

### Pliki
1. `src/pages/Products.tsx` — usunięcie H1+opisu, dodanie sr-only H1, dodanie pływającego `ProductFilter variant="floating"` na mobile, ukrycie głównego na mobile
2. `src/components/products/ProductFilter.tsx` — dodanie propa `variant` (default/floating) ze stylowaniem okrągłego przycisku
3. `src/components/ui/ProductCard.tsx` — `aspect-[4/3]` → `aspect-[3/4]`

### Bez zmian
- `FilterModal`, tłumaczenia, kolory, fonty, układ gridu produktów, FAQ, CTA, hero
- Karta poza zmianą proporcji obrazu



## Plan: Sekcja "Proces przygotowania + Wsparcie posprzedażowe" na stronie produktu

### Lokalizacja
W `src/pages/ProductDetail.tsx` wstawiamy nową sekcję **między `RelatedProducts` a `CallToAction`** (na końcu strony produktu, po powiązanych produktach). Uwaga: w obecnym układzie nie ma "4 linii produktów" — jest tylko jeden grid `RelatedProducts` (3 karty). Sekcja proces/wsparcie pojawi się raz, jako blok zaufania przed finalnym CTA.

### Nowy komponent: `src/components/products/ProductTrustSection.tsx`
Trzy części w jednym komponencie, każda jako osobny `<section>`:

**Część 1 — Proces przygotowania (jasne tło `bg-white`)**
- H2 wyśrodkowany: "Każdy wózek przechodzi pełny proces przygotowania"
- Subheadline szary
- Grid 4 kolumn (`md:grid-cols-4`) — 4 kroki:
  - 01 `ClipboardCheck` — Pełna diagnostyka
  - 02 `Wrench` — Wymiana elementów zużywalnych
  - 03 `BatteryCharging` — Test baterii trakcyjnej
  - 04 `SprayCan` — Poprawki lakiernicze
- Każdy krok: duża cyfra `text-stakerpol-orange/20` jako tło dekoracyjne (absolute), kółko `bg-stakerpol-orange/10` z ikoną `text-stakerpol-orange`, tytuł `text-stakerpol-navy font-bold`, opis `text-gray-600`
- Linia łącząca kroki na desktop: `border-t-2 border-dashed border-stakerpol-orange/30` w tle gridu

**Część 2 — Wsparcie posprzedażowe (`bg-gray-50`)**
- H2: "Wsparcie posprzedażowe"
- Grid 3 kolumn (`md:grid-cols-3`), karty białe z `shadow-sm`:
  - `Headset` — Wsparcie serwisowe
  - `Package` — Materiały eksploatacyjne
  - `CalendarCheck` — Prezentacja na żywo
- Ikony `text-stakerpol-navy`, tła kółek `bg-stakerpol-navy/10`

**Część 3 — CTA konwersja (`bg-stakerpol-navy text-white`)**
- H2 wyśrodkowany: "Chcesz zobaczyć ten model na żywo?"
- Subheadline biały/szary
- 3 przyciski w rzędzie (mobile: stack):
  - **Umów prezentację** — `bg-stakerpol-orange`, link `/contact#form?subject=prezentacja&product={slug}`, `trackCTAClick('product_process_presentation')`
  - **WhatsApp** — `bg-green-600`, `https://wa.me/48694133592?text=...{model}`, `trackWhatsAppClick('product_process')`
  - **Zadzwoń** — outline biały, `tel:+48694133592`, `trackPhoneClick('product_process')`

### Props komponentu
```ts
interface ProductTrustSectionProps {
  productModel: string;
  productSlug?: string;
}
```
Używane do prefill linków WhatsApp i formularza.

### Tłumaczenia
Dodaję klucze do `src/utils/translations/products.ts` (lub nowy plik) we wszystkich 5 językach (PL/EN/DE/CS/SK):
- `trustProcessTitle`, `trustProcessSubtitle`
- `trustStep1Title..4Title`, `trustStep1Desc..4Desc`
- `trustSupportTitle`
- `trustSupport1Title..3Title`, `trustSupport1Desc..3Desc`
- `trustCtaTitle`, `trustCtaSubtitle`
- `trustCtaPresentation`, `trustCtaCall` (WhatsApp jako brand zostaje)

PL — pełne treści z briefu. EN/DE/CS/SK — przetłumaczone w spójnym tonie sprzedażowym.

### Integracja w `ProductDetail.tsx`
Po `<RelatedProducts ... />` przed `<CallToAction />`:
```tsx
<ProductTrustSection productModel={product.model} productSlug={product.slug || product.id} />
```

### Pliki
1. **Nowy** `src/components/products/ProductTrustSection.tsx`
2. `src/utils/translations/products.ts` — dodanie ~18 kluczy × 5 języków
3. `src/pages/ProductDetail.tsx` — import + wstawienie komponentu

### Bez zmian
RelatedProducts, ProductInfo, kolory tokenów, inne strony, edge functions, CallToAction.

### Uwagi
- Wariant wybrany: **podstawowy** (4 kroki + 3 karty + CTA). Bez timeline animacji ani galerii przed/po — można dodać później.
- Kolorystyka spójna z resztą serwisu: `stakerpol-orange` dla procesu (akcent), `stakerpol-navy` dla wsparcia i finalnego CTA, zielony tylko dla WhatsApp.


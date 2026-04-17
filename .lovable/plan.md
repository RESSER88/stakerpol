

## Plan: Przeprojektowanie karty produktu na liście `/products`

### Mapowanie pól z Supabase → karta
Tabela `products` w bazie nie ma 1:1 nazw z briefu. Mapowanie:

| Brief | Realne pole DB | Pole w `Product` (TS) |
|---|---|---|
| `model` / `name` | `name` | `model` |
| `lift_height_mm` | `lift_height` (numeric) | `specs.liftHeight` |
| `production_year` | `production_year` (int) | `specs.productionYear` |
| `operating_hours` / `mth` | `working_hours` (numeric) | `specs.workingHours` |
| `load_capacity_kg` | `lift_capacity_mast` (numeric) | `specs.mastLiftingCapacity` |
| `main_image_url` | `image_url` + `product_images[0]` | `images[0]` / `image` |
| `slug` / `id` | `slug` / `id` | `slug` / `id` |

Dostępność („Dostępny od ręki") — w bazie nie ma flagi stanu magazynowego. Wszystkie produkty z listy traktujemy jako dostępne (zielony chip statyczny). Jeśli w przyszłości pojawi się pole `availability`, podmienimy źródło.

**Bez zmian w schemacie DB** — wszystkie wymagane pola istnieją.

### Pliki do zmiany

**1. `src/components/ui/ProductCard.tsx`** — pełny redesign
- Usuwam: długi tytuł, `shortDescription`, `LiftHeightBadge`, dwa duże przyciski CTA w obecnej formie
- Nowa struktura:
  - Wrapper `Card` z hover translate + soft shadow, `rounded-md`, white bg
  - **Image** `aspect-[4/3]` z `OptimizedImage`, klikalna (Link do produktu)
    - Chip lewy górny: czarny `bg-[#0E0E0E] text-white font-mono text-[10px] tracking-[0.08em]` → `ROK {year}`
    - Chip prawy górny: biały pill z zieloną kropką `#14A84A` → `Dostępny od ręki` (i18n)
  - **Tytuł** `text-stakerpol-navy font-extrabold` (Archivo 800), 16-17px mobile / 18-20px desktop, sama nazwa modelu, klikalna
  - **Pasek specyfikacji** — `grid-cols-4` z `border-y border-[#E5E1D8]` i `divide-x divide-[#E5E1D8]`:
    - kolumna: ikona `lucide` 16px `text-[#C8102E]`, wartość `font-mono font-bold text-xs`, etykieta `text-[8.5px] uppercase tracking-[0.04em] text-[#5B5B5B]`
    - Ikony: `MoveVertical` (mm), `Calendar` (rok), `Clock` (mth), `Package` (kg)
    - Helper `formatPL(n)` — `Intl.NumberFormat('pl-PL').format()` (spacja jako separator tysięcy)
  - **CTA grid 2 kolumny** gap-1.5:
    - Lewy „Zadzwoń" — `bg-stakerpol-orange` (#E85C1E), `Phone` ikona, `tel:+48694133592`, `trackPhoneClick('product_card_grid_'+model)`, `e.stopPropagation()`
    - Prawy „Zapytaj" — `bg-[#0E0E0E]`, `Mail` ikona, otwiera `PriceInquiryModal` (istniejący komponent!) z prefillem produktu, `e.stopPropagation()`
  - **„Pełna specyfikacja →"** — pełna szerokość, biały bg, `border border-[#E5E1D8]`, link do `/products/{slug}`

**2. `src/components/products/PriceInquiryModal.tsx`** — sprawdzić czy obsługuje prefill modelu w wiadomości; jeśli tak, używamy as-is. Brief mówi „resend email" — istniejący modal już pisze do `price_inquiries` + edge function `notify-lead` używa Resend. Spójne z resztą systemu, nie wymyślamy nowego flow.

**3. `src/utils/translations/products.ts`** — dodać klucze (PL/EN/DE/CS/SK):
- `cardYearChip` — „ROK"
- `cardAvailable` — „Dostępny od ręki" / „Available now" / „Sofort verfügbar" / „K dispozici" / „Dostupné ihneď"
- `cardSpecHeight` — „mm"
- `cardSpecYear` — „rok" / „year" / „Jahr" / „rok" / „rok"
- `cardSpecHours` — „mth"
- `cardSpecCapacity` — „kg"
- `cardCallBtn` — „Zadzwoń" / „Call" / „Anrufen" / „Volat" / „Zavolať"
- `cardAskBtn` — „Zapytaj" / „Ask" / „Anfragen" / „Zeptat se" / „Spýtať sa"
- `cardFullSpec` — „Pełna specyfikacja →" + tłumaczenia

**4. `src/index.css`** — import fontów Archivo + JetBrains Mono z Google Fonts (preconnect + link). Dodać klasy utility:
- `font-archivo` (już może być w tailwind.config), `font-mono` używamy istniejącego stacka — rozszerzamy `tailwind.config.ts` o `mono: ['JetBrains Mono', ...]` i `archivo: ['Archivo', ...]`

**5. `src/pages/Products.tsx`** — siatka:
- Zmiana `product-grid-desktop` (lub override) na: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5`
- Reszta strony bez zmian (filtr, FAQ, CTA, hero)

**6. `tailwind.config.ts`** — dodać `fontFamily.archivo` i `fontFamily.mono` (JetBrains Mono jako pierwszy w stacku)

### Bez zmian
- DB schema, RLS, edge functions
- `ProductDetail.tsx`, `RelatedProducts`, `ProductInfo`, `LiftHeightBadge` (zostaje używany na detalu)
- `PriceInquiryModal` poza ewentualnym prefillem już istnieje

### Stan magazynowy
Chip „Dostępny od ręki" jest statyczny — wszystkie produkty wystawione na liście traktujemy jako dostępne. Jeśli klient chce realny stan (np. „w drodze", „zarezerwowany"), trzeba dodać kolumnę `availability_status` — zgłoszę to jako follow-up po wdrożeniu.

### Pliki (lista finalna)
1. `src/components/ui/ProductCard.tsx` — pełny rewrite
2. `src/utils/translations/products.ts` — +9 kluczy × 5 języków
3. `src/pages/Products.tsx` — klasy gridu
4. `src/index.css` — import fontów
5. `tailwind.config.ts` — fontFamily



## Plan: Iteracja 2 — Hero, CTA i panel admin (strona produktu)

### A. Migracja SQL (do akceptacji przed wdrożeniem)

```sql
-- Enum dostępności
CREATE TYPE public.availability_status AS ENUM ('available', 'reserved', 'sold');

-- Nowe kolumny w products
ALTER TABLE public.products
  ADD COLUMN availability_status public.availability_status NOT NULL DEFAULT 'available',
  ADD COLUMN condition_label text,
  ADD COLUMN short_marketing_description text,
  ADD COLUMN leasing_monthly_from_pln numeric,
  ADD COLUMN warranty_months integer NOT NULL DEFAULT 3,
  ADD COLUMN is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN slogan text;

-- Tabela zalet produktu
CREATE TABLE public.product_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  icon_name text NOT NULL DEFAULT 'check',
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_benefits_product ON public.product_benefits(product_id, sort_order);
ALTER TABLE public.product_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product benefits"
  ON public.product_benefits FOR SELECT USING (true);
CREATE POLICY "Only admins can insert product benefits"
  ON public.product_benefits FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update product benefits"
  ON public.product_benefits FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete product benefits"
  ON public.product_benefits FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Tabela leadów (inline formularz)
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'product_page_inline',
  page_url text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can submit leads"
  ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Only admins can view leads"
  ON public.leads FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can update leads"
  ON public.leads FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins can delete leads"
  ON public.leads FOR DELETE USING (has_role(auth.uid(), 'admin'));
```

Mapowanie pól z briefu — wszystkie nowe (brak istniejących odpowiedników), brak konfliktu z obecnymi kolumnami.

### B. Panel administracyjny — `ProductForm.tsx`

Dodaję 5 nowych sekcji do istniejącego formularza edytora produktu:

1. **Status i dostępność** — dropdown `availability_status` (3 opcje), dropdown `condition_label` (4 opcje), checkbox `is_featured`
2. **Opis marketingowy** — textarea `short_marketing_description`, input `slogan`
3. **Zalety produktu** — repeater (osobny `BenefitsEditor.tsx`): max 3 wpisy, każdy = ikona (select Lucide z whitelistą: check/battery/shield/zap/award/wrench/truck/clock), tytuł, opis. CRUD przez `product_benefits` (osobny zapis po `productId`).
4. **Cena i leasing** — input numeryczny `leasing_monthly_from_pln` (nullable)
5. **Gwarancja** — input numeryczny `warranty_months` (default 3)

Zapis: rozszerzenie `useSupabaseProducts.addProduct/updateProduct` o nowe pola + osobny upsert/delete dla `product_benefits` po zapisie produktu.

### C. Frontend — strona produktu

Refaktor podzielony na nowe komponenty (mniejsze, kompozycyjne):

**Nowe komponenty:**
1. `ProductStatusBadges.tsx` — 2-3 badge nad tytułem
2. `ProductKeySpecsBar.tsx` — pasek 4 parametrów (reuse logiki z karty `/products`)
3. `ProductPriceBlock.tsx` — cena netto + leasing (warunkowo)
4. `ProductCTAButtons.tsx` — 3 CTA (Zadzwoń, Wyślij zapytanie, WhatsApp)
5. `ProductTrustStrip.tsx` — 4-ikonowy pasek (zastępuje obecny `ProductTrustSection` w hero, dawne karty przeniesione niżej)
6. `ProductAboutSection.tsx` — „01 · O tym modelu" + opis + 3 zalety
7. `ProductLeadCallback.tsx` — inline formularz „Zostaw numer" (zod walidacja PL phone, insert do `leads`)
8. `ProductStickyBar.tsx` — sticky bottom bar (mobile only)
9. `ProductImageBadges.tsx` — chipy ROK / Dostępny na zdjęciu (rozszerzenie `ProductImage.tsx`)

**Zmiany w istniejących plikach:**
- `ProductDetail.tsx` — nowy układ hero: status badges → tytuł (sam `model`) → slogan → key specs bar → price block → CTA (3 przyciski) → trust strip → about section → lead callback → (zachowane sekcje: specyfikacja, proces, FAQ, related) → sticky bar
- `ProductInfo.tsx` — usuwam obecne 2 CTA (przenosi się do `ProductCTAButtons`); zostawiam tylko nagłówek „Specifications" + `ModernSpecificationsTable`
- `ProductImage.tsx` — overlay chipów (top-left ROK, top-right availability pill) na głównym zdjęciu galerii
- `FAQSection.tsx` (lub miejsce użycia w `ProductDetail.tsx`) — tytuł hardcoded „Najczęstsze pytania" zamiast `FAQ – ${product.model}`
- Tytuł H1 — używam `product.model` 1:1 (już tak jest w `ProductDetail.tsx`); brief mówi „usuń frazy typu Używany jak nowy" — to są w nazwach modeli w bazie, **nie modyfikuję danych w DB** — dopisuję notkę dla użytkownika, że trzeba poprawić nazwy produktów ręcznie w panelu (lub zaakceptować, że tytuł = `model` + uzupełnić `slogan`)

**Hooki:**
- `useProductBenefits(productId)` — fetch z `product_benefits` order by `sort_order`
- `useLeadSubmit()` — insert do `leads` z walidacją zod

### D. Tłumaczenia
+ ~25 kluczy × 5 języków w `src/utils/translations/products.ts`:
- `aboutThisModel`, `keySpecs`, `priceNet`, `priceInquiry`, `leasingFrom`, `leasingMonthly`, `callNow`, `sendInquiry`, `whatsappContact`, `leaveNumberTitle`, `leaveNumberDesc`, `phonePlaceholder`, `requestCallback`, `sameDayResponse`, `availableNow`, `reserved`, `sold`, `featured`, `afterReview`, `inspectionCheck`, `warrantyMonths`, `nationwideDelivery`, `leasingAvailable`, `mostPopularQuestions`, `validPhoneRequired`

### E. Pliki (lista finalna)

**Migracja:** 1 plik SQL  
**Backend hooks:** `src/hooks/useProductBenefits.ts` (nowy), `src/hooks/useLeadSubmit.ts` (nowy), `src/hooks/useSupabaseProducts.ts` (rozszerzenie)  
**Admin:** `src/components/admin/ProductForm.tsx` (rozszerzenie), `src/components/admin/BenefitsEditor.tsx` (nowy)  
**Frontend (nowe):** `ProductStatusBadges.tsx`, `ProductKeySpecsBar.tsx`, `ProductPriceBlock.tsx`, `ProductCTAButtons.tsx`, `ProductTrustStrip.tsx`, `ProductAboutSection.tsx`, `ProductLeadCallback.tsx`, `ProductStickyBar.tsx` (wszystkie w `src/components/products/`)  
**Frontend (zmiany):** `src/pages/ProductDetail.tsx`, `src/components/products/ProductInfo.tsx`, `src/components/products/ProductImage.tsx`  
**Typy:** `src/types/index.ts` (dodanie nowych pól do `Product`), `src/types/supabase.ts` regeneruje się automatycznie  
**Tłumaczenia:** `src/utils/translations/products.ts`

### F. Edge cases (potwierdzone wymagania briefu)
- `leasing_monthly_from_pln` null → cała prawa strona price block ukryta
- `product_benefits` pusta → cała sekcja zalet ukryta (ale akapit `short_marketing_description` zostaje, jeśli jest)
- `availability_status = 'reserved'` → chip żółty „Zarezerwowany", `'sold'` → chip szary „Sprzedany", trust strip i CTA bez zmian
- `is_featured = false` → trzeci badge ukryty
- Tytuł modelu zawiera dziś frazy typu „Używany jak nowy…" — **decyzja**: tytuł renderujemy jako `product.model` (jest), a użytkownik powinien w panelu admin uprościć nazwy + dopisać `slogan`. Bez ingerencji w istniejące dane w DB.
- Numer telefonu CTA: brief mówi `603507783`, projekt obecnie używa `694133592` (`ProductInfo.tsx`) — **stosuję `694133592`** dla spójności, chyba że potwierdzisz zmianę.

### G. Bez zmian
- Sekcja pogrupowanej specyfikacji (`ModernSpecificationsTable`)
- `ProductTrustSection` — przenoszę użycie niżej (pod about section), zamiast usuwać
- FAQ content, `RelatedProducts`, `ProductHeader` (breadcrumb), `CallToAction` w stopce
- Tabele `products` (poza dodanymi kolumnami), RLS na istniejących tabelach

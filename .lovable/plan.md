

## Plan: Sekcja „O tym modelu" — dwa opisy z limitami i rozwijaniem na mobile

### 1. Model danych

Zmiana znaczenia istniejących pól w `Product`:
- `shortMarketingDescription` → **Opis pierwszy** (lewa kolumna, 800 znaków)
- nowe pole `aboutDescription` (string, opcjonalne) → **Opis drugi** (prawa kolumna, 800 znaków)

Pliki:
- `src/types/index.ts` — dodanie `aboutDescription?: string`
- `src/types/supabase.ts` — mapowanie `about_description` ↔ `aboutDescription` (read + write)
- `src/integrations/supabase/types.ts` — dodanie kolumny w typach Row/Insert/Update tabeli `products`

### 2. Migracja DB

Nowa migracja:
```sql
ALTER TABLE public.products ADD COLUMN about_description text;
```

### 3. Panel admina — sekcja Marketing (`Chapter05_Marketing.tsx`)

Zamiana obecnego pojedynczego pola „Krótki opis marketingowy" na dwa pola tekstowe pod nagłówkiem „O tym modelu":

- **Opis pierwszy** (`EditorialTextarea`, rows=6, `maxLength=800`)
  - `value = product.shortMarketingDescription`
  - hint: `${len}/800`
  - onChange: `.slice(0, 800)`
- **Opis drugi** (`EditorialTextarea`, rows=6, `maxLength=800`)
  - `value = product.aboutDescription`
  - hint: `${len}/800`
  - onChange: `.slice(0, 800)`

Drobna informacja pod polami: „Łącznie max 1600 znaków — po 800 na kolumnę".

`useChapterCompletion.ts`: ch05 uznaje sekcję za wypełnioną, gdy któreś z dwóch pól lub slogan ma treść.

### 4. Strona produktu — `ProductAboutSection.tsx`

Zastąpienie obecnego layoutu (opis po lewej, zalety po prawej) nowym układem dwukolumnowym dla opisów. Zalety i CTA pozostają w osobnym bloku poniżej.

**Logika kolumn:**
- Oba opisy wypełnione → `grid md:grid-cols-2 gap-8`
- Tylko jeden → pełna szerokość (`md:grid-cols-1` lub warunkowy `col-span-2`)
- Żaden → sekcja opisów ukryta (zalety nadal mogą się pokazać)

**Mobile (każdy blok osobno):**
- Nowy komponent wewnętrzny `CollapsibleAbout` z `useState(expanded)`
- Domyślnie pokazuje ~50% tekstu (np. `text.slice(0, Math.ceil(text.length / 2))` + `…`) — tylko gdy tekst > ~200 znaków
- Pod tekstem przycisk identyczny stylem jak w `ModernSpecificationsTable` (białe tło, border `#E5E1D8`, font Archivo, ChevronDown/Up):
  - Zwinięty: „Rozwiń ↓" (`ChevronDown`)
  - Rozwinięty: „Zwiń ↑" (`ChevronUp`)
- Na desktop (md+) zawsze pełny tekst, brak przycisku (`md:hidden` na przycisku, full text zawsze renderowany — przełącznik dotyczy tylko tego, czy renderujemy obcięty czy pełny string poniżej breakpointa). Implementacja: dwa warianty z `block md:hidden` / `hidden md:block` lub wykrywanie przez `useIsMobile`.

### 5. ProductAboutSection — zachowanie istniejących elementów

Nagłówek „02 · O tym modelu", sekcja „Kluczowe zalety", InlineContextualCTA i link „Jak dojechać" — bez zmian, pod blokiem dwukolumnowym.

### Zmienione pliki
- `supabase/migrations/<new>.sql` (nowa)
- `src/types/index.ts`
- `src/types/supabase.ts`
- `src/integrations/supabase/types.ts`
- `src/components/admin/editor/chapters/Chapter05_Marketing.tsx`
- `src/components/admin/editor/useChapterCompletion.ts`
- `src/components/products/ProductAboutSection.tsx`

### QA
1. Admin → Marketing: dwa pola, liczniki działają, twardy stop przy 800.
2. Strona produktu desktop ≥768px: oba wypełnione → 50/50; jedno wypełnione → 100%.
3. Mobile <768px: każdy opis zwinięty do połowy, przycisk „Rozwiń ↓" → pełny tekst + „Zwiń ↑".
4. Pusty `aboutDescription` na istniejących produktach → brak błędów (kompatybilność wsteczna).


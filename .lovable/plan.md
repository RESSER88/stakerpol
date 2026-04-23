

## Plan: Audyt hydracji pól w edytorze produktu (rozdziały 01–05)

### Diagnoza bug-u „Krótki opis"

Po prześledzeniu ścieżki danych (`Admin.tsx` → `ProductManager` → `ProductEditorView` → `Chapter02_Basic` → mapper `mapProductToSupabaseInsert/Update` → DB → mapper `mapSupabaseProductToProduct`) wartość `shortDescription` jest poprawnie zapisywana i odczytywana. Bug wynika z **dwóch problemów ze stanem lokalnym edytora**:

1. **`Admin.tsx` przechowuje `selectedProduct` jako odniesienie do obiektu pobranego ze starej tablicy `products`.** Po zapisie React Query unieważnia query, lista produktów dostaje nowe odniesienia, ale `selectedProduct` zostaje stary. Po zamknięciu i ponownym otwarciu edycji tego samego produktu (lub odświeżeniu w tle) widać niespójność.
2. **W `Chapter02_Basic` onChange dla „Krótki opis" robi `set({ ...(product as any), shortDescription: ... })`** — patch zawiera cały produkt, który następnie jest po raz drugi spreadowany w `set`. Przy szybkim wpisywaniu i równoczesnym refetchu przez realtime (w `useSupabaseProducts` jest subskrypcja `postgres_changes` która unieważnia query po każdym update) powstaje race condition — `useEffect` w edytorze re-fire'uje i resetuje stan do świeżo pobranego produktu, gdzie `short_description` jeszcze nie zostało zapisane.

Realtime invalidation na `products` powoduje też, że po zapisie tablica `products` w `Admin.tsx` jest świeża, ale `selectedProduct` (przekazywany jako `initialProduct`) wskazuje na stary obiekt lub na obiekt z innego renderu. `useEffect` w `ProductEditorView` reaguje na zmianę referencji `initialProduct` i resetuje stan lokalny — czasem do wartości sprzed zapisu.

### Audyt pól — co jest poprawne, co wymaga naprawy

**01 Zdjęcia** — `images` przekazywane jako prop, hydracja OK (z `selectedProduct.images` w `handleEdit`). ✅

**02 Podstawowe**
- `model`, `serialNumber`, `productionYear`, `condition`, `conditionLabel`, `battery`, `availabilityStatus`, `slug` — hydracja OK ✅
- **`shortDescription`** — onChange spreaduje cały `product` w patchu (nadmiarowe i ryzykowne); `as any` cast ukrywa typowanie. Bug hydracji po zapisie. ❌
- **`slogan`** — przeniesiony, zapis OK, hydracja OK ✅

**03 Techniczne** — wszystkie pola przez `setSpec(k, v)` w obiekcie `product.specs`. Mapper poprawnie hydratuje wszystkie pola. ✅

**04 Cena & Leasing**
- `priceDisplayMode`, `netPrice`, `priceCurrency` — używają `as any` w obie strony, ale działa ✅
- `leasingMonthlyFromPln`, `warrantyMonths` — poprawne ✅

**05 Marketing**
- `shortMarketingDescription`, `aboutDescription` — onChange poprawne, hydracja OK ✅
- `isFeatured`, `faqIds` — OK ✅
- `benefits` — ładowane osobno z `product_benefits` w `useEffect` w `ProductEditorView`. Po zapisie nie są re-hydratowane (tylko przy otwarciu modala). Akceptowalne, ale do poprawy.

### Naprawa — plan zmian

#### 1. `src/components/admin/editor/chapters/Chapter02_Basic.tsx`
Uprościć onChange „Krótki opis" do spójnego wzorca jak inne pola:
```ts
onChange={(e) => set({ shortDescription: e.target.value.slice(0, 300) })}
```
Usunąć `(product as any)` cast — `shortDescription` jest w typie `Product`. Zmienna `shortDesc` czytana bezpośrednio jako `product.shortDescription || ''`.

#### 2. `src/pages/Admin.tsx`
Wyciągnąć `defaultNewProduct` poza komponent (lub do `useMemo`), żeby nie dostawał nowej referencji przy każdym renderze:
```ts
const DEFAULT_NEW_PRODUCT: Product = { ... };
```
To eliminuje niepotrzebne re-firowanie `useEffect` w `ProductEditorView` przy renderach Admin spowodowanych aktualizacjami React Query.

#### 3. `src/components/admin/editor/ProductEditorView.tsx`
Po pomyślnym zapisie (`saveBasic`, `saveAll`) zsynchronizować stan lokalny z odpowiedzią serwera, żeby uniknąć rozbiegu z realtime'em:
- `addProductAsync`/`updateProductAsync` zwracają `newProduct`/`updatedProduct` (raw row z Supabase). Po zapisie zmapować przez `mapSupabaseProductToProduct(updatedProduct, [...obecne images jako mock])` lub po prostu zachować obecny `product` state (bo był wysłany przez użytkownika).
- Zmienić `useEffect` resetujący stan, żeby reagował tylko na **otwarcie** modala (`open` z false→true) lub zmianę `initialProduct.id`, a nie na każdą zmianę referencji `initialProduct`. Przykład:
```ts
useEffect(() => {
  if (!open) return;
  setProduct(initialProduct);
  setImages(initialImages);
  // ...
}, [open, initialProduct.id]);
```
To zapobiega nadpisywaniu lokalnych zmian przez realtime invalidation.

#### 4. (opcjonalnie) `src/components/admin/ProductManager.tsx`
Po zapisie zaktualizować `selectedProduct` w `Admin.tsx` świeżą wersją z listy `products` (po refetchu), żeby ponowne otwarcie tego samego produktu pokazywało aktualne dane. Można dodać `useEffect` w `Admin.tsx`:
```ts
useEffect(() => {
  if (!selectedProduct?.id) return;
  const fresh = products.find(p => p.id === selectedProduct.id);
  if (fresh && fresh !== selectedProduct) setSelectedProduct(fresh);
}, [products]);
```
Ale tylko gdy modal jest **zamknięty** — żeby nie zakłócać edycji.

### Pliki do edycji
- `src/components/admin/editor/chapters/Chapter02_Basic.tsx` — uproszczenie onChange „Krótki opis"
- `src/pages/Admin.tsx` — `DEFAULT_NEW_PRODUCT` poza komponentem + sync `selectedProduct` po refetchu (gdy modal zamknięty)
- `src/components/admin/editor/ProductEditorView.tsx` — `useEffect` zależny od `[open, initialProduct.id]` zamiast całego obiektu

### QA po wdrożeniu
1. Edycja produktu → wpisać tekst w „Krótki opis" → Zapisz → pole nadal pokazuje wpisany tekst ✅
2. Zamknąć modal → Edytuj ten sam produkt → pole pokazuje zapisaną wartość ✅
3. To samo dla wszystkich pól w sekcjach 02–05.
4. Realtime: zmienić produkt z drugiej karty → otwarty edytor nie nadpisuje stanu lokalnego.
5. Tworzenie nowego produktu → po zapisie sekcji 02 odblokowują się rozdziały 01, 03, 04, 05 ✅


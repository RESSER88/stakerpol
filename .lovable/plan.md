

## Diagnoza: panel admina pokazuje stare dane po powrocie i zawsze resetuje się do rozdziału 01 (Zdjęcia)

### Co dokładnie się dzieje

Prześledziłem ścieżkę: `Admin.tsx` (trzyma `selectedProduct`, `isEditDialogOpen`, `productImages`) → `ProductManager` → `ProductEditorView` (trzyma własny lokalny stan `product`, `images`, `benefits`, `activeChapter`).

**Trzy odrębne błędy nakładają się na siebie:**

#### Bug 1 — `activeChapter` zawsze resetuje się do 1 przy każdej hydracji
W `ProductEditorView.tsx` linia 72:
```ts
useEffect(() => {
  if (!open) return;
  setProduct(initialProduct);
  setImages(initialImages);
  ...
  setActiveChapter(create ? 2 : 1);   // ← TWARDY RESET
}, [open, initialProduct?.id]);
```
Za każdym razem, gdy modal się otwiera lub zmienia produkt, aktywny rozdział wraca do 1 (Zdjęcia) dla edycji lub 2 (Dane podstawowe) dla nowego. To wyjaśnia objaw „panel wraca zawsze do pierwszej zakładki".

#### Bug 2 — przełączenie sekcji bocznego menu (np. Produkty → Zapytania → Produkty) niszczy edytor
W `Admin.tsx` `renderSection()` montuje/odmontowuje `ProductManager` zależnie od `activeSection`. Gdy użytkownik wraca do „Produkty":
- `selectedProduct`, `isEditDialogOpen`, `productImages` są zachowane w `Admin.tsx` (na poziomie wyższym),
- ale `ProductEditorView` jest świeżo zamontowany ze świeżym `useState(initialProduct)`,
- effect hydracji odpala się raz (open=true, id znany) i kopiuje `initialProduct` do lokalnego stanu,
- `activeChapter` ustawia się na 1.

W efekcie: edytor pokazuje **rozdział 01** zamiast tego, który był otwarty wcześniej, oraz wszystkie pola formularza są skopiowane z `initialProduct` — czyli z `selectedProduct` w Admin.tsx, który **nie został odświeżony po zapisie** (bo effect synchronizujący w Admin.tsx pomija wykonanie gdy `isEditDialogOpen` jest `true`, a po zapisie modal nadal jest otwarty).

#### Bug 3 — po zapisie `selectedProduct` w Admin.tsx pozostaje starą referencją
`Admin.tsx` linie 56–65:
```ts
useEffect(() => {
  if (isEditDialogOpen) return;          // ← blokada gdy modal otwarty
  if (!selectedProduct?.id) return;
  const fresh = products.find(p => p.id === selectedProduct.id);
  if (fresh && fresh !== selectedProduct) {
    setSelectedProduct(fresh);
    setProductImages(fresh.images || []);
  }
}, [products, isEditDialogOpen, selectedProduct]);
```
Blokada `if (isEditDialogOpen) return` była dodana, by chronić edycje w toku. Skutek uboczny: po zapisie modal nadal jest otwarty → `selectedProduct` w Admin pozostaje starą wersją sprzed zapisu. Gdy użytkownik przełączy sekcję i wróci, `ProductEditorView` zostanie zhydratowany właśnie tą starą referencją.

### Realtime i query cache działają poprawnie

Z konsoli widać, że realtime przychodzi (`Admin products realtime update`, `Public product images realtime update detected`) i `useSupabaseProducts` invaliduje query (`staleTime: 5 s`, `refetchOnWindowFocus: true`). Tablica `products` w `Admin.tsx` jest świeża. Problem leży **wyłącznie w propagacji świeżych danych do otwartego edytora**.

---

## Plan naprawy

### Zmiana 1 — `ProductEditorView.tsx`: rozdziel hydrację od resetu nawigacji

Rozbić jeden efekt na dwa, żeby:
- pełna hydracja (włącznie z `activeChapter`) działa tylko przy **pierwszym otwarciu** lub **zmianie produktu** (inne `id`),
- gdy ten sam produkt zostaje zaktualizowany przez realtime/refetch (nowa referencja `initialProduct`, ten sam `id`), **scalić tylko brakujące/zmienione pola** z bazy nie nadpisując pól, które właśnie edytuje użytkownik.

Konkretnie:
- użyć `useRef<string | null>` przechowującego id ostatnio zhydratowanego produktu,
- w efekcie sprawdzić: jeśli `initialProduct.id !== lastHydratedId.current` → pełna hydracja + reset `activeChapter` (jak teraz),
- jeśli ten sam id i modal otwarty → **NIE** resetować `activeChapter`, **NIE** nadpisywać `product` w całości; zamiast tego tylko odświeżyć pola, które nie były edytowane (alternatywa: jeśli `saving === false` i nie ma „dirty flag", zhydratować świeże dane, w przeciwnym razie zostawić lokalny stan).

Najprostsza i bezpieczna implementacja na start: trzymać `lastHydratedId` w ref i hydrować tylko przy zmianie id. Reszta synchronizacji zachodzi po zamknięciu i ponownym otwarciu modala.

### Zmiana 2 — `ProductEditorView.tsx`: po udanym zapisie zaktualizować lokalny stan świeżymi danymi z mutacji

W `saveBasic` i `saveAll` mutacja zwraca `updatedProduct` (rekord z bazy). Zamiast polegać na realtime → invalidate → propagacja, **bezpośrednio** zmapować zwrócony rekord przez `mapSupabaseProductToProduct` i wywołać `setProduct(...)` na świeżych danych. To gwarantuje, że formularz natychmiast pokazuje to, co rzeczywiście jest w bazie, bez jakichkolwiek wyścigów.

Wymaga: wystawić mapper w `ProductEditorView` (import z `@/types/supabase`) i pobrać świeże obrazy/benefits razem z rekordem, albo prostsza wersja — po sukcesie zapisu wywołać własny `refresh()` który czyta produkt + obrazy + benefity z bazy i ustawia stan lokalny.

### Zmiana 3 — `ProductEditorView.tsx`: zachować `activeChapter` przy zmianach `initialProduct` dla tego samego id

Wynika z Zmiany 1, ale zaznaczam osobno bo to widoczny objaw „panel wraca zawsze do Zdjęć". Po naprawie: rozdział resetuje się tylko przy zmianie produktu (otwarcie innego rekordu) lub przy nowym tworzeniu.

### Zmiana 4 — `Admin.tsx`: zsynchronizować `selectedProduct` także gdy modal jest otwarty, ale tylko po zmianie zawartości

Zmienić warunek tak, aby:
- gdy modal jest otwarty i przyszła nowa wersja tego samego `selectedProduct.id`, nadal aktualizować referencję w Admin.tsx (żeby zamknięcie+otwarcie pokazało świeże dane),
- ale `ProductEditorView` (po Zmianie 1) i tak nie nadpisze swojego lokalnego stanu, więc edycje w toku są bezpieczne.

Innymi słowy: Admin.tsx zawsze trzyma świeżą referencję, edytor sam decyduje kiedy ją zaakceptować.

### Zmiana 5 — `ProductEditorView.tsx`: realtime na otwartym produkcie ładuje świeże benefits

Aktualnie benefits są ładowane raz przy otwarciu. Po zapisie z innej karty/instancji — przestaną być spójne. Dodać subskrypcję realtime na `product_benefits` filtrowaną po `product_id` (lub po prostu re-load po wykryciu eventu) — ale tylko jeśli użytkownik nie ma niezapisanych zmian benefits.

To opcjonalne, można dodać w drugiej iteracji.

---

## Pliki do edycji

- `src/components/admin/editor/ProductEditorView.tsx` — rozdzielenie effectu hydracji, zachowanie `activeChapter`, hydrowanie świeżymi danymi po zapisie
- `src/pages/Admin.tsx` — usunięcie blokady `if (isEditDialogOpen) return` lub zmiana jej semantyki

Brak migracji bazy — problem jest wyłącznie w warstwie React state.

---

## Test po wdrożeniu

1. **Reset rozdziału**: otwórz produkt → przejdź do rozdziału 04 (Cena) → zmień coś → Zapisz → kursor zostaje w rozdziale 04, pole pokazuje zapisaną wartość. ✅
2. **Przełączenie sekcji menu**: otwórz produkt na rozdziale 03 → kliknij „Zapytania" w sidebarze → wróć do „Produkty" → modal otwarty na rozdziale 03 z aktualnymi danymi. ✅
3. **Powrót na kartę przeglądarki**: otwórz produkt → przejdź na inną kartę na 30 s → wróć → modal otwarty na tym samym rozdziale, pola niezedytowane pokazują świeże wartości z bazy. ✅
4. **Edycja w drugiej karcie**: w karcie A otwarty edytor produktu X na rozdziale 02; w karcie B zmień Slogan tego samego produktu i zapisz → karta A pokazuje świeży Slogan w rozdziale 02 (jeśli pole nie było aktywnie edytowane). ✅
5. **Tworzenie nowego**: Dodaj produkt → zapisz rozdział 02 → przejdź do 03 → wpisz dane → Zapisz → po zapisie jesteś nadal w 03, dane zachowane. ✅


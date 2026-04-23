
## Plan: ujednolicenie analityki GA4 dla 3 brakujących formularzy

### Kontekst
Wszystkie 6 formularzy poprawnie zapisuje leady do bazy i wywołuje mail (potwierdzone w logach Resend, 8/8 sukcesów). Ale tylko 3 z nich raportują konwersję do GA4. Pozostałe 3 są "niewidzialne" dla raportów konwersji.

### Brakujące tracking'i

**1. `src/components/contact/ContactLeadForm.tsx`** (źródło: `contact_page`)
Po udanym INSERT dodać:
```ts
trackFormSubmit('contact_page_form');
trackGenerateLead(crypto.randomUUID(), 'contact_page');
```

**2. `src/hooks/useLeadSubmit.ts`** (źródła: `product_page_inline`, `product_list`)
Po udanym INSERT dodać:
```ts
trackFormSubmit('product_callback', productModel);
trackGenerateLead(crypto.randomUUID(), source, product ? { id: productId, model: productModel } : undefined);
```
(`source` ustalany z kontekstu wywołania)

**3. `src/components/contact/ContactConversionCards.tsx`** (źródła: `callback_card`, `visit_request`)
Po udanym INSERT dla każdego z dwóch wariantów (callback vs wizyta):
```ts
trackFormSubmit(variant === 'callback' ? 'conversion_callback' : 'conversion_visit');
trackGenerateLead(crypto.randomUUID(), source);
```

### Zasady wspólne
- `crypto.randomUUID()` jako transaction_id (nie czytamy `id` z bazy → nie łamiemy RLS)
- Kolejność: najpierw INSERT, dopiero po `if (!error)` track
- Brak zmian w bazie, brak nowych zależności, brak zmian w mailu

### Test po wdrożeniu
Wypełnić każdy z 3 formularzy → sprawdzić w DevTools → Network → `collect?v=2` że leci event `generate_lead` z odpowiednim `lead_source`. W GA4 DebugView (jeśli aktywny) eventy widoczne w 30 sek.

### Pliki do edycji
- `src/components/contact/ContactLeadForm.tsx`
- `src/hooks/useLeadSubmit.ts`
- `src/components/contact/ContactConversionCards.tsx`

Brak migracji DB. Brak edge functions. Tylko 3 pliki frontu, każdy ~3 linijki.



# Diagnoza i plan naprawy FAQ — Stakerpol

## Diagnoza

### Główna przyczyna: brak `TO authenticated` w politykach RLS tabeli `faqs`

Porównanie polityk FAQ (migracja `20250904`) z działającymi politikami products (migracja `20250623`):

```text
❌ FAQ (NIE DZIAŁA):
CREATE POLICY "Only admins can insert FAQs" 
ON public.faqs FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

✅ Products (DZIAŁA):
CREATE POLICY "Only admins can insert products"
ON public.products FOR INSERT
TO authenticated                              ← BRAK W FAQ!
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

**Bez `TO authenticated`** polityka stosuje się do roli `PUBLIC` (domyślna). Klient Supabase używa klucza `anon`, więc zapytania lecą jako rola `anon`. Dla roli `anon` `auth.uid()` zwraca NULL → `has_role(NULL, 'admin')` = false → **BLOKADA**.

Ale moment — w konsoli widzimy błąd `"new row violates row-level security policy"` przy **INSERT** (nie UPDATE/DELETE). To znaczy, że **INSERT też nie działa poprawnie**, mimo że wcześniej stwierdzono, że CREATE działa. Prawdopodobnie INSERT działał przed remix projektu lub nigdy nie działał.

### Dodatkowe problemy:

1. **SELECT policy** (`USING (is_active = true)`) — admin widzi TYLKO aktywne FAQ. Po soft-delete (is_active=false) rekord znika z panelu admina. `getAllFAQsForAdmin()` nie może pobrać nieaktywnych.

2. **Przycisk migracji** — pojawia się tylko gdy `faqs.length === 0`. Jeśli w bazie są jakiekolwiek FAQ, przycisk się nie pokazuje.

3. **deleteFAQ** robi soft-delete (UPDATE is_active=false), co jest poprawne, ale po operacji admin nie zobaczy tego rekordu (problem z SELECT policy).

## Plan naprawy — 3 kroki

### Krok 1: Migracja SQL — naprawić polityki RLS

Utworzyć nową migrację SQL, która:
- Usuwa wszystkie 4 istniejące polityki na tabeli `faqs`
- Tworzy nowe polityki z `TO authenticated` dla operacji admina
- Dodaje osobną politykę SELECT dla admina (widzi WSZYSTKIE FAQ, nie tylko aktywne)
- Zachowuje publiczny SELECT dla aktywnych FAQ (dla frontendu)

```sql
-- Usunięcie starych polityk
DROP POLICY IF EXISTS "Anyone can view active FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Only admins can insert FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Only admins can update FAQs" ON public.faqs;
DROP POLICY IF EXISTS "Only admins can delete FAQs" ON public.faqs;

-- Nowe polityki
CREATE POLICY "Anyone can view active FAQs" 
ON public.faqs FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all FAQs" 
ON public.faqs FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert FAQs" 
ON public.faqs FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update FAQs" 
ON public.faqs FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete FAQs" 
ON public.faqs FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

### Krok 2: Poprawki w kodzie frontendu

**`FAQManager.tsx`:**
- Przycisk "Migruj FAQ" — zawsze widoczny (nie tylko gdy lista pusta), z potwierdzeniem przed nadpisaniem
- Dodać osobny przycisk "Dezaktywuj" i "Usuń trwale" w tabeli FAQ

**`FAQList.tsx`:**
- Dodać kolumnę/przycisk toggle aktywacji (is_active) 
- Dodać przycisk "Usuń trwale" (hard delete) obok soft-delete

**`useSupabaseFAQ.ts`:**
- Dodać funkcję `hardDeleteFAQ(id)` — prawdziwy DELETE z bazy
- Dodać funkcję `toggleFAQActive(id, is_active)` — przełączanie aktywności

### Krok 3: Weryfikacja

Po wdrożeniu migracji przetestować:
- INSERT nowego FAQ
- UPDATE istniejącego FAQ
- Soft-delete (dezaktywacja)
- Hard-delete (trwałe usunięcie)
- Migracja danych z hardcoded

## Podsumowanie zmian

| Plik | Zmiana |
|------|--------|
| `supabase/migrations/NEW.sql` | Nowa migracja — naprawione polityki RLS |
| `src/hooks/useSupabaseFAQ.ts` | Dodanie `hardDeleteFAQ` i `toggleFAQActive` |
| `src/components/admin/FAQManager.tsx` | Przycisk migracji zawsze widoczny + potwierdzenie |
| `src/components/admin/FAQList.tsx` | Przycisk toggle aktywacji + przycisk trwałego usunięcia |




# Plan: Migracja SQL faq_ids + naprawa build errors

## Problem 1: Brak kolumny `faq_ids` w tabeli `products`
Kolumna nie istnieje — potwierdzone zapytaniem do bazy. Kod w `supabase.ts` już mapuje `faq_ids`, ale dane nigdy nie przychodzą z bazy.

**Rozwiązanie:** Migracja SQL:
```sql
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS faq_ids TEXT[] DEFAULT '{}';
```

## Problem 2: Build errors — `process` is not defined
Trzy pliki używają `process.env.NODE_ENV`, co nie działa w Vite (przeglądarka). Trzeba zamienić na `import.meta.env.MODE`.

**Pliki do zmiany:**
| Plik | Linia | Zmiana |
|------|-------|--------|
| `src/App.tsx` | 50 | `process.env.NODE_ENV === 'production'` → `import.meta.env.PROD` |
| `src/utils/logger.ts` | 5 | `process.env.NODE_ENV === 'development'` → `import.meta.env.DEV` |
| `src/utils/performance.ts` | 36 | `process.env.NODE_ENV === 'development'` → `import.meta.env.DEV` |

## Kolejność
1. Wykonać migrację SQL (dodanie kolumny `faq_ids`)
2. Naprawić 3 pliki z `process.env` → `import.meta.env`

## Ryzyko
- Zerowe — kolumna opcjonalna, `import.meta.env` to standardowy sposób w Vite


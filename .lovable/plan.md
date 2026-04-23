

## Plan: Usprawnienia zakładki „Zapytania"

### 1. Domyślny filtr „Nowe"
W `InquiriesSection.tsx` zmieniam stan początkowy: `useState<StatusFilter>('new')` zamiast `'all'`. Gdy admin wchodzi w zakładkę, od razu widzi tylko nieobsłużone.

### 2. Po „Obsłużone" → przeskok do zakładki „Obsłużone"
W funkcji `markHandled` po sukcesie:
- jeśli `newStatus === 'handled'` i bieżący filtr to `'new'` → automatycznie przełączam `setFilter('handled')` i `setPage(0)`. Toast zostaje („✓ Oznaczono jako obsłużone").
- analogicznie cofnięcie z `handled` → `setFilter('new')`.

Zachowanie staje się intuicyjne: lead „znika" z aktualnej listy i pojawia się tam, gdzie trafił.

### 3. Auto-usuwanie po 60 dniach + przycisk „Usuń"

**Baza (migracja):**
- Dodać kolumnę `handled_at timestamptz` w `public.leads`.
- Trigger `BEFORE UPDATE`: jeśli `status` zmienia się na `'handled'` → ustaw `handled_at = now()`; jeśli wraca na `'new'` → `handled_at = NULL`.
- Backfill: dla istniejących `status='handled'` ustawić `handled_at = created_at`.
- Funkcja `public.cleanup_old_handled_leads()` (SECURITY DEFINER, search_path=public): `DELETE FROM leads WHERE status='handled' AND handled_at < now() - interval '60 days'`.
- Włączyć `pg_cron` + `pg_net`, zaplanować codzienny job o 03:00 wywołujący tę funkcję.
- RLS już pozwala adminom na DELETE — nic nowego.

**Frontend:**
- W `Lead` dodać `handled_at: string | null` i pobierać je w `select`.
- W rzędzie obsłużonego leada pokazać subtelny tekst: „Zostanie usunięte za X dni" (gdzie X = `60 - daysSince(handled_at)`, min 0). Styl: `text-[10px] tracking-[0.2em] uppercase text-editorial-muted`.
- Dodać przycisk „Usuń" obok „Cofnij" — widoczny tylko dla `isHandled`. Klik → `confirm()` → `supabase.from('leads').delete().eq('id', lead.id)` → usunięcie z listy + toast. Styl czerwony minimalistyczny (border-editorial-error, ikona Trash2).

### 4. Klikalny licznik „Nowe zapytania" w dashboardzie
W `DashboardSection.tsx` typ `stats` rozszerzam o opcjonalny `onClick`. Item „Nowe zapytania" dostaje `onClick: () => onNavigate('inquiries')`. Renderowanie: jeśli `s.onClick` istnieje, owijam zawartość w `<button>` z hover na akcent. Hint nawigacji: nic nie zmieniam w sygnaturze `onNavigate` — `InquiriesSection` już domyślnie wystartuje z filtrem `'new'` (krok 1), więc trafienie jest spójne z wymaganiem.

### Pliki do edycji
- `src/components/admin/sections/InquiriesSection.tsx` — kroki 1, 2, 3 (UI).
- `src/components/admin/sections/DashboardSection.tsx` — krok 4.
- Nowa migracja SQL — krok 3 (kolumna, trigger, backfill, funkcja czyszcząca, cron job).

### Test po wdrożeniu
1. Otwórz Zapytania → widać tylko „Nowe", chip „Nowe" aktywny.
2. Kliknij „Obsłużone" na leadzie → lead znika, filtr przeskakuje na „Obsłużone", lead widoczny u góry.
3. W „Obsłużone" widać „Zostanie usunięte za 60 dni" oraz przycisk „Usuń" → po kliknięciu i potwierdzeniu lead znika.
4. Dashboard → kliknięcie liczby „Nowe zapytania" → przejście do zakładki Zapytania z filtrem „Nowe".
5. Cron job: weryfikacja w `cron.job` że wpis istnieje; ręczny test `SELECT public.cleanup_old_handled_leads();` zwraca bez błędu.


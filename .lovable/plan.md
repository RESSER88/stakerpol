
## Plan: Trigger first, forms second — jedna zmiana na raz

Słusznie zwracasz uwagę. Zatrzymuję refactor formularzy. Robimy to w dwóch krokach z testem po każdej zmianie.

---

### Krok 1 — Udowodnić że trigger działa (i naprawić jeśli nie)

**1a. Test triggera przez SQL** (bez żadnych zmian w kodzie):
```sql
INSERT INTO public.leads (name, email, phone, message, source, rodo_accepted, page_url, user_agent)
VALUES ('TEST TRIGGER 1', 'test@stakerpol.pl', '600000001',
        'Test triggera trg_leads_notify - wstawka 1.', 'trigger_test', true,
        'https://test.local/step1', 'pg-trigger-test')
RETURNING id, source, created_at;
```
Następnie:
- sprawdzam logi `notify-lead` (czy się odpaliła, czy Resend zwrócił sukces),
- sprawdzam czy mail dotarł na `info@stakerpol.pl`.

**1b. Jeśli mail NIE przyszedł** → naprawa `notify_lead_created`:
- Zamiana `extensions.http_post(...)` na `public.http_post(uri, content, content_type)` (rozszerzenie `http` jest zainstalowane w schemacie `public` — potwierdzone w liście funkcji DB, gdzie `public.http_post` istnieje, a `extensions.http_post` nie).
- Migracja `CREATE OR REPLACE FUNCTION public.notify_lead_created()` z poprawioną sygnaturą wywołania (JSON body jako `text` + `application/json`) i `SET search_path = public`.
- Powtórzenie testu SQL z punktu 1a (`TEST TRIGGER 2`) — musi przyjść mail.

**Wyjście z Kroku 1:** potwierdzenie w logach Resenda, że trigger DB sam (bez frontu) wysyła maila. Dopiero wtedy idziemy dalej.

---

### Krok 2 — Audyt 6 formularzy, jeden po drugim

Dopiero gdy trigger udowodniony. Dla KAŻDEGO formularza osobno wykonuję ten sam mini-cykl:

1. Przeczytanie kodu formularza i wskazanie czy robi `INSERT` do `leads`, czy `INSERT` do innej tabeli, czy tylko `functions.invoke`.
2. Wykonanie testu z UI (lub symulacja inserta klienckiego z anon key).
3. `SELECT` na `leads` po `created_at desc` — czy rekord wpadł.
4. Logi `notify-lead` — czy trigger odpalił, czy Resend OK.
5. Raport: ✅ działa / ❌ co jest zepsute → punktowa naprawa TYLKO tego jednego formularza.

**Lista 6 formularzy do audytu (kolejność):**

| # | Formularz | Plik | Tabela docelowa | Znane ryzyko |
|---|-----------|------|-----------------|--------------|
| 1 | Dymek (floating bubble) | `FloatingContactBubble` → `useContactForm` | `leads` | `.insert(...).select('id').single()` — anon nie ma SELECT na `leads` (RLS), 401 mimo udanego INSERT |
| 2 | Strona główna — hero form | `HomeHeroForm` → `useContactForm` | `leads` | to samo co #1 (wspólny hook) |
| 3 | Karta produktu — pełny formularz | `ProductDetail` / `useContactForm` | `leads` | to samo co #1 |
| 4 | Karta produktu — szybki callback | `ProductLeadCallback` → `useLeadSubmit` | `leads` | `INSERT` bez `.select()` — powinno działać, weryfikuję |
| 5 | Strona /contact — formularz | `ContactLeadForm` | `leads` | po wcześniejszym refactorze brak ręcznego invoke — ma polegać na triggerze |
| 6 | Karta produktu — modal cenowy | `PriceInquiryModal` | `price_inquiries` (nie `leads`!) | trigger NIE obejmuje tej tabeli — tu nadal musi być ręczny `functions.invoke('notify-lead')` |

**Naprawa wzorca z #1 (dotyczy formularzy 1, 2, 3):**
W `useContactForm.ts` usuwam `.select('id').single()`. Lead ID do GA4 zastępuję `crypto.randomUUID()` (już jest fallback w kodzie). Po tej zmianie INSERT przejdzie pod RLS dla anon, trigger DB wyśle mail.

**Dla #6 (PriceInquiryModal):** zostawiam ręczny `invoke` — tabela `price_inquiries` nie ma triggera i celowo nie dodajemy go w tym kroku (osobny temat).

---

### Co zmieniam fizycznie

1. **Migracja DB** (Krok 1b, tylko jeśli test SQL nie wyśle maila):
   - `CREATE OR REPLACE FUNCTION public.notify_lead_created()` — `public.http_post` zamiast `extensions.http_post`, `SET search_path = public`.

2. **Frontend** (Krok 2, po naprawie triggera):
   - `src/hooks/useContactForm.ts` — usunięcie `.select('id').single()`, użycie `crypto.randomUUID()` dla GA4.
   - Pozostałe pliki tylko jeśli audyt punktowy wykryje problem — nie ruszam ich „prewencyjnie".

3. **Bez zmian:** `PriceInquiryModal.tsx`, `useLeadSubmit.ts` (chyba że audyt pokaże problem), edge function `notify-lead` (już naprawione w poprzednich krokach).

---

### Kontrakt na każdy krok

Po każdej pojedynczej zmianie raportuję Tobie:
- co zmieniłem,
- wynik testu (SQL insert lub UI submit),
- wpis w logach Resenda (ID maila lub błąd),
- decyzja: idziemy dalej / cofamy.

Zaczynam od Kroku 1a — czysty test SQL bez żadnej modyfikacji kodu. Jeśli mail przyjdzie, pomijam 1b i przechodzę do audytu formularzy. Akceptujesz?

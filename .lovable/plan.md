

## Diagnoza

Wszystkie 4 formularze (dymek, lista, karta produktu, /contact) trafiają do **jednego** edge function `notify-lead`. Handler jest spójny, payload pasuje. Problem nie leży w formularzach.

Znalazłem **dwa realne problemy**, które razem dają objaw "wysyłka nie działa":

### Problem 1 — CORS preflight blokuje request w przeglądarce
W `notify-lead/index.ts` `Access-Control-Allow-Headers` zawiera tylko:
```
authorization, x-client-info, apikey, content-type
```
Nowsza wersja `@supabase/supabase-js` (używana w `src/integrations/supabase/client.ts`) wysyła dodatkowo `x-supabase-client-platform`, `x-supabase-client-platform-version`, `x-supabase-client-runtime`, `x-supabase-client-runtime-version`. Brak tych nagłówków → przeglądarka odrzuca preflight → `supabase.functions.invoke` rzuca błędem zanim cokolwiek dotrze do handlera. To tłumaczy, czemu w logach `notify-lead` jest pusto i czemu front pokazuje "Błąd wysyłki".

### Problem 2 — adresat maila niezgodny z trybem sandbox Resend
Obecnie:
```ts
from: "Stakerpol <onboarding@resend.dev>"
to:   "info@stakerpol.pl"
```
Resend w trybie sandbox (bez zweryfikowanej domeny) pozwala wysyłać `onboarding@resend.dev` **wyłącznie na adres właściciela konta Resend**. Potwierdzasz, że `info@stakerpol.pl` to właśnie ten adres → wystarczy zostawić obecną konfigurację `from`/`to` i zadziała. **Żadna zmiana adresów nie jest potrzebna.**

### Co NIE jest problemem
- Mapowanie pól (`name`, `contact`, `message`, `phone`, `product_model`) — `useContactForm` poprawnie składa `LeadPayload`.
- `RESEND_API_KEY` — jest skonfigurowany.
- Zapis do `leads` — działa (idzie przed `invoke`, nie wysypuje się).
- `useLeadSubmit` (mini-formularz "oddzwonimy w 30 min") — zapisuje tylko do DB; wysyłkę maila i tak odpala trigger `notify_lead_created` → edge function.

---

## Plan naprawy

### Krok 1 — naprawa CORS w `supabase/functions/notify-lead/index.ts`

Rozszerzam nagłówki:
```ts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```
Stosowane w odpowiedzi OPTIONS, 200 i 500 (tam już są).

### Krok 2 — utwardzenie raportowania błędów w handlerze

Obecnie błąd Resend leci tylko do `console.error`, a handler zwraca `{ ok: true }`. Zmiana:
- jeśli Resend zwróci błąd **i** `webhookUrl` też zawiódł (lub nie jest ustawiony) → handler odpowiada `502` z treścią błędu, dzięki czemu front pokaże "Błąd wysyłki" zamiast cichej awarii,
- jeśli webhook się powiódł (lead trafił gdzieś indziej) → nadal `200`,
- dorzucam `reply_to: lead.email || lead.phone-derived undefined`, żeby w przychodzącej wiadomości można było odpowiedzieć bezpośrednio klientowi.

`from`/`to` zostają **bez zmian** (`Stakerpol <onboarding@resend.dev>` → `info@stakerpol.pl`).

### Krok 3 — bez zmian po stronie frontendu

Żaden plik w `src/components/contact/*`, `src/components/products/*` ani `src/hooks/*` się nie zmienia. Payload i tak jest poprawny.

### Krok 4 — deploy edge function

Deploy `notify-lead` po zmianach.

### Krok 5 — testy 4 formularzy

Dla każdego: wysyłam testową wiadomość, sprawdzam:
1. status w panelu (toast "Dziękujemy") — PASS/FAIL,
2. nowy rekord w tabeli `leads` — PASS/FAIL,
3. log w `notify-lead` z `Email sent successfully` + `id` z Resend — PASS/FAIL.

Formularze:
- **Floating bubble** (desktop, dowolna podstrona) — `source: floating_widget`,
- **Lista produktów** `/products` → "Zapytaj o produkt" → `InquiryModal` — `source: product_list`,
- **Karta produktu** `/products/:slug` → ten sam `InquiryModal` — `source: product_page`,
- **`/contact`** → `ContactLeadForm` — `source: contact_page`.

Potwierdzenie faktycznego dotarcia maila na `info@stakerpol.pl` zostawiam Tobie — z mojej strony zweryfikuję `Email sent successfully` w logach (Resend zwraca ID maila).

---

## Pliki, które się zmienią

- `supabase/functions/notify-lead/index.ts` — rozszerzone CORS headers, lepsza obsługa błędów Resend, opcjonalny `reply_to`. Bez zmian w `from`/`to`.

Po Twoim "akceptuję" implementuję Kroki 1–4 i raportuję wyniki Kroku 5.


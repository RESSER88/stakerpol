

# Plan: Natychmiastowa naprawa wysyłki emaili z notify-lead

## Problem
Resend zwraca błąd 403 bo domena `stakerpol.pl` nie jest zweryfikowana. Emaile nie dochodzą.

## Rozwiązanie

### Plik: `supabase/functions/notify-lead/index.ts`
1. Zmienić `from: "Stakerpol <noreply@stakerpol.pl>"` → `from: "Stakerpol <onboarding@resend.dev>"`
2. Dodać logowanie pełnej odpowiedzi z Resend (dla debugowania)
3. Deploy edge function
4. Przetestować wysyłkę emaila wywołując funkcję z testowymi danymi

### Wynik
Email z powiadomieniem o nowym zapytaniu dotrze na `info@stakerpol.pl` natychmiast po zmianie.

> **Uwaga:** `onboarding@resend.dev` to testowa domena Resend — działa bez weryfikacji DNS. Aby wrócić do `@stakerpol.pl`, trzeba zweryfikować domenę w panelu Resend (dodać rekordy DNS u rejestratora).


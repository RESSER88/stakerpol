# FINAL AI ARCHITECTURE — bezpośrednie OpenAI API (rozszerzenie Planu v2)

Status: specyfikacja. Nic nie jest wdrażane (brak kluczy, Edge Functions, migracji, zmian UI).
Zasada nadrzędna: brak jakiegokolwiek połączenia z Lovable AI (bez Lovable AI Gateway, bez `LOVABLE_API_KEY`, bez modeli i billingu Lovable). Jedyny provider: OpenAI API na Twoim koncie (API, billing, limity, tokeny, wybór modeli).

## A. Brakujące elementy AI w Planie v2

1. Nie określono providera ani drogi połączenia.
2. Brak miejsca przechowywania klucza i zasad jego odczytu.
3. Model zapisany na sztywno, brak whitelisty i testu połączenia.
4. Brak schematu odpowiedzi i walidacji przed zapisem draftu.
5. Brak autoryzacji endpointu (tylko admin), limitów, obsługi błędów OpenAI.
6. Brak śladu diagnostycznego: produkt → generacja → model → czas → status → wersja promptu.

## B. Finalna architektura komunikacji

```text
Admin UI (SEO Manager > zakładka AI / karta egzemplarza VARIANT|UNIQUE)
   | supabase.functions.invoke('generate-product-delta', { product_id })
   |   (JWT zalogowanego admina; przeglądarka nie zna klucza ani nie wybiera modelu)
   v
Edge Function generate-product-delta (Deno, Supabase)
   1. weryfikacja JWT + has_role(uid,'admin')
   2. walidacja product_id (UUID, istnieje, nie sold, kwalifikacja != STANDARD, content_lock = false)
   3. odczyt: products, wynik Diff Engine, model_content, ai_settings
   4. sprawdzenie ai_settings.enabled i model ∈ ALLOWED_MODELS
   5. budowa promptu (wersja z ai_settings.prompt_version)
   v
fetch -> https://api.openai.com/v1/responses  (Authorization: Bearer OPENAI_API_KEY)
   v
Structured Output (json_schema, strict)
   v
Walidacja w Edge Function
   v
ai_generations (wpis) -> product_seo_settings.delta_content, ai_status='draft'
   v
Ręczna akceptacja redaktora -> ai_status='approved'
   v
Mikro-akapit na /produkty/:slug + JSON-LD
```

Odpowiedzialności:
- Frontend: przycisk w SEO Managerze (hook `useProductDeltaAI`), wysyła tylko `product_id`.
- Połączenie HTTP z OpenAI: wyłącznie Edge Function (bez SDK Lovable, zwykły `fetch` lub oficjalny pakiet `openai`).
- Wybór modelu: `ai_settings.model`, sprawdzany w Edge Function.
- Walidacja i zapis: Edge Function, przed jakimkolwiek zapisem.
- Draft: `product_seo_settings` (1:1, werdykt A).

## C. Klucz OPENAI_API_KEY

- Nazwa: `OPENAI_API_KEY`. Miejsce: sekrety Supabase Edge Functions (Project Settings → Secrets), dodany przez Ciebie przez bezpieczny formularz — wartość nie przechodzi przez czat.
- Odczyt: `Deno.env.get('OPENAI_API_KEY')`; brak → status `Not configured`, odpowiedź 503 bez szczegółów.
- NIGDY: React, `src/`, `VITE_*`, `.env`, GitHub, baza, `ai_settings`, odpowiedzi funkcji, logi.
- Produkcja: klucz produkcyjny w sekretach środowiska produkcyjnego. Staging/dev: osobny klucz (osobny projekt OpenAI z niskim limitem wydatków) w środowisku testowym.
- Zalecenie po Twojej stronie w OpenAI: osobny projekt „stakerpol”, miesięczny limit budżetu, klucz z dostępem tylko do Responses API.

## D. Konfiguracja modelu i ALLOWED MODELS

- SECRET: `OPENAI_API_KEY` (sekrety). CONFIGURATION: tabela `ai_settings` (jeden wiersz): `provider` ('openai'), `model`, `enabled`, `prompt_version` (np. `product_delta_v1`), `paused_reason`, `last_test_at`, `last_test_status`, `last_test_latency_ms`, `updated_at`, `updated_by`.
- Whitelista (rekomendacja MVP): stała `ALLOWED_MODELS` w module `_shared/ai/openai.ts` Edge Functions — backend decyduje, frontend pobiera listę z funkcji `ai-config` i pokazuje dropdown. Brak pola tekstowego na model.
- Zapis modelu przez funkcję `ai-config` (tylko admin): odrzuca model spoza whitelisty. `generate-product-delta` sprawdza to ponownie przed każdym wywołaniem.
- Nazwy modeli na whiteliście: weryfikowane w Etapie 0 z dokumentacją OpenAI i endpointem `GET /v1/models` na Twoim koncie (przykłady GPT-5.6 Luna/Terra/Sol dopiszemy tylko, jeśli konto je udostępnia). Model domyślny wybierzesz Ty.
- Abstrakcja: `getProvider('openai').generate({ model, system, input, schema })` — kolejny provider = nowy plik adaptera, bez zmian UI.
- Rozdzielenie: PRODUCT DATA (`products`), AI OUTPUT (`product_seo_settings`), GLOBAL AI CONFIG (`ai_settings`) — zmiana modelu nie zmienia danych produktów.

## E. Admin UX (zakładka „AI” w SEO Managerze)

```text
Provider:   OpenAI API
Model:      [ <model z whitelisty>  v ]
Status:     Not configured | Connected | Error: <typ> | Paused (<powód>)
Ostatni test: 2026-09-28 12:50, 840 ms
[ Test połączenia ]
```
Przy egzemplarzach VARIANT/UNIQUE: `[ Generuj draft AI ]` — nieaktywny dla STANDARD, przy content_lock, przy Paused/Not configured.

## F. Test połączenia (`ai-connection-test`)

Tylko admin; używa `OPENAI_API_KEY`; minimalne żądanie do OpenAI (krótki prompt techniczny, bez danych produktu). Zwraca `{ success, provider:"openai", model, latency_ms, error_type? }`; wynik zapisany w `ai_settings.last_test_*`. Klucz nigdy nie jest zwracany.

## G. Generowanie Product Delta (przykład SN 6627934)

Wejście (tylko fakty z bazy): SWE 200D, SN 6627934, rok, mth, maszt 2700 mm, wolny skok 1400 mm, podest, opcje dodatkowe, kwalifikacja UNIQUE, delty z Diff Engine, skrót model_content jako kontekst.

Prompt systemowy `product_delta_v1`:
- opisuj wyłącznie przekazane delty względem standardu modelu, nie cały opis SWE 200D;
- nie wymyślaj parametrów, certyfikatów, gwarancji, zastosowań bez podstaw, opinii, recenzji;
- nie zmieniaj liczb; bez marketingowego „lania wody”;
- maks. 350 znaków, po polsku; przy brakach/sprzecznościach → `warnings`.

Schemat (strict):
```json
{ "delta_content": "string", "detected_features_used": ["string"], "warnings": ["string"] }
```

Walidacja w kodzie: poprawny JSON; `delta_content` niepusty i ≤ 350 znaków; każda liczba w tekście występuje w faktach; `detected_features_used` ⊆ delty; brak słów zakazanych („gwarancja”, „certyfikat”, „najlepszy” itd.). Niezgodność → brak zapisu treści, `ai_generations.status='invalid'`, komunikat dla admina. AI zawsze zapisuje tylko `draft`.

## H. Błędy, limity, koszt, logowanie

- Długość: `max_output_tokens` w żądaniu (np. 400) + limit znaków w walidacji.
- Timeout: 60 s na wywołanie OpenAI (AbortController).
- 429 / 5xx: maks. 1 automatyczne ponowienie z odczekaniem (Retry-After), potem błąd — brak pętli.
- 400 / 404 (zły model lub schemat): bez ponowień, „nieprawidłowa konfiguracja modelu”.
- 401: „Not configured / nieprawidłowy klucz”.
- 429 `insufficient_quota` (brak środków na koncie OpenAI): `ai_settings.enabled=false`, `paused_reason='quota'`; przyciski wyłączone do ręcznego odblokowania.
- Anty-spam: blokada, gdy trwa generacja dla produktu lub ostatnia < 30 s; dzienny limit (np. 50) liczony z `ai_generations`.
- Tabela `ai_generations` (potrzebna — historia także nieudanych prób bez nadpisywania draftu): `id, product_id, provider, model, prompt_version, status (success|invalid|error|paused), error_type, latency_ms, input_tokens, output_tokens, openai_request_id, created_by, created_at`. Bez promptu, bez surowej odpowiedzi, bez kluczy. Diagnostyka kosztu: produkt → generacja → model → czas → status → tokeny; szczegółowe koszty w panelu Twojego konta OpenAI.
- PROMPT_VERSION: tak — `ai_settings.prompt_version` + kolumna `prompt_version` w `ai_generations` i `product_seo_settings`. Bez systemu wersjonowania treści.

## Security

- Obie funkcje: walidacja JWT w kodzie + `has_role(uid,'admin')`; niezalogowany → 401, zwykły użytkownik → 403.
- `product_id` walidowany (UUID, istnieje, nie sold); STANDARD → 409; content_lock → 409.
- RLS: `ai_settings`, `ai_generations` — tylko admin; zapisy przez service_role w funkcji; GRANT tylko authenticated/service_role, bez anon.
- Publicznie tylko treść `approved`.
- Dodatkowo: istniejący `test-translation-direct.js` w repo zawiera klucz publiczny i test starej funkcji — poza zakresem, do decyzji w Etapie 0.

## I. Zmiany do dopisania w Planie v2

- Etap 0 (rozszerzony): usunięcie ProductSchema.tsx, baseline 37 egzemplarzy, weryfikacja modeli na Twoim koncie OpenAI, ustalenie whitelisty i modelu domyślnego, dodanie `OPENAI_API_KEY` (przez Ciebie).
- Etap 2a — AI Provider Configuration: `ai_settings`, funkcja `ai-config`, zakładka „AI”, `ai-connection-test`.
- Etap 2b — Secure OpenAI Integration: `generate-product-delta` (auth, walidacja wejścia, adapter OpenAI, whitelist, obsługa błędów).
- Etap 3 (rozszerzony) — Product Delta Generation: prompt `product_delta_v1`, schemat, walidacja, draft, `ai_generations`.
- Etapy 4–5 bez zmian. QA: SN 6627934 (UNIQUE), SN 6625316 (VARIANT), odmowa dla STANDARD, wywołanie jako niezalogowany i zwykły użytkownik, model spoza whitelisty, brak klucza, symulacja 429/quota.

## J. Finalna decyzja

READY FOR AI IMPLEMENTATION — z warunkami Etapu 0: potwierdzenie listy modeli dostępnych na Twoim koncie OpenAI, wybór modelu domyślnego, dodanie `OPENAI_API_KEY` do sekretów przez Ciebie.

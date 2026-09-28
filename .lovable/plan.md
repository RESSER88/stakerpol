# AI INTEGRATION ARCHITECTURE — rozszerzenie Planu v2 (SEO_MODEL_CONTENT_AI)

Status: specyfikacja. Nic nie jest wdrażane (brak kluczy, Edge Functions, migracji, zmian UI).

## A. Brakujące elementy AI w Planie v2

1. Nie określono dostawcy ani drogi połączenia („AI Gateway” był tylko nazwą).
2. Brak miejsca przechowywania klucza i zasad jego odczytu.
3. Model zapisany na sztywno, brak konfiguracji i testu połączenia.
4. Brak schematu odpowiedzi i walidacji przed zapisem draftu.
5. Brak autoryzacji endpointu (tylko admin), limitów, obsługi błędów 402/403/429.
6. Brak śladu diagnostycznego: produkt → generacja → model → czas → status → wersja promptu.

## B. Finalna architektura komunikacji

```text
Admin UI (SEO Manager > "Do akceptacji" / karta egzemplarza)
   | supabase.functions.invoke('generate-product-delta', { product_id })
   |   (JWT zalogowanego admina, brak klucza w przeglądarce)
   v
Edge Function generate-product-delta  (Deno, serwer)
   1. weryfikacja JWT + has_role(uid,'admin')
   2. walidacja product_id (UUID, istnieje, nie sold, kwalifikacja != STANDARD, content_lock = false)
   3. odczyt: products, wynik Diff Engine, model_content, ai_settings
   4. budowa promptu (PROMPT_VERSION = product_delta_v1)
   v
Provider "openai" -> Lovable AI Gateway (/v1/responses, modele OpenAI)
   v
Odpowiedź strukturalna (JSON wg schematu)
   v
Walidacja w Edge Function (schemat + długość + zgodność liczb z faktami)
   v
product_seo_settings.delta_content, ai_status = 'draft'  + wpis w ai_generations
   v
Redaktor: zatwierdź / edytuj i zablokuj / generuj ponownie / odrzuć
   v
ai_status = 'approved' (tylko ręcznie) -> mikro-akapit na /produkty/:slug + JSON-LD
```

Odpowiedzialności:
- Wywołanie AI z frontendu: wyłącznie przycisk w SEO Managerze (nowy hook `useProductDeltaAI`), przekazuje tylko `product_id`.
- Połączenie HTTP z AI: tylko w Edge Function.
- Wybór modelu: Edge Function czyta `ai_settings` (nie komponent).
- Walidacja: Edge Function, przed jakimkolwiek zapisem.
- Zapis draftu: `product_seo_settings` (relacja 1:1, zgodnie z werdyktem A).

## C. Bezpieczne przechowywanie klucza

- Pierwszy provider: modele OpenAI udostępniane przez Lovable AI Gateway. Secret: `LOVABLE_API_KEY` — zarządzany przez platformę, zapisany w sekretach Supabase Edge Functions, odczyt `Deno.env.get('LOVABLE_API_KEY')`. Nie trafia do `src/`, Git, bazy ani odpowiedzi.
- Opcja na przyszłość (bezpośrednie konto OpenAI): secret `OPENAI_API_KEY` dodany przez bezpieczny formularz sekretów; ta sama abstrakcja providera, zmiana tylko w Edge Function.
- Produkcja: sekret w środowisku produkcyjnym Edge Functions. Staging/dev: osobna wartość w środowisku testowym (osobny limit 100 sekretów na środowisko). Brak zmian w `.env` i zmiennych `VITE_*`.
- Edge Function nigdy nie zwraca ani nie loguje klucza, nagłówków autoryzacji ani pełnych odpowiedzi providera.

## D. Konfiguracja modelu

Rozdzielenie:
- SECRET: klucz API (sekrety Edge Functions).
- CONFIGURATION: nowa tabela `ai_settings` (jeden wiersz): `provider` ('openai'), `model` (np. `openai/gpt-6-astra` — domyślny), `allowed_models` (lista), `reasoning_effort` ('low'|'medium'), `prompt_version`, `enabled`, `paused_reason`, `updated_at`, `updated_by`.
- Uzasadnienie wyboru B+C: model zmienia admin w SEO Managerze bez redeployu; secret zostaje oddzielnie. Lista `allowed_models` weryfikowana przy wdrożeniu z listą modeli bramki (`/v1/models`) — nie z pamięci. Nazwy typu „GPT-5.6 Luna/Terra/Sol” trafią na listę tylko jeśli bramka je potwierdzi.
- Abstrakcja w Edge Function: `getProvider(settings.provider) -> generate({ model, system, input, schema })`. Teraz jedna implementacja: `openai`.
- PRODUCT DATA (products), AI OUTPUT (product_seo_settings) i GLOBAL AI CONFIG (ai_settings) są rozdzielone — zmiana modelu nie zmienia danych produktów.

## E. Admin UX (zakładka „AI” w SEO Managerze, jedna karta)

```text
AI Provider:    OpenAI (przez Lovable AI Gateway)
Model:          [ openai/gpt-6-astra  v ]   (tylko allowed_models)
Status:         Connected | Error: <typ> | Not configured | Paused (brak środków)
Ostatni test:   2026-09-28 12:50, 840 ms
[ Test AI connection ]
```
Na karcie egzemplarza (VARIANT/UNIQUE): `[ Generuj draft AI ]` — nieaktywny dla STANDARD, przy content_lock, przy statusie Paused.

## F. Test połączenia

Edge Function `ai-connection-test` (tylko admin): minimalne wywołanie z krótkim promptem technicznym („odpowiedz: OK”), bez danych produktu. Zwraca `{ success, provider, model, latency_ms, error_type?, error_message? }`. Wynik zapisywany w `ai_settings.last_test_*`. Klucz nigdy nie jest zwracany.

## G. Generowanie Product Delta (przykład SN 6627934)

Dane wejściowe (tylko fakty z bazy): model SWE 200D, SN 6627934, rok, mth, maszt 2700 mm, wolny skok 1400 mm, podest, opcje dodatkowe, kwalifikacja UNIQUE, lista delt z Diff Engine, skrót model_content (kontekst — nie do przepisywania).

Prompt systemowy (product_delta_v1), zasady:
- opisuj wyłącznie przekazane delty względem standardu modelu;
- nie wymyślaj parametrów, certyfikatów, gwarancji, zastosowań bez uzasadnienia w danych, opinii, recenzji;
- nie zmieniaj żadnych liczb; bez przymiotników marketingowych;
- maksymalnie 350 znaków, język polski;
- jeśli danych brak lub są sprzeczne — dopisz ostrzeżenie w `warnings`, zamiast zgadywać.

Schemat odpowiedzi (strict, wszystkie pola wymagane, bez limitów w schemacie):
```json
{ "delta_content": "string", "detected_features_used": ["string"], "warnings": ["string"] }
```

Walidacja w kodzie: poprawny JSON; `delta_content` niepusty i ≤ 350 znaków; każda liczba w tekście występuje w faktach wejściowych; `detected_features_used` ⊆ lista delt; brak słów z listy zakazanej (np. „gwarancja”, „certyfikat”, „najlepszy”). Niezgodność → brak zapisu treści, `ai_generations.status = 'invalid'`, komunikat dla admina. Zapis zawsze jako `ai_status = 'draft'`; AI nie może ustawić `approved`.

## H. Błędy, limity, koszt, logowanie

- Długość: limit w prompcie + przycięcie/odrzucenie w walidacji (model nie przyjmuje parametru max_tokens).
- Strumieniowanie odpowiedzi po stronie Edge Function (brak sztucznych timeoutów, anulowanie tylko przez użytkownika).
- 429 i 5xx: maks. 1 automatyczne ponowienie z backoffem (Retry-After), potem błąd dla admina — brak pętli.
- 400 (zły model/schemat): bez ponowień, komunikat „nieprawidłowa konfiguracja”.
- 401: „Not configured”.
- 402 / 403 (brak środków, limit workspace, odmowa dostawcy): `ai_settings.enabled=false` + `paused_reason`; wszystkie przyciski AI wyłączone do ręcznego odblokowania.
- Anty-spam: odrzucenie, jeśli dla produktu trwa generacja lub ostatnia była < 30 s temu; dzienny limit generacji (np. 50) sprawdzany w `ai_generations`.
- Nowa tabela `ai_generations` (uzasadnienie: jedyny sposób na historię prób, także nieudanych, bez nadpisywania draftu): `id, product_id, model, provider, prompt_version, status (success|invalid|error|paused), error_type, latency_ms, run_id, created_by, created_at`. Bez treści promptu, bez kluczy, bez surowych odpowiedzi. Diagnostyka kosztu: produkt → generacja → model → czas → status; szczegóły zużycia w logach bramki (run_id).
- PROMPT_VERSION: tak, jako stała w Edge Function + kolumna `prompt_version` w `product_seo_settings` i `ai_generations`. Bez systemu wersjonowania treści.

## Security

- `verify_jwt = true` dla obu funkcji; w kodzie dodatkowo `has_role(uid,'admin')` — niezalogowany i zwykły użytkownik: 401/403.
- `product_id` walidowany (UUID, istnieje, nie sold); STANDARD → 409 „nie wymaga AI”; content_lock → 409.
- RLS: `ai_settings` i `ai_generations` — odczyt/zapis tylko admin; zapis generacji przez service_role w funkcji. Nadane GRANT-y wyłącznie dla authenticated/service_role, bez anon.
- Publicznie widoczna tylko treść `approved` (istniejące zasady odczytu product_seo_settings do weryfikacji przy wdrożeniu).

## I. Zmiany do dopisania w Planie v2

- Etap 0 (rozszerzony): usunięcie ProductSchema.tsx, baseline 37 egzemplarzy + weryfikacja listy modeli bramki i dostępności klucza.
- Etap 2a — AI Provider Configuration: tabela `ai_settings`, zakładka „AI” w SEO Managerze, `ai-connection-test`.
- Etap 2b — Secure AI Gateway: Edge Function `generate-product-delta` (auth, walidacja wejścia, abstrakcja providera, streaming, obsługa błędów).
- Etap 3 (rozszerzony) — Product Delta Generation: prompt product_delta_v1, schemat, walidacja, zapis draftu, tabela `ai_generations`.
- Etap 4 bez zmian (akceptacja redaktora), Etap 5 bez zmian (mikro-akapit na /produkty/:slug), QA dopisane: test SN 6627934 (UNIQUE), SN 6625316 (VARIANT), odmowa dla STANDARD, test jako niezalogowany i zwykły użytkownik, symulacja 402/429.

## J. Finalna decyzja

READY FOR AI IMPLEMENTATION — pod warunkiem wykonania w Etapie 0 weryfikacji listy modeli bramki (identyfikatory do `allowed_models`) i zatwierdzenia przez Ciebie: dostawca = modele OpenAI przez Lovable AI Gateway (bez osobnego konta OpenAI), domyślny model `openai/gpt-6-astra`.

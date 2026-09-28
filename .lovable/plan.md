# AI PROVIDER MANAGER — raport architektury (rozszerzenie Planu v2)

Status: audyt + specyfikacja. Nic nie jest wdrażane (brak tabel, Edge Functions, sekretów, zmian UI, usuwania DeepL).
Zasady: bez Lovable AI (bez gatewaya, `LOVABLE_API_KEY`, billingu Lovable). Providerzy: OpenAI, Anthropic, Google Gemini — na Twoich kontach i kluczach. DeepL nie jest częścią nowego systemu.

## A. Obecna architektura AI

- Brak jakiejkolwiek integracji z modelem językowym (OpenAI/Anthropic/Gemini) w kodzie i bazie.
- Jedyna „AI” w projekcie to stary system tłumaczeń DeepL (opis w B/C).
- SEO Manager (`src/components/admin/SEOManagerTool.tsx`) — ręczna edycja `product_seo_settings`, bez AI.

## B. Mapa DeepL / translation

| Element | Rodzaj | Kto używa |
|---|---|---|
| `supabase/functions/auto-translate` | Edge Function, woła `api-free.deepl.com`, klucze czyta z tabeli `deepl_api_keys` | hooki niżej, translation-worker |
| `supabase/functions/schedule-translations` | Edge Function (kolejka `translation_jobs`) | `useAutoTranslation` |
| `supabase/functions/translation-worker` | Edge Function (cron → auto-translate) | cron usunięty migracją 2026-08-05 |
| `deepl_api_keys` | tabela z `api_key_encrypted` (klucz w bazie) | auto-translate |
| `translation_jobs`, `translation_logs`, `translation_stats` | tabele | funkcje DeepL |
| `product_translations` | tabela z przetłumaczonymi polami | `useProductTranslationsDisplay` na karcie produktu |
| `src/hooks/useProductTranslationIntegration.ts` | nasłuch realtime INSERT na `products` → `auto-translate` | `Layout.tsx` (każda publiczna strona) |
| `src/hooks/useAutoTranslation.ts` | wywołania auto-translate / schedule-translations | tylko `useProductTranslationIntegration` |
| `src/hooks/useProductTranslations.ts` | `translateProductFields` | `useSupabaseProducts` — za flagą `DEEPL_ENABLED=false` |
| `src/hooks/useProductTranslationsDisplay.ts` | odczyt `product_translations` | `ProductDetail.tsx` |
| `FEATURES.DEEPL_ENABLED` | flaga = false | `useSupabaseProducts` |
| `test-translation-direct.js` | skrypt testowy w katalogu głównym | nikt |
| `AI_TRANSLATION_PLAN.md` | dokument | nikt |
| `src/utils/translations/*` | statyczne tłumaczenia UI (PL/EN/DE/SK/CS) | cała strona — NIE dotyczy DeepL, zostaje |

## C. Aktywne vs martwe

- Aktywne (ryzyko): `useProductTranslationIntegration` w `Layout.tsx` — każdy odwiedzający otwiera kanał realtime na `products` i przy dodaniu produktu jego przeglądarka woła `auto-translate`. Działa niezależnie od flagi `DEEPL_ENABLED`. Do odłączenia jako pierwsze.
- Aktywne (odczyt): `useProductTranslationsDisplay` na karcie produktu czyta `product_translations` — przed usunięciem sprawdzić, czy tabela ma dane i czy wersje EN/DE/SK/CS ich używają.
- Martwe: `useProductTranslations` (flaga false), `translation-worker` (brak cron), `schedule-translations` (tylko przez martwą ścieżkę), `test-translation-direct.js` (kandydat do usunięcia), `AI_TRANSLATION_PLAN.md`.
- Do weryfikacji przed usunięciem: czy `deepl_api_keys` zawiera klucze (usunąć i unieważnić u DeepL), zawartość `translation_*`.
- Kolejność sprzątania (osobny etap, po akceptacji): odłączyć hook z Layout → wyłączyć funkcje → decyzja o `product_translations` → usunięcie tabel/kodu.

## D. Proponowana architektura

```text
SEO Manager → zakładka "AI / Providers"
   | supabase.functions.invoke('ai-providers', {...})  (JWT admina)
   v
Edge Function ai-providers  (zarządzanie: klucze, modele, test, aktywny provider)
Edge Function generate-product-delta  (generowanie)
   | wspólny moduł _shared/ai/: registry + adaptery
   v
getProvider(ai_settings.active_provider)  → OpenAIProvider | AnthropicProvider | GeminiProvider
   v
API providera (klucz z Vault, tylko w pamięci funkcji)
   v
Structured output → walidacja → ai_generations → product_seo_settings (draft)
   v
Ręczna akceptacja → approved → /produkty/:slug
```
Frontend nigdy nie łączy się z API providera i nigdy nie otrzymuje klucza.

## E. Przechowywanie kluczy

- Wymaganie „admin dodaje/usuwa klucz z panelu” wyklucza sekrety Edge Functions (zmiana wymagałaby tokena zarządczego Supabase o pełnych uprawnieniach — zbyt ryzykowne).
- Rekomendacja: Supabase Vault (`vault.secrets`, szyfrowanie po stronie bazy). Nazwy: `ai_key_openai`, `ai_key_anthropic`, `ai_key_gemini`.
- Dostęp wyłącznie przez funkcje `SECURITY DEFINER` w schemacie prywatnym (`private.ai_key_set/delete/get`), z `EXECUTE` tylko dla `service_role`. Brak dostępu dla `anon`/`authenticated`, brak widoku w PostgREST.
- Odczyt klucza tylko w Edge Function (service role) tuż przed wywołaniem providera; nigdy w odpowiedzi, logach, `ai_settings`, localStorage, `VITE_*`, Git.
- UI pokazuje tylko `Configured ••••` i datę dodania (bez fragmentów klucza).
- Staging/dev: osobny projekt Supabase = osobny Vault i osobne klucze.

## F. Dodawanie klucza

Admin wpisuje klucz w polu typu hasło → `ai-providers {action:'set_key', provider, key}` (HTTPS) → JWT + `has_role(admin)` → walidacja formatu → test połączenia z tym kluczem → dopiero przy sukcesie zapis do Vault → status `Connected`. Pole czyszczone natychmiast po wysłaniu; klucz nie wraca do przeglądarki.

## G. Usuwanie klucza

`[ Usuń API key ]` → potwierdzenie → `ai-providers {action:'delete_key', provider}` → usunięcie z Vault → `ai_provider_configs.status='not_configured'`. Jeśli był aktywnym providerem: `ai_settings.enabled=false`, `paused_reason='no_key'`, przyciski generowania wyłączone. Trwające generowanie kończy się (klucz był już w pamięci), kolejne są odrzucane.

## H. Test providera

`ai-providers {action:'test', provider}` → adapter `testConnection()` = listowanie modeli (bez generowania treści, bez danych produktu, zero kosztu tokenów). Zwraca `{ success, provider, latency_ms, models_count, error_type? }`; zapis w `last_test_*`.

## I. Modele

| Provider | Sposób ustalania | Model domyślny | Źródło |
|---|---|---|---|
| OpenAI | `GET https://api.openai.com/v1/models` ∩ filtr modeli tekstowych | wybiera admin po teście | dokumentacja OpenAI API (Models) |
| Anthropic | `GET https://api.anthropic.com/v1/models` | wybiera admin po teście | dokumentacja Anthropic API (Models) |
| Google Gemini | `GET https://generativelanguage.googleapis.com/v1beta/models`, tylko z `generateContent` | wybiera admin po teście | dokumentacja Gemini API (models.list) |

- Lista pobierana przez backend na koncie danego klucza i zapisywana w `ai_provider_configs.available_models` (cache, odświeżane przy teście). Żadnych nazw modeli wymyślonych w kodzie.
- Filtr bezpieczeństwa w adapterze: tylko modele tekstowe (bez embeddingów, audio, obrazów).
- Dropdown modelu zmienia się wraz z providerem; brak ręcznego wpisywania. Edge Function przed każdym wywołaniem sprawdza `model ∈ available_models`.

## J. Konfiguracja (schemat)

- `ai_settings` (1 wiersz): `active_provider`, `active_model`, `enabled`, `paused_reason`, `prompt_version`, `updated_at`, `updated_by`.
- `ai_provider_configs` (1 wiersz na providera): `provider` (PK), `enabled`, `selected_model`, `available_models` jsonb, `models_synced_at`, `status` (not_configured|connected|error), `key_configured_at`, `last_test_at`, `last_test_status`, `last_error_type`, `updated_at`, `updated_by`.
- `ai_generations`: `id, product_id, provider, model, prompt_version, status (success|invalid|error|paused), error_type, latency_ms, input_tokens, output_tokens, created_by, created_at` — bez promptu, odpowiedzi i kluczy.
- Klucze: tylko Vault.
- RLS: wszystkie trzy tabele — odczyt tylko admin (`has_role`), zapis tylko przez Edge Functions (service_role). GRANT bez `anon`.

## K. Provider abstraction

```text
interface AIProvider {
  id: 'openai' | 'anthropic' | 'gemini'
  testConnection(key): { ok, latencyMs, errorType? }
  listModels(key): ModelInfo[]
  generate(key, { model, system, input, schema, maxOutputTokens }):
      { json, usage, rawStatus }
  mapError(httpStatus, body): 'auth'|'quota'|'rate_limit'|'bad_model'|'server'|'timeout'
}
registry = { openai: OpenAIProvider, anthropic: AnthropicProvider, gemini: GeminiProvider }
```
Całe `if provider…` zamknięte w adapterach w `_shared/ai/`. UI i generowanie znają tylko `registry[id]`. Nowy provider = nowy adapter + wiersz w `ai_provider_configs`.

## L. Integracja z Product Delta

Bez zmian logiki: products → Diff Engine → detected_deltas → (aplikacja ustala STANDARD/VARIANT/UNIQUE; AI tego nie decyduje) → aktywny provider/model → `delta_content` (schemat `{delta_content, detected_features_used, warnings}`, ≤350 znaków, prompt `product_delta_v1` zakazujący wymyślania faktów) → walidacja (liczby ⊆ fakty, cechy ⊆ delty, słowa zakazane) → `ai_status='draft'` → akceptacja → `approved`. Limity: timeout 60 s, 1 ponowienie tylko dla 429/5xx, `quota`/`auth` → pauza aktywnego providera, anty-spam 30 s na produkt i dzienny limit.

## M. Ryzyka bezpieczeństwa

- Klucz przechodzi raz przez przeglądarkę admina przy dodawaniu (HTTPS, pole hasła, brak zapisu lokalnego) — akceptowalne; alternatywa wymagałaby ręcznego dodawania w panelu Supabase.
- Błędne uprawnienia do funkcji Vault = wyciek klucza → `EXECUTE` tylko service_role, test w QA jako anon/authenticated.
- Logowanie ciał żądań w Edge Function → zakaz logowania nagłówków i body.
- Obecny wyciek: `deepl_api_keys` trzyma klucze w zwykłej tabeli; hook DeepL działa w przeglądarkach klientów.
- Koszt: klucze na Twoich kontach — zalecane limity budżetu u każdego providera.

## N. Zmiany do implementacji

1. Migracja: `ai_settings`, `ai_provider_configs`, `ai_generations` (+GRANT, RLS), funkcje Vault w schemacie prywatnym, kolumny w `product_seo_settings` (`delta_content`, `ai_status`, `content_lock`, `prompt_version`, `ai_provider`, `ai_model`).
2. `_shared/ai/` z trzema adapterami i registry.
3. Edge Functions: `ai-providers`, `generate-product-delta`.
4. SEO Manager: zakładka „AI / Providers” (3 karty providerów + wybór aktywnego providera/modelu) i przycisk „Generuj draft AI” przy VARIANT/UNIQUE.
5. Osobny etap: sprzątanie DeepL wg C.

## O. Kolejność

0. Etap 0 Planu v2 + weryfikacja danych w `product_translations` i `deepl_api_keys`.
1. Odłączenie `useProductTranslationIntegration` z `Layout.tsx` (najpilniejsze, bez zmiany wyglądu).
2. Migracja konfiguracji + Vault.
3. Adapter OpenAI + `ai-providers` (klucz, test, modele) + zakładka AI.
4. Adaptery Anthropic i Gemini.
5. `generate-product-delta` + draft/akceptacja.
6. Usunięcie pozostałości DeepL.

Decyzja: architektura gotowa do implementacji po Twojej akceptacji raportu (w szczególności: Vault jako magazyn kluczy oraz odłączenie hooka DeepL jako pierwszy krok).

# AI PROVIDER MANAGER — finalna architektura MVP (po korektach)

Status: specyfikacja do akceptacji. Nic nie jest wdrażane.
Zasady: bez Lovable AI. W MVP wyłącznie OpenAIProvider (Twoje konto i klucz). Anthropic/Gemini tylko przewidziane w interfejsie i registry — bez kodu. DeepL nie należy do nowego systemu.

## 1. Ustalenia z audytu (stan faktyczny)

- Aktywna ścieżka DeepL: `useProductTranslationIntegration` w `Layout.tsx` — na każdej publicznej stronie otwiera nasłuch zmian `products` i przy dodaniu produktu woła `auto-translate`, niezależnie od flagi `DEEPL_ENABLED=false`.
- Odczyt: `useProductTranslationsDisplay` na karcie produktu czyta `product_translations` — zostaje do decyzji po Etapie 0.
- Martwe: `useProductTranslations` (za flagą false), `translation-worker` (cron usunięty), `schedule-translations`, `AI_TRANSLATION_PLAN.md`.
- W sekretach Edge Functions istnieje `DEEPL_API_KEY`; tabela `deepl_api_keys` przechowuje klucze w zwykłej tabeli (do sprawdzenia w Etapie 0).
- `test-translation-direct.js`: zawiera wyłącznie publiczny klucz „anon” projektu Supabase (ten sam co w kodzie strony) — nie jest to klucz prywatny ani klucz DeepL, rotacja nie jest wymagana. Plik to pozostałość testowa, kandydat do usunięcia.

## 2. Poprawiona kolejność etapów

0. Etap 0 — weryfikacja (tylko odczyt):
   - `product_translations`: liczba wierszy, języki, czy strony EN/DE/SK/CS z nich korzystają;
   - `deepl_api_keys`: czy są aktywne klucze (bez pokazywania wartości) → decyzja o unieważnieniu u DeepL;
   - `DEEPL_API_KEY` w sekretach → kandydat do usunięcia po wyłączeniu funkcji;
   - `test-translation-direct.js` i pełna mapa zależności DeepL (hooki, funkcje, tabele, cron, flagi);
   - dotychczasowy Etap 0 Planu v2 (usunięcie `ProductSchema.tsx`, baseline 37 egzemplarzy).
1. Odłączenie aktywnej ścieżki DeepL: usunięcie wywołania `useProductTranslationIntegration()` z `Layout.tsx`. Bez usuwania tabel, funkcji i pozostałego kodu DeepL. Brak zmian wyglądu.
2. Migracja: `ai_settings`, `ai_provider_configs` (1 rekord `openai`), `ai_generations`, funkcje Vault, kolumny AI w `product_seo_settings`.
3. `_shared/ai/`: interfejs `AIProvider`, registry, `OpenAIProvider`.
4. Edge Function `ai-providers`: dodanie / zmiana / usunięcie klucza, test połączenia, synchronizacja modeli, wybór modelu, włączenie/pauza.
5. SEO Manager → zakładka „AI”: Provider → Model (lista providerów = tylko OpenAI).
6. Edge Function `generate-product-delta` + przycisk „Generuj draft AI” (VARIANT/UNIQUE) + akceptacja redaktora.
7. Później, osobnym poleceniem: usunięcie pozostałości DeepL.

## 3. Klucze — Supabase Vault

- Nazwa w Vault: `ai_key_openai` (w przyszłości `ai_key_<provider>`).
- Funkcje w schemacie `private` (SECURITY DEFINER, `EXECUTE` tylko `service_role`): `ai_key_set(provider, key)`, `ai_key_get(provider)`, `ai_key_delete(provider)`, `ai_key_exists(provider)`.
- Dodanie/zmiana: pole hasła w SEO Managerze → `ai-providers {action:'set_key'}` → JWT + `has_role(admin)` → test klucza → zapis w Vault (zmiana = nadpisanie) → status `connected`.
- Usunięcie: potwierdzenie → `delete_key` → usunięcie z Vault → `status='not_configured'`; jeśli OpenAI jest aktywny → `ai_settings.enabled=false`, `paused_reason='no_key'`.
- Frontend nigdy nie otrzymuje klucza — widzi tylko `Configured` i datę.

## 4. UI (zakładka „AI” w SEO Managerze)

```text
Provider:  [ OpenAI  v ]            (lista z registry — obecnie 1 pozycja)
Klucz API: Configured (2026-09-28)  [ Zmień klucz ] [ Usuń klucz ]
Model:     [ <z available_models>  v ]   [ Odśwież listę ]
Status:    Connected | Error | Not configured | Paused
[ Test połączenia ]      Ostatni test: 12:50, 840 ms
```

## 5. Provider abstraction

```text
interface AIProvider {
  id; label
  testConnection(key)            -> { ok, latencyMs, errorType? }
  listModels(key)                -> ModelInfo[]   (tylko modele tekstowe)
  generate(key, { model, system, input, schema, maxOutputTokens }) -> { json, usage }
  mapError(status, body)         -> auth | quota | rate_limit | bad_model | server | timeout
}
registry = { openai: OpenAIProvider }   // anthropic, gemini — tylko miejsce w typie
```
OpenAI: modele z `GET /v1/models` na Twoim koncie (filtr tekstowych), generowanie przez `POST /v1/responses` ze structured output. Żadnych nazw modeli w kodzie.

## 6. Finalny schemat tabel

`ai_settings` (jeden wiersz)
| kolumna | typ | uwagi |
|---|---|---|
| id | smallint PK | stałe 1 |
| active_provider | text | FK → ai_provider_configs.provider, domyślnie 'openai' |
| enabled | boolean | domyślnie false |
| paused_reason | text null | no_key, quota, auth, manual |
| prompt_version | text | domyślnie 'product_delta_v1' |
| updated_at | timestamptz | |
| updated_by | uuid null | |

`ai_provider_configs` (jeden rekord: openai)
| kolumna | typ | uwagi |
|---|---|---|
| provider | text PK | 'openai' |
| selected_model | text null | musi należeć do available_models (walidacja w Edge Function) |
| available_models | jsonb | lista z API providera |
| models_synced_at | timestamptz null | |
| status | text | not_configured, connected, error |
| key_configured_at | timestamptz null | tylko data, bez klucza |
| last_test_at | timestamptz null | |
| last_test_status | text null | success, error |
| last_test_latency_ms | integer null | |
| last_error_type | text null | |
| updated_at | timestamptz | |
| updated_by | uuid null | |

`ai_generations`
| kolumna | typ | uwagi |
|---|---|---|
| id | uuid PK | |
| product_id | uuid | FK → products |
| provider | text | |
| model | text | |
| prompt_version | text | |
| status | text | success, invalid, error, paused |
| error_type | text null | |
| latency_ms | integer null | |
| input_tokens | integer null | |
| output_tokens | integer null | |
| created_by | uuid null | |
| created_at | timestamptz | |

`product_seo_settings` — nowe kolumny
| kolumna | typ | uwagi |
|---|---|---|
| delta_content | text null | draft lub zatwierdzony tekst |
| ai_status | text | none, draft, approved, rejected (domyślnie none) |
| content_lock | boolean | domyślnie false |
| ai_provider | text null | |
| ai_model | text null | |
| prompt_version | text null | |
| ai_generated_at | timestamptz null | |
| approved_at / approved_by | timestamptz / uuid null | |

Dostęp: `ai_settings`, `ai_provider_configs`, `ai_generations` — odczyt tylko admin (`has_role`), zapis tylko Edge Functions (service_role); bez dostępu `anon`. Publicznie z `product_seo_settings` widoczny wyłącznie `delta_content` przy `ai_status='approved'`. Klucze wyłącznie w Vault.

## 7. Product Delta (bez zmian merytorycznych)

products → Diff Engine → detected_deltas → aplikacja ustala STANDARD/VARIANT/UNIQUE (nie AI) → `registry[active_provider]` + `selected_model` → schemat `{delta_content, detected_features_used, warnings}` (≤350 znaków, prompt `product_delta_v1` zakazuje wymyślania faktów) → walidacja → `ai_generations` → `ai_status='draft'` → ręczna akceptacja → `approved`. Limity: timeout 60 s, 1 ponowienie tylko dla 429/5xx, `quota`/`auth` → pauza, anty-spam 30 s na produkt, dzienny limit.

## Decyzja

Po Twojej akceptacji rozpoczynam od Etapu 0 (tylko odczyt) i Etapu 1 (odłączenie hooka DeepL z `Layout.tsx`); kolejne etapy po raporcie z Etapu 0.

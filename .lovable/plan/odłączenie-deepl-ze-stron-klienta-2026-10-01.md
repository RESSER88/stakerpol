# Odłączenie DeepL ze stron klienta

Cel: strona przestaje uruchamiać stare tłumaczenia DeepL w przeglądarkach odwiedzających. Wygląd i działanie strony bez zmian.

## Co zmieniam

1. `src/components/layout/Layout.tsx` — usuwam import i wywołanie `useProductTranslationIntegration()`. Efekt: żadna publiczna strona nie otwiera już nasłuchu zmian produktów i nie wywołuje funkcji `auto-translate`.
2. Specyfikację AI (poniżej) zapisuję jako osobny dokument `.lovable/plan/ai-provider-manager-spec.md`, żeby wrócić do niej później.

## Czego NIE ruszam

- Pliku hooka `useProductTranslationIntegration.ts` i `useAutoTranslation.ts` (zostają nieużywane do późniejszego sprzątania).
- Edge Functions `auto-translate`, `schedule-translations`, `translation-worker`, tabel DeepL/tłumaczeń, sekretu `DEEPL_API_KEY`, flagi `DEEPL_ENABLED`.
- Odczytu `product_translations` na karcie produktu (`useProductTranslationsDisplay`) — wersje językowe działają jak dotąd.
- `test-translation-direct.js` (zawiera tylko publiczny klucz — bez rotacji).

## Weryfikacja

- Build i lint bez nowych błędów.
- Strona główna i karta produktu ładują się normalnie; w ruchu sieciowym brak połączenia z kanałem `product-translations` i brak wywołań `auto-translate`.

---

# ZAŁĄCZNIK — zapisana specyfikacja do późniejszego powrotu

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
2. Migracja: `ai_settings`, `ai_provider_configs` (1 rekord `openai`), `ai_generations`, `product_ai_drafts`, funkcje Vault, funkcje `approve_product_ai_draft` i `unpublish_product_delta`, kolumny `delta_content`/`content_lock`/`delta_*` w `product_seo_settings`.
3. `_shared/ai/`: interfejs `AIProvider`, registry, `OpenAIProvider`.
4. Edge Function `ai-providers`: dodanie / zmiana / usunięcie klucza, test połączenia, synchronizacja modeli, wybór modelu, włączenie/pauza.
5. SEO Manager → zakładka „AI”: Provider → Model (lista providerów = tylko OpenAI).
6. Edge Function `generate-product-delta` + przyciski „Generuj draft AI” (VARIANT/UNIQUE), „Akceptuj”, „Odrzuć”, „Wycofaj publikację” + Security QA.
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

`product_ai_drafts` (nowa, tylko admin — jedyne miejsce draftu AI)
| kolumna | typ | uwagi |
|---|---|---|
| id | uuid PK | |
| product_id | uuid UNIQUE | FK → products; jeden wiersz na produkt, nadpisywany przy regeneracji |
| content | text | treść draftu |
| detected_features_used | jsonb | |
| warnings | jsonb | |
| status | text | draft, approved, rejected |
| provider / model / prompt_version | text | |
| generation_id | uuid null | FK → ai_generations |
| generated_at / generated_by | timestamptz / uuid | |
| reviewed_at / reviewed_by | timestamptz / uuid null | audyt akceptacji/odrzucenia |
| updated_at | timestamptz | |

`product_seo_settings` — nowe kolumny (tylko treść zatwierdzona, bez `ai_status`)
| kolumna | typ | uwagi |
|---|---|---|
| delta_content | text null | publiczna treść; widoczna, gdy `IS NOT NULL` |
| content_lock | boolean | domyślnie false; blokuje nadpisanie przez akceptację draftu |
| delta_approved_at / delta_approved_by | timestamptz / uuid null | |
| delta_source | text null | ai lub manual |

Dostęp:
- `product_ai_drafts`: RLS włączone; GRANT tylko `authenticated` (polityka: odczyt wyłącznie `has_role(admin)`) i `service_role`; brak GRANT dla `anon`; zapis wyłącznie przez Edge Functions / funkcje SECURITY DEFINER.
- `ai_settings`, `ai_provider_configs`, `ai_generations`: odczyt tylko admin, zapis tylko Edge Functions; bez `anon`.
- `product_seo_settings.delta_content` czytany publicznie jak dotąd (istniejące zasady dostępu do tabeli zweryfikować w Etapie 0). Klucze wyłącznie w Vault.

## 7. Product Delta — przepływ

```text
Diff Engine (aplikacja ustala STANDARD/VARIANT/UNIQUE, nie AI)
  -> generate-product-delta -> OpenAIProvider (selected_model)
  -> walidacja -> ai_generations
  -> product_ai_drafts (upsert po product_id, status='draft')
  -> redaktor: AKCEPTUJ | ODRZUĆ | GENERUJ PONOWNIE
  -> AKCEPTUJ: product_seo_settings.delta_content
```

- Stan możliwy: stara zatwierdzona treść w `delta_content` + nowy draft `status='draft'` — publiczna strona nadal pokazuje starą treść.
- Akceptacja: funkcja SECURITY DEFINER `approve_product_ai_draft(product_id, edited_content)` (wołana przez Edge Function), sprawdza `has_role(auth.uid(),'admin')`, w jednej transakcji: walidacja długości (≤350) i treści (słowa zakazane, niepusta) → odmowa, gdy `content_lock = true` → zapis `delta_content`, `delta_source`, `delta_approved_*` → draft `status='approved'`, `reviewed_*`.
- Odrzucenie: `status='rejected'`, `delta_content` bez zmian.
- „Wycofaj publikację”: funkcja `unpublish_product_delta(product_id)` (admin) → `delta_content = NULL`; draft pozostaje do audytu.
- Limity: timeout 60 s, 1 ponowienie tylko dla 429/5xx, `quota`/`auth` → pauza, anty-spam 30 s na produkt, dzienny limit.

## Security QA (obowiązkowe)

Jako `anon`: odczyt `product_ai_drafts` przez REST → brak dostępu; wywołanie funkcji akceptacji/wycofania → odmowa; publiczna strona nadal czyta `delta_content`. Jako zwykły zalogowany użytkownik: brak odczytu draftów i brak akceptacji. Jako admin: odczyt, akceptacja, odrzucenie, wycofanie; akceptacja przy `content_lock=true` odrzucona.

## Decyzja

Po Twojej akceptacji rozpoczynam od Etapu 0 (tylko odczyt) i Etapu 1 (odłączenie hooka DeepL z `Layout.tsx`); kolejne etapy po raporcie z Etapu 0.

# Analiza: przejście na klucze publishable / secret (tylko odczyt)

Niczego nie zmieniono. Wartości kluczy pominięto.

## 1. Frontend
- `src/integrations/supabase/client.ts` (l. 6–7): URL i klucz anon (JWT `eyJ...`) **wpisane na sztywno**. Plik generuje Lovable — nie czyta `.env`.
- `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (obecnie klucz legacy anon), `VITE_SUPABASE_PROJECT_ID`, `VITE_GSC_VERIFICATION`.
- Kod czytający `.env` bezpośrednio: `useSupabaseAuth.tsx:37` (tylko URL), `QuoteOfTheDay.tsx:11` (URL funkcji daily-quote).
- URL wpisany na sztywno: `SEOManagerTool.tsx:30–31` (sitemap, geo-feed) — sam URL, bez klucza.
- Wywołania `functions.invoke` (klient wysyła apikey + Bearer sesji lub klucza anon): shared-list, migrate-images, auto-translate, schedule-translations, notify-lead.

## 2. Edge Functions
| Funkcja | Zmienne | Kontrola wywołującego |
|---|---|---|
| auto-translate | SERVICE_ROLE_KEY + ANON_KEY | Bearer → `getClaims`, potem `has_role(admin)`; dodatkowo przyjmuje wywołanie z translation-worker |
| generate-product-description | ANON_KEY (+ OPENAI_API_KEY) | verify_jwt=true + `getUser` + `has_role(admin)` |
| migrate-images | SERVICE_ROLE_KEY + ANON_KEY | Bearer → `getClaims` + `has_role(admin)` |
| geo-feed, sitemap | ANON_KEY | publiczne, brak kontroli (domyślny verify_jwt) |
| schedule-translations | SERVICE_ROLE_KEY | brak kontroli w kodzie — polega wyłącznie na verify_jwt |
| translation-worker | SERVICE_ROLE_KEY | brak kontroli; **wysyła `Authorization: Bearer <service_role>`** do auto-translate |
| shared-list | SERVICE_ROLE_KEY | verify_jwt=false, publiczne, limit po IP |
| daily-quote | brak kluczy Supabase | verify_jwt=false, publiczne |
| notify-lead | RESEND_API_KEY, LEAD_WEBHOOK_URL | brak kontroli w kodzie — polega na verify_jwt |

## 3. supabase/config.toml
- `shared-list`: verify_jwt = false
- `daily-quote`: verify_jwt = false
- `generate-product-description`: verify_jwt = true
- Pozostałe funkcje: brak wpisu (domyślnie wg ustawień wdrożenia).

## 4. Klucze na sztywno (poza migracjami)
- `src/integrations/supabase/client.ts:7` — klucz anon (publiczny).
- `test-translation-direct.js:23` — klucz anon (publiczny).
- Migracje (poza zakresem): `net.http_post` do funkcji z nagłówkami — 4 pliki z 2025-08 i 2026-04; wymagają osobnego przeglądu, bo mogą zawierać klucz legacy w cronie.

## 5. social-media-rotation, notify-order, zct-diagnostics, zct-priority-manager
Brak kodu w repozytorium i brak jakichkolwiek wywołań w kodzie. Istnieją tylko w Supabase (wdrożone poza Lovable) — trzeba je przejrzeć bezpośrednio w panelu Supabase.

## 6. Plan etapowy (legacy działa równolegle do końca)

**Etap 0 — przygotowanie (bez zmian w kodzie)**
Utworzyć w Supabase klucze `sb_publishable_` i `sb_secret_`; zinwentaryzować crony (`cron.job`, wywołania `net.http_post`), Make.com i Hermes oraz 4 funkcje spoza repo. Ryzyko: brak.

**Etap 1 — frontend**
Podmienić `VITE_SUPABASE_PUBLISHABLE_KEY` na `sb_publishable_` i wartość w `client.ts` (plik generowany — zmiana przez połączenie Supabase / Lovable, nie ręcznie). `test-translation-direct.js` zaktualizować lub usunąć.
Ryzyko: średnie. Klucz `sb_publishable_` nie jest JWT — dla niezalogowanych wywołań `functions.invoke` do funkcji z verify_jwt=true (notify-lead z formularza zamówienia, sitemap/geo-feed jeśli wymagają JWT) brama odrzuci żądanie 401. Wymaga wcześniejszego ustawienia verify_jwt=false dla publicznych funkcji (Etap 2a). Zalogowani admini nie są dotknięci (wysyłany jest JWT sesji).

**Etap 2a — konfiguracja verify_jwt**
Ustawić verify_jwt=false dla notify-lead, sitemap, geo-feed, schedule-translations, translation-worker, auto-translate, migrate-images i dodać kontrolę w kodzie tam, gdzie jej brak (schedule-translations, translation-worker, notify-lead — np. sprawdzenie sekretu/roli lub limit). Ryzyko: wysokie dla bezpieczeństwa — bez dodanej kontroli w kodzie funkcje staną się publicznie wywoływalne. Kolejność: najpierw kod z kontrolą, potem zmiana verify_jwt.

**Etap 2b — Edge Functions: zmienne**
Zastąpić `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` nowymi sekretami (np. `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`) z fallbackiem na legacy. Ryzyko: niskie przy fallbacku.

**Etap 2c — wywołania funkcja→funkcja**
translation-worker → auto-translate: `sb_secret_` nie jest JWT, więc nie może iść jako `Bearer`; przejść na nagłówek `apikey` i w auto-translate rozpoznawać wywołanie serwisowe inaczej niż przez `getClaims`. Ryzyko: wysokie — tłumaczenia z kolejki przestaną działać przy błędzie (ścieżka DeepL i tak ma zostać odłączona).

**Etap 3 — automatyzacje zewnętrzne**
Make.com, Hermes, crony w bazie: przejść na `sb_secret_` (nagłówek `apikey`, nie `Bearer`). Ryzyko: wysokie — poza repozytorium, test każdego scenariusza.

**Etap 4 — weryfikacja**
Logi Edge Functions i API: brak żądań z kluczami legacy przez min. 1–2 tygodnie. Wyłączenia legacy nie planujemy.

## Szczegóły techniczne
- Nowe klucze nie są JWT: nie działają z `verify_jwt=true` ani jako `Authorization: Bearer`.
- `getClaims`/`getUser` z JWT sesji użytkownika działają bez zmian — kontrola admina w auto-translate, migrate-images, generate-product-description pozostaje poprawna.

# Stan serwisu pod system automatycznego generowania treści SEO

## 1. Jak dziś dodawana jest treść

- Produkty: rekordy w Supabase (`products`, `product_images`, `product_translations`, `product_seo_settings`) edytowane w panelu `/admin`.
- FAQ: rekordy w Supabase (`faqs`) + panel admina (FAQManager).
- Wszystkie pozostałe podstrony (Strona główna, Opinie, Kontakt, Polityka, FAQ jako strona) to komponenty React w `src/pages/*` — dodanie nowej wymaga zmiany w kodzie.
- Nie ma dziś żadnej ścieżki „dodaj artykuł" — ani w kodzie, ani w bazie.

## 2. Tabela na artykuły / blog

Nie istnieje. W bazie nie ma tabeli typu `posts`, `articles`, `blog_*`. Jedyne treściowe tabele to `products`, `faqs` i tłumaczenia. Brak też storage/bucketu na obrazy artykułów (obrazy produktów idą przez `product_images` + `lovable-uploads`).

## 3. Renderowanie

Pełny CSR. Vite SPA, `BrowserRouter`, strony lazy-loadowane, dane z Supabase pobierane w przeglądarce (React Query). Meta tagi wstrzykiwane po hydracji przez `react-helmet-async`, statyczny fallback w `index.html` (z `data-rh="true"`). Nie ma prerenderu ani SSG. Skutek: Googlebot indeksuje po renderze JS (działa, ale z opóźnieniem i ryzykiem), a większość crawlerów AI/social nie wykonuje JS — dla treści blogowej to główne ograniczenie.

## 4. Routing nowej podstrony

Dziś każda trasa jest wpisana ręcznie w `src/App.tsx` na podstawie `src/config/routes.ts`. Ale wzorzec dynamiczny już istnieje: `/produkty/:id` (slug z bazy) i `/oferta/:token`. Analogiczna trasa `/blog/:slug` wymaga jednorazowej zmiany w kodzie (dwie trasy: lista + szczegół), a potem każdy nowy artykuł to wyłącznie rekord w bazie — bez deployu. Fallback SPA (`public/_redirects`) już przepuszcza dowolną ścieżkę na `index.html`.

## 5. API do programistycznego dodawania wpisów

- PostgREST Supabase: `https://peztqgfmmnxaaoapzpbw.supabase.co/rest/v1/<tabela>` — pełny CRUD kluczem `service_role` lub kontem admina, bez udziału Lovable. To najprostsza droga dla zewnętrznego generatora.
- Edge Functions: istnieją `sitemap`, `geo-feed`, `shared-list`, `notify-lead`, `auto-translate`, `translation-worker`, `schedule-translations` — żadna nie przyjmuje treści. Można dodać dedykowaną funkcję (np. `content-ingest`) z autoryzacją tokenem, jeśli chcesz warstwę walidacji zamiast surowego PostgREST.
- `pg_cron` + `pg_net`/`http` są już włączone — cykliczne zadania (harmonogram generowania, publikacja zaplanowana) da się prowadzić w bazie.

## 6. Meta, JSON-LD, sitemap

- Meta title/description: częściowo statycznie w kodzie (`src/config/featureFlags.ts` — `SITE_CONFIG`, `getSiteDescription`), częściowo dynamicznie z danych produktu w `ProductDetail.tsx` przez Helmet.
- JSON-LD: generowany w kodzie z danych bazy — `ProductSchema.tsx` / `utils/seo/generateProductSchema.ts` (z `product_seo_settings`), `FAQSchema.tsx` (z `faqs`), `BreadcrumbSchema.tsx`, `LocalBusinessSchema.tsx`, plus blok `WebSite` w `index.html`.
- Sitemap: dynamiczny — Edge Function `sitemap` czyta `products` z bazy i buduje XML (z filtrem `availability_status != 'sold'`). `public/robots.txt` wskazuje `https://stakerpol.pl/sitemap.xml`, więc na produkcji musi być proxy/rewrite na funkcję.
- `public/llms.txt` jest statyczny i utrzymywany ręcznie.

## 7. Repozytorium i wdrożenie

- Git zdalny to wewnętrzne repo Lovable (`git.private.lovable-gcp.code.storage/0c3d6365-...`) + kopia S3. Nie widzę tu podłączonego remote'u GitHub — jeśli integracja GitHub istnieje, jest ustawiona po stronie Lovable, nie w konfiguracji repozytorium.
- Build: `vite build` → `dist/`. W repo są artefakty pod hosting statyczny: `public/_redirects` (SPA fallback) i `public/_headers` (CSP, HSTS, cache). Wdrożenie self-hosted = zbudowanie `dist/` i podanie go z serwera z fallbackiem na `index.html`.
- Uwaga: CSP w `_headers` ma `connect-src 'self' https://*.supabase.co` — zewnętrzne API generatora wywoływane z przeglądarki trzeba by tam dopisać (wywołania serwer-serwer nie dotyczy).

---

## Proponowane realizacje

### Wariant A — treść w bazie + dynamiczny routing (rekomendowany na start)

Nowe tabele (`seo_articles`, opcjonalnie `seo_topics`, `seo_competitors`, `seo_keyword_gaps`), trasy `/blog` i `/blog/:slug`, panel w `/admin` do przeglądu i zatwierdzania (`status: draft → review → published`). Generator (zewnętrzny worker lub Edge Function na Lovable AI) zapisuje szkice przez PostgREST/Edge Function; człowiek zatwierdza; sitemap i `llms.txt` rozszerzone o artykuły. Zaleta: publikacja bez deployu, jedna zmiana w kodzie. Wada: treść nadal CSR.

### Wariant B — A + prerender artykułów w buildzie

Do wariantu A dochodzi krok build-time: skrypt pobiera opublikowane artykuły i generuje statyczne `dist/blog/<slug>/index.html` z gotowym HTML, meta i JSON-LD. Indeksowanie natychmiastowe i pełne dla crawlerów bez JS. Wada: publikacja artykułu wymaga przebudowy/deployu (da się zautomatyzować hookiem po zatwierdzeniu).

### Wariant C — A + Edge Function renderująca HTML dla botów

Funkcja typu `article-render` zwraca kompletny HTML artykułu (meta + JSON-LD + treść) z bazy; reverse proxy kieruje tam żądania z `/blog/*`. Efekt zbliżony do SSR bez zmiany stacku i bez rebuildów. Wada: dodatkowa warstwa proxy do utrzymania, czas odpowiedzi zależny od funkcji.

### Warstwa analityczna (wspólna dla wszystkich wariantów)

Analiza konkurencji i luk tematycznych jako oddzielny worker (może po stronie leadboksu w Tailscale): zbiera dane (SERP/Semrush), zapisuje kandydatów tematów do tabeli, `pg_cron` uruchamia cykl generowania szkiców, panel admina to kolejka do zatwierdzenia. Klucze API trzymane w sekretach Edge Functions lub u workera — nigdy w kliencie.

### Rekomendacja

Wariant A jako fundament, z zaplanowanym dołożeniem prerenderu (B) zaraz po tym, jak pierwsze artykuły będą gotowe — bo dla treści tekstowej brak prerenderu jest realnym ograniczeniem widoczności, zwłaszcza w wyszukiwarkach AI.

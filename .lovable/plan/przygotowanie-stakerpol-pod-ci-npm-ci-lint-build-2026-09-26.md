# Przygotowanie STAKERPOL pod CI (npm ci / lint / build)

Bez zmian w wyglądzie, funkcjach, Supabase, `.env`, sekretach. Bez workflow GitHub Actions, Dockera, Raspberry Pi.

## Stan potwierdzony
- `package-lock.json` nie zgadza się z `package.json`: `@supabase/supabase-js` ^2.54.0 vs ^2.104.0; brak `exceljs`, `xlsx`, `jspdf-autotable`.
- W repo są też `bun.lock` i `bun.lockb` (Lovable używa bun).

## Kroki
1. Zregenerować `package-lock.json` z obecnego `package.json` (`npm install --package-lock-only`), bez podnoszenia wersji w `package.json`. Zakresy zostają, lock rozwiązuje je minimalnie zgodnie z nimi.
2. Czysta weryfikacja w /tmp (kopia projektu): `npm ci`, `npm run lint`, `npm run build`.
3. Build: poprawiać tylko błędy blokujące production build.
4. Lint: poprawiać tylko błędy (errors) blokujące `eslint .`; ostrzeżenia zostawić i wypisać w raporcie. Jeśli błędów jest dużo i są niekrytyczne, punktowo (np. wykluczenie `supabase/functions` Deno z lintu przeglądarkowego) — bez refaktoru.
5. Env: bez zmian; sprawdzić, że build nie wymaga sekretów prywatnych.
6. Raport: zmienione pliki, wynik ci/lint/build, ostrzeżenia, ryzyka dla Actions (np. podwójne lockfile bun/npm, rozmiar chunków, wersja Node — zalecenie Node 20).

## Uwagi techniczne
- `bun.lock`/`bun.lockb` nie usuwam (zarządza nimi Lovable); w raporcie opiszę ryzyko rozjazdu i zalecenie, by CI używał npm + package-lock.
- Brak zmian w `src/integrations/supabase/*`, migracjach, Edge Functions.

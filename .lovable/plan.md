# Tryb nocny panelu administracyjnego

## Stan faktyczny (sprawdzony w kodzie)

- `tailwind.config.ts` ma `darkMode: ["class"]` — mechanizm klasowy jest gotowy po stronie konfiguracji.
- `src/index.css` zawiera blok `.dark { ... }`, ale wyłącznie dla ogólnych tokenów shadcn (`--background`, `--card`, `--border`, itd.).
- Tokeny panelu — `--admin-*` (linie 52-60) i `--editorial-*` (linie 62-69) — są zdefiniowane **tylko** w `:root`. W `.dark` nie mają odpowiedników, więc panel po dodaniu klasy `dark` pozostanie jasny.
- Nie ma przełącznika ani żadnego kodu ustawiającego klasę `dark` na `document.documentElement` (brak `next-themes`, brak `ThemeProvider`). W całym `src/` jest 5 wystąpień klas `dark:` (tylko `alert.tsx` i CSS) — panel ich nie używa.
- W `src/components/admin` jest 28 zahardkodowanych wystąpień kolorów (`bg-white`, `text-white`, itp.), m.in. `AdminLayout` (`bg-white`), `AdminSidebar`, `AdminTopBar`. To one blokują motyw i wymagają zamiany na tokeny.

Wniosek: mechanizm trzeba zbudować, ale nie od zera — brakuje wariantów tokenów dla ciemnego motywu, przełącznika i sprzątnięcia zahardkodowanych kolorów.

## Rozmiar pracy

Zadanie **średnie** (nie proste, nie duże). Dominuje praca mechaniczna: podmiana kolorów na tokeny w komponentach panelu. Logika przełącznika jest prosta.

## Plan pracy — etapy

**Etap 1 — Tokeny ciemne (mały)**
W `src/index.css`, w bloku `.dark`, dopisać ciemne warianty `--editorial-*` i `--admin-*`. Konwencja graficzna bez zmian: nadal ta sama paleta pomarańcz-akcent (`24 95% 53%`), te same fonty (`font-editorial` = Georgia, `font-sans` = system-ui), te same promienie (`--radius`) i skala odstępów. Zmieniamy wyłącznie jasność powierzchni i tekstu:
- `--editorial-bg` → ciemne tło (np. `222 47% 9%`)
- `--editorial-ink` → jasny tekst, `--editorial-muted` → przygaszony jasny
- `--editorial-line` → subtelna ciemna linia
- `--admin-bg`, `--admin-border`, `--admin-text`, `--admin-muted` — analogicznie
- akcenty (`accent`, `ok`, `bad`, `orange`, `green`, `red`) — lekkie podniesienie jasności dla kontrastu na ciemnym tle, bez zmiany odcienia

**Etap 2 — Przełącznik (mały)**
- Nowy hook `src/hooks/useAdminTheme.ts`: stan `light | dark | system`, zapis w `localStorage` (klucz `stakerpol-admin-theme`), dodawanie/usuwanie klasy `dark` na `document.documentElement`, respektowanie `prefers-color-scheme` dla `system`.
- Ikona słońce/księżyc (lucide-react `Sun`/`Moon`) w `AdminSidebar` (obok „Wyloguj”) oraz w menu „więcej” w `AdminTopBar` na mobile.
- Klasa `dark` zdejmowana przy wyjściu z `/admin`, żeby tryb nocny nie przeciekał na stronę publiczną.

**Etap 3 — Sprzątanie zahardkodowanych kolorów (średni, najwięcej plików)**
Zamiana `bg-white` / `text-white` / wartości `#...` na tokeny `bg-editorial-bg`, `text-editorial-ink`, `border-editorial-line` w plikach panelu:
- `layout/AdminLayout.tsx`, `AdminSidebar.tsx`, `AdminTopBar.tsx`, `AdminBottomNav.tsx`, `AdminPageHeader.tsx`
- `sections/*` (Dashboard, Offers, Contacts, Export, Inquiries, InquiryStats)
- `sections/offers/NewOfferView.tsx`, `SentOffersView.tsx`
- `sections/contacts/ContactCard.tsx`, `CallForm.tsx`
- `editor/*` i `editorial/*`
- `products/*`

**Etap 4 — Weryfikacja (mały)**
Playwright: `/admin` w obu trybach, zrzuty ekranu 384px i 1280px, sprawdzenie że nie zostało białe tło pod ciemnym motywem i że wybór trwa po odświeżeniu.

## Zakres wyłączony

Bez zmian w bazie, RPC (`create_offer`, `log_contact_activity`, `import_lead_to_contact`), Edge Functions i bez tryb nocnego dla stron publicznych. Bez zmiany layoutu, typografii, odstępów i promieni — wyłącznie warstwa kolorów plus przełącznik.

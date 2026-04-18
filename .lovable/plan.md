

## Cel
Przebudowa `/admin` na nowoczesny panel z mobile bottom-nav i desktop sidebarem. Zachowuję pełną logikę Supabase, autentykację, ProductManager, FAQManager, SEOManagerTool. Dodaję 2 nowe sekcje (Start, Zapytania) i wyodrębniam Eksport.

## Architektura nawigacji

**Sekcje (z ikonami Lucide):**
- `Zap` Start — dashboard (statystyki: liczba produktów, leadów dziś/7 dni, ostatnie 5 zapytań)
- `Package` Produkty — istniejący `ProductManager` (bez wbudowanego przycisku Eksport — przeniesiony)
- `Inbox` Zapytania — nowa lista z `leads` + `price_inquiries` (filtr po `source`, sortowanie po `created_at`)
- `Download` Eksport — wyodrębniony eksport stanu magazynu (PDF/JPG) z `ExportFormatModal`
- `Search` SEO (desktop only) — `SEOManagerTool`
- `HelpCircle` FAQ (desktop only) — `FAQManager`

Mobile: 4 ikony (Start / Produkty / Zapytania / Eksport). SEO i FAQ schowane w "Więcej" w top barze (ikona MoreVertical → dropdown) — żeby nie tracić dostępu na mobile.

## Tokeny CSS
W `src/index.css` dodaję zmienne (HSL-friendly, by zachować Tailwind):
```
--admin-orange: 24 95% 53%;   /* #F97316 */
--admin-dark: 222 47% 11%;    /* #0F172A */
--admin-bg: 210 40% 98%;      /* #F8FAFC */
--admin-border: 214 32% 91%;  /* #E2E8F0 */
--admin-text: 222 47% 17%;    /* #1E293B */
--admin-muted: 215 16% 47%;   /* #64748B */
--admin-green: 142 71% 45%;   /* #16A34A */
--admin-red: 0 73% 51%;       /* #DC2626 */
```
W `tailwind.config.ts` mapuję jako `admin.orange`, `admin.dark` itd. (nie ruszam istniejących `stakerpol-*`).

## Pliki

**Nowe:**
- `src/components/admin/layout/AdminLayout.tsx` — `<div>` z conditional rendering: desktop sidebar (`hidden lg:flex w-[220px] fixed`) + main `lg:ml-[220px]` + mobile top bar + mobile bottom nav (`lg:hidden fixed bottom-0`)
- `src/components/admin/layout/AdminSidebar.tsx` — desktop sidebar: logo "StakerPanel", lista linków NavLink z aktywnym stanem (border-left pomarańczowy), przycisk Wyloguj na dole
- `src/components/admin/layout/AdminTopBar.tsx` — mobile top bar `bg-admin-dark` z białym tytułem (z context/route) + dropdown MoreVertical (SEO/FAQ/Wyloguj)
- `src/components/admin/layout/AdminBottomNav.tsx` — fixed bottom, 4 zakładki, aktywna z `text-admin-orange` + górną krechą 2px pomarańczową
- `src/components/admin/layout/AdminPageHeader.tsx` — desktop: breadcrumb (Panel / [sekcja]) + slot na actions po prawej
- `src/components/admin/sections/DashboardSection.tsx` — Start: 4 karty KPI (produkty, leady dziś, leady 7 dni, niska dostępność), tabela 5 ostatnich leadów, link „Zobacz wszystkie"
- `src/components/admin/sections/InquiriesSection.tsx` — Zapytania: tabela leadów z `leads` (kolumny: data, imię, telefon, email, źródło, wiadomość, akcje: tel:/mailto:), filtr po `source` (`home_hero_form` / `product_lead` / inne), sortowanie desc po `created_at`, paginacja 20/str
- `src/components/admin/sections/ExportSection.tsx` — Eksport: 2 karty (PDF stanu magazynu, JPG), reuse logiki z `ProductManager` (`exportProductListToPDF/JPG`)

**Edytowane:**
- `src/pages/Admin.tsx` — refaktor: zamiast Tabs używa stanu `activeSection` (lub query param `?section=`) i renderuje `AdminLayout` + odpowiednią sekcję. Cała logika auth/products bez zmian — przekazana jako prop do `ProductManager` w sekcji „produkty".
- `src/components/admin/ProductManager.tsx` — usuwam wbudowany przycisk „Eksport stan magazyn" i `ExportFormatModal` (przeniesione do `ExportSection`). Pozostaje Odśwież + Dodaj Produkt.
- `src/index.css` — dodanie tokenów `--admin-*`
- `tailwind.config.ts` — dodanie `colors.admin.{orange,dark,bg,border,text,muted,green,red}`

## Routing / aktywna sekcja
Używam stanu lokalnego w `Admin.tsx` (`activeSection: 'start' | 'products' | 'inquiries' | 'export' | 'seo' | 'faq'`), domyślnie `'start'`. Każdy przycisk nav ustawia stan. Mapping tytułu top bara po `activeSection`. Brak zmian w React Router.

## Zapytania — query Supabase
```ts
supabase.from('leads')
  .select('id, created_at, name, phone, email, message, source, page_url')
  .order('created_at', { ascending: false })
  .range(page*20, page*20+19)
```
RLS już jest (admin czyta wszystko przez `has_role`). Jeśli brak policy SELECT dla admina — dodam migrację.

## Layout — szczegóły CSS

Desktop:
- Sidebar: `fixed top-0 left-0 h-screen w-[220px] bg-admin-dark text-white flex flex-col`
- Logo: `px-6 py-5 text-xl font-bold` ("StakerPanel" + ikona Zap pomarańczowa)
- Linki: `flex items-center gap-3 px-6 py-3 hover:bg-white/5`, aktywny: `bg-white/10 border-l-4 border-admin-orange`
- Main: `lg:ml-[220px] min-h-screen bg-admin-bg`
- Page header: `bg-white border-b border-admin-border px-8 py-4 flex items-center justify-between`

Mobile:
- Top bar: `lg:hidden sticky top-0 bg-admin-dark text-white px-4 h-14 flex items-center justify-between z-40`
- Content: `pb-20` (miejsce na bottom nav)
- Bottom nav: `lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-admin-border h-16 grid grid-cols-4 z-40`
- Każda zakładka: kolumna ikona + label 11px; aktywna: `text-admin-orange` + `border-t-2 border-admin-orange -mt-px`

## Kolejność implementacji
1. Tokeny CSS + tailwind
2. AdminLayout + Sidebar + TopBar + BottomNav + PageHeader (puste sekcje)
3. Refaktor `Admin.tsx` na nowy layout, podpięcie istniejących `ProductManager`/`SEOManagerTool`/`FAQManager`
4. `DashboardSection` (zapytania COUNT z Supabase)
5. `InquiriesSection`
6. `ExportSection` + usunięcie eksportu z `ProductManager`
7. Migracja RLS dla `leads` jeśli admin nie może SELECT (sprawdzę po refaktorze)

## Co zostaje bez zmian
- `useSupabaseAuth`, `AdminLogin`, ścieżki `/admin`, RLS produktów, ProductDetailsModal, formularze, eksport util `listExporter.ts`, klient Supabase.


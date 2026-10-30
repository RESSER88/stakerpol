# Audyt widoczności dla wyszukiwarek AI + plan (bez zmian w kodzie)

## 1. Co dziś widzi bot AI bez JavaScriptu (sprawdzone curl na stakerpol.pl)

- Produkty i ceny są pobierane z Supabase w przeglądarce (React). Nie ma pre-renderingu.
- `curl https://stakerpol.pl/produkty` zwraca pusty szablon: 0 wystąpień "SWE 200D", "PLN" czy "zł". OAI-SearchBot, ClaudeBot i PerplexityBot nie widzą żadnego wózka ani ceny. Googlebot widzi je, bo wykonuje JS.
- JSON-LD produktu (`generateProductSchema.ts`) powstaje dopiero w przeglądarce, więc proste boty go nie widzą. W `index.html` jest tylko statyczny JSON-LD firmy.
- `robots.txt` jest w porządku: boty AI mają jawne `Allow`, zablokowane są tylko `/admin` i `/oferta` (to prawidłowe).
- `llms.txt` istnieje i działa (text/plain), ale jest statyczny i nie podaje cen.
- **Błąd krytyczny:** `https://stakerpol.pl/sitemap.xml` zwraca stronę HTML aplikacji (z canonical wskazującym na samą siebie), a nie XML. W `public/` nie ma pliku sitemap, a funkcja `sitemap` w Supabase nie jest podpięta pod domenę. Robots i llms.txt odsyłają więc do niedziałającej mapy.
- Strona działa na hostingu Lovable (Cloudflare). Plik `_redirects` z Netlify nie pozwala tu przekierować ścieżki na Edge Function. To ogranicza punkt 3.

## 2. Co ma sens (efekt / nakład)

| Poziom | Ocena |
|---|---|
| 1. `llms.txt` + publiczny JSON z cenami | **Tak, największy efekt.** Mało pracy, czytają to boty bez JS. |
| 2. Product + Offer w JSON-LD | **Tak, ale tylko w HTML z serwera.** Dziś działa to wyłącznie dla Google. Bez prerenderingu boty AI tego nie zobaczą. |
| 3. ARD v0.91 | **Tani dodatek, mały efekt.** To wczesny, mało znany standard i żadna z wymienionych wyszukiwarek go dziś nie wspiera. Warto dodać jeden wpis JSON-LD i link w `llms.txt` (koszt ok. 30 min). Nie warto budować pod niego osobnego systemu `agent-skills`. |

Uwaga do cen: domyślny tryb to `inquiry_with_pricelist`. Bot pokaże cenę tylko przy wózkach, które mają `net_price` i tryb publicznej ceny. Brutto można policzyć jako netto × 1,23, wtedy z dopiskiem "brutto (VAT 23%)".

## 3. Automatyczna synchronizacja z bazy

Lovable nie może podpiąć ścieżek domeny `stakerpol.pl` pod Edge Function. Proponuję dwie warstwy:

```text
Supabase products ──> Edge Function "ai-catalog" (żywe dane, cache 15 min)
      │                 https://<projekt>.supabase.co/functions/v1/ai-catalog(.json|/llms.txt)
      │
      └─> skrypt przy publikacji ──> public/sitemap.xml, public/llms.txt (z cenami),
                                     statyczny HTML /produkty/<slug> z JSON-LD (prerender)
```

- **Żywe dane:** Edge Function `ai-catalog` (wzorowana na `geo-feed`). Zwraca JSON z dostępnymi wózkami: model, rok, mth, udźwig, wysokość, cena netto/brutto lub "na zapytanie", status, URL. Wersja `?format=txt` zwraca to samo jako tekst dla LLM. Link do niej trafia do `llms.txt` i do wpisu ARD.
- **Pliki na domenie:** sitemap, llms.txt i strony HTML wózków generowane z bazy przy każdym "Publish". Działa to bez dodatkowych usług, ale aktualizuje się przy publikacji, a nie co minutę.
- **W pełni bezobsługowo na `stakerpol.pl/...`:** wymaga przejścia na szablon TanStack Start (SSR) albo Cloudflare Worker przed domeną. To osobna, większa decyzja i jej nie realizuję w tym planie.

## 4. Etapy

1. **Naprawa sitemap (pilne).** Generowanie `public/sitemap.xml` z tabeli `products` przy buildzie (strony stałe + `/produkty/<slug>` dostępnych i zarezerwowanych wózków).
   Test: `curl -s https://stakerpol.pl/sitemap.xml | head` pokazuje `<urlset>`.
2. **Edge Function `ai-catalog`.** Publiczna, tylko odczyt, przez klucz anon/RLS, bez nowych tabel.
   Test: `curl -s .../functions/v1/ai-catalog | jq '.items[0]'`, a potem zmiana ceny w adminie i ponowny curl.
3. **`llms.txt` generowany z bazy.** Sekcja "Aktualna oferta" z ceną lub "cena na zapytanie" dla każdego wózka oraz link do `ai-catalog`.
   Test: `curl -s https://stakerpol.pl/llms.txt | grep -i "SWE 200D"`.
4. **Prerender kart produktów.** Statyczny HTML z tytułem, opisem, parametrami i JSON-LD Product+Offer (`price`, `priceCurrency` PLN, `itemCondition` Used, `availability`, mth i rok jako `additionalProperty`). Treść ma odpowiadać temu, co widać w UI.
   Test: `curl -s https://stakerpol.pl/produkty/<slug> | grep -o '"price":[^,]*'`.
5. **Wpis ARD.** JSON-LD w `index.html` plus link w `llms.txt`.
   Test: `curl -s https://stakerpol.pl/ | grep agenticresourcediscovery`.

Każdy etap wdrażam osobno, po Twojej akceptacji. UI, wygląd i dane pozostają bez zmian, a `package.json` zmienia się tylko wtedy, gdy etap 1 lub 4 tego wymaga (zgłoszę to wcześniej).

## Szkic wpisu ARD JSON-LD

```json
{
  "@context": "https://agenticresourcediscovery.org/context/v1",
  "@type": "ResourceEntry",
  "identifier": "urn:air:stakerpol.pl:catalog",
  "name": "Stakerpol — katalog używanych paleciaków elektrycznych Toyota BT",
  "description": "Aktualna lista dostępnych wózków: model, rok produkcji, motogodziny, udźwig, wysokość podnoszenia, bateria, stan, cena netto PLN lub cena na zapytanie, status dostępności.",
  "url": "https://stakerpol.pl/produkty",
  "endpoint": "https://<projekt>.supabase.co/functions/v1/ai-catalog",
  "encodingFormat": ["application/json", "text/plain"],
  "inLanguage": ["pl", "en", "de", "sk", "cs"],
  "provider": { "@type": "Organization", "name": "FHU Stakerpol", "url": "https://stakerpol.pl", "telephone": "+48694133592" },
  "capabilities": [
    "list_available_products",
    "get_product_by_slug",
    "filter_by_lift_capacity_kg",
    "filter_by_lift_height_mm",
    "filter_by_working_hours",
    "filter_by_production_year",
    "price_net_pln_or_inquiry",
    "availability_status"
  ],
  "dataFields": {
    "name": "products.name",
    "slug": "products.slug",
    "serialNumber": "products.serial_number",
    "productionYear": "products.production_year",
    "workingHours": "products.working_hours",
    "liftCapacityKg": "products.lift_capacity_mast",
    "liftCapacityInitialKg": "products.lift_capacity_initial",
    "liftHeight": "products.lift_height",
    "battery": "products.battery",
    "condition": "products.condition_label",
    "priceNet": "products.net_price",
    "priceCurrency": "products.price_currency",
    "priceMode": "products.price_display_mode",
    "leasingMonthlyFromPln": "products.leasing_monthly_from_pln",
    "warrantyMonths": "products.warranty_months",
    "availability": "products.availability_status",
    "image": "products.image_url"
  },
  "representativeQueries": [
    "używany paleciak elektryczny Toyota BT SWE 200D cena",
    "paleciak elektryczny z masztem 2000 kg do 1500 motogodzin",
    "wózek paletowy elektryczny używany z gwarancją Małopolska",
    "BT SWE 200D rocznik 2018 ile kosztuje",
    "paleciak elektryczny z podestem dla operatora na sprzedaż",
    "used Toyota BT electric pallet stacker price Poland"
  ],
  "updateFrequency": "PT15M",
  "dateModified": "<generowane z max(products.updated_at)>"
}
```

Uwaga: nazwy pól (`ResourceEntry`, `endpoint`, `capabilities`) sprawdzę ze specyfikacją ARD v0.91 przed wdrożeniem etapu 5. Szkic odwzorowuje pola Twojej bazy, nie schemat potwierdzony przez specyfikację.

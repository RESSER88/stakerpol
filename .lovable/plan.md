

# Audyt SEO — stan faktyczny i plan działania

## Co jest już zrobione (wbrew Twoim podejrzeniom)

Projekt przeszedł kilka rund optymalizacji SEO. Większość Twojej listy **już istnieje**:

| Twoje żądanie | Stan w projekcie | Wniosek |
|---|---|---|
| Product schema JSON-LD (name, image, sku, brand, offers, aggregateRating) | ✅ `generateProductSchema.ts` — pełny schema z review/aggregateRating z testimonials | **Działa** |
| BreadcrumbList schema | ✅ `BreadcrumbSchema.tsx` na ProductDetail | **Działa** |
| Organization schema na home | ✅ `LocalBusinessSchema.tsx` (LocalBusiness = nadtyp Organization) | **Działa** |
| Meta title format `[Produkt] - [Kategoria] \| Stakerpol` | ✅ `getMetaTitle()` w ProductDetail | **Działa** |
| Meta description z USP | ✅ `getMetaDescription()` ze specami + CTA | **Działa** |
| Unikatowy H1 z keyword | ✅ Każda strona ma jeden H1 (Index, ProductDetail, Products) | **Działa** |
| Canonical URL | ✅ Ustawiony w ProductDetail i Index z prefiksem języka | **Działa** |
| Alt text obrazów | ✅ ProductImage przekazuje `alt={product.model}`, hero `alt="Wózki paletowe Toyota BT"` | **Działa** |
| XML sitemap | ✅ Edge function `supabase/functions/sitemap/index.ts` + statyczna w robots.txt | **Działa** |
| robots.txt | ✅ `public/robots.txt` z bot-specific rules + sitemapy | **Działa** |
| URL keyword-friendly | ✅ `/products/toyota-swe-200d-2018r-w-6633366` (slug) | **Działa** |

## Realne problemy do naprawy (3 sztuki)

### Problem 1 — Konflikt canonical URL (KRYTYCZNE dla SEO)

**Lokalizacja:** `ProductDetail.tsx` linia 149 vs `HreflangLinks.tsx` linia 31-33

ProductDetail ustawia canonical jako `https://stakerpol.pl/${language}/products/${slug}`, ale faktyczny URL to `https://stakerpol.pl/products/${slug}` (bez prefiksu języka — patrz aktualny route w przeglądarce: `/products/toyota-swe-200d-2018r-w-6633366`).

**Skutek:** Google widzi `<link rel="canonical">` wskazujący na **nieistniejący URL** z prefiksem `/pl/`. To poważny błąd SEO — Google może deindeksować stronę lub ignorować canonical.

**To samo dotyczy `og:url`** (linia 143).

**Fix:** Usunąć prefiks `${language}/` z canonical i og:url w ProductDetail. To samo w Index (linia 47).

### Problem 2 — Hreflang wskazuje na nieistniejące URL

**Lokalizacja:** `HreflangLinks.tsx` linie 18-21, 25-28

Generuje linki typu `https://stakerpol.pl/en/products/...`, `https://stakerpol.pl/de/...` — ale te trasy nie istnieją w `App.tsx` (routing nie ma `/:lang/` segmentu). Wszystkie hreflangi prowadzą do 404.

**Skutek:** Google Search Console będzie raportować "alternate page with proper canonical tag" jako błąd; międzynarodowe SEO nie działa.

**Opcje fix:**
- (A) **Usunąć prefiks języka** ze wszystkich `hreflang` URLów — wskazywać na ten sam URL kanoniczny z różnymi `hreflang` (rozwiązanie w stylu "język wykrywany przez kontekst klienta")
- (B) **Dodać prawdziwe trasy `/:lang/`** w routerze — duża zmiana architektoniczna

**Rekomendacja:** Opcja A — szybka, zero ryzyka, zgodna z aktualną architekturą (jeden URL, wybór języka po stronie klienta). Hreflang stays jako sygnał dla Google że strona jest dostępna w wielu językach, ale wskazuje na ten sam URL.

### Problem 3 — Przestarzały `<title>` w `index.html` jako fallback

**Lokalizacja:** `index.html` linie 7-8, 54-58

Statyczny tytuł `"Stakerpol - Paleciaki elektryczne Toyota BT"` jest wstrzykiwany do HTML przed React-Helmet. Crawlery które nie wykonują JS (część botów AI, niektóre social media) widzą **ten sam tytuł na każdej podstronie**. Helmet nadpisuje to dopiero po hydracji.

**Skutek:** Niski wpływ (Google JS-renderuje od 2019), ale Bingbot, Facebook Open Graph crawler i część botów AI mogą widzieć duplikaty.

**Opcja fix (niskie ryzyko):** Pozostawić jako fallback — nie ruszać. Alternatywa (SSR) wymaga przebudowy architektury. **Pomijam.**

## Czego NIE robię (i dlaczego)

| Element | Powód |
|---|---|
| Zmiana URL na `/category/subcategory/product-name/` | Wszystkie produkty to wózki paletowe — sztuczny podział na kategorie/podkategorie zaszkodzi SEO (utrata linków przychodzących, rozrzedzenie autorytetu). Aktualne `/products/[slug]` jest właściwe dla katalogu jednolitego. |
| Dodanie real `price` w Product schema | Model B2B kwotowy — `seoSettings.price` jest opcjonalne, jeśli admin ustawi cenę → schema się aktualizuje automatycznie (już zaimplementowane w `generateProductSchema.ts` linia 245-249). |
| Duplikat `BreadcrumbSchema` na innych podstronach | Tylko ProductDetail go potrzebuje (głęboka nawigacja). Strona główna i listing nie mają hierarchii do pokazania. |
| Re-konwersja URL produktów | Slugs są już keyword-friendly (`toyota-swe-200d-2018r-w-6633366` zawiera markę, model, rok). Zmiana wymagałaby 301 redirects = utrata SEO juice. |
| Generowanie nowego sitemap | Edge function już generuje dynamicznie z bazy + statyczny fallback. |

## Plan zmian — 2 pliki

### Plik 1: `src/pages/ProductDetail.tsx` (linie 143, 149)

**Przed:**
```tsx
<meta property="og:url" content={`https://stakerpol.pl/${language}/products/${product.slug || product.id}`} />
<link rel="canonical" href={`https://stakerpol.pl/${language}/products/${product.slug || product.id}`} />
```

**Po:**
```tsx
<meta property="og:url" content={`https://stakerpol.pl/products/${product.slug || product.id}`} />
<link rel="canonical" href={`https://stakerpol.pl/products/${product.slug || product.id}`} />
```

### Plik 2: `src/pages/Index.tsx` (linia 41, 47)

**Przed:**
```tsx
<meta property="og:url" content={`https://stakerpol.pl/${language}`} />
<link rel="canonical" href={`https://stakerpol.pl/${language}`} />
```

**Po:**
```tsx
<meta property="og:url" content="https://stakerpol.pl/" />
<link rel="canonical" href="https://stakerpol.pl/" />
```

### Plik 3: `src/components/seo/HreflangLinks.tsx` (linie 18-22, 32)

**Przed:**
```tsx
const makeUrl = (lang: string) => {
  const suffix = basePath === '/' ? '' : basePath;
  return `https://stakerpol.pl/${lang}${suffix}`;
};
```

**Po:**
```tsx
const makeUrl = (_lang: string) => {
  // Routing nie ma prefiksu języka — wszystkie języki wskazują na ten sam URL.
  // Wybór języka odbywa się po stronie klienta (LanguageContext).
  const suffix = basePath === '/' ? '/' : basePath;
  return `https://stakerpol.pl${suffix}`;
};
```

Plus usunąć fallback canonical w linii 31-33 (canonical jest już ustawiany przez ProductDetail/Index — w HreflangLinks tworzy duplikat).

## Przykładowy JSON-LD dla strony produktu (już generowany przez `generateProductSchema.ts`)

```json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Toyota SWE200D 2018r W-6633366",
  "brand": { "@type": "Brand", "name": "Toyota" },
  "model": "SWE200D",
  "sku": "W-6633366",
  "description": "Elektryczny wózek paletowy Toyota SWE200D, rok 2018, wysokość podnoszenia 2000mm, udźwig 2000kg.",
  "url": "https://stakerpol.pl/products/toyota-swe-200d-2018r-w-6633366",
  "image": ["https://...image1.webp", "https://...image2.webp"],
  "manufacturer": { "@type": "Organization", "name": "Toyota" },
  "category": "Wózki widłowe",
  "additionalProperty": [
    { "@type": "PropertyValue", "name": "Wysokość podnoszenia", "value": "2000 mm", "unitCode": "MMT" },
    { "@type": "PropertyValue", "name": "Udźwig na maszcie", "value": "2000 kg", "unitCode": "KGM" },
    { "@type": "PropertyValue", "name": "Rok produkcji", "value": "2018" },
    { "@type": "PropertyValue", "name": "Stan", "value": "Używany" }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": 4.9,
    "reviewCount": 12,
    "bestRating": 5,
    "worstRating": 1
  },
  "review": [ /* lista z testimonials/ */ ],
  "offers": {
    "@type": "Offer",
    "availability": "https://schema.org/InStock",
    "businessFunction": "https://schema.org/Sell",
    "seller": {
      "@type": "Organization",
      "name": "Stakerpol",
      "url": "https://stakerpol.pl",
      "telephone": "+48694133592"
    }
  },
  "productionDate": "2018"
}
```

## Oczekiwany efekt

| Metryka | Przed | Po |
|---|---|---|
| Canonical wskazuje na istniejący URL | ❌ `/pl/products/...` (404) | ✅ `/products/...` |
| Hreflang prowadzi do 404 | ❌ tak | ✅ nie (wskazuje na canonical) |
| Google Search Console "Alternate page" błędy | obecnie wszystkie | **0** |
| Indeksowalność produktów | utrudniona (canonical → 404) | **prawidłowa** |
| Pozostałe SEO (schema, meta, alt, sitemap) | już prawidłowe | bez zmian |

## Uczciwa ocena

Twoja lista 10 punktów zakładała projekt bez SEO. **8 z 10 jest już zaimplementowane prawidłowo.** Realne problemy znalazłem 2 (canonical mismatch + hreflang→404), oba są krytyczne dla indeksowania, ale małe w zakresie kodu (3 pliki, ~10 linii zmian).

**Zero zmian wizualnych. Zero zmian funkcjonalnych. Tylko poprawne URL-e w meta tagach.**


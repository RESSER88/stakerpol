# Adres produktu w danych strukturalnych JSON-LD

## Problem

Pole `url` w schemacie `Product` jest budowane z bieżącego adresu przeglądarki, więc na środowisku testowym (`stakerpol.lovable.app`) dane strukturalne wskazują adres testowy zamiast produkcyjnego. Canonical i `og:url` już korzystają ze stałej domeny produkcyjnej — JSON-LD jest jedynym rozbieżnym miejscem.

## Zakres

1. `src/utils/seo/generateProductSchema.ts` — funkcja `getCurrentUrl` przestaje czytać adres przeglądarki i zawsze zwraca kanoniczny adres produktu (`productUrl(product)`), spójny z canonical i `og:url`.
2. `src/components/seo/ProductSchema.tsx` — ta sama korekta w analogicznym miejscu, aby oba generatory schematu emitowały identyczny adres.

## Poza zakresem

- Pozostałe elementy raportu (fallback `og:image`, `noindex` dla sprzedanych, rozróżnienie środowisk).
- Struktura schematu, logika ceny, dostępności i pola SEO produktu.
- Migracje bazy, polityki RLS, konfiguracja.

## Kryterium akceptacji

Na środowisku testowym i produkcyjnym `Product.url` w JSON-LD jest identyczny z canonical strony produktu i zawiera domenę `stakerpol.pl`; pozostałe pola schematu bez zmian.

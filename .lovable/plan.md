

## Plan: Wyśrodkować zawartość HomeHelpHero

Aktualnie sekcja jest wyrównana do lewej. Wyśrodkujemy nagłówek, badge'y i CTA.

### Zmiany w `src/components/home/HomeHelpHero.tsx`
- H2: dodać `text-center`
- Kontener badge'y: dodać `justify-center`
- Kontener CTA: dodać `justify-center` + na mobile `items-stretch` (zostaje `flex-col`)
- Bez zmiany struktury, kolorów, paddingów

### Bez zmian
Wszystko inne (HomeStatsBar, Index, kolory, tłumaczenia).


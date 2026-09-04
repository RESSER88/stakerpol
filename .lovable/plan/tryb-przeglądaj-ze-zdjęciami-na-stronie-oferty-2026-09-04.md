# Tryb "Przeglądaj ze zdjęciami" na stronie oferty

## KROK 0 — wynik weryfikacji (ważne, zmienia założenie)

Sprawdziłem kod eksportów. **Nie istnieje eksport JPG pojedynczego produktu ze zdjęciem, białą ramką i znakiem wodnym "STAKERPOL".**

Co faktycznie jest:
- `src/utils/listExporter.ts` — jeden eksport JPG: `exportProductListToJPG()` renderuje **całą tabelę stanu magazynu** (HTML + `html2canvas`), bez żadnych zdjęć produktów. Napis "STAKERPOL" to nagłówek dokumentu (34 px, bold, navy `#1E3A5F`, pod nim pomarańczowa kreska `#F97316`), nie znak wodny na zdjęciu.
- PDF (`pdfGenerator.ts`) i XLSX (`xlsxExporterV2.ts`) — również listy tabelaryczne.
- Karta zdjęciowa produktu z paskiem danych pod fotografią **nigdzie nie istnieje** — nie ma czego "odtworzyć 1:1".

Wniosek: nie da się skopiować istniejącej karty, bo jej nie ma. Zamiast zgadywać, proponuję zbudować kartę z **istniejących tokenów wizualnych oferty i eksportu** (navy `#1E3A5F`, orange `#F97316`, biała ramka, `font-sans` = system-ui/Segoe UI/Roboto — ta sama czcionka co strona główna). Format liczb 1:1 z listy oferty: `formatLift` (`1.54m`), `normalizeBattery` (`210 Ah`), `availabilityLabel`, `formatPrice` z `exportListModel.ts` — bez żadnej nowej logiki formatowania.

Karuzela: w projekcie jest `embla-carousel-react` (przez shadcn), ale **nie będzie użyta** — pionowe przewijanie zrobię natywnym CSS `scroll-snap` (`snap-y mandatory`, karta `h-[100dvh]`, `snap-start`). Zero nowych zależności.

Dane: `SharedOffer.tsx` już ma pełne produkty z `usePublicSupabaseProducts()` (w tym `images[]`), więc **zero zmian w Edge Function `shared-list`** i zero migracji.

## Co zbuduję (po Twojej akceptacji)

1. Nowy komponent `src/components/shared-offer/OfferPhotoCard.tsx` — bezstanowa karta:
   - zdjęcie główne (`product.images[0]`, fallback `product.image`) na białym tle, w białej ramce, `object-contain`, zajmuje większość ekranu,
   - znak wodny "STAKERPOL" na dole na środku zdjęcia (półprzezroczysty biały tekst z delikatnym cieniem, bold, tracking — czytelny na jasnym i ciemnym zdjęciu),
   - pod zdjęciem pasek: model + rok · nr seryjny · mth, a niżej WYS. KONSTR. / PODNOSZENIE / BATERIA (te same ikony co dziś w liście: `MoveVertical`, `ArrowUpFromLine`, `BatteryCharging`), na końcu dostępność i cena,
   - brak strzałek zdjęć, brak przycisków akcji (zadzwoń/zapytaj) — widok czysto przeglądowy.
2. Nowy komponent `src/components/shared-offer/OfferPhotoBrowser.tsx` — `fixed inset-0 z-50` overlay, kontener `overflow-y-auto snap-y snap-mandatory`, jedna karta = `100dvh` + `snap-start`, przycisk X w prawym górnym rogu (zamyka bez przeładowania), licznik "3 / 42" i blokada scrolla `body` na czas otwarcia.
3. `SharedOffer.tsx` — przycisk **"Przeglądaj ze zdjęciami"** w pasku obok filtrów + stan `photoMode`. Karty budowane z `visible` (dokładnie ta sama, już przefiltrowana lista co tekstowa), w tej samej kolejności co posortowane grupy.
4. Wydajność: `loading="lazy"`, `decoding="async"`, jawne `sizes`; pierwsze 2 karty eager, reszta lazy — przy 42+ pozycjach nic nie ładuje się z góry.

## Poza zakresem (nie tykam)

`create_offer`, generatory JPG/PDF/XLSX, `exportListModel.ts` / `EXPORT_COLUMNS`, Edge Function `shared-list`, filtry listy tekstowej, formularz zapytania, sticky controls.

## Pytanie do decyzji

Skoro karty JPG pojedynczego produktu nie ma, akceptujesz wersję "w duchu eksportu" (biała ramka + navy/orange + te same pola i formaty liczb), czy chcesz najpierw zobaczyć propozycję wizualną karty?

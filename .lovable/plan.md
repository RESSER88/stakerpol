# Specyfikacja wyglądu panelu administracyjnego — typografia i kolory

## Cel
Powstaje jeden dokument (`DESIGN_SPEC_ADMIN.md` w katalogu głównym projektu) z rzeczywistymi wartościami wyciągniętymi z kodu panelu: nazwy fontów, kody kolorów (HSL + HEX), promienie oraz skala odstępów. Bez żadnych zmian w wyglądzie aplikacji i bez modyfikacji komponentów.

## Zakres dokumentu
Tylko typografia i kolory (plus wartości pomocnicze: promienie, odstępy, wysokości elementów), zgodnie z ustaleniem. Bez opisu układu sidebara i komponentów.

## Co znajdzie się w dokumencie (wartości już zweryfikowane w kodzie)

### Fonty
- Interfejs (body, `font-sans`): `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Nagłówki panelu (`font-editorial`): `Georgia, Cambria, "Times New Roman", serif`
- Mono (`font-mono`): `ui-monospace, Consolas, Menlo, Monaco, monospace`
- Brak fontów zewnętrznych (Google Fonts) — wszystko systemowe.

### Skala typograficzna panelu (rzeczywiście używana)
- Etykiety/sekcje: `10px` bold, `letter-spacing: 0.2em`, UPPERCASE
- Przyciski: `12px` bold, `letter-spacing: 0.15em`, UPPERCASE
- Nawigacja: `15px` serif
- Nagłówek sekcji: `18px` serif, `tracking-tight`
- Pola formularza: `14px`; na mobile wymuszone `16px` (blokada auto‑zoom iOS)
- Nawigacja dolna (mobile): `9px` / `10px`

### Kolory (HSL z `src/index.css` + konwersja HEX)
Warstwa editorial (panel):
- ink `222 47% 11%`, muted `215 16% 47%`, line `220 13% 91%`, accent `24 95% 53%`, ok `142 71% 45%`, bad `0 73% 51%`, bg `0 0% 100%`

Warstwa admin (starsza, nadal używana na ekranach ładowania):
- orange `24 95% 53%`, dark `222 47% 11%`, bg `210 40% 98%`, border `214 32% 91%`, text `222 47% 17%`, muted `215 16% 47%`, green `142 71% 45%`, red `0 73% 51%`

Marka Stakerpol: navy `212 84% 16%`, orange `25 100% 50%`, gray `215 16% 47%`, lightgray `210 40% 96%`.

Dokument poda każdą wartość jako HSL i HEX oraz opisze przeznaczenie (tło, obramowanie, tekst, akcent, statusy).

### Promienie i odstępy
- `--radius: 0.5rem` (tokeny `lg/md/sm`), ale panel editorial świadomie używa `rounded-none`; jedyne zaokrąglenie to `rounded-full` dla kropek statusu (8×8 px)
- Skala odstępów: standardowa skala Tailwind (1 = 4px); realnie używane 1.5/3/4/6/8/12
- Wymiary stałe: sidebar `240px`, pasek górny i dolny `48px`, przycisk `40px`, padding sekcji mobile `20px/32px`, desktop `48px`
- Obramowania: `1px` linia `--editorial-line`; brak cieni (flat)

## Techniczne
Źródła wartości: `src/index.css` (tokeny HSL), `tailwind.config.ts` (mapowanie kolorów, fonty, promienie), komponenty panelu (`editorial/*`, `layout/*`, `editor/EditorialField.tsx`) jako potwierdzenie realnie stosowanych rozmiarów. HEX policzony z HSL, dodatkowo blok gotowy do skopiowania nie będzie wymagany (wybrano wariant „tylko dokument”).

## Poza zakresem
Brak zmian w komponentach, stylach, konfiguracji i bazie. Wygląd aplikacji pozostaje bez zmian.



# Naprawa dwóch bugów w MobileContactButton.tsx

## BUG 1 — Ikona telefonu obok tekstu zamiast wewnątrz przycisku

**Problem:** W linii 83-84 jest `<Phone size={16} />` (ikona Lucide) **oraz** emoji `📞` w tekście — podwójna ikona. Ikona Lucide renderuje się jako osobny element SVG obok emoji.

**Naprawa:** Usunąć emoji `📞` z tekstu i zostawić tylko ikonę Lucide `<Phone>` jako dziecko tego samego `<a>`. Klasy `flex items-center justify-center gap-2` już są — wystarczy wyczyścić tekst:

```tsx
<Phone size={16} />
Zadzwoń teraz
```

## BUG 2 — Klawiatura zakrywa formularz

**Problem:** `useEffect` nasłuchuje tylko `resize`, nie `scroll`. Używa `setState` zamiast bezpośredniej manipulacji DOM, co powoduje opóźnienia. Brak resetu przy zamknięciu.

**Naprawa:** Przepisać `useEffect` na bezpośrednią manipulację `sheetRef.current.style.maxHeight`:
- Nasłuchiwać zarówno `resize` jak i `scroll` na `visualViewport`
- Ustawiać `maxHeight` na `vh * 0.92` (więcej miejsca)
- Dodać `transition: max-height 0.15s ease` do stylu arkusza
- Resetować `maxHeight` w cleanup
- Usunąć state `sheetMaxHeight` — niepotrzebny

## Zmiany w pliku

**Jedyny plik:** `src/components/contact/MobileContactButton.tsx`

1. **Linia 8:** Usunąć `const [sheetMaxHeight, setSheetMaxHeight] = useState('85vh');`
2. **Linie 24-35:** Przepisać `useEffect` — bezpośrednia manipulacja DOM przez `sheetRef`, nasłuch `resize` + `scroll`, `maxHeight = vh * 0.92 + 'px'`, reset w cleanup
3. **Linia 62:** Zmienić `style={{ maxHeight: sheetMaxHeight }}` → `style={{ maxHeight: '92vh', transition: 'max-height 0.15s ease' }}`
4. **Linia 84:** Usunąć emoji `📞` — zostawić tylko `Zadzwoń teraz`

**Bez zmian:** kolory, walidacja, numer telefonu, separator, overlay, pulsujący przycisk, inne pliki.


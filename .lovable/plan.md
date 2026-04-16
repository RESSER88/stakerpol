

# Plan: Modify Mobile Bottom Sheet — Phone Button + Keyboard Fix

## Changes to `src/components/contact/MobileContactButton.tsx`

### 1. Add phone button + divider before form fields
- Full-width `<a href="tel:+48694133592">` button styled with site colors (orange outline or filled)
- Text: "📞 Zadzwoń teraz"
- Below it: a divider with centered "lub wyślij wiadomość" text (flex + hr pattern)
- Then existing form fields unchanged

### 2. Keyboard-aware sheet height via `visualViewport` API
- Add a `useEffect` that listens to `window.visualViewport?.addEventListener('resize', ...)` when sheet is open
- Track viewport height in state, apply as `maxHeight` on the sheet div
- Sheet already has `overflow-y: auto` — just ensure the `maxHeight` dynamically adjusts
- Cleanup listener on close/unmount
- Add `id` or ref to the sheet div for targeting

### 3. Keep everything else unchanged
- Pulsing button, overlay close, form validation, submit logic, colors — all untouched

## Files modified
- `src/components/contact/MobileContactButton.tsx` — only file changed


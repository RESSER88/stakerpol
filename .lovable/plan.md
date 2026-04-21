

# Microsoft Clarity — integracja zgodna z Consent Mode v2

## Plan

Dodaję Clarity (ID: `wf47fxgy8q`) **z poszanowaniem zgód cookie** — uruchamia się dopiero gdy użytkownik wyrazi zgodę na cookies analityczne (zgodnie z istniejącym `CookieConsent.tsx`).

## Zmiany — 2 pliki

### 1. `index.html`
Dodaję loader Clarity w `<head>`, ale **bez automatycznego startu**. Skrypt sprawdza zapisaną zgodę z `localStorage` (klucz `cookie-consent-v1`):
- Jeśli użytkownik wcześniej zaakceptował `analytics: true` → ładuje Clarity natychmiast
- Jeśli nie → czeka na event `clarity-consent-granted` z `CookieConsent.tsx`

Loader używa tej samej strategii deferred (`requestIdleCallback`) co GA4 — bez wpływu na Core Web Vitals.

### 2. `src/components/consent/CookieConsent.tsx`
W funkcji `updateConsent`:
- Gdy `next.analytics === true` → emituje `window.dispatchEvent(new Event('clarity-consent-granted'))` żeby zainicjować Clarity bez przeładowania strony
- Gdy `next.analytics === false` → wywołuje `window.clarity?.('stop')` żeby zatrzymać tracking po cofnięciu zgody

## Czego NIE robię

- **Nie ładuję Clarity bezwarunkowo** — naruszałoby to RODO/Consent Mode v2 (analytics_storage: denied domyślnie)
- Nie zmieniam UI banera cookie — tekst "Analityczne" już pokrywa Clarity
- Nie dodaję osobnego toggla dla Clarity — mieści się w istniejącej kategorii "Analityczne" razem z GA4

## Późniejsze przeniesienie domeny (na produkcję)

**Nic nie musisz zmieniać w kodzie.** Clarity ID (`wf47fxgy8q`) działa niezależnie od domeny. Gdy przeniesiesz stronę na docelową domenę:
1. W panelu Clarity (clarity.microsoft.com) → Settings → Setup → dodaj nową domenę do listy dozwolonych
2. Opcjonalnie: dodaj filtry żeby wykluczyć ruch z `lovable.app` (Settings → Filters → IP/URL filters)

Skrypt sam zacznie zbierać dane z nowej domeny, historyczne sesje z `lovable.app` zostaną zachowane w panelu (możesz je usunąć lub zostawić jako baseline).

## Efekt

| | Stan |
|---|---|
| Clarity ID | `wf47fxgy8q` |
| Zgodność RODO | ✅ czeka na zgodę analytics |
| Wpływ na LCP/FCP | ✅ żaden (deferred + warunkowy) |
| Stop po cofnięciu zgody | ✅ `clarity('stop')` |
| Migracja domeny | ✅ tylko konfiguracja w panelu Clarity |
| Zmiany wizualne | żadne |


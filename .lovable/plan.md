

# Audyt analityki i śledzenia – Stakerpol.pl

## Odpowiedzi na pytania wejściowe

| Pytanie | Odpowiedź |
|---------|-----------|
| Technologia | React 18 + Vite + Tailwind + Supabase (SPA) |
| GTM zainstalowany? | ❌ Nie – GA4 jest wstrzyknięty bezpośrednio w `index.html` |
| Cookie consent / Consent Mode v2? | ⚠️ Częściowo – banner istnieje, wywołuje `gtag('consent','update')`, ale **brak `gtag('consent','default',...)`** przed `gtag('config')` |
| Google Search Console? | ⚠️ Komponent `GSCVerification` istnieje, ale zmienna `VITE_GSC_VERIFICATION` jest pusta |
| Heatmapa / nagrania sesji? | ❌ Brak (zero: Clarity, Hotjar, FullStory) |
| Zdarzenia konwersji w GA4? | ❌ Brak – żaden CTA (telefon, email, WhatsApp, formularz) nie wysyła `gtag('event')` |
| PageSpeed / Core Web Vitals? | ⚠️ Monitoring LCP/CLS/INP istnieje w kodzie, ale działa tylko na produkcji; brak formalnego testu |

---

## Tabela audytu

| Narzędzie / Element | Status | Priorytet | Wymagane działanie |
|---------------------|--------|-----------|-------------------|
| GA4 (G-SM784ZRC5E) | ⚠️ Częściowo | 🔴 Krytyczny | Brak `consent('default')` – GA4 może tracić dane. Brak śledzenia nawigacji SPA |
| GTM | ❌ Brak | 🟡 Ważny | Nie zainstalowany – zarządzanie tagami wymaga redeploy |
| Consent Mode v2 | ⚠️ Częściowo | 🔴 Krytyczny | Banner OK, ale brak domyślnego stanu consent PRZED ładowaniem GA4 |
| Google Search Console | ⚠️ Częściowo | 🔴 Krytyczny | Komponent gotowy, ale brak kodu weryfikacji |
| Heatmapa (Clarity) | ❌ Brak | 🟡 Ważny | Zero narzędzi do analizy zachowań |
| Śledzenie tel: kliknięć | ❌ Brak | 🔴 Krytyczny | Żaden przycisk "Zadzwoń" nie wysyła eventu |
| Śledzenie mailto: | ❌ Brak | 🔴 Krytyczny | Kliknięcia email nie rejestrowane |
| Śledzenie WhatsApp | ❌ Brak | 🔴 Krytyczny | Link WhatsApp bez eventu |
| Śledzenie formularza zapytania | ⚠️ Częściowo | 🔴 Krytyczny | Zapis do Supabase OK, ale brak eventu GA4 |
| Nawigacja SPA → page_view | ❌ Brak | 🔴 Krytyczny | React Router nie wysyła page_view przy zmianie trasy |
| Facebook Pixel | ❌ Brak | 🟢 Opcjonalny | Brak remarketingu |
| Schema.org JSON-LD | ✅ OK | — | Zaimplementowane (ProductSchema) |
| Web Vitals monitoring | ⚠️ Częściowo | 🟡 Ważny | Kod istnieje, ale tylko na produkcji |
| Sentry / LogRocket | ❌ Brak | 🟢 Opcjonalny | Placeholdery bez kluczy API |

---

## Checklist implementacyjna (od najpilniejszego)

### 🔴 1. Consent Mode v2 – domyślny stan (index.html)
Dodać PRZED `gtag('config')` w `index.html`:
```js
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  functionality_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500
});
```
**Gdzie:** `index.html`, linia 22 (przed `gtag('config')`)

### 🔴 2. Śledzenie nawigacji SPA (kod React)
Utworzyć hook `usePageTracking` w `src/hooks/usePageTracking.ts` używający `useLocation()` z React Router do wysyłania `gtag('event', 'page_view', { page_path, page_title })` przy każdej zmianie trasy. Podpiąć w `App.tsx`.

### 🔴 3. Śledzenie kliknięć CTA (kod React)
Utworzyć `src/utils/analytics.ts` z funkcjami:
- `trackPhoneClick()` – event `phone_click`
- `trackEmailClick()` – event `email_click`  
- `trackWhatsAppClick()` – event `whatsapp_click`
- `trackCTAClick(label)` – event `cta_click`
- `trackFormSubmit(formName)` – event `form_submit`

Dodać wywołania do komponentów:
- `Header.tsx` – link tel: i WhatsApp
- `CallToAction.tsx` – przyciski CTA
- `ProductCard.tsx` – przycisk "Zadzwoń"
- `Footer.tsx` – linki tel:, mailto:, social media
- `PriceInquiryModal.tsx` – submit formularza

### 🔴 4. Google Search Console (zmienna środowiskowa)
Ustawić secret `VITE_GSC_VERIFICATION` z kodem weryfikacji z GSC. Komponent `GSCVerification.tsx` jest już gotowy.

### 🟡 5. Microsoft Clarity – darmowe heatmapy (index.html)
Dodać snippet Clarity w `index.html` (w `<head>`), z warunkiem consent – uruchamiać tylko gdy `analytics_storage === 'granted'`. Alternatywnie: dodać przez przyszły GTM.

### 🟡 6. Konwersje GA4 (panel GA4)
Po wdrożeniu eventów z kroku 3, w panelu GA4:
- Oznaczyć `phone_click`, `email_click`, `whatsapp_click`, `form_submit` jako konwersje
- Przypisać wartości konwersji (np. telefon = 50 PLN, formularz = 100 PLN)
**Gdzie:** GA4 Admin → Events → Mark as conversion

### 🟡 7. Migracja do GTM (opcjonalnie, index.html)
Zastąpić bezpośredni snippet GA4 kontenerem GTM. Umożliwi dodawanie tagów (Clarity, FB Pixel, remarketing) bez redeploy.
**Gdzie:** `index.html` – zamienić skrypt GA4 na GTM container

### 🟢 8. Facebook Pixel (GTM lub index.html)
Dodać po wdrożeniu GTM jako tag w kontenerze.

### 🟢 9. Sentry (kod React)
Dodać prawdziwy DSN do `productionMonitoring.ts` lub osobny `Sentry.init()`.

---

## Plan implementacji (co zrobię po zatwierdzeniu)

1. **index.html** – dodać `consent('default')` przed `gtag('config')`
2. **src/utils/analytics.ts** – utworzyć utility z funkcjami trackingu
3. **src/hooks/usePageTracking.ts** – hook do śledzenia nawigacji SPA
4. **App.tsx** – podpiąć `usePageTracking`
5. **Header, Footer, CallToAction, ProductCard, PriceInquiryModal** – dodać wywołania `track*()` do CTA
6. **index.html** – dodać snippet Microsoft Clarity (opcjonalnie)

Szacowany czas: ~30 minut implementacji.


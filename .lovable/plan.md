

# Plan: Widgety kontaktowe (desktop bubble + mobile navbar button)

## Analiza kolorów

Obecna paleta strony:
- **Primary (CTA):** pomarańczowy `#FF6B00` (HSL 25 100% 50%) — używany w `.cta-button`, przyciskach telefonu
- **Navy:** `#0A2647` — tło ciemne
- **Akcent telefonu:** pomarańczowy (ten sam primary)

Proponowany czerwony `#C0392B` i niebieski `#185FA5` **kolidują** z istniejącą paletą. Strona jest spójna wokół pomarańczowego. Rekomendacja:

| Element | Propozycja użytkownika | Rekomendacja dopasowana do strony |
|---------|----------------------|----------------------------------|
| Główny przycisk / bubble | `#C0392B` (czerwony) | **`#FF6B00`** (pomarańczowy — ten sam co CTA) |
| Przycisk „Zadzwoń" | `#185FA5` (niebieski) | **`#0A2647`** (navy — obecny na stronie) |
| Pulsowanie | czerwone glow | pomarańczowe glow |

To zachowa spójność wizualną. Jeśli wolisz czerwony — zaimplementuję czerwony.

## Co zostanie zbudowane

### 1. `FloatingContactBubble.tsx` (desktop, ukryty na mobile)
- Okrągły przycisk 52px, fixed bottom-right, z-[9999]
- Pulsująca animacja box-shadow
- Klik → 2 sub-bubbles (envelope + phone) animowane slide-up
- „Wyślij zapytanie" → popup z formularzem (imię, telefon/email, treść)
- „Zadzwoń" → popup z kartą tel:+48694133592
- Submit → wywołuje `supabase.functions.invoke('notify-lead')` (Resend email)
- Po sukcesie: „Dziękujemy! Odpiszemy w ciągu 24 godzin." + auto-close 3s

### 2. `MobileContactButton.tsx` (mobile, ukryty na desktop)
- Pill button „✉ Zapytaj" w headerze mobilnym
- Pulsująca animacja
- Klik → bottom sheet z formularzem (te same pola)
- Submit → ta sama logika (notify-lead → Resend)
- Overlay + zamknięcie na ✕ lub tap overlay

### 3. `useContactForm.ts` — shared hook
- Walidacja pól (required, format email/telefon)
- Submit logic: `supabase.functions.invoke('notify-lead', { body: {...} })`
- Stany: loading, success, error

### 4. Modyfikacja `notify-lead` Edge Function
- Rozszerzenie payload o pola z nowego formularza (name, contact, message — bez product_model)
- Product_model = "Zapytanie ogólne" gdy brak produktu
- Redeploy edge function

### 5. Modyfikacja plików
- **`Header.tsx`** — dodanie `MobileContactButton` w sekcji mobilnej
- **`Layout.tsx`** — dodanie `FloatingContactBubble`
- **`tailwind.config.ts`** — dodanie keyframe `pulse-glow` dla pulsowania bubble
- **`notify-lead/index.ts`** — obsługa nowego typu payload

### 6. GA4 tracking
- Event `contact_bubble_open` przy rozwinięciu bubble
- Event `contact_form_submit` przy wysłaniu formularza
- Event `contact_call_click` przy kliknięciu „Zadzwoń"

## Numer telefonu
Użyty z kodu: **+48 694 133 592** (zgodny z headerem)

## Tekst
- „Odpowiadamy w ciągu 24 godzin!" — zgodnie z życzeniem użytkownika


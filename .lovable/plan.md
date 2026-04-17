

## Plan: Ujednolicony formularz kontaktowy w hero (desktop only)

### Cel
Dodać formularz w prawej kolumnie hero na homepage — z **półprzezroczystym szarym tłem** (nie białe, delikatne, widoczne ale nie krzykliwe), **ujednolicony** z mobilnym i bubble (te same pola, ten sam hook, ten sam honeypot, ten sam GDPR).

### Ujednolicenie
Reuse istniejącego hooka `useContactForm` (już ma honeypot + GDPR + walidację + submit przez `notify-lead`). Ten sam zestaw pól co w `MobileContactButton` i `FloatingContactBubble`:
- **Imię** (`name`)
- **Telefon lub e-mail** (`contact` — jedno pole, walidacja akceptuje oba — tak jak w pozostałych formularzach)
- **Wiadomość** (`message`)
- Honeypot ukryty `name="website"`
- GDPR checkbox + adnotacja + link `/polityka-prywatnosci`

To samo co w MobileContactButton/FloatingContactBubble — pełna spójność.

### Styl karty (półprzezroczyste szare tło)
- Tło: `bg-white/10 backdrop-blur-md` (półprzezroczyste, na ciemnym hero widoczne jako delikatna szara/dymna tafla)
- Border: `border border-white/20`
- Rounded: `rounded-xl` (12px)
- Padding: 24px
- Shadow: `shadow-lg`
- Max-width: 440px
- Tekst inputów: jasny (białe placeholdery, białe labele), inputy z `bg-white/5` i `border-white/30` żeby wpisywany tekst był czytelny na ciemnym hero
- Nagłówek karty (białym): "Zapytaj o ofertę — odpiszemy tego samego dnia"
- Submit button: klasa `cta-button` (pomarańczowy primary) + `animate-pulse-light`, tekst "Poproś o ofertę →"
- Komunikat sukcesu: "✓ Dziękujemy! Skontaktujemy się wkrótce."

### Layout w `Index.tsx`
- Hero grid: zmiana `md:grid-cols-2` → `lg:grid-cols-2` (na tablecie hero zostaje 1-kolumnowy, formularz schowany)
- Lewa kolumna: bez zmian (headline + dwa CTA)
- Prawa kolumna (nowa): `<HeroContactForm />` w wrapperze `hidden lg:block`
- Mobile (<1024px): formularz całkowicie ukryty — używany jest sticky bubble

### Pliki
1. **Nowy:** `src/components/contact/HeroContactForm.tsx` — używa `useContactForm`, ten sam honeypot i GDPR co inne formularze
2. **Edycja:** `src/pages/Index.tsx` — dodanie prawej kolumny + zmiana breakpointa grida na `lg:`

### Bez zmian
Tekst hero, CTA buttons, mobile bubble, desktop bubble, hook `useContactForm`, edge function `notify-lead`, kolory globalne, inne strony.


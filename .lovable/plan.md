

## Plan: Zmiana kolejności + nowy About we wszystkich 5 językach

### 1. Kolejność sekcji w `src/pages/Index.tsx`
Przenieść About przed HomeHelpHero:
Hero → ContactConversionCards → **About** → HomeHelpHero → HomeStatsBar → WhyChooseUs → Featured Products → FAQ → CTA

### 2. Nowe klucze tłumaczeń w `src/utils/translations/homepage.ts`
Zaktualizować `aboutUsTitle` i `aboutUsDescription` (wszystkie 5 języków: PL/EN/DE/CS/SK) oraz dodać nowe klucze:
- `aboutUsSubtitle` — drugi wiersz nagłówka ("Sprawdzone wózki Toyota BT...")
- `aboutUsIntro1` — akapit "Od 2008 roku..."
- `aboutUsIntro2` — akapit "Specjalizujemy się..."
- `aboutUsBenefitsTitle` — "Co zyskujesz, wybierając Stakerpol:"
- `aboutUsBenefit1..4` — 4 punkty listy
- `aboutUsClosing` — "Zapraszam do kontaktu..."

Wszystkie klucze wypełnione w PL/EN/DE/CS/SK na podstawie tłumaczeń dostarczonych przez użytkownika.

### 3. Nowy markup About w `Index.tsx`
Zamiast pojedynczego `<p>`:
```
<h2>{aboutUsTitle}</h2>
<p class="font-medium">{aboutUsSubtitle}</p>
<p>{aboutUsIntro1}</p>
<p>{aboutUsIntro2}</p>
<h3>{aboutUsBenefitsTitle}</h3>
<ul> 4× <li>{aboutUsBenefitN}</li> </ul>
<p>{aboutUsClosing}</p>
```
Zachowane: `section-padding bg-white`, `container-custom`, `section-title text-center`, `max-w-3xl mx-auto` dla treści. Lista wyrównana do lewej w wycentrowanym kontenerze.

### Pliki
1. `src/utils/translations/homepage.ts` — aktualizacja 2 kluczy + dodanie 8 nowych (każdy w 5 językach)
2. `src/pages/Index.tsx` — przesunięcie About + nowy markup

### Bez zmian
HomeHelpHero, HomeStatsBar, ContactConversionCards, kolory, fonty, inne strony.


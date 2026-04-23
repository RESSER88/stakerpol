
## Plan: Zmiany w edycji produktu — przeniesienie Sloganu i limity znaków

### 1. Sekcja 02 — Dane podstawowe (`Chapter02_Basic.tsx`)

**Pole Model (limit 22 znaków):**
- Dodanie `maxLength={22}` do EditorialInput
- Dodanie licznika znaków w `hint` w formacie `X/22`
- Zablokowanie wpisywania powyżej limitu przez `.slice(0, 22)`

**Pole Slogan (przeniesione z Marketingu):**
- Dodanie nowego pola `EditorialInput` bezpośrednio po polu „Krótki opis"
- Limit 86 znaków (`maxLength={86}` + `.slice(0, 86)`)
- Licznik znaków w `hint` w formacie `X/86`
- Placeholder: „np. Niezawodność w każdej zmianie"
- Zachowanie istniejącego opisu w hint: „Krótkie hasło wyświetlane nad opisem"

### 2. Sekcja 05 — Marketing (`Chapter05_Marketing.tsx`)

**Usunięcie pola Slogan:**
- Całkowite usunięcie bloku `<EditorialInput label="Slogan" ... />`
- Pozostałe pola (krótki opis marketingowy, checkbox wyróżnienia, zalety, FAQ) bez zmian

### Pliki do edycji
- `src/components/admin/editor/chapters/Chapter02_Basic.tsx` — dodanie limitów i przeniesionego pola
- `src/components/admin/editor/chapters/Chapter05_Marketing.tsx` — usunięcie pola Slogan

Bez zmian w typach (Product.slogan już istnieje) i bez migracji bazy danych.

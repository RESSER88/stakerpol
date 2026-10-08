# Raport diagnostyczny — „Kopiuj” i slugi (tylko analiza)

Nic nie zostało zmienione. Ten raport koryguje dwa punkty z poprzedniego raportu SEO (patrz na końcu).

## 1. Jak działa „Kopiuj” dzisiaj
- Funkcja: `handleCopy` w `src/pages/Admin.tsx`.
- **Kliknięcie „Kopiuj” nie zapisuje rekordu w bazie.** Otwiera edytor w trybie „NOWY”: id puste, model „{model} (kopia)”, numer seryjny „{numer}-COPY”. Zapis do bazy (INSERT) następuje dopiero po „Zapisz” (`addProductMutation` w `useSupabaseProducts.ts`).
- Kopiowane są wszystkie pola produktu (`...product`), **razem z polem `slug` oryginału**.
- Slug kopii **nie** powstaje w triggerze bazy. `mapProductToSupabaseInsert` (`src/types/supabase.ts`) zawsze wysyła slug: wartość z pola „Slug (opcjonalnie)” (rozdział 02 edytora), a gdy pole jest puste — slug tworzony w przeglądarce (`toSlug(model, numer)`). Trigger `set_product_slug` działa tylko przy pustym slugu, więc w praktyce się nie uruchamia.
- Wniosek: kopia przejmuje slug oryginału w polu formularza. Gdyby został w niezmienionej postaci, zapis by się nie udał (slug musi być unikalny). Slug `toyota-swe-200d-6760435` u wózka 6865260 oznacza, że w polu slug był tekst z numerem 6760435 (np. pozostawiony po edycji lub po kopii innego wózka). Z kodu nie da się ustalić dokładnej sekwencji kliknięć.

## 2. Zdjęcia
- Kopia przejmuje listę adresów zdjęć oryginału (`setProductImages(product.images)`). Po „Zapisz” tworzone są nowe wiersze `product_images` wskazujące **te same pliki** w Storage — plików nie duplikuje się.
- Już dziś zdjęcia kopiują się poprawnie przy zapisie dopiero po „Zapisz”. Ryzyko: usunięcie pliku z magazynu przy jednym wózku usunęłoby go też w drugim (jeśli usuwanie kasuje plik — do sprawdzenia osobno).

## 3. Powiązane dane
- `faq_ids`: kopiowane (pole produktu).
- Korzyści (`product_benefits`): kopiowane tylko wtedy, gdy edytor ma je w stanie — do sprawdzenia w edytorze, nie zostało tu potwierdzone.
- `product_seo_settings` (cena, GTIN, MPN, włączenie schematu): **nie kopiowane** — kopia startuje bez nich.
- `product_translations`: nie kopiowane (system tłumaczeń odłączony).

## 4. Wykonalność rozwiązania
- Zasadnicza część („zapis dopiero po Zapisz”) **już działa**. Brakuje dwóch zmian, wyłącznie we frontendzie, bez bazy:
  1. W `handleCopy` wyczyścić pole `slug` (zamiast przejmować slug oryginału).
  2. Wyczyścić numer seryjny (zamiast „-COPY”) — formularz i tak wymaga numeru przed zapisem.
- Wtedy slug powstanie z nowego modelu i numeru w chwili zapisu.

## 5. Ostrzeżenie na liście produktów
- Łatwe, tylko frontend: lista (`ProductsTableDesktop`, `ProductCardMobile`) ma już slug i numer seryjny. Warunek „slug nie kończy się na `-{numer}`” → mała ikona z podpowiedzią. Dziś dotyczy to 1 wózka.

## 6. SEO w adminie
- **Tytułu i meta description nie da się nadpisać ręcznie.** Oba są budowane w `ProductDetail.tsx` z modelu, roku, wysokości, udźwigu, motogodzin i statusu. W bazie nie ma pól na własny tytuł/opis.
- Dostępność w JSON-LD pochodzi z `products.availability_status` (`generateProductSchema.ts`). Pole `product_seo_settings.availability` istnieje, ale nie wpływa na schemat — więc nie mogą się rozjechać na stronie, choć w bazie mogą mieć różne wartości.
- **Edycja może zmienić slug i canonical.** Przy zapisie zmian (`mapProductToSupabaseUpdate`) slug jest wysyłany ponownie: jeśli ktoś zmieni pole „Slug” albo je wyczyści, slug przelicza się z aktualnego modelu i numeru. Zmienia się wtedy adres karty i canonical, a stary adres przestaje działać. Zmiana samej nazwy lub numeru przy niezmienionym polu slug adresu nie zmienia.

## Korekta poprzedniego raportu SEO
- Przyczyna braku „ł”: slugi tworzy funkcja `toSlug` w przeglądarce, nie funkcja w bazie. `toSlug` usuwa akcenty (ą→a, ś→s, ó→o), ale litera „ł” nie ma takiego rozbicia i zostaje wycięta. Funkcja w bazie (używana tylko awaryjnie) wycina wszystkie polskie litery.
- Przyczyna duplikatu 6760435: jak w pkt 1 — slug pochodzi z pola formularza, a nie z triggera.

## Decyzje do podjęcia
1. Czy przy „Kopiuj” czyścić slug i numer seryjny (zalecane)?
2. Czy dodać ikonę ostrzeżenia o niezgodnym slugu?
3. Czy zablokować pole „Slug” przy edycji istniejącego wózka, żeby nie zmieniać przypadkiem adresu?
4. Czy zamieniać „ł” na „l” dla nowych wózków?

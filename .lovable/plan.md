# Mobilna oferta handlowa — refactor prezentacji

## Zakres
- Zmiany wyłącznie dla telefonu na `/oferta/:token`; widok desktopowy, strona produktu, dane, pobieranie, filtry i sortowanie pozostają bez zmian.
- Domyślny tryb zmieni się na **Zdjęcia**. Nad produktami pojawi się mały przełącznik z czytelnymi etykietami „Zdjęcia” i „Lista”.

## Widok „Zdjęcia”
- Przebudowa istniejącej karty: duże zdjęcie z badge’em dostępności, licznikiem, strzałkami i gestem przesunięcia w poziomie.
- Pod zdjęciem: model i cena netto, niżej rok/numer seryjny/motogodziny, następnie lekka siatka czterech parametrów 2×2.
- Zachowanie istniejącego linku „Karta produktu”.
- Na dole karty: drugorzędne „Zadzwoń” i główne pomarańczowe „Zamawiam ten model”, z obecną treścią szkicu e-maila.

## Widok „Lista”
- Zastąpienie ciężkich mobilnych nagłówków grup subtelnym nagłówkiem: nazwa modelu i liczba dostępnych sztuk.
- Każdy wiersz będzie lekkim, klikalnym odsyłaczem do istniejącej karty produktu: miniatura, rok/numer/motogodziny, cztery skrócone parametry, status, cena netto i strzałka.
- Bez dodatkowych parametrów i bez zmian w grupowaniu danych.

## Dolny pasek
- Mobilny pasek pozostaje stale widoczny, ale otrzyma kolejność „Zadzwoń” + „Zamawiam”.
- „Zamawiam” użyje istniejącego szkicu e-maila dla aktualnie oglądanego produktu: w zdjęciach produktu najbliższego środkowi ekranu, a w liście ostatnio dotkniętego wiersza. Bez zmian backendu.

## Weryfikacja
- Sprawdzenie typów oraz test na aktywnej ofercie w szerokościach 384 px i 430 px: oba tryby, swipe/strzałki, przejście do karty produktu, ceny, grupy i oba przyciski zamówienia.

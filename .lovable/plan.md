# Zapis nowej oferty kończy się błędem bez wyjaśnienia — diagnoza i naprawa

## Co się dzieje

W bazie istnieją dwie wersje funkcji tworzącej ofertę: stara (9 pól) i nowa
(11 pól, z firmą i „Skąd?”). Sprawdziłem to zapytaniem do bazy — obie są nadal aktywne.
Gdy panel wysyła dane, baza nie wie, której wersji użyć, i odrzuca zapis.

Drugi problem: okno nowej oferty pokazuje tylko ogólny komunikat
„Nie udało się utworzyć oferty”, więc nie widzisz prawdziwej przyczyny.

## Co zrobię

1. Usunę starą wersję funkcji tworzącej ofertę, zostawiając tylko nową.
   Nic z zapisanych ofert i kontaktów nie zostanie usunięte.
2. W oknie nowej oferty komunikat błędu pokaże konkretną przyczynę z bazy,
   zamiast ogólnego zdania — na przyszłość od razu będzie wiadomo, co blokuje zapis.
3. Sprawdzę też ekran „Odnów ofertę” w karcie kontaktu, żeby korzystał z tej
   jednej, właściwej wersji funkcji.
4. Po zmianie utworzę ofertę testową w panelu i potwierdzę, że zapisuje się
   zarówno z telefonem, jak i bez telefonu i e-maila.

## Szczegóły techniczne

- Migracja: `DROP FUNCTION public.create_offer(text, jsonb, text, text, text, integer, text, text, uuid);`
  (pozostaje wariant z `_firma` i `_kanal_detail`). Powód: PostgREST zwraca
  PGRST203 „Could not choose the best candidate function” przy dwóch przeciążeniach.
- `NewOfferView.tsx`: w bloku `catch` oraz przy `lastError` przekazywać
  `(error as { message?: string }).message` do `description` toastu; zachować
  obecną obsługę kodu `23505` (kolizja tokenu).
- `ContactCard.tsx`: potwierdzić, że `renew()` wywołuje `create_offer`
  z pełnym zestawem nazwanych parametrów nowego wariantu.
- Weryfikacja: `npx tsgo --noEmit` + Playwright (1280×1800) — Zapytania →
  „Wygeneruj ofertę” → zapis bez telefonu i e-maila; sprawdzenie wpisu
  w `shared_lists` i `contacts`.

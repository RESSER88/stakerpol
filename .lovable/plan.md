
## Diagnoza: po zalogowaniu panel sam wyrzuca użytkownika na `/`, mimo że logowanie i rola admina są poprawne

### Co potwierdziłem
- Logi przeglądarki pokazują zdarzenie `SIGNED_IN`.
- Request `rpc/has_role` zwraca `200` i `true`, więc konto **ma rolę admina**.
- W routerze istnieje tylko ścieżka `/admin`; **nie ma dziś** `/admin/dashboard` ani `/panel`.

### Rzeczywista przyczyna
To nie jest błąd hasła, sesji ani RLS. To jest **race condition w inicjalizacji auth**:

1. `useSupabaseAuth.tsx`
   - po `SIGNED_IN` ustawia `user` i bardzo szybko robi `setLoading(false)`,
   - właściwe sprawdzenie roli admina uruchamia dopiero chwilę później przez `setTimeout(...checkAdminRole...)`.

2. `src/pages/Admin.tsx`
   - w tym krótkim oknie stan wygląda tak:
     - `user !== null`
     - `authLoading === false`
     - `adminLoading === false`
     - `isAdmin === false` (jeszcze nieustalone)
   - wtedy odpala się warunek:
   ```ts
   if (!isAdmin && !adminLoading) return <Navigate to="/" replace />;
   ```
   i użytkownik zostaje odesłany na stronę główną, mimo że za moment `has_role` zwróci `true`.

To oznacza, że problem jest **produkcyjny**, nie lokalny. Na deployu zachowa się tak samo.

---

## Plan naprawy

### 1. Uporządkować stan autoryzacji w `useSupabaseAuth.tsx`
Zamiast traktować `isAdmin=false` jako „brak uprawnień”, rozdzielić 3 stany:

- `unknown/checking` — rola jeszcze sprawdzana
- `granted` — admin potwierdzony
- `denied` — admin odrzucony

Najbezpieczniej:
- ustawić `adminLoading=true` **natychmiast**, gdy pojawi się zalogowany użytkownik,
- nie kończyć przepływu auth dopóki bieżąca weryfikacja roli nie zostanie rozstrzygnięta,
- nie zostawiać przejściowego stanu „user już jest, ale admin jeszcze nie wiadomo”.

Praktycznie:
- albo dodać osobne `authReady` / `roleResolved`,
- albo poprawić obecne `loading` + `adminLoading`, żeby dla zalogowanego usera zawsze było:
  - najpierw `adminLoading=true`,
  - potem dopiero wynik `isAdmin`.

### 2. Uszczelnić guard w `src/pages/Admin.tsx`
Zastąpić obecną logikę warunkową tak, aby:

- `!user` → pokazać `AdminLogin`
- `user && (authLoading || adminLoading || !roleResolved)` → pokazać loader
- `user && roleResolved && !isAdmin` → pokazać `PermissionDenied`
- `user && isAdmin` → renderować panel

Najważniejsze: **usunąć możliwość redirectu do `/` zanim status admina będzie ostatecznie znany**.

### 3. Nie używać `/admin/dashboard` jako celu, dopóki ta trasa nie istnieje
Aktualna aplikacja ma tylko:
- `/admin`

Więc poprawne zachowanie po logowaniu powinno być teraz:
- użytkownik zostaje na `/admin`,
- formularz logowania znika,
- od razu pojawia się panel admina.

Jeśli potrzebny jest adres typu `/admin/dashboard`, to jest osobny krok architektoniczny:
- dodać route alias w `App.tsx`,
- zmapować go w `Admin.tsx` na sekcję `start`.

Do naprawy bug-u nie jest to konieczne.

### 4. Opcjonalne dopracowanie UX logowania
W `AdminLogin.tsx` można po sukcesie:
- nie robić żadnego ręcznego `navigate('/')`,
- zdać się na stan auth i render panelu na tej samej ścieżce `/admin`.

Jeśli kiedyś zostanie dodane `/admin/dashboard`, wtedy dopiero warto po sukcesie robić `navigate('/admin/dashboard', { replace: true })`.

---

## Pliki do zmiany
- `src/hooks/useSupabaseAuth.tsx`
- `src/pages/Admin.tsx`

Opcjonalnie, tylko jeśli chcemy osobny URL dashboardu:
- `src/App.tsx`
- `src/components/admin/AdminLogin.tsx`

---

## Proponowana implementacja techniczna

### Wariant rekomendowany
W `useSupabaseAuth.tsx`:
- dodać stan typu:
```ts
type AdminRoleState = 'unknown' | 'checking' | 'granted' | 'denied';
```
albo równoważny zestaw flag.

Zasada:
- po wykryciu `newSession.user`:
  - ustaw `adminLoading=true` od razu,
  - uruchom `checkAdminRole`,
  - dopiero po zakończeniu ustaw końcowy status.

W `Admin.tsx`:
- usunąć wczesny redirect:
```ts
if (!isAdmin && !adminLoading) return <Navigate to="/" replace />;
```
- zastąpić go renderowaniem zależnym od pełnego statusu roli.

### Minimalny hotfix
Jeśli chcemy najmniejszą zmianę:
- w `onAuthStateChange` ustawiać `adminLoading=true` synchronnie zanim `setLoading(false)`,
- w `Admin.tsx` nigdy nie redirectować do `/`, gdy `user` istnieje, ale rola jeszcze nie została potwierdzona.

To prawdopodobnie naprawi błąd już samo w sobie.

---

## QA po wdrożeniu

### Test 1 — zwykłe logowanie
1. Wejść na `/admin`
2. Wpisać poprawny email i hasło
3. Kliknąć „Zaloguj się”

Oczekiwane:
- brak przejścia na `/`
- pozostajemy na `/admin`
- zamiast formularza pojawia się panel admina

### Test 2 — wolniejsza sieć / opóźniony role check
Zasymulować wolniejsze połączenie lub po prostu obserwować stan po kliknięciu logowania.

Oczekiwane:
- przez chwilę może być loader
- ale nie ma redirectu na `/`
- po odpowiedzi `has_role=true` ładuje się panel

### Test 3 — użytkownik bez roli admin
Zalogować się kontem bez uprawnień.

Oczekiwane:
- brak skoku na `/`
- pokazuje się kontrolowany ekran `PermissionDenied`

### Test 4 — odświeżenie strony na `/admin`
Będąc zalogowanym, odświeżyć `/admin`.

Oczekiwane:
- krótki loader / sprawdzenie sesji
- potem panel
- bez mignięcia strony głównej

### Test 5 — produkcja
Sprawdzić ten sam flow na opublikowanej wersji.

Oczekiwane:
- identycznie stabilne zachowanie
- brak zależności od HMR/dev mode

---

## Efekt końcowy
Po naprawie logowanie będzie działało tak:
- użytkownik loguje się na `/admin`,
- aplikacja czeka na rozstrzygnięcie sesji i roli,
- panel otwiera się od razu po pozytywnym `has_role`,
- użytkownik nie jest już błędnie przekierowywany na stronę główną.

## Uwaga architektoniczna
Jeśli docelowo chcesz mieć prawdziwe adresy:
- `/admin/dashboard`
- `/admin/products`
- `/admin/faq`

to warto zrobić to jako osobny refactor routera. Obecny bug nie wymaga jednak tej przebudowy; można go naprawić w obecnej architekturze przez poprawne zarządzanie stanem auth.

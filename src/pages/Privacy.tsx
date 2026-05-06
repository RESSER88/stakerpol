import React from 'react';
import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';

const Privacy: React.FC = () => {
  return (
    <Layout>
      <Helmet>
        <title>Polityka prywatności – Stakerpol</title>
        <meta
          name="description"
          content="Polityka prywatności serwisu Stakerpol.pl – informacje o przetwarzaniu danych osobowych zgodnie z RODO."
        />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Polityka prywatności</h1>
        <p className="text-sm text-muted-foreground mb-8">Ostatnia aktualizacja: 5 maja 2026</p>

        <h2 className="text-xl font-semibold mt-8 mb-3">I. Postanowienia ogólne</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li className="text-base leading-relaxed">
            Polityka prywatności określa, jak zbierane, przetwarzane i przechowywane są dane osobowe Użytkowników niezbędne do świadczenia usług drogą elektroniczną za pośrednictwem serwisu internetowego https://stakerpol.pl (dalej: Serwis).
          </li>
          <li className="text-base leading-relaxed">
            Serwis zbiera wyłącznie dane osobowe niezbędne do obsługi zapytań ofertowych, kontaktu z Użytkownikiem oraz rozwoju usług oferowanych w Serwisie.
          </li>
          <li className="text-base leading-relaxed">
            Dane osobowe zbierane za pośrednictwem Serwisu są przetwarzane zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO) oraz ustawą o ochronie danych osobowych z dnia 10 maja 2018 r.
          </li>
        </ol>

        <h2 className="text-xl font-semibold mt-8 mb-3">II. Administrator danych</h2>
        <p className="text-base leading-relaxed mb-3">Administratorem danych osobowych zbieranych poprzez Serwis jest:</p>
        <p className="text-base leading-relaxed mb-3">
          Stakerpol FHU – Michał Seweryn<br />
          Adres: ul. Szewska 6, 32-043 Skała<br />
          NIP: 6492111954<br />
          REGON: 120724080<br />
          E-mail: info@stakerpol.pl<br />
          Telefon: +48 694 133 592<br />
          dalej: Administrator.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">III. Cel zbierania danych osobowych</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li className="text-base leading-relaxed">
            Dane osobowe Użytkowników wykorzystywane są w celu:
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>obsługi zapytań ofertowych przesyłanych przez formularze kontaktowe oraz formularze zapytań przy produktach,</li>
              <li>kontaktu z Użytkownikiem za pośrednictwem czatu, telefonu lub poczty elektronicznej,</li>
              <li>umówienia wizyty w siedzibie Administratora,</li>
              <li>przedstawienia oferty handlowej dotyczącej wózków widłowych, paleciaków oraz pozostałych produktów Administratora,</li>
              <li>realizacji ewentualnej umowy sprzedaży zawartej z Użytkownikiem,</li>
              <li>prowadzenia działań analitycznych i statystycznych dotyczących korzystania z Serwisu,</li>
              <li>ustalenia, dochodzenia lub obrony przed roszczeniami.</li>
            </ul>
          </li>
          <li className="text-base leading-relaxed">
            Podanie danych jest dobrowolne, ale niezbędne do skontaktowania się z Użytkownikiem i przygotowania oferty.
          </li>
        </ol>

        <h2 className="text-xl font-semibold mt-8 mb-3">IV. Rodzaj przetwarzanych danych osobowych</h2>
        <p className="text-base leading-relaxed mb-3">
          Administrator może przetwarzać następujące dane osobowe Użytkownika: imię i nazwisko, adres e-mail, numer telefonu, nazwa firmy oraz NIP (w przypadku zapytań od podmiotów gospodarczych), a także treść wiadomości przekazanej przez Użytkownika za pośrednictwem formularza lub czatu.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">V. Okres przetwarzania danych osobowych</h2>
        <p className="text-base leading-relaxed mb-3">Dane osobowe Użytkowników będą przetwarzane przez okres:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>gdy podstawą przetwarzania jest realizacja umowy – do momentu przedawnienia roszczeń po jej wykonaniu,</li>
          <li>gdy podstawą przetwarzania jest zgoda Użytkownika – do momentu jej odwołania, a po odwołaniu zgody do upływu terminu przedawnienia ewentualnych roszczeń,</li>
          <li>gdy podstawą przetwarzania jest prawnie uzasadniony interes Administratora (np. obsługa zapytania ofertowego, które nie zakończyło się sprzedażą) – maksymalnie przez okres 3 lat od ostatniego kontaktu.</li>
        </ul>
        <p className="text-base leading-relaxed mb-3 mt-3">
          Termin przedawnienia roszczeń wynosi co do zasady 6 lat, a dla roszczeń o świadczenia okresowe i roszczeń związanych z prowadzeniem działalności gospodarczej – 3 lata.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">VI. Udostępnianie danych osobowych</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li className="text-base leading-relaxed">
            Dane osobowe Użytkowników mogą być przekazywane podmiotom współpracującym z Administratorem, w szczególności:
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>dostawcy usługi hostingu bazy danych (Supabase),</li>
              <li>dostawcy usługi wysyłki wiadomości e-mail (Resend),</li>
              <li>dostawcy narzędzi analitycznych (np. Google),</li>
              <li>firmom kurierskim i transportowym – w przypadku realizacji dostawy,</li>
              <li>kancelariom prawnym i podatkowym – w razie potrzeby.</li>
            </ul>
          </li>
          <li className="text-base leading-relaxed">
            Niektóre z wymienionych podmiotów mogą przetwarzać dane poza Europejskim Obszarem Gospodarczym (EOG). W takim przypadku transfer odbywa się na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję Europejską, zapewniających odpowiedni poziom ochrony danych zgodnie z RODO.
          </li>
        </ol>

        <h2 className="text-xl font-semibold mt-8 mb-3">VII. Prawa Użytkowników</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li className="text-base leading-relaxed">
            Użytkownik Serwisu ma prawo do:
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>dostępu do treści swoich danych osobowych,</li>
              <li>sprostowania danych,</li>
              <li>usunięcia danych,</li>
              <li>ograniczenia przetwarzania,</li>
              <li>przenoszenia danych,</li>
              <li>wniesienia sprzeciwu wobec przetwarzania,</li>
              <li>cofnięcia zgody w każdej chwili (co nie wpływa na zgodność z prawem przetwarzania, którego dokonano na podstawie zgody przed jej cofnięciem).</li>
            </ul>
          </li>
          <li className="text-base leading-relaxed">
            Realizacja powyższych praw odbywa się poprzez kontakt na adres e-mail: info@stakerpol.pl.
          </li>
          <li className="text-base leading-relaxed">
            Administrator spełnia żądanie lub odmawia jego spełnienia niezwłocznie, najpóźniej w ciągu miesiąca od jego otrzymania.
          </li>
          <li className="text-base leading-relaxed">
            Użytkownik ma prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa), jeżeli uzna, że przetwarzanie jego danych narusza przepisy RODO.
          </li>
        </ol>

        <h2 className="text-xl font-semibold mt-8 mb-3">VIII. Pliki cookies</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li className="text-base leading-relaxed">Serwis zbiera informacje za pomocą plików cookies (sesyjnych, stałych oraz pochodzących od podmiotów zewnętrznych).</li>
          <li className="text-base leading-relaxed">Pliki cookies wykorzystywane są w celu poprawnego świadczenia usług, prowadzenia statystyk odwiedzin oraz – jeżeli Użytkownik wyrazi zgodę – w celach marketingowych.</li>
          <li className="text-base leading-relaxed">W Serwisie wykorzystywane są m.in. pliki cookies należące do: Google (Google Analytics, Google Maps, ewentualnie Google Ads), a także własne pliki cookies Serwisu.</li>
          <li className="text-base leading-relaxed">Użytkownik może w każdej chwili określić zakres dostępu plików cookies do swojego urządzenia w ustawieniach przeglądarki internetowej. Wyłączenie obsługi cookies może wpłynąć na ograniczenie niektórych funkcjonalności Serwisu.</li>
        </ol>

        <h2 className="text-xl font-semibold mt-8 mb-3">IX. Zautomatyzowane podejmowanie decyzji i profilowanie</h2>
        <p className="text-base leading-relaxed mb-3">
          Dane Użytkowników nie są przetwarzane w sposób zautomatyzowany skutkujący podejmowaniem decyzji wywołujących skutki prawne lub w podobny sposób istotnie wpływających na Użytkownika.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">X. Postanowienia końcowe</h2>
        <ol className="list-decimal pl-6 space-y-1">
          <li className="text-base leading-relaxed">Administrator zastrzega sobie prawo do wprowadzania zmian w Polityce prywatności, przy czym prawa Użytkowników nie zostaną ograniczone.</li>
          <li className="text-base leading-relaxed">Informacja o zmianach pojawi się w formie komunikatu w Serwisie.</li>
          <li className="text-base leading-relaxed">W sprawach nieuregulowanych w niniejszej Polityce prywatności obowiązują przepisy RODO oraz przepisy prawa polskiego.</li>
        </ol>
      </div>
    </Layout>
  );
};

export default Privacy;

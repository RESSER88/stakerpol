import Layout from '@/components/layout/Layout';
import { MapPin } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import ContactTopInfoBar from '@/components/contact/ContactTopInfoBar';
import ContactCompactHero from '@/components/contact/ContactCompactHero';
import ContactStatsBar from '@/components/contact/ContactStatsBar';
import ContactDetailsCard from '@/components/contact/ContactDetailsCard';
import ContactLeadForm from '@/components/contact/ContactLeadForm';
import ContactConversionCards from '@/components/contact/ContactConversionCards';
import ContactMobileStickyBar from '@/components/contact/ContactMobileStickyBar';

const Contact = () => {
  return (
    <Layout>
      <Helmet>
        <title>Kontakt – Stakerpol | Wózki widłowe BT Toyota</title>
        <meta name="description" content="Skontaktuj się ze Stakerpol: wózki widłowe BT Toyota, serwis i części. Godziny: Pon-Pt 8:00–17:00. Adres: ul. Szewska 6, 32-043 Skała." />
        <link rel="canonical" href="https://stakerpol.pl/contact" />
        <meta property="og:title" content="Kontakt – Stakerpol" />
        <meta property="og:description" content="Wózki widłowe BT Toyota – kontakt, doradztwo, serwis. Odpowiadamy tego samego dnia." />
        <meta property="og:type" content="website" />
      </Helmet>

      <ContactTopInfoBar />
      <ContactCompactHero />
      <ContactStatsBar />

      {/* Two-column: details + form */}
      <section className="bg-gray-50 py-8">
        <div className="container-custom">
          <div className="grid lg:grid-cols-[1fr_1.55fr] gap-6 items-start">
            <ContactDetailsCard />
            <ContactLeadForm />
          </div>
        </div>
      </section>

      <ContactConversionCards />

      {/* Map */}
      <section className="bg-white py-8">
        <div className="container-custom">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-stakerpol-orange" size={20} />
            <h2 className="text-xl font-bold text-stakerpol-navy">Nasza lokalizacja</h2>
          </div>
          <div className="rounded-xl overflow-hidden shadow-sm border border-gray-200">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d2610899.6512577063!2d19.995502000000002!3d50.278735!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x471655f810639623%3A0xc3bcd72bdd0d6aa!2sStakerpol%20Paleciak%20elektryczny%20Bt%20Swe%20200d!5e0!3m2!1spl!2sus!4v1749466251552!5m2!1spl!2sus"
              width="100%"
              height="240"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Lokalizacja Stakerpol"
            />
          </div>
        </div>
      </section>

      {/* Mobile sticky bar at very bottom + spacing for it */}
      <div className="md:hidden h-16" />
      <ContactMobileStickyBar />
    </Layout>
  );
};

export default Contact;

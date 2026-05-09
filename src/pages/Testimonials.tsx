
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Star, Users, Award, Package, Phone } from 'lucide-react';
import { trackPhoneClick, trackWhatsAppClick } from '@/utils/analytics';
import { useSupabaseFAQ } from '@/hooks/useSupabaseFAQ';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import FAQSchema from '@/components/seo/FAQSchema';

const Testimonials = () => {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { faqs, fetchFAQs } = useSupabaseFAQ();

  useEffect(() => {
    fetchFAQs(language);
  }, [language]);

  const reviewsFaqItems = faqs
    .filter((f) => f.language === language)
    .filter((f) => f.is_active === true)
    .filter((f) => f.display_locations?.includes('reviews'))
    .sort((a, b) => a.display_order - b.display_order);

  const getFaqHeading = () => {
    switch (language) {
      case 'en': return { title: 'Frequently asked questions', subtitle: 'We answer the questions most often asked by our customers before purchase.' };
      case 'cs': return { title: 'Často kladené otázky', subtitle: 'Odpovídáme na otázky, které naši zákazníci nejčastěji kladou před nákupem.' };
      case 'sk': return { title: 'Často kladené otázky', subtitle: 'Odpovedáme na otázky, ktoré naši zákazníci najčastejšie kladú pred nákupom.' };
      case 'de': return { title: 'Häufig gestellte Fragen', subtitle: 'Wir beantworten die Fragen, die unsere Kunden am häufigsten vor dem Kauf stellen.' };
      default: return { title: 'Najczęstsze pytania', subtitle: 'Odpowiadamy na pytania, które najczęściej zadają nasi klienci przed zakupem' };
    }
  };
  const getNoAnswerCopy = () => {
    switch (language) {
      case 'en': return { title: "Didn't find your answer?", subtitle: 'Call or write — free consultation' };
      case 'cs': return { title: 'Nenašli jste odpověď?', subtitle: 'Zavolejte nebo napište — bezplatná konzultace' };
      case 'sk': return { title: 'Nenašli ste odpoveď?', subtitle: 'Zavolajte alebo napíšte — bezplatná konzultácia' };
      case 'de': return { title: 'Keine Antwort gefunden?', subtitle: 'Rufen Sie an oder schreiben Sie — kostenlose Beratung' };
      default: return { title: 'Nie znalazłeś odpowiedzi na swoje pytanie?', subtitle: 'Zadzwoń lub napisz — doradzimy bezpłatnie' };
    }
  };
  const faqHeading = getFaqHeading();
  const noAnswerCopy = getNoAnswerCopy();

  const getExperienceContent = () => {
    switch (language) {
      case 'en':
        return {
          title: 'Happy with our equipment? Take the next step',
          description: 'Share your opinion on Google or browse our current forklifts.',
          buttonText: 'Add Google review',
          secondaryText: 'See our forklifts'
        };
      case 'cs':
        return {
          title: 'Spokojeni s naší technikou? Pokračujte dál',
          description: 'Sdílejte názor na Google nebo si prohlédněte naše aktuální vozíky.',
          buttonText: 'Přidat hodnocení na Google',
          secondaryText: 'Prohlédnout vozíky'
        };
      case 'sk':
        return {
          title: 'Spokojní s našou technikou? Pokračujte ďalej',
          description: 'Zdieľajte názor na Google alebo si pozrite naše aktuálne vozíky.',
          buttonText: 'Pridať hodnotenie na Google',
          secondaryText: 'Pozrieť vozíky'
        };
      case 'de':
        return {
          title: 'Zufrieden mit unserer Technik? Gehen Sie weiter',
          description: 'Teilen Sie Ihre Meinung auf Google oder sehen Sie unsere aktuellen Stapler.',
          buttonText: 'Google-Bewertung hinzufügen',
          secondaryText: 'Unsere Stapler ansehen'
        };
      default:
        return {
          title: 'Zadowolony z naszego sprzętu? Polecamy iść dalej',
          description: 'Podziel się opinią na Google lub zobacz nasze aktualne wózki.',
          buttonText: 'Dodaj opinię na Google',
          secondaryText: 'Zobacz nasze wózki'
        };
    }
  };

  const getReadyContent = () => {
    switch (language) {
      case 'en':
        return {
          title: 'Want to talk about your warehouse?',
          description: 'We advise free of charge and match the forklift to your conditions. We respond the same day.'
        };
      case 'cs':
        return {
          title: 'Chcete si promluvit o svém skladu?',
          description: 'Poradíme zdarma a vybereme vozík podle vašich podmínek. Odpovídáme tentýž den.'
        };
      case 'sk':
        return {
          title: 'Chcete sa porozprávať o svojom sklade?',
          description: 'Poradíme zdarma a vyberieme vozík podľa vašich podmienok. Odpovedáme v ten istý deň.'
        };
      case 'de':
        return {
          title: 'Möchten Sie über Ihr Lager sprechen?',
          description: 'Wir beraten kostenlos und wählen den passenden Stapler. Antwort am selben Tag.'
        };
      default:
        return {
          title: 'Chcesz porozmawiać o swoim magazynie?',
          description: 'Doradzimy bezpłatnie i dobierzemy wózek do Twoich warunków. Odpowiadamy tego samego dnia.'
        };
    }
  };

  const getStripContent = () => {
    switch (language) {
      case 'en':
        return { rating: 'Average Google rating', sold: 'Forklifts sold', years: 'On the market since 2008', yearsValue: '17 years' };
      case 'cs':
        return { rating: 'Průměrné hodnocení Google', sold: 'Prodaných vozíků', years: 'Na trhu od 2008', yearsValue: '17 let' };
      case 'sk':
        return { rating: 'Priemerné hodnotenie Google', sold: 'Predaných vozíkov', years: 'Na trhu od 2008', yearsValue: '17 rokov' };
      case 'de':
        return { rating: 'Google-Durchschnittsbewertung', sold: 'Verkaufte Stapler', years: 'Auf dem Markt seit 2008', yearsValue: '17 Jahre' };
      default:
        return { rating: 'Średnia ocen w Google', sold: 'Sprzedanych wózków', years: 'Na rynku od 2008', yearsValue: '17 lat' };
    }
  };

  const experienceContent = getExperienceContent();
  const readyContent = getReadyContent();
  const strip = getStripContent();

  // Load Elfsight script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://static.elfsight.com/platform/platform.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://static.elfsight.com/platform/platform.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>Opinie klientów – Stakerpol</title>
        <meta name="description" content="Opinie klientów o Stakerpol: wózki paletowe BT Toyota, sprzedaż, serwis i wynajem. Sprawdź rekomendacje i dodaj własną opinię." />
        <link rel="canonical" href="https://stakerpol.pl/testimonials" />
        <meta property="og:title" content="Opinie klientów – Stakerpol" />
        <meta property="og:description" content="Sprawdź opinie klientów o Stakerpol i dodaj własną recenzję." />
        <meta property="og:type" content="website" />
        <style>{`
          .elfsight-app-79b664bd-146f-4c14-95e6-8e8fc072c9f3 a[href*="elfsight.com"],
          .elfsight-app-79b664bd-146f-4c14-95e6-8e8fc072c9f3 [class*="PoweredBy"],
          .elfsight-app-79b664bd-146f-4c14-95e6-8e8fc072c9f3 [class*="poweredBy"] {
            font-size: 0.7rem !important;
            color: #9ca3af !important;
            opacity: 0.6;
          }
        `}</style>
      </Helmet>
      <section className="bg-gradient-to-b from-gray-100 to-white py-12 md:py-20">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-6 text-center animate-fade-in">{t('customerOpinions')}</h1>
          <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto mb-12 animate-fade-in delay-100">
            {t('testimonialsPageDescription')}
          </p>

          {/* Social proof strip */}
          <div className="mb-8 md:mb-12 animate-fade-in delay-150">
            <div className="grid grid-cols-3 gap-3 md:gap-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                <div className="flex gap-0.5 md:gap-1 mb-1 md:mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 md:w-5 md:h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <div className="text-2xl md:text-4xl font-bold text-stakerpol-navy leading-none">5.0</div>
                <div className="text-xs md:text-sm text-muted-foreground leading-tight">{strip.rating}</div>
              </div>
              <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                <Users className="w-4 h-4 md:w-7 md:h-7 text-stakerpol-navy mb-1 md:mb-2" />
                <div className="text-2xl md:text-4xl font-bold text-stakerpol-navy leading-none">850+</div>
                <div className="text-xs md:text-sm text-muted-foreground leading-tight">{strip.sold}</div>
              </div>
              <div className="flex flex-col items-center text-center space-y-1 md:space-y-2">
                <Award className="w-4 h-4 md:w-7 md:h-7 text-stakerpol-navy mb-1 md:mb-2" />
                <div className="text-2xl md:text-4xl font-bold text-stakerpol-navy leading-none">{strip.yearsValue}</div>
                <div className="text-xs md:text-sm text-muted-foreground leading-tight">{strip.years}</div>
              </div>
            </div>
          </div>

          {/* Google Reviews Widget */}
          <div className="mb-16 animate-fade-in delay-200">
            <div className="elfsight-app-79b664bd-146f-4c14-95e6-8e8fc072c9f3" data-elfsight-app-lazy></div>
          </div>

          <div className="mt-16 bg-white p-8 rounded-lg shadow text-center animate-fade-in">
            <h3 className="text-2xl font-bold mb-4">{experienceContent.title}</h3>
            <p className="text-lg mb-6">
              {experienceContent.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <a
                href="https://g.co/kgs/tR5khFz"
                target="_blank"
                rel="noopener noreferrer"
                className="cta-button inline-block"
              >
                {experienceContent.buttonText}
              </a>
              <Button asChild variant="outline" className="border-stakerpol-navy text-stakerpol-navy hover:bg-stakerpol-navy/5 font-bold">
                <Link to="/products">
                  <Package className="mr-2 w-4 h-4" />
                  {experienceContent.secondaryText} →
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ section — only renders when admin selected at least one FAQ for "reviews" */}
      {reviewsFaqItems.length > 0 && (
        <section className="bg-white py-12 md:py-16">
          <div className="container-custom max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-3 text-stakerpol-navy">{faqHeading.title}</h2>
            <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">{faqHeading.subtitle}</p>

            <Accordion type="single" collapsible className="space-y-2">
              {reviewsFaqItems.map((qa, idx) => (
                <AccordionItem
                  key={qa.id}
                  value={`reviews-faq-${idx}`}
                  className="border rounded-md bg-white"
                >
                  <AccordionTrigger className="text-left text-sm md:text-base font-semibold hover:text-stakerpol-navy py-4 px-5 hover:no-underline">
                    {qa.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{qa.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <FAQSchema items={reviewsFaqItems.map((f) => ({ question: f.question, answer: f.answer }))} />

            <div className="mt-8 text-center bg-muted/30 border rounded-lg py-6 px-4 md:px-6">
              <p className="text-base md:text-lg font-semibold text-stakerpol-navy">{noAnswerCopy.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{noAnswerCopy.subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-center mt-4">
                <a href="tel:+48694133592" className="text-sm md:text-base font-semibold text-stakerpol-navy hover:opacity-80">
                  📞 694 133 592
                </a>
                <a href="mailto:info@stakerpol.pl" className="text-sm md:text-base font-semibold text-stakerpol-navy hover:opacity-80">
                  ✉ info@stakerpol.pl
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Custom CTA section (replaces global CallToAction here) */}
      <section className="bg-stakerpol-navy text-white py-16">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4 animate-fade-in">{readyContent.title}</h2>
          <p className="text-xl mb-8 animate-fade-in max-w-2xl mx-auto">{readyContent.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
            <Button className="cta-button text-lg" size="lg" asChild>
              <a href="tel:+48694133592" onClick={() => trackPhoneClick('testimonials_cta')}>
                <Phone className="mr-2" />
                {t('callNow')}
              </a>
            </Button>
            <Button className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1" size="lg" asChild>
              <a href="https://wa.me/+48694133592" target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick('testimonials_cta')}>
                <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515"/>
                </svg>
                WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Testimonials;

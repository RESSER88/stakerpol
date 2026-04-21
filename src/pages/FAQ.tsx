import React, { useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import FAQSection, { FAQItem } from '@/components/ui/FAQSection';
import FAQSchema from '@/components/seo/FAQSchema';
import SearchInput from '@/components/ui/SearchInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { useSupabaseFAQ } from '@/hooks/useSupabaseFAQ';

const FAQ: React.FC = () => {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [searchTerm, setSearchTerm] = useState('');
  const { faqs: supabaseFAQs, loading, fetchFAQs } = useSupabaseFAQ();

  React.useEffect(() => {
    fetchFAQs(language);
  }, [language]);
  
  // Fallback to static translations if no database FAQs exist
  const staticFaqItems: FAQItem[] = useMemo(() => {
    return Array.from({ length: 35 }, (_, index) => ({
      question: t(`faq_${index + 1}_question` as any),
      answer: t(`faq_${index + 1}_answer` as any),
    }));
  }, [t]);

  const faqItems: FAQItem[] = useMemo(() => {
    if (loading) return [];
    
    const languageFAQs = supabaseFAQs.filter(faq => faq.language === language);
    
    if (languageFAQs.length > 0) {
      return languageFAQs.map(faq => ({
        question: faq.question,
        answer: faq.answer,
      }));
    }
    
    // Fallback to static content if no database FAQs for current language
    return staticFaqItems;
  }, [supabaseFAQs, language, loading, staticFaqItems]);

  const filteredFAQItems = useMemo(() => {
    if (!searchTerm.trim()) return faqItems;
    
    return faqItems.filter(item => 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, faqItems]);

  const getMetaContent = () => {
    switch (language) {
      case 'de':
        return {
          title: 'FAQ Gabelstapler – häufige Fragen | Stakerpol',
          description: 'Komplette FAQ zu Toyota BT Gabelstaplern: Betrieb, Service, UDT, Batterie, Lieferung. Antworten auf 35 häufigste Fragen.',
          ogTitle: 'FAQ Gabelstapler – Stakerpol',
          ogDescription: 'Antworten auf die häufigsten Fragen zu Toyota BT Gabelstaplern: Nutzung, Service, UDT, Batterie, Lieferung.'
        };
      case 'en':
        return {
          title: 'FAQ forklifts – frequently asked questions | Stakerpol',
          description: 'Complete FAQ about Toyota BT forklifts: operation, service, UDT, battery, delivery. Answers to 35 most frequent questions.',
          ogTitle: 'FAQ forklifts – Stakerpol',
          ogDescription: 'Answers to the most frequent questions about Toyota BT forklifts: usage, service, UDT, battery, delivery.'
        };
      case 'cs':
        return {
          title: 'FAQ vysokozdvižné vozíky – často kladené otázky | Stakerpol',
          description: 'Kompletní FAQ o vysokozdvižných vozících Toyota BT: provoz, servis, UDT, baterie, dodávka. Odpovědi na 35 nejčastějších otázek.',
          ogTitle: 'FAQ vysokozdvižné vozíky – Stakerpol',
          ogDescription: 'Odpovědi na nejčastější otázky o vysokozdvižných vozících Toyota BT: používání, servis, UDT, baterie, dodávka.'
        };
      case 'sk':
        return {
          title: 'FAQ vysokozdvižné vozíky – často kladené otázky | Stakerpol',
          description: 'Kompletné FAQ o vysokozdvižných vozíkoch Toyota BT: prevádzka, servis, UDT, batéria, dodávka. Odpovede na 35 najčastejších otázok.',
          ogTitle: 'FAQ vysokozdvižné vozíky – Stakerpol',
          ogDescription: 'Odpovede na najčastejšie otázky o vysokozdvižných vozíkoch Toyota BT: používanie, servis, UDT, batéria, dodávka.'
        };
      default:
        return {
          title: 'FAQ wózki widłowe – najczęstsze pytania | Stakerpol',
          description: 'Kompletne FAQ o wózkach widłowych Toyota BT: eksploatacja, serwis, UDT, bateria, dostawa. Odpowiedzi na 35 najczęstszych pytań.',
          ogTitle: 'FAQ wózki widłowe – Stakerpol',
          ogDescription: 'Odpowiedzi na najczęstsze pytania o wózki widłowe Toyota BT: użytkowanie, serwis, UDT, bateria, dostawa.'
        };
    }
  };

  const metaContent = getMetaContent();

  return (
    <Layout>
      <Helmet>
        <title>{metaContent.title}</title>
        <meta name="description" content={metaContent.description} />
        <link rel="canonical" href={`https://stakerpol.pl/${language}/faq`} />
        <meta property="og:title" content={metaContent.ogTitle} />
        <meta property="og:description" content={metaContent.ogDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://stakerpol.pl/${language}/faq`} />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <main>
        <section className="section-padding bg-white" aria-labelledby="faq-page-heading">
          <div className="container-custom">
            <h1 id="faq-page-heading" className="section-title text-center">{t('faq_section_title')}</h1>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mt-2">
              {t('faq_page_description')}
            </p>
            
            <div className="mt-8 max-w-md mx-auto">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t('faq_search_placeholder')}
                className="w-full"
              />
            </div>
            
            <div className="mt-8">
              {filteredFAQItems.length > 0 ? (
                <FAQSection title="" items={filteredFAQItems} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {t('faq_no_results').replace('{searchTerm}', searchTerm)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <FAQSchema items={faqItems} />
    </Layout>
  );
};

export default FAQ;
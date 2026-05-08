import React, { useState, useMemo, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Helmet } from 'react-helmet-async';
import FAQSchema from '@/components/seo/FAQSchema';
import SearchInput from '@/components/ui/SearchInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { useSupabaseFAQ, FAQ as FAQType, FAQCategory } from '@/hooks/useSupabaseFAQ';
import { usePublicSupabaseProducts } from '@/hooks/usePublicSupabaseProducts';
import FAQCategoryTabs, { CategoryFilter } from '@/components/faq/FAQCategoryTabs';
import FAQItemEnhanced from '@/components/faq/FAQItemEnhanced';
import HomeHeroForm from '@/components/home/HomeHeroForm';

const CATEGORY_HEADER: Record<CategoryFilter, string> = {
  all: 'Wszystkie pytania',
  pre_purchase: 'Przed zakupem',
  tech_specs: 'Specyfikacja techniczna',
  delivery: 'Dostawa i transport',
  service_warranty: 'Serwis i gwarancja',
};

const FAQ: React.FC = () => {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<CategoryFilter>('all');
  const { faqs, loading, fetchFAQs } = useSupabaseFAQ();
  const { products } = usePublicSupabaseProducts();

  useEffect(() => {
    fetchFAQs(language);
  }, [language]);

  const langFaqs = useMemo(
    () => faqs.filter((f) => f.is_active && f.language === language),
    [faqs, language]
  );

  const counts = useMemo(() => {
    const c: Record<FAQCategory, number> = {
      pre_purchase: 0,
      tech_specs: 0,
      delivery: 0,
      service_warranty: 0,
    };
    langFaqs.forEach((f) => {
      if (c[f.category] !== undefined) c[f.category]++;
    });
    return c;
  }, [langFaqs]);

  const featured = useMemo(
    () =>
      langFaqs
        .filter((f) => f.is_featured)
        .sort((a, b) => a.display_order - b.display_order)
        .slice(0, 5),
    [langFaqs]
  );

  const visibleFaqs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return langFaqs
      .filter((f) => selected === 'all' || f.category === selected)
      .filter(
        (f) =>
          !term ||
          f.question.toLowerCase().includes(term) ||
          f.answer.toLowerCase().includes(term)
      )
      .sort((a, b) => a.display_order - b.display_order);
  }, [langFaqs, selected, searchTerm]);

  const schemaItems = useMemo(
    () => visibleFaqs.map((f) => ({ question: f.question, answer: f.answer })),
    [visibleFaqs]
  );

  const meta = {
    title: 'FAQ wózki widłowe – najczęstsze pytania | Stakerpol',
    description:
      'Kompletne FAQ o wózkach widłowych Toyota BT: eksploatacja, serwis, UDT, bateria, dostawa.',
  };

  return (
    <Layout>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={`https://stakerpol.pl/${language}/faq`} />
      </Helmet>
      <main>
        <section className="section-padding bg-white" aria-labelledby="faq-page-heading">
          <div className="container-custom">
            <h1 id="faq-page-heading" className="section-title text-center">
              {t('faq_section_title')}
            </h1>
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
              <FAQCategoryTabs
                selected={selected}
                onChange={setSelected}
                counts={counts}
                totalCount={langFaqs.length}
              />
            </div>

            {!loading && selected === 'all' && featured.length > 0 && !searchTerm.trim() && (
              <section className="mt-10 bg-stakerpol-navy/5 border border-stakerpol-navy/10 rounded-xl p-5 md:p-6">
                <h2 className="text-xl md:text-2xl font-bold text-navy-brand mb-4">
                  Najczęściej pytają przed zakupem
                </h2>
                <div className="space-y-3">
                  {featured.map((f) => (
                    <FAQItemEnhanced key={f.id} faq={f} products={products} />
                  ))}
                </div>
              </section>
            )}

            <section className="mt-10">
              <h2 className="text-xl md:text-2xl font-bold text-navy-brand mb-4">
                {CATEGORY_HEADER[selected]}
              </h2>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Ładowanie…</p>
              ) : visibleFaqs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('faq_no_results').replace('{searchTerm}', searchTerm)}
                </p>
              ) : (
                <div className="space-y-3">
                  {visibleFaqs.map((f) => (
                    <FAQItemEnhanced key={f.id} faq={f} products={products} />
                  ))}
                </div>
              )}
            </section>

            <section className="mt-12 max-w-xl mx-auto bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
              <HomeHeroForm
                source="faq_form"
                title="Nie znalazłeś odpowiedzi?"
                subtitle="Opisz swoje pytanie — odpowiemy w ciągu 30 minut. Bez zobowiązań."
                ctaLabel="Wyślij pytanie →"
              />
            </section>
          </div>
        </section>
      </main>
      <FAQSchema items={schemaItems} />
    </Layout>
  );
};

export default FAQ;

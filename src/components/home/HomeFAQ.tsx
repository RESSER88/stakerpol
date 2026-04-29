import { useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useSupabaseFAQ } from '@/hooks/useSupabaseFAQ';
import { useLanguage } from '@/contexts/LanguageContext';
import FAQSchema from '@/components/seo/FAQSchema';

const HomeFAQ = () => {
  const { language } = useLanguage();
  const { faqs, fetchFAQs } = useSupabaseFAQ();

  useEffect(() => {
    fetchFAQs(language);
  }, [language]);

  const langFaqs = faqs.filter((f) => f.language === language);
  const homeSelected = langFaqs
    .filter((f) => f.display_locations?.includes('home'))
    .sort((a, b) => a.display_order - b.display_order);

  // Fallback: jeśli admin nie zaznaczył jeszcze pytań dla "home",
  // pokazujemy pierwsze 6 (zachowanie wsteczne). Po zaznaczeniu pytań fallback wygasa.
  const items = homeSelected.length > 0 ? homeSelected : langFaqs.slice(0, 6);

  if (items.length === 0) return null;

  return (
    <section className="bg-white py-10 md:py-16">
      <div className="container-custom max-w-[800px] px-4 md:px-6">
        <h2 className="text-xl md:text-3xl font-extrabold text-navy-brand leading-tight mb-6 md:mb-8">
          Najczęstsze pytania
        </h2>

        <Accordion
          type="single"
          collapsible
          defaultValue="faq-0"
          className="space-y-2"
        >
          {items.map((qa, idx) => (
            <AccordionItem
              key={qa.id}
              value={`faq-${idx}`}
              className="border border-border-line rounded-md mb-0 bg-white shadow-none hover:shadow-none"
            >
              <AccordionTrigger className="text-left text-sm md:text-base font-semibold text-ink hover:text-navy-brand py-3.5 px-4 md:py-4 md:px-5 hover:no-underline">
                {qa.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 md:px-5 md:pb-5">
                <p className="text-sm text-ink-soft leading-relaxed">{qa.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <FAQSchema items={items.map((f) => ({ question: f.question, answer: f.answer }))} />

        {/* CTA pod FAQ */}
        <div className="mt-8 md:mt-10 text-center bg-surface-soft border border-border-line rounded-lg py-6 px-4 md:px-6">
          <p className="text-base md:text-lg font-semibold text-navy-brand">
            Nie znalazłeś odpowiedzi na swoje pytanie?
          </p>
          <p className="text-sm text-ink-soft mt-1">
            Zadzwoń lub napisz — doradzimy bezpłatnie
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center items-center mt-4">
            <a
              href="tel:+48694133592"
              className="text-sm md:text-base font-semibold text-navy-brand hover:text-orange-cta transition-colors"
            >
              📞 694 133 592
            </a>
            <a
              href="mailto:info@stakerpol.pl"
              className="text-sm md:text-base font-semibold text-navy-brand hover:text-orange-cta transition-colors"
            >
              ✉ info@stakerpol.pl
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeFAQ;

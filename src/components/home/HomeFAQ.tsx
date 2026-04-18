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

  const items = faqs.slice(0, 6);

  if (items.length === 0) return null;

  return (
    <section className="bg-white py-10 md:py-16">
      <div className="container-custom max-w-[800px] px-4 md:px-6">
        <div className="font-mono text-xs md:text-sm text-red-accent tracking-widest mb-2">
          03
        </div>
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
      </div>
    </section>
  );
};

export default HomeFAQ;

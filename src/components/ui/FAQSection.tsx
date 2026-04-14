import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FEATURES } from '@/config/featureFlags';

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title?: string;
  items: FAQItem[];
}

const FAQSection: React.FC<FAQSectionProps> = ({ title = 'Najczęstsze pytania (FAQ)', items }) => {
  if (!items || items.length === 0) return null;

  if (FEATURES.MODERN_FAQ_UI) {
    return (
      <section className="py-12 md:py-16 bg-background" aria-labelledby="faq-heading">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 id="faq-heading" className="text-2xl md:text-3xl font-semibold text-foreground text-center mb-8">
            {title}
          </h2>
          <Accordion type="single" collapsible className="space-y-0 divide-y divide-border/50">
            {items.map((qa, idx) => (
              <AccordionItem
                key={idx}
                value={`faq-${idx}`}
                className="border-none py-0"
              >
                <AccordionTrigger className="text-left text-sm md:text-base font-medium text-foreground hover:text-primary py-4 px-1 hover:no-underline leading-snug">
                  {qa.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 px-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">{qa.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    );
  }

  // Legacy UI
  return (
    <section className="section-padding bg-white" aria-labelledby="faq-heading">
      <div className="container-custom">
        <h2 id="faq-heading" className="section-title text-center">{title}</h2>
        <div className="max-w-3xl mx-auto mt-6">
          <Accordion type="single" collapsible className="space-y-2">
            {items.map((qa, idx) => (
              <AccordionItem 
                key={idx} 
                value={`faq-${idx}`}
                className="border rounded-lg px-6 py-2 hover:bg-muted/30 transition-colors"
              >
                <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary py-4 hover:no-underline">
                  {qa.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <p className="text-muted-foreground leading-relaxed">{qa.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;

import React from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  items: FAQItem[];
}

/** Do FAQPage trafiają wyłącznie pytania z realną, niepustą odpowiedzią. */
const hasRealAnswer = (qa: FAQItem) =>
  !!qa?.question?.trim() && (qa?.answer || '').trim().length >= 10;

const FAQSchema: React.FC<FAQSchemaProps> = ({ items }) => {
  const valid = (items || []).filter(hasRealAnswer);

  if (valid.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: valid.map((qa) => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: qa.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
};

export default FAQSchema;

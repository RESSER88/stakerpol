import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { COMPANY_PHONE_TEL, buildWhatsAppUrl } from '@/lib/contact';
import PresentationModal from './PresentationModal';

export interface InlineContextualCTAProps {
  variant: 'soft' | 'line';
  accentColor?: 'red' | 'navy';
  question: string;
  actionLabel: string;
  actionType: 'phone' | 'form' | 'whatsapp' | 'demo';
  modelName?: string;
}

const InlineContextualCTA = ({
  variant,
  accentColor = 'red',
  question,
  actionLabel,
  actionType,
  modelName,
}: InlineContextualCTAProps) => {
  const [demoOpen, setDemoOpen] = useState(false);

  const baseClasses =
    'group flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4 mt-2 md:mt-4 px-3 py-2.5 md:px-4 md:py-3.5 rounded transition-colors';

  const variantClasses =
    variant === 'soft'
      ? `bg-surface-soft border-l-4 ${
          accentColor === 'navy' ? 'border-navy-brand' : 'border-red-accent'
        }`
      : 'bg-white border border-border-line';

  const handleClick = (e: React.MouseEvent) => {
    if (actionType === 'form') {
      e.preventDefault();
      const el = document.getElementById('lead-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = el.querySelector('input') as HTMLInputElement | null;
        setTimeout(() => input?.focus(), 400);
      }
    } else if (actionType === 'demo') {
      e.preventDefault();
      setDemoOpen(true);
    }
  };

  const getHref = () => {
    switch (actionType) {
      case 'phone':
        return `tel:${COMPANY_PHONE_TEL}`;
      case 'whatsapp':
        return buildWhatsAppUrl(`Interesuje mnie ${modelName || 'jeden z Waszych wózków'}`);
      case 'form':
      case 'demo':
        return '#';
    }
  };

  const target = actionType === 'whatsapp' ? '_blank' : undefined;
  const rel = actionType === 'whatsapp' ? 'noopener noreferrer' : undefined;

  return (
    <>
      <a
        href={getHref()}
        target={target}
        rel={rel}
        onClick={handleClick}
        className={`${baseClasses} ${variantClasses}`}
      >
        <span className="text-[12px] md:text-[13px] font-medium text-ink leading-snug">
          {question}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[13px] md:text-[14px] font-bold text-orange-cta whitespace-nowrap transition-colors group-hover:text-orange-cta/80">
          {actionLabel}
          <ArrowRight
            size={14}
            className="transition-transform duration-150 group-hover:translate-x-0.5"
          />
        </span>
      </a>
      {actionType === 'demo' && (
        <PresentationModal
          open={demoOpen}
          onClose={() => setDemoOpen(false)}
          modelName={modelName}
        />
      )}
    </>
  );
};

export default InlineContextualCTA;

import React from 'react';
import { FAQCategory } from '@/hooks/useSupabaseFAQ';
import { trackFAQCategorySelect } from '@/utils/analytics';

export type CategoryFilter = 'all' | FAQCategory;

interface FAQCategoryTabsProps {
  selected: CategoryFilter;
  onChange: (cat: CategoryFilter) => void;
  counts: Record<FAQCategory, number>;
  totalCount: number;
}

const TABS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'Wszystkie pytania' },
  { value: 'pre_purchase', label: 'Przed zakupem' },
  { value: 'tech_specs', label: 'Specyfikacja techniczna' },
  { value: 'delivery', label: 'Dostawa i transport' },
  { value: 'service_warranty', label: 'Serwis i gwarancja' },
];

const FAQCategoryTabs: React.FC<FAQCategoryTabsProps> = ({ selected, onChange, counts, totalCount }) => {
  const getCount = (v: CategoryFilter) => (v === 'all' ? totalCount : counts[v as FAQCategory] ?? 0);

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {TABS.map((t) => {
        const active = selected === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => {
              trackFAQCategorySelect({ category: t.value, count: getCount(t.value) });
              onChange(t.value);
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              active
                ? 'bg-orange-cta text-white border-orange-cta shadow-sm'
                : 'bg-white text-navy-brand border-border hover:border-orange-cta/60 hover:text-orange-cta'
            }`}
            aria-pressed={active}
          >
            {t.label}{' '}
            <span className={active ? 'opacity-90' : 'text-muted-foreground'}>
              ({getCount(t.value)})
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default FAQCategoryTabs;

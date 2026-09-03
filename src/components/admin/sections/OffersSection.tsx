import { useState } from 'react';
import { Product } from '@/types';
import InquiriesSection from './InquiriesSection';
import NewOfferView from './offers/NewOfferView';
import SentOffersView from './offers/SentOffersView';

interface Props {
  products: Product[];
  initialView?: 'new' | 'sent' | 'inquiries';
}

type OffersView = 'new' | 'sent' | 'inquiries';

const TABS: { id: OffersView; label: string }[] = [
  { id: 'new', label: 'Nowa' },
  { id: 'sent', label: 'Wysłane' },
  { id: 'inquiries', label: 'Zapytania' },
];

const OffersSection = ({ products, initialView = 'new' }: Props) => {
  const [view, setView] = useState<OffersView>(initialView);
  const [sentReloadKey, setSentReloadKey] = useState(0);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={`px-3 py-2 text-[11px] uppercase tracking-wider border transition-colors ${
              view === tab.id
                ? 'border-editorial-ink bg-editorial-ink text-background'
                : 'border-editorial-line text-editorial-muted hover:border-editorial-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'new' && (
        <NewOfferView
          products={products}
          onCreated={() => {
            setSentReloadKey((k) => k + 1);
            setView('sent');
          }}
        />
      )}
      {view === 'sent' && <SentOffersView reloadKey={sentReloadKey} />}
      {view === 'inquiries' && <InquiriesSection />}
    </div>
  );
};

export default OffersSection;

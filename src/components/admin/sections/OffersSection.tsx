import { useEffect, useState } from 'react';
import { Product } from '@/types';
import NewOfferView from './offers/NewOfferView';
import SentOffersView from './offers/SentOffersView';
import { OfferPrefill } from './offers/types';

interface Props {
  products: Product[];
  initialView?: OffersView;
  prefill?: OfferPrefill | null;
  onPrefillCleared?: () => void;
}

type OffersView = 'new' | 'sent';

const TABS: { id: OffersView; label: string }[] = [
  { id: 'new', label: 'Nowa' },
  { id: 'sent', label: 'Wysłane' },
];

const OffersSection = ({ products, initialView = 'new', prefill, onPrefillCleared }: Props) => {
  const [view, setView] = useState<OffersView>(initialView);
  const [sentReloadKey, setSentReloadKey] = useState(0);
  const [activePrefill, setActivePrefill] = useState<OfferPrefill | null>(prefill ?? null);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (!prefill) return;
    setActivePrefill(prefill);
    setView('new');
  }, [prefill]);

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
          prefill={activePrefill}
          onCreated={() => {
            setActivePrefill(null);
            onPrefillCleared?.();
            setSentReloadKey((k) => k + 1);
            setView('sent');
          }}
        />
      )}
      {view === 'sent' && <SentOffersView reloadKey={sentReloadKey} />}
    </div>
  );
};

export default OffersSection;

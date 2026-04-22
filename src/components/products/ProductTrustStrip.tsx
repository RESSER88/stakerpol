import { CheckCircle2, Shield, Truck, CreditCard } from 'lucide-react';

interface Props {
  warrantyMonths?: number;
}

const ProductTrustStrip = ({ warrantyMonths = 3 }: Props) => {
  const items = [
    { Icon: CheckCircle2, label: 'Sprawdzenie\ntechniczne', sub: 'Każdy wózek' },
    { Icon: Shield, label: `Gwarancja\n${warrantyMonths} mies.`, sub: 'Na wszystkie modele' },
    { Icon: Truck, label: 'Dostawa\nw całej PL', sub: 'Własny transport' },
    { Icon: CreditCard, label: 'Leasing\ndostępny', sub: 'Od 450 zł/mies.' },
  ];

  return (
    <div className="grid grid-cols-4 bg-surface-soft p-4 md:p-6 border-y border-border-line">
      {items.map((it, i) => (
        <div
          key={i}
          className={`flex flex-col items-center justify-center text-center gap-1 md:gap-2 px-1 md:px-4 ${i < items.length - 1 ? 'border-r border-border-line' : ''}`}
        >
          <it.Icon className="text-navy-brand w-6 h-6 md:w-8 md:h-8" />
          <div className="font-bold whitespace-pre-line leading-tight text-[11px] md:text-base text-ink">
            {it.label}
          </div>
          <div className="hidden md:block text-sm text-ink-soft leading-tight">
            {it.sub}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductTrustStrip;

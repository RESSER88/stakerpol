import { CheckCircle2, Shield, Truck, CreditCard } from 'lucide-react';

interface Props {
  warrantyMonths?: number;
}

const ProductTrustStrip = ({ warrantyMonths = 3 }: Props) => {
  const items = [
    { Icon: CheckCircle2, label: 'Sprawdzenie\ntechniczne' },
    { Icon: Shield, label: `Gwarancja\n${warrantyMonths} mies.` },
    { Icon: Truck, label: 'Dostawa\nw całej PL' },
    { Icon: CreditCard, label: 'Leasing\ndostępny' },
  ];

  return (
    <div className="grid grid-cols-4 bg-surface-soft p-3 border-y border-border-line">
      {items.map((it, i) => (
        <div
          key={i}
          className={`flex flex-col items-center justify-center text-center gap-1 ${i < items.length - 1 ? 'border-r border-border-line' : ''}`}
        >
          <it.Icon size={20} className="text-navy-brand" />
          <div className="font-bold whitespace-pre-line leading-tight text-[9.5px] text-ink">
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductTrustStrip;

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
    <div
      className="grid grid-cols-4"
      style={{
        background: '#FAF8F3',
        padding: 12,
        borderTop: '1px solid #E5E1D8',
        borderBottom: '1px solid #E5E1D8',
      }}
    >
      {items.map((it, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center text-center gap-1"
          style={{
            borderRight: i < items.length - 1 ? '1px solid #E5E1D8' : 'none',
          }}
        >
          <it.Icon size={20} style={{ color: '#1E3A8A' }} />
          <div
            className="font-bold whitespace-pre-line leading-tight"
            style={{ fontSize: 9.5, color: '#0E0E0E' }}
          >
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductTrustStrip;

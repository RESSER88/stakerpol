import { CheckCircle2, Shield, Truck, CreditCard } from 'lucide-react';

const items = [
  {
    Icon: CheckCircle2,
    label: 'Sprawdzony\ntechnicznie',
    sub: 'Każdy wózek',
  },
  {
    Icon: Shield,
    label: 'Gwarancja\n3 mies.',
    sub: 'Na wszystkie modele',
  },
  {
    Icon: Truck,
    label: 'Dostawa\nw całej PL',
    sub: 'Własny transport',
  },
  {
    Icon: CreditCard,
    label: 'Leasing\ndostępny',
    sub: 'Od 450 zł/mies.',
  },
];

const TrustStrip = () => {
  return (
    <section className="bg-surface-soft border-y border-border-line">
      <div className="container-custom max-w-[1200px] py-5 md:py-8">
        <div className="grid grid-cols-4">
          {items.map((it, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center text-center gap-1 md:gap-2 px-1 md:px-4 ${
                i < items.length - 1 ? 'border-r border-border-line' : ''
              }`}
            >
              <it.Icon className="text-navy-brand w-5 h-5 md:w-7 md:h-7" />
              <div className="font-bold whitespace-pre-line leading-tight text-[9.5px] md:text-[13px] text-ink">
                {it.label}
              </div>
              <div className="hidden md:block text-[11px] text-ink-soft leading-tight">
                {it.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;

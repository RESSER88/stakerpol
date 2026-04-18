import { ClipboardCheck, Wrench, BatteryCharging, SprayCan } from 'lucide-react';
import InlineContextualCTA from './InlineContextualCTA';

interface Props {
  modelName?: string;
}

const ProductProcessSteps = ({ modelName }: Props = {}) => {
  const steps = [
    { num: '01', Icon: ClipboardCheck, title: 'Pełna diagnostyka', desc: 'Sprawdzamy układy hydrauliczne, elektryczne i mechaniczne.' },
    { num: '02', Icon: Wrench, title: 'Naprawa i wymiana', desc: 'Wymieniamy zużyte części na oryginalne lub równoważne.' },
    { num: '03', Icon: BatteryCharging, title: 'Test akumulatora', desc: 'Mierzymy pojemność i wydajność, regenerujemy lub wymieniamy.' },
    { num: '04', Icon: SprayCan, title: 'Czyszczenie i lakier', desc: 'Mycie, malowanie i finalna prezentacja przed wysyłką.' },
  ];

  return (
    <section className="bg-white py-10 md:py-12 px-4 md:px-6">
      <div className="container-custom max-w-[1200px]">
        <div className="bg-white border border-border-line rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-5 md:p-8">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-navy-brand mb-2">
              Każdy wózek przechodzi pełny proces przygotowania
            </h2>
            <p className="text-sm text-ink-soft">
              Kupujesz sprzęt gotowy do pracy — bez ukrytych usterek.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {steps.map(({ num, Icon, title, desc }) => (
              <div key={num} className="flex flex-col items-start text-left">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-soft mb-2">
                  <Icon className="w-4 h-4 text-orange-cta" />
                </div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="font-mono font-bold text-[11px] text-orange-cta">{num}</span>
                  <span className="text-ink-soft text-xs">·</span>
                  <h3 className="font-bold text-sm text-ink leading-tight">{title}</h3>
                </div>
                <p className="text-xs text-ink-soft leading-snug">{desc}</p>
              </div>
            ))}
          </div>
          <InlineContextualCTA
            variant="soft"
            accentColor="navy"
            question="Chcesz wiedzieć więcej o tym, jak przygotowujemy wózki?"
            actionLabel="Napisz do nas"
            actionType="whatsapp"
            modelName={modelName}
          />
        </div>
      </div>
    </section>
  );
};

export default ProductProcessSteps;

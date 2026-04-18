import { Shield, TrendingUp, Award } from 'lucide-react';

const stats = [
  { value: '17+', label: 'lat doświadczenia' },
  { value: '850+', label: 'sprzedanych wózków' },
  { value: 'Ten sam dzień', label: 'czas odpowiedzi' },
];

const benefits = [
  {
    Icon: Shield,
    title: 'Gwarancja Jakości',
    description:
      'Każdy wózek w sprawdzonym stanie, po gruntownej regeneracji. Dajemy 3 miesiące gwarancji na wszystkie modele.',
  },
  {
    Icon: TrendingUp,
    title: 'Kupuj bez ryzyka',
    description:
      'Nie sprzedajemy przypadkowych maszyn — oferujemy najlepsze pod względem ceny i jakości. Realna oszczędność względem nowego sprzętu.',
  },
  {
    Icon: Award,
    title: 'Od 2008 roku',
    description:
      'Przez lata zbudowaliśmy zaufanie firm i dostarczamy sprawdzone rozwiązania do magazynów w całej Polsce.',
  },
];

const HomeAboutSection = () => {
  return (
    <section className="bg-surface-soft py-10 md:py-16">
      <div className="container-custom max-w-[1200px] px-4 md:px-6">
        <div className="font-mono text-xs md:text-sm text-red-accent tracking-widest mb-2">
          02
        </div>
        <h2 className="text-xl md:text-3xl font-extrabold text-navy-brand leading-tight">
          Stakerpol — Twój partner w wyposażeniu magazynu
        </h2>
        <p className="text-base md:text-lg font-semibold text-ink mt-3">
          Sprawdzone wózki Toyota BT. Realna oszczędność. Pewność działania.
        </p>
        <p className="text-sm md:text-base text-ink-soft mt-4 max-w-3xl leading-relaxed">
          Od 2008 roku pomagamy firmom usprawniać magazyny bez przepłacania za nowy
          sprzęt. Jako rodzinna firma wiemy, że za każdą decyzją zakupową stoi
          człowiek — dlatego stawiamy na partnerstwo i profesjonalizm.
          Specjalizujemy się w używanych paleciakach Toyota BT — cenimy je za
          niezawodność i niską eksploatację.
        </p>

        {/* Statystyki */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 mt-8 md:mt-10 bg-white border border-border-line rounded-lg py-5 md:py-8 px-3 md:px-6">
          {stats.map((s) => {
            const isLong = s.value.length > 4;
            return (
              <div key={s.label} className="text-center flex flex-col justify-center">
                <div
                  className={`font-mono font-extrabold text-orange-cta leading-none ${
                    isLong
                      ? 'text-base md:text-2xl'
                      : 'text-2xl md:text-4xl'
                  }`}
                >
                  {s.value}
                </div>
                <div className="text-[10px] md:text-[11px] uppercase tracking-[0.08em] text-ink-soft mt-2">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3 zalety */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8 pt-6 md:pt-8 border-t border-border-line">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-white border border-border-line rounded p-4 md:p-5 flex flex-col hover:bg-surface-soft transition-colors"
            >
              <div className="w-[38px] h-[38px] rounded-full bg-surface-soft flex items-center justify-center mb-3">
                <b.Icon className="w-5 h-5 text-red-accent" />
              </div>
              <h3 className="text-[15px] font-bold text-navy-brand mb-1.5">
                {b.title}
              </h3>
              <p className="text-[12.5px] text-ink-soft leading-[1.5]">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeAboutSection;

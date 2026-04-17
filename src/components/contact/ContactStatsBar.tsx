const stats = [
  { value: '850+', label: 'sprzedanych wózków' },
  { value: '17+', label: 'lat doświadczenia' },
  { value: 'Ten sam dzień', label: 'czas odpowiedzi' },
  { value: 'Gwarancja i serwis', label: 'pogwarancyjny' },
];

const ContactStatsBar = () => {
  return (
    <section className="bg-stakerpol-navy text-white border-y border-white/10">
      <div className="container-custom">
        <div className="flex overflow-x-auto md:grid md:grid-cols-4 divide-x divide-white/15">
          {stats.map((s) => (
            <div key={s.label} className="flex-shrink-0 min-w-[180px] md:min-w-0 px-6 py-6 text-center">
              <div className="text-xl md:text-2xl font-bold text-stakerpol-orange">{s.value}</div>
              <div className="text-xs md:text-sm text-white/75 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactStatsBar;

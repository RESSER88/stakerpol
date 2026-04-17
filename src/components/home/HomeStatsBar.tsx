const stats = [
  { value: '17+', label: 'lat doświadczenia' },
  { value: '850+', label: 'sprzedanych wózków' },
  { value: 'Ten sam dzień', label: 'czas odpowiedzi' },
];

const HomeStatsBar = () => {
  return (
    <section className="bg-stakerpol-navy text-white">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-white/15">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-5 text-center">
              <div className="text-2xl md:text-3xl font-bold text-stakerpol-orange">{s.value}</div>
              <div className="text-xs md:text-sm text-white/70 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeStatsBar;

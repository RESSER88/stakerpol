const stats = [
  { value: '17+', label: 'lat doświadczenia' },
  { value: '850+', label: 'sprzedanych wózków' },
  { value: 'Ten sam dzień', label: 'czas odpowiedzi' },
];

const ContactStatsBar = () => {
  return (
    <section className="bg-stakerpol-navy/95 text-white border-t border-white/10">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-white/15">
          {stats.map(s => (
            <div key={s.label} className="px-6 py-4 text-center">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-white/70 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ContactStatsBar;

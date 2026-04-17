const stats = [
  { value: '17+', label: 'lat doświadczenia' },
  { value: '850+', label: 'sprzedanych wózków' },
  { value: 'Ten sam dzień', label: 'czas odpowiedzi' },
];

const ContactStatsBar = () => {
  return (
    <section className="bg-stakerpol-navy/95 text-white border-t border-white/10">
      <div className="container-custom">
        <div className="flex flex-col md:grid md:grid-cols-3 md:divide-x md:divide-white/15">
          {stats.map(s => (
            <div key={s.label} className="px-6 py-4 md:py-5 text-center">
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

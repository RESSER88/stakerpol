import HomeHeroForm from './HomeHeroForm';

const HomeHeroFormSection = () => {
  return (
    <section className="lg:hidden bg-surface-soft py-8 px-5">
      <div className="container-custom max-w-[600px]">
        <div className="font-mono text-[11px] text-red-accent tracking-widest mb-2">
          // FORMULARZ
        </div>
        <h2 className="text-xl font-extrabold text-navy-brand leading-tight">
          Zapytaj o wózek
        </h2>
        <p className="text-sm text-ink-soft mt-1.5 mb-4">
          Odpowiadamy tego samego dnia.
        </p>
        <div className="bg-white border border-border-line rounded-md p-4">
          <HomeHeroForm />
        </div>
      </div>
    </section>
  );
};

export default HomeHeroFormSection;

import { useState } from 'react';
import { useLeadSubmit } from '@/hooks/useLeadSubmit';

interface Props {
  productId?: string;
}

const ProductLeadCallback = ({ productId }: Props) => {
  const [phone, setPhone] = useState('');
  const { submit, isSubmitting } = useLeadSubmit();

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit(phone, productId);
    if (ok) setPhone('');
  };

  return (
    <section
      className="text-white py-8 md:py-14 px-4"
      style={{ background: 'linear-gradient(135deg, hsl(var(--color-navy-brand)) 0%, hsl(222 64% 22%) 100%)' }}
    >
      <div className="container-custom max-w-3xl text-center md:text-left">
        <h3 className="font-extrabold mb-2 text-[17px] md:text-[22px]">
          Nie wiesz, czy to dobry wybór?
        </h3>
        <p className="mb-4 text-[12.5px] md:text-sm opacity-85">
          Zostaw numer — oddzwonimy w 30 minut i pomożemy dobrać wózek do Twojego magazynu.
        </p>
        <form onSubmit={handle} className="space-y-2 md:space-y-0 md:grid md:grid-cols-[2fr_1fr] md:gap-3">
          <input
            type="tel"
            inputMode="tel"
            required
            placeholder="Twój numer telefonu"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full text-foreground px-3 py-3 md:py-3.5 rounded-md border-0 text-sm"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full font-bold text-white disabled:opacity-60 bg-orange-cta hover:bg-orange-cta/90 transition-colors px-3 py-3 md:py-3.5 rounded-md text-sm"
          >
            {isSubmitting ? 'Wysyłanie…' : 'Poproś o kontakt →'}
          </button>
        </form>
        <div className="mt-3 text-[10.5px] md:text-[11px] opacity-70">
          Odpowiadamy tego samego dnia · pon-pt 8:00-17:00
        </div>
      </div>
    </section>
  );
};

export default ProductLeadCallback;

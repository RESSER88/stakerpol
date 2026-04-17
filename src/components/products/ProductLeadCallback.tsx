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
      style={{
        background: 'linear-gradient(135deg, #1E3A8A 0%, #142558 100%)',
        color: '#fff',
        padding: '22px 16px',
      }}
    >
      <div className="container-custom max-w-3xl">
        <h3 className="font-extrabold mb-2" style={{ fontSize: 17 }}>
          Nie wiesz, czy to dobry wybór?
        </h3>
        <p className="mb-4" style={{ fontSize: 12.5, opacity: 0.85 }}>
          Zostaw numer — oddzwonimy w 30 minut i pomożemy dobrać wózek do Twojego magazynu.
        </p>
        <form onSubmit={handle} className="space-y-2">
          <input
            type="tel"
            inputMode="tel"
            required
            placeholder="Twój numer telefonu"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full text-foreground"
            style={{
              padding: 12,
              borderRadius: 4,
              border: 'none',
              fontSize: 14,
            }}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full font-bold text-white disabled:opacity-60"
            style={{
              background: '#E85C1E',
              padding: 12,
              borderRadius: 4,
              fontSize: 14,
            }}
          >
            {isSubmitting ? 'Wysyłanie…' : 'Poproś o kontakt →'}
          </button>
        </form>
        <div className="mt-3" style={{ fontSize: 10.5, opacity: 0.7 }}>
          Odpowiadamy tego samego dnia · pon-pt 8:00-17:00
        </div>
      </div>
    </section>
  );
};

export default ProductLeadCallback;

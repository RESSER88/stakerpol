import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { useLeadSubmit } from '@/hooks/useLeadSubmit';
import { COMPANY_PHONE_DISPLAY } from '@/lib/contact';

interface Props {
  productId?: string;
}

const ProductLeadCallback = ({ productId }: Props) => {
  const [phone, setPhone] = useState('');
  const [success, setSuccess] = useState(false);
  const { submit, isSubmitting, error, clearError } = useLeadSubmit();

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      setSuccess(false);
      setPhone('');
    }, 5000);
    return () => clearTimeout(t);
  }, [success]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit(phone, productId);
    if (ok) setSuccess(true);
  };

  return (
    <section
      id="lead-form"
      className="text-white py-8 md:py-14 px-4"
      style={{ background: 'linear-gradient(135deg, hsl(var(--color-navy-brand)) 0%, hsl(222 64% 22%) 100%)' }}
    >
      <div className="container-custom max-w-3xl text-center md:text-left">
        <h3 className="font-extrabold mb-2 text-[17px] md:text-[22px]">
          Nie wiesz, czy to dobry wybór?
        </h3>
        <p className="mb-4 text-[12.5px] md:text-sm opacity-85">
          Zostaw numer — oddzwonimy w 30 minut i pomożemy dobrać wózek do Twojego magazynu.{' '}
          <strong className="opacity-100">Bez zobowiązań.</strong>
        </p>

        {success ? (
          <div className="flex flex-col items-center md:items-start gap-2 py-4 animate-fade-in">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
              <Check className="w-8 h-8 text-green-available" strokeWidth={3} />
            </div>
            <p className="text-base font-bold text-white">
              Dzięki! Oddzwonimy w ciągu 30 minut.
            </p>
            <p className="text-[13px] text-white/85">
              W międzyczasie możesz od razu do nas zadzwonić:{' '}
              <strong className="opacity-100">{COMPANY_PHONE_DISPLAY}</strong>
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handle} className="space-y-2 md:space-y-0 md:grid md:grid-cols-[2fr_1fr] md:gap-3">
              <input
                type="tel"
                inputMode="tel"
                required
                maxLength={20}
                placeholder="Numer telefonu (np. 600 000 000)"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (error) clearError();
                }}
                aria-invalid={!!error}
                aria-describedby={error ? 'lead-phone-error' : undefined}
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
            {error && (
              <p
                id="lead-phone-error"
                className="mt-2 text-[11px] text-red-accent font-medium"
                role="alert"
              >
                {error}
              </p>
            )}
            <div className="mt-3 text-[10.5px] md:text-[11px] opacity-70">
              Odpowiadamy tego samego dnia · pon-pt 8:00-17:00
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ProductLeadCallback;

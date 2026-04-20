import { useEffect, useState } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { COMPANY_PHONE_TEL, COMPANY_PHONE_DISPLAY } from '@/lib/contact';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  modelName?: string;
  productId?: string;
  serialNumber?: string;
}

const PresentationModal = ({ open, onClose, modelName, productId, serialNumber }: Props) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rodo, setRodo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      // reset on close
      setTimeout(() => {
        setName('');
        setPhone('');
        setRodo(false);
        setSuccess(false);
        setSubmitting(false);
      }, 200);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !rodo) return;

    setSubmitting(true);
    try {
      const productLabel = [modelName, serialNumber].filter(Boolean).join(' ');
      const message = `Prośba o wizytę — ${productLabel || 'wózek'}`;

      const isUuid = productId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);

      const { error } = await supabase.from('leads').insert({
        name: name.trim(),
        phone: phone.trim(),
        source: 'visit_request',
        message,
        rodo_accepted: true,
        product_id: isUuid ? productId : null,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: 'Dziękujemy!',
        description: 'Skontaktujemy się wkrótce, aby ustalić termin wizyty.',
      });
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      console.error('Visit request error:', err);
      toast({
        title: 'Błąd',
        description: 'Nie udało się wysłać. Spróbuj zadzwonić bezpośrednio.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px] animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[420px] bg-white rounded-lg p-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Zamknij"
          className="absolute top-3 right-3 text-ink-soft hover:text-ink transition-colors"
        >
          <X size={20} />
        </button>

        {success ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-600 mb-3" />
            <h3 className="text-[18px] font-extrabold text-navy-brand mb-1">Dziękujemy!</h3>
            <p className="text-[13px] text-ink-soft">Zadzwonimy do Ciebie wkrótce.</p>
          </div>
        ) : (
          <>
            <h3 className="text-[19px] font-extrabold text-navy-brand mb-1.5 pr-6 leading-tight">
              Chcesz przyjechać i zobaczyć wózek?
            </h3>
            <p className="text-[13px] text-ink-soft mb-4">
              Zostaw numer — zadzwonimy i ustalimy termin.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="visit-name" className="block text-[12px] font-semibold text-ink mb-1">
                  Imię <span className="text-red-accent">*</span>
                </label>
                <input
                  id="visit-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-border-line rounded-md focus:outline-none focus:ring-2 focus:ring-orange-cta/40 focus:border-orange-cta"
                  placeholder="Jan"
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="visit-phone" className="block text-[12px] font-semibold text-ink mb-1">
                  Numer telefonu <span className="text-red-accent">*</span>
                </label>
                <input
                  id="visit-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-border-line rounded-md focus:outline-none focus:ring-2 focus:ring-orange-cta/40 focus:border-orange-cta"
                  placeholder="+48 ___ ___ ___"
                  disabled={submitting}
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={rodo}
                  onChange={(e) => setRodo(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-orange-cta"
                  disabled={submitting}
                />
                <span className="text-[12px] text-ink-soft leading-snug">
                  Akceptuję politykę prywatności <span className="text-red-accent">*</span>
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting || !name.trim() || !phone.trim() || !rodo}
                className="w-full flex items-center justify-center gap-2 bg-orange-cta text-white font-bold py-3 px-4 rounded-md hover:bg-orange-cta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Wysyłanie...
                  </>
                ) : (
                  <>Zostaw numer → zadzwonimy</>
                )}
              </button>

              <p className="text-center text-[12px] text-ink-soft pt-1">
                Lub zadzwoń teraz:{' '}
                <a
                  href={`tel:${COMPANY_PHONE_TEL}`}
                  className="font-bold text-navy-brand hover:text-orange-cta transition-colors"
                >
                  {COMPANY_PHONE_DISPLAY}
                </a>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default PresentationModal;

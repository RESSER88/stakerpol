import { Send, X } from 'lucide-react';
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useContactForm } from '@/hooks/useContactForm';
import { trackBeginInquiry } from '@/utils/analytics';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: 'product_page' | 'product_list';
  productId?: string;
  productModel?: string;
  serialNumber?: string;
}

const InquiryModal = ({ isOpen, onClose, source, productId, productModel, serialNumber }: InquiryModalProps) => {
  const { formData, errors, status, honeypot, setHoneypot, consent, updateConsent, updateField, submit, reset } =
    useContactForm();

  useEffect(() => {
    if (!isOpen) {
      reset();
    } else {
      trackBeginInquiry(
        productId || productModel
          ? { id: productId || '', model: productModel || 'Zapytanie ogólne' }
          : undefined,
        source === 'product_list' ? 'product_list' : 'product_page'
      );
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit({ source, productId, productModel, serialNumber });
    if (ok) setTimeout(onClose, 1600);
  };

  const inputCls = (err?: string) =>
    `w-full px-3 py-2.5 text-sm rounded-lg bg-white border ${
      err ? 'border-red-400' : 'border-border'
    } text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,50%)] focus:border-transparent transition-colors`;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden">
        <div className="bg-stakerpol-navy p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/70 hover:text-white transition-colors"
            aria-label="Zamknij"
          >
            <X size={20} />
          </button>
          <DialogTitle className="text-white text-lg font-semibold mb-1">
            Wyślij zapytanie {productModel ? `o ${productModel}` : ''}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-sm">
            Odpowiemy tego samego dnia.
          </DialogDescription>
        </div>

        <div className="p-6">
          {status === 'success' ? (
            <div className="py-8 text-center">
              <div className="text-4xl mb-2">✓</div>
              <p className="text-foreground font-medium">Dziękujemy! Skontaktujemy się wkrótce.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div>
                <input
                  placeholder="Imię i nazwisko *"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={inputCls(errors.name)}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <input
                  placeholder="Telefon lub e-mail *"
                  value={formData.contact}
                  onChange={(e) => updateField('contact', e.target.value)}
                  className={inputCls(errors.contact)}
                />
                {errors.contact && <p className="text-xs text-red-500 mt-1">{errors.contact}</p>}
              </div>
              <div>
                <textarea
                  placeholder="Treść zapytania... *"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  className={inputCls(errors.message) + ' resize-none'}
                />
                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
              </div>

              {/* Hidden product context */}
              {productId && <input type="hidden" name="product_id" value={productId} readOnly />}
              {serialNumber && <input type="hidden" name="serial_number" value={serialNumber} readOnly />}

              {/* Honeypot */}
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none', position: 'absolute', left: '-9999px' }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => updateConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[hsl(25,100%,50%)] cursor-pointer"
                  />
                  <span className="text-[13px] text-foreground/85 leading-snug">
                    Akceptuję{' '}
                    <a
                      href="/polityka-prywatnosci"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stakerpol-orange underline"
                    >
                      politykę prywatności
                    </a>{' '}
                    *
                  </span>
                </label>
                {errors.consent && <p className="text-xs text-red-500 mt-1 ml-6">{errors.consent}</p>}
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="cta-button w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send size={14} />
                {status === 'loading' ? 'Wysyłanie...' : 'Wyślij zapytanie →'}
              </button>
              {status === 'error' && (
                <p className="text-xs text-red-500 text-center mt-1">Błąd wysyłki. Spróbuj ponownie.</p>
              )}
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InquiryModal;

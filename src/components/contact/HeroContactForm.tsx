import { Send } from 'lucide-react';
import { useContactForm } from '@/hooks/useContactForm';

const HeroContactForm = () => {
  const { formData, errors, status, honeypot, setHoneypot, consent, updateConsent, updateField, submit } = useContactForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit({ source: 'homepage' });
  };

  const inputCls = (err?: string) =>
    `w-full px-3 py-2.5 text-sm rounded-lg bg-white/10 border ${
      err ? 'border-red-400' : 'border-white/30'
    } text-white caret-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,50%)] focus:border-transparent focus:bg-white/10 autofill:bg-white/10 [&:-webkit-autofill]:![-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] transition-colors`;

  return (
    <div
      className="w-full max-w-[440px] mx-auto rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-lg p-6"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}
    >
      {status === 'success' ? (
        <div className="py-10 text-center">
          <div className="text-3xl mb-2">✓</div>
          <p className="text-white font-medium">Dziękujemy! Skontaktujemy się wkrótce.</p>
        </div>
      ) : (
        <>
          <h3 className="text-white text-base font-medium mb-4">
            Zapytaj o ofertę — odpiszemy tego samego dnia
          </h3>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <input
                placeholder="Imię i nazwisko"
                value={formData.name}
                onChange={e => updateField('name', e.target.value)}
                className={inputCls(errors.name)}
              />
              {errors.name && <p className="text-xs text-red-300 mt-1">{errors.name}</p>}
            </div>
            <div>
              <input
                placeholder="Telefon lub e-mail"
                value={formData.contact}
                onChange={e => updateField('contact', e.target.value)}
                className={inputCls(errors.contact)}
              />
              {errors.contact && <p className="text-xs text-red-300 mt-1">{errors.contact}</p>}
            </div>
            <div>
              <textarea
                placeholder="Treść zapytania..."
                rows={4}
                value={formData.message}
                onChange={e => updateField('message', e.target.value)}
                className={inputCls(errors.message) + ' resize-none'}
              />
              {errors.message && <p className="text-xs text-red-300 mt-1">{errors.message}</p>}
            </div>

            {/* Honeypot */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={e => setHoneypot(e.target.value)}
              style={{ display: 'none', position: 'absolute', left: '-9999px' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {/* GDPR */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => updateConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[hsl(25,100%,50%)] cursor-pointer"
                />
                <span className="text-[13px] text-white/90 leading-snug">
                  Akceptuję{' '}
                  <a
                    href="/polityka-prywatnosci"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[hsl(25,100%,60%)] underline"
                  >
                    politykę prywatności
                  </a>
                  {' *'}
                </span>
              </label>
              <p className="text-xs text-white/60 mt-1 ml-6 leading-snug">
                Używamy Twoich danych tylko do odpowiedzi na zapytanie. Dane będą usunięte po 30 dniach.
              </p>
              {errors.consent && <p className="text-xs text-red-300 mt-1 ml-6">{errors.consent}</p>}
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="cta-button w-full mt-2 flex items-center justify-center gap-2 animate-[pulse-glow_2.2s_infinite] disabled:opacity-60"
            >
              <Send size={14} />
              {status === 'loading' ? 'Wysyłanie...' : 'Poproś o ofertę →'}
            </button>
            {status === 'error' && (
              <p className="text-xs text-red-300 text-center mt-1">Błąd wysyłki. Spróbuj ponownie.</p>
            )}
          </form>
        </>
      )}
    </div>
  );
};

export default HeroContactForm;

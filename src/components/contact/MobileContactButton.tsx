import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, X, Send, Phone } from 'lucide-react';
import { useContactForm } from '@/hooks/useContactForm';
import { trackCTAClick } from '@/utils/analytics';

const MobileContactButton = () => {
  const location = useLocation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Hide on /contact — page has its own sticky bottom bar
  if (location.pathname === '/contact' || location.pathname === '/kontakt') return null;
  const sheetRef = useRef<HTMLDivElement>(null);
  const { formData, errors, status, honeypot, setHoneypot, consent, updateConsent, updateField, submit, reset } = useContactForm();

  const openSheet = () => {
    setIsSheetOpen(true);
    reset();
    trackCTAClick('mobile_contact_button');
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    reset();
  };

  useEffect(() => {
    if (!isSheetOpen) return;
    const sheet = sheetRef.current;
    if (!sheet) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      const vh = vv.height;
      sheet.style.maxHeight = `${vh * 0.92}px`;
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
      if (sheet) sheet.style.maxHeight = '';
    };
  }, [isSheetOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await submit();
    if (ok) setTimeout(closeSheet, 3000);
  };

  const inputCls = (err?: string) =>
    `w-full px-3 py-2.5 text-sm rounded-lg border ${err ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,50%)] transition-all`;

  return (
    <>
      <button
        onClick={openSheet}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-white text-[13px] font-medium bg-[hsl(25,100%,50%)] animate-[pulse-glow_2.2s_infinite]"
      >
        <Mail size={14} />
        Zapytaj
      </button>

      {isSheetOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={closeSheet} />
          <div
            ref={sheetRef}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-slide-up overflow-y-auto"
            style={{ maxHeight: '92vh', transition: 'max-height 0.15s ease' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Wyślij zapytanie</h2>
              <button onClick={closeSheet} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            {status === 'success' ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-gray-800 text-lg">Dziękujemy!</p>
                <p className="text-sm text-gray-500 mt-1">Odpiszemy w ciągu 24 godzin.</p>
              </div>
            ) : (
              <div className="p-5">
                {/* Phone button */}
                <a
                  href="tel:+48694133592"
                  onClick={() => trackCTAClick('mobile_call_button')}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold text-white bg-[hsl(210,60%,25%)] hover:bg-[hsl(210,60%,20%)] transition-all"
                >
                  <Phone size={16} />
                  Zadzwoń teraz
                </a>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <hr className="flex-1 border-gray-200" />
                  <span className="text-xs text-gray-400 whitespace-nowrap">lub wyślij wiadomość</span>
                  <hr className="flex-1 border-gray-200" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <input placeholder="Imię i nazwisko" value={formData.name} onChange={e => updateField('name', e.target.value)} className={inputCls(errors.name)} />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <input placeholder="Telefon lub e-mail" value={formData.contact} onChange={e => updateField('contact', e.target.value)} className={inputCls(errors.contact)} />
                    {errors.contact && <p className="text-xs text-red-500 mt-1">{errors.contact}</p>}
                  </div>
                  <div>
                    <textarea placeholder="Treść zapytania" rows={4} value={formData.message} onChange={e => updateField('message', e.target.value)} className={inputCls(errors.message) + ' resize-none'} />
                    {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
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
                  {/* GDPR consent */}
                  <div>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={e => updateConsent(e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[hsl(25,100%,50%)] cursor-pointer"
                      />
                      <span className="text-[13px] text-gray-700 leading-snug">
                        Akceptuję{' '}
                        <a href="/polityka-prywatnosci" target="_blank" rel="noopener noreferrer" className="text-[hsl(25,100%,50%)] underline">
                          politykę prywatności
                        </a>
                        {' *'}
                      </span>
                    </label>
                    <p className="text-[11px] text-gray-500 mt-1 ml-6 leading-snug">
                      Używamy Twoich danych tylko do odpowiedzi na zapytanie. Dane będą usunięte po 30 dniach.
                    </p>
                    {errors.consent && <p className="text-xs text-red-500 mt-1 ml-6">{errors.consent}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full py-3 rounded-lg text-sm font-semibold text-white bg-[hsl(25,100%,50%)] hover:bg-[hsl(25,100%,45%)] transition-all disabled:opacity-60 flex items-center justify-center gap-2 animate-[pulse-glow_2.2s_infinite]"
                  >
                    <Send size={14} />
                    {status === 'loading' ? 'Wysyłanie...' : 'Wyślij zapytanie →'}
                  </button>
                  {status === 'error' && <p className="text-xs text-red-500 text-center">Błąd wysyłki. Spróbuj ponownie.</p>}
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileContactButton;

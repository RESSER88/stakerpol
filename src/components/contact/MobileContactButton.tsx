import { useState } from 'react';
import { Mail, X, Send } from 'lucide-react';
import { useContactForm } from '@/hooks/useContactForm';
import { trackCTAClick } from '@/utils/analytics';

const MobileContactButton = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { formData, errors, status, updateField, submit, reset } = useContactForm();

  const openSheet = () => {
    setIsSheetOpen(true);
    reset();
    trackCTAClick('mobile_contact_button');
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    reset();
  };

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
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" onClick={closeSheet} />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
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
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileContactButton;

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Mail, Phone, X, Send } from 'lucide-react';
import { useContactForm } from '@/hooks/useContactForm';
import { trackCTAClick, trackPhoneClick } from '@/utils/analytics';

const FloatingContactBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'none' | 'form' | 'call'>('none');
  const containerRef = useRef<HTMLDivElement>(null);
  const { formData, errors, status, updateField, submit, reset } = useContactForm();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActivePanel('none');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => { setActivePanel('none'); setIsOpen(false); reset(); }, 3000);
      return () => clearTimeout(t);
    }
  }, [status, reset]);

  const toggle = () => {
    if (isOpen) { setIsOpen(false); setActivePanel('none'); }
    else { setIsOpen(true); trackCTAClick('contact_bubble_open'); }
  };

  const openForm = () => { setActivePanel('form'); reset(); };
  const openCall = () => { setActivePanel('call'); trackPhoneClick('contact_bubble'); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
  };

  const inputCls = (err?: string) =>
    `w-full px-3 py-2 text-sm rounded-lg border ${err ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,50%)] transition-all`;

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-[9999] hidden md:flex flex-col items-end gap-3">
      {/* Panels */}
      {activePanel === 'form' && (
        <div className="w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <span className="font-semibold text-sm text-gray-800">Wyślij zapytanie</span>
            <button onClick={() => setActivePanel('none')} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          {status === 'success' ? (
            <div className="p-6 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="font-semibold text-gray-800">Dziękujemy!</p>
              <p className="text-sm text-gray-500">Odpiszemy w ciągu 24 godzin.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div>
                <input placeholder="Imię i nazwisko" value={formData.name} onChange={e => updateField('name', e.target.value)} className={inputCls(errors.name)} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <input placeholder="Telefon lub e-mail" value={formData.contact} onChange={e => updateField('contact', e.target.value)} className={inputCls(errors.contact)} />
                {errors.contact && <p className="text-xs text-red-500 mt-1">{errors.contact}</p>}
              </div>
              <div>
                <textarea placeholder="Treść zapytania" rows={3} value={formData.message} onChange={e => updateField('message', e.target.value)} className={inputCls(errors.message) + ' resize-none'} />
                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-[hsl(25,100%,50%)] hover:bg-[hsl(25,100%,45%)] transition-all disabled:opacity-60 flex items-center justify-center gap-2 animate-[pulse-glow_2.2s_infinite]"
              >
                <Send size={14} />
                {status === 'loading' ? 'Wysyłanie...' : 'Wyślij zapytanie →'}
              </button>
              {status === 'error' && <p className="text-xs text-red-500 text-center">Błąd wysyłki. Spróbuj ponownie.</p>}
            </form>
          )}
        </div>
      )}

      {activePanel === 'call' && (
        <div className="w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <span className="font-semibold text-sm text-gray-800">Zadzwoń do nas</span>
            <button onClick={() => setActivePanel('none')} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
          <div className="p-5 text-center space-y-3">
            <p className="text-sm text-gray-500">Odpowiadamy 8:00–17:00</p>
            <a
              href="tel:+48694133592"
              onClick={() => trackPhoneClick('contact_bubble_call_card')}
              className="block w-full py-3 rounded-lg text-white font-semibold bg-[hsl(210,42%,16%)] hover:bg-[hsl(210,42%,22%)] transition-colors"
            >
              <Phone size={16} className="inline mr-2" />
              +48 694 133 592
            </a>
          </div>
        </div>
      )}

      {/* Sub-bubbles */}
      {isOpen && activePanel === 'none' && (
        <div className="flex flex-col items-end gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">Wyślij zapytanie</span>
            <button onClick={openForm} className="w-11 h-11 rounded-full bg-[hsl(25,100%,50%)] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Mail size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">Zadzwoń</span>
            <button onClick={openCall} className="w-11 h-11 rounded-full bg-[hsl(210,42%,16%)] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Phone size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main bubble */}
      <button
        onClick={toggle}
        className={`w-[52px] h-[52px] rounded-full bg-[hsl(25,100%,50%)] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform ${!isOpen ? 'animate-[pulse-glow_2.2s_infinite]' : ''}`}
        aria-label="Kontakt"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
      {!isOpen && (
        <span className="absolute -left-24 bottom-3 bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full shadow-md whitespace-nowrap pointer-events-none">
          Zapytaj nas
        </span>
      )}
    </div>
  );
};

export default FloatingContactBubble;

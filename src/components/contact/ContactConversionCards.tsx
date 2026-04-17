import { useState } from 'react';
import { Phone, MessageSquare, PhoneCall, ArrowRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { trackCTAClick, trackFormSubmit } from '@/utils/analytics';

const validatePhone = (v: string) => /^[\d\s\-+()]{7,20}$/.test(v);

const CallbackMiniForm = () => {
  const [phone, setPhone] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (!validatePhone(phone)) { setError('Podaj poprawny numer'); return; }
    setError('');
    setStatus('loading');
    try {
      const { error: err } = await supabase.functions.invoke('notify-lead', {
        body: {
          product_model: 'Prośba o kontakt zwrotny',
          language: 'pl',
          message: `Klient prosi o oddzwonienie.\nTelefon: ${phone}`,
          phone,
          page_url: window.location.href,
          user_agent: navigator.userAgent,
        },
      });
      if (err) throw err;
      trackFormSubmit('contact_callback_card');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-center font-medium">✓ Zapisaliśmy! Oddzwonimy wkrótce.</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
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
      <div className="flex gap-2">
        <input
          type="tel"
          placeholder="Twój telefon"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          maxLength={20}
          className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-stakerpol-orange/40 focus:border-stakerpol-orange"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2.5 rounded-lg bg-stakerpol-orange hover:bg-stakerpol-orange/90 text-white text-sm font-semibold disabled:opacity-60"
        >
          {status === 'loading' ? '...' : 'Oddzwońcie'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {status === 'error' && <p className="text-xs text-red-500">Błąd. Spróbuj ponownie.</p>}
    </form>
  );
};

const ContactConversionCards = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="bg-gray-50 py-8 border-t border-gray-200">
      <div className="container-custom">
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border-2 border-stakerpol-orange text-stakerpol-orange hover:bg-stakerpol-orange hover:text-white font-semibold text-sm transition-colors"
          >
            Nie wiesz, który model wybrać? Rozwiń
            <ChevronDown size={18} />
          </button>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-stakerpol-orange mb-1">
                Dla niezdecydowanych
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-stakerpol-navy">
                Nie wiesz od czego zacząć? Pomożemy.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Card A */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <Phone className="text-red-600" size={22} />
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-2">Nie wiesz, który model wybrać?</h3>
                <p className="text-sm text-gray-600 mb-4 flex-1">
                  Zadzwoń — w 10 minut powiemy Ci, który wózek sprawdzi się w Twoim magazynie.
                </p>
                <a
                  href="tel:+48694133592"
                  onClick={() => trackCTAClick('conversion_card_call')}
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold min-h-[44px]"
                >
                  <Phone size={16} />
                  Zadzwoń: 694 133 592
                </a>
              </div>

              {/* Card B */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <MessageSquare className="text-blue-600" size={22} />
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-2">Dobierzemy wózek do Twojego magazynu</h3>
                <p className="text-sm text-gray-600 mb-4 flex-1">
                  Opisz swoje potrzeby — wysokość regałów, rodzaj nawierzchni, udźwig — przygotujemy propozycję.
                </p>
                <a
                  href="#form"
                  onClick={() => trackCTAClick('conversion_card_form')}
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border-2 border-stakerpol-orange text-stakerpol-orange hover:bg-stakerpol-orange hover:text-white text-sm font-semibold transition-colors min-h-[44px]"
                >
                  Wyślij opis magazynu
                  <ArrowRight size={16} />
                </a>
              </div>

              {/* Card C */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <PhoneCall className="text-green-600" size={22} />
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-2">Zostaw numer — oddzwonimy</h3>
                <p className="text-sm text-gray-600 mb-4 flex-1">
                  Wpisz numer, oddzwonimy w ciągu 2h w godzinach pracy.
                </p>
                <CallbackMiniForm />
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ContactConversionCards;

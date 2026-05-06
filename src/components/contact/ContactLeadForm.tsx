import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { trackFormSubmit, trackGenerateLead } from '@/utils/analytics';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface FormData {
  name: string;
  phone: string;
  email: string;
  interest: string;
  message: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  consent?: string;
}

const validateEmail = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validatePhone = (v: string) => /^[\d\s\-+()]{7,20}$/.test(v);

const ContactLeadForm = () => {
  const [formData, setFormData] = useState<FormData>({ name: '', phone: '', email: '', interest: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [honeypot, setHoneypot] = useState('');
  const [consent, setConsent] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!formData.name.trim()) e.name = 'Pole wymagane';
    if (!formData.phone.trim()) e.phone = 'Pole wymagane';
    else if (!validatePhone(formData.phone)) e.phone = 'Podaj poprawny numer telefonu';
    if (formData.email && !validateEmail(formData.email)) e.email = 'Podaj poprawny adres email';
    if (!formData.message.trim()) e.message = 'Pole wymagane';
    if (!consent) e.consent = 'Prosimy o akceptację polityki prywatności.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (!validate()) return;
    setStatus('loading');
    try {
      const { error } = await supabase.from('leads').insert({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        message: formData.message,
        source: 'contact_page',
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        rodo_accepted: consent,
      });
      if (error) throw error;

      // notify-lead is triggered automatically by DB trigger on leads INSERT
      trackFormSubmit('contact_lead_form');
      trackGenerateLead(crypto.randomUUID(), 'contact_page');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  const inputCls = (err?: string) =>
    `w-full px-3 py-2 text-sm rounded-lg border ${err ? 'border-red-500' : 'border-gray-200'} bg-white focus:outline-none focus:ring-2 focus:ring-stakerpol-orange/40 focus:border-stakerpol-orange transition-all`;

  if (status === 'success') {
    return (
      <div id="form" className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="text-green-600" size={32} />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Dziękujemy za zapytanie!</h3>
        <p className="text-gray-600">Odpowiemy w ciągu kilku godzin (pon–pt 8:00–17:00).</p>
      </div>
    );
  }

  return (
    <div id="form" className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900">Zostaw zapytanie</h2>
      <p className="text-sm text-gray-600 mt-1 mb-4">Oddzwonimy lub odpiszemy w ciągu kilku godzin. Bezpłatne doradztwo.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Imię i nazwisko *</label>
            <input value={formData.name} onChange={e => updateField('name', e.target.value)} className={inputCls(errors.name)} maxLength={100} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Telefon *</label>
            <input type="tel" value={formData.phone} onChange={e => updateField('phone', e.target.value)} className={inputCls(errors.phone)} maxLength={20} />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">E-mail</label>
          <input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} className={inputCls(errors.email)} maxLength={255} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Wiadomość *</label>
          <textarea
            rows={3}
            value={formData.message}
            onChange={e => updateField('message', e.target.value)}
            placeholder="Np. paleciak elektryczny, z niskim masztem, udźwig 1000 kg , magazyn z posadzką w kostce"
            className={inputCls(errors.message) + ' resize-none'}
            maxLength={1000}
          />
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

        {/* GDPR */}
        <div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={e => { setConsent(e.target.checked); if (e.target.checked) setErrors(prev => ({ ...prev, consent: undefined })); }}
              className="mt-0.5 w-4 h-4 accent-stakerpol-orange cursor-pointer"
            />
            <span className="text-[13px] text-gray-700 leading-snug">
              Akceptuję{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-stakerpol-orange underline">politykę prywatności</a>
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
          style={{ backgroundColor: '#F97316', color: '#ffffff' }}
          className="w-full py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 min-h-[48px] shadow-sm"
        >
          <Send size={16} />
          {status === 'loading' ? 'Wysyłanie...' : 'Poproś o ofertę →'}
        </button>

        {status === 'error' && <p className="text-sm text-red-500 text-center">Błąd wysyłki. Spróbuj ponownie lub zadzwoń.</p>}
      </form>
    </div>
  );
};

export default ContactLeadForm;

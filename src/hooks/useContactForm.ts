import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { trackFormSubmit, trackGenerateLead } from '@/utils/analytics';

interface ContactFormData {
  name: string;
  contact: string;
  message: string;
}

interface SubmitOptions {
  source?: 'homepage' | 'contact_page' | 'floating_widget' | 'product_page' | 'product_list';
  productId?: string;
  productModel?: string;
  serialNumber?: string;
}

interface ContactFormErrors {
  name?: string;
  contact?: string;
  message?: string;
  consent?: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validatePhone = (v: string) => /^[\d\s\-+()]{7,20}$/.test(v);

export function useContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({ name: '', contact: '', message: '' });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [honeypot, setHoneypot] = useState('');
  const [consent, setConsent] = useState(false);

  const validate = (): boolean => {
    const e: ContactFormErrors = {};
    if (!formData.name.trim()) e.name = 'Pole wymagane';
    if (!formData.contact.trim()) {
      e.contact = 'Pole wymagane';
    } else if (!validateEmail(formData.contact) && !validatePhone(formData.contact)) {
      e.contact = 'Podaj poprawny email lub telefon';
    }
    if (!formData.message.trim()) e.message = 'Pole wymagane';
    if (!consent) e.consent = 'Prosimy o akceptację polityki prywatności.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const updateField = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const updateConsent = (value: boolean) => {
    setConsent(value);
    if (value && errors.consent) setErrors(prev => ({ ...prev, consent: undefined }));
  };

  const submit = async ({ source = 'homepage', productId, productModel, serialNumber }: SubmitOptions = {}) => {
    // Honeypot: silently block bots
    if (honeypot) return false;
    if (!validate()) return false;
    setStatus('loading');
    try {
      const isEmail = validateEmail(formData.contact);
      const productInfo = productModel || serialNumber
        ? `\n\n--- Produkt ---\n${productModel ? `Model: ${productModel}\n` : ''}${serialNumber ? `Nr seryjny: ${serialNumber}\n` : ''}${productId ? `ID: ${productId}` : ''}`
        : '';
      const fullMessage = `Imię: ${formData.name}\n${isEmail ? 'Email' : 'Telefon'}: ${formData.contact}\n\nTreść:\n${formData.message}${productInfo}`;
      const isUuid = productId ? /^[0-9a-f-]{36}$/i.test(productId) : false;
      const payload = {
        product_model: productModel || 'Zapytanie ogólne',
        language: 'pl',
        message: fullMessage,
        phone: isEmail ? null : formData.contact,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      };
      const { error } = await supabase.from('leads').insert({
        name: formData.name,
        email: isEmail ? formData.contact : null,
        phone: formData.contact,
        message: fullMessage,
        source,
        product_id: isUuid ? productId : null,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        rodo_accepted: consent,
      });
      if (error) throw error;

      // notify-lead is triggered automatically by DB trigger on leads INSERT
      // Anon users have INSERT but not SELECT on leads (RLS), so we don't read back the id.
      void payload;
      trackFormSubmit('contact_widget', productModel);
      trackGenerateLead(
        crypto.randomUUID(),
        source,
        productId || productModel
          ? { id: productId || '', model: productModel || 'Zapytanie ogólne' }
          : undefined
      );
      setStatus('success');
      setFormData({ name: '', contact: '', message: '' });
      setConsent(false);
      return true;
    } catch {
      setStatus('error');
      return false;
    }
  };

  const reset = () => {
    setStatus('idle');
    setErrors({});
    setConsent(false);
    setHoneypot('');
  };

  return { formData, errors, status, honeypot, setHoneypot, consent, updateConsent, updateField, submit, reset };
}

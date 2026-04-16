import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { trackFormSubmit } from '@/utils/analytics';

interface ContactFormData {
  name: string;
  contact: string;
  message: string;
}

interface ContactFormErrors {
  name?: string;
  contact?: string;
  message?: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validatePhone = (v: string) => /^[\d\s\-+()]{7,20}$/.test(v);

export function useContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({ name: '', contact: '', message: '' });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');

  const validate = (): boolean => {
    const e: ContactFormErrors = {};
    if (!formData.name.trim()) e.name = 'Pole wymagane';
    if (!formData.contact.trim()) {
      e.contact = 'Pole wymagane';
    } else if (!validateEmail(formData.contact) && !validatePhone(formData.contact)) {
      e.contact = 'Podaj poprawny email lub telefon';
    }
    if (!formData.message.trim()) e.message = 'Pole wymagane';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const updateField = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const submit = async () => {
    if (!validate()) return false;
    setStatus('loading');
    try {
      const isEmail = validateEmail(formData.contact);
      const payload = {
        product_model: 'Zapytanie ogólne',
        language: 'pl',
        message: `Imię: ${formData.name}\n${isEmail ? 'Email' : 'Telefon'}: ${formData.contact}\n\nTreść:\n${formData.message}`,
        phone: isEmail ? null : formData.contact,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      };
      const { error } = await supabase.functions.invoke('notify-lead', { body: payload });
      if (error) throw error;
      trackFormSubmit('contact_widget');
      setStatus('success');
      setFormData({ name: '', contact: '', message: '' });
      return true;
    } catch {
      setStatus('error');
      return false;
    }
  };

  const reset = () => {
    setStatus('idle');
    setErrors({});
  };

  return { formData, errors, status, updateField, submit, reset };
}

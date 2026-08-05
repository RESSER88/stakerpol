import { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trackFormSubmit, trackGenerateLead } from '@/utils/analytics';

// Polish phone format: optional +48, then 9 digits starting 5-9, with optional spaces/dashes
const phoneSchema = z
  .string()
  .trim()
  .max(20, { message: 'Numer jest za długi' })
  .regex(/^(\+48\s?)?[5-9]\d{2}[\s-]?\d{3}[\s-]?\d{3}$/, {
    message: 'Podaj poprawny numer telefonu',
  });

export interface LeadSubmitOptions {
  /** Distinguishes the entry point in statistics. Defaults to the inline product form. */
  source?: string;
  /** Optional free-text content saved to leads.message */
  message?: string;
  /** GDPR consent — stored as rodo_accepted */
  rodoAccepted?: boolean;
  /** GA4 form_submit label */
  formLabel?: string;
  /** Product model passed to GA4 generate_lead */
  productModel?: string;
  /** Success toast copy */
  successTitle?: string;
  successDescription?: string;
}

export const useLeadSubmit = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (phone: string, productId?: string, options: LeadSubmitOptions = {}) => {
    const {
      source = 'product_page_inline',
      message,
      rodoAccepted,
      formLabel = 'product_callback_inline',
      productModel = 'Zapytanie produktowe',
      successTitle = '✅ Dziękujemy!',
      successDescription = 'Oddzwonimy w ciągu 30 minut w godzinach pracy.',
    } = options;

    setError(null);
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message || 'Podaj poprawny numer telefonu';
      setError(msg);
      return false;
    }
    setIsSubmitting(true);
    try {
      const { error: dbError } = await supabase.from('leads' as any).insert({
        phone: parsed.data,
        product_id: productId || null,
        source,
        message: message?.trim() ? message.trim().slice(0, 2000) : null,
        rodo_accepted: rodoAccepted ?? undefined,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      } as any);
      if (dbError) throw dbError;
      // notify-lead is triggered automatically by DB trigger on leads INSERT
      trackFormSubmit(formLabel);
      trackGenerateLead(
        crypto.randomUUID(),
        source,
        productId ? { id: productId, model: productModel } : undefined
      );
      toast({
        title: successTitle,
        description: successDescription,
      });
      return true;
    } catch (e: any) {
      console.error('Lead submit error');
      const msg = 'Coś poszło nie tak. Spróbuj zadzwonić: 694 133 592';
      setError(msg);
      toast({
        title: 'Nie udało się wysłać',
        description: msg,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error, clearError: () => setError(null) };
};

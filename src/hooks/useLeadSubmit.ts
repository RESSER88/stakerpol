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

export const useLeadSubmit = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (phone: string, productId?: string) => {
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
        source: 'product_page_inline',
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      } as any);
      if (dbError) throw dbError;
      // notify-lead is triggered automatically by DB trigger on leads INSERT
      trackFormSubmit('product_callback_inline');
      trackGenerateLead(
        crypto.randomUUID(),
        'product_page_inline',
        productId ? { id: productId, model: 'Zapytanie produktowe' } : undefined
      );
      toast({
        title: '✅ Dziękujemy!',
        description: 'Oddzwonimy w ciągu 30 minut w godzinach pracy.',
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

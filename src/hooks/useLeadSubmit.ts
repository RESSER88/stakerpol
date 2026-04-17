import { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+]?[0-9\s-]{9,15}$/, { message: 'Podaj poprawny numer telefonu' });

export const useLeadSubmit = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (phone: string, productId?: string) => {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast({
        title: 'Błędny numer',
        description: parsed.error.errors[0]?.message || 'Sprawdź numer telefonu',
        variant: 'destructive',
      });
      return false;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('leads' as any).insert({
        phone: parsed.data,
        product_id: productId || null,
        source: 'product_page_inline',
        page_url: typeof window !== 'undefined' ? window.location.href : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      } as any);
      if (error) throw error;
      toast({
        title: '✅ Dziękujemy!',
        description: 'Oddzwonimy w ciągu 30 minut w godzinach pracy.',
      });
      return true;
    } catch (e: any) {
      console.error('Lead submit error:', e);
      toast({
        title: 'Nie udało się wysłać',
        description: e?.message || 'Spróbuj ponownie za chwilę.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
};

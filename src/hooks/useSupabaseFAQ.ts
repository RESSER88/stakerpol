import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type FAQCategory = 'pre_purchase' | 'tech_specs' | 'delivery' | 'service_warranty';

export interface FAQ {
  id: string;
  language: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  /** Pages where the FAQ should appear: 'home' | 'reviews'. */
  display_locations?: string[];
  category: FAQCategory;
  is_featured: boolean;
  linked_product_ids: string[];
  inline_cta_label: string | null;
  inline_cta_action: string | null;
  created_at: string;
  updated_at: string;
}

export const useSupabaseFAQ = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFAQs = async (language?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (language) {
        query = query.eq('language', language);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFaqs((data as any) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({
        title: "Error",
        description: "Failed to fetch FAQs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFAQ = async (faq: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .insert([faq as any])
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Success", description: "FAQ created successfully" });
      return data;
    } catch (err) {
      toast({ title: "Error", description: "Failed to create FAQ", variant: "destructive" });
      throw err;
    }
  };

  const updateFAQ = async (id: string, updates: Partial<FAQ>) => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Success", description: "FAQ updated successfully" });
      return data;
    } catch (err) {
      toast({ title: "Error", description: "Failed to update FAQ", variant: "destructive" });
      throw err;
    }
  };

  const toggleFAQActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) {
        console.error('[toggleFAQActive] Supabase error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: isActive ? "FAQ aktywowane" : "FAQ dezaktywowane",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nie udało się zmienić statusu FAQ';
      console.error('[toggleFAQActive] failed:', err);
      toast({ title: "Error", description: message, variant: "destructive" });
      throw err;
    }
  };

  const deleteFAQ = async (id: string) => {
    try {
      const { error } = await supabase.from('faqs').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "FAQ dezaktywowane" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to deactivate FAQ", variant: "destructive" });
      throw err;
    }
  };

  const hardDeleteFAQ = async (id: string) => {
    try {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "FAQ trwale usunięte" });
    } catch (err) {
      toast({ title: "Error", description: "Nie udało się trwale usunąć FAQ", variant: "destructive" });
      throw err;
    }
  };

  const getAllFAQsForAdmin = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('language', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data as any) || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({ title: "Error", description: "Failed to fetch all FAQs", variant: "destructive" });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedCountByLanguage = async (lang: string): Promise<number> => {
    const { count, error } = await supabase
      .from('faqs')
      .select('id', { count: 'exact', head: true })
      .eq('language', lang)
      .eq('is_featured', true);
    if (error) {
      console.error('[fetchFeaturedCountByLanguage]', error);
      return 0;
    }
    return count ?? 0;
  };

  return {
    faqs,
    loading,
    error,
    fetchFAQs,
    createFAQ,
    updateFAQ,
    toggleFAQActive,
    deleteFAQ,
    hardDeleteFAQ,
    getAllFAQsForAdmin,
    fetchFeaturedCountByLanguage,
  };
};

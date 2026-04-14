import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

interface TranslationStats {
  current_month: string;
  characters_used: number;
  characters_limit: number;
  api_calls: number;
  pending_jobs: number;
  limit_reached: boolean;
  translation_progress?: {
    [language: string]: {
      translated_products: number;
      total_products: number;
    };
  };
}

interface TranslationJob {
  id: string;
  content_type: string;
  content_id: string;
  source_language: string;
  target_language: string;
  source_content: string;
  translated_content?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  characters_used: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export const useAutoTranslation = () => {
  const [stats, setStats] = useState<TranslationStats | null>(null);
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('auto-translate', {
        body: { action: 'get_stats' }
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      logger.error('Error loading translation stats:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować statystyk tłumaczeń',
        variant: 'destructive'
      });
    }
  };

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('translation_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setJobs((data || []) as TranslationJob[]);
    } catch (error) {
      logger.error('Error loading translation jobs:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować zadań tłumaczeń',
        variant: 'destructive'
      });
    }
  };

  const setupInitialTranslations = async () => {
    setLoading(true);
    try {
      toast({
        title: 'Uruchamianie tłumaczeń',
        description: 'Dodawanie zadań tłumaczeń do kolejki...'
      });

      const { data, error } = await supabase.functions.invoke('schedule-translations', {
        body: { action: 'initial_setup' }
      });

      if (error) throw error;

      toast({
        title: 'Sukces',
        description: `Zaplanowano tłumaczenia: ${data.faq_result?.scheduled_faq_items || 0} FAQ, ${data.products_result?.scheduled_products || 0} produktów`,
        variant: 'default'
      });

      // Odśwież statystyki i zadania
      await loadStats();
      await loadJobs();

    } catch (error) {
      logger.error('Error setting up initial translations:', error);
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się uruchomić tłumaczeń',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const processPendingTranslations = async () => {
    setLoading(true);
    try {
      toast({
        title: 'Przetwarzanie tłumaczeń',
        description: 'Wykonywanie oczekujących tłumaczeń...'
      });

      const { data, error } = await supabase.functions.invoke('auto-translate', {
        body: { action: 'process_pending_translations' }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Sukces',
          description: `Przetłumaczono ${data.processed_count} elementów (${data.characters_used} znaków)`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Informacja',
          description: data.message || 'Brak zadań do przetworzenia',
          variant: 'default'
        });
      }

      // Odśwież statystyki i zadania
      await loadStats();
      await loadJobs();

    } catch (error) {
      logger.error('Error processing translations:', error);
      toast({
        title: 'Błąd',
        description: error.message || 'Nie udało się przetworzyć tłumaczeń',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleProductTranslation = async (productId: string, productContent: any) => {
    try {
      const { error } = await supabase.functions.invoke('schedule-translations', {
        body: { 
          action: 'schedule_new_product',
          product_id: productId,
          product_content: productContent
        }
      });

      if (error) throw error;

      logger.log(`Translation scheduled for product ${productId}`);
      
      // Odśwież statystyki
      await loadStats();
      await loadJobs();

    } catch (error) {
      logger.error('Error scheduling product translation:', error);
      toast({
        title: 'Błąd tłumaczenia',
        description: 'Nie udało się zaplanować tłumaczenia produktu',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    // Feature flag: skip DeepL API calls when disabled
    const { FEATURES } = require('@/config/featureFlags');
    if (!FEATURES.DEEPL_ENABLED) return;
    loadStats();
    loadJobs();
  }, []);

  return {
    stats,
    jobs,
    loading,
    setupInitialTranslations,
    processPendingTranslations,
    scheduleProductTranslation,
    refreshData: () => {
      loadStats();
      loadJobs();
    }
  };
};
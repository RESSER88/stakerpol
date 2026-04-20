import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Language } from '@/contexts/LanguageContext';
import { logger } from '@/utils/logger';

interface ProductTranslation {
  language: string;
  field_name: string;
  translated_value: string;
}

interface TranslatedFields {
  shortDescription?: string;
  additionalDescription?: string;
}

export const useProductTranslationsDisplay = (productId: string, language: Language) => {
  const [translations, setTranslations] = useState<TranslatedFields>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || language === 'pl') {
      // Don't fetch translations for Polish (original language)
      setTranslations({});
      return;
    }

    const fetchTranslations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('product_translations')
          .select('language, field_name, translated_value')
          .eq('product_id', productId)
          .eq('language', language);

        if (fetchError) {
          throw fetchError;
        }

        // Convert array to object for easier access
        const translatedFields: TranslatedFields = {};
        
        data?.forEach((translation: ProductTranslation) => {
          if (translation.field_name === 'short_description') {
            translatedFields.shortDescription = translation.translated_value;
          } else if (translation.field_name === 'detailed_description') {
            translatedFields.additionalDescription = translation.translated_value;
          }
        });

        logger.log(`Loaded ${data?.length || 0} translations for product ${productId} in ${language}:`, translatedFields);

        setTranslations(translatedFields);
      } catch (err) {
        logger.error('Error fetching product translations:', err);
        setError(err.message || 'Failed to fetch translations');
        setTranslations({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchTranslations();
  }, [productId, language]);

  return {
    translations,
    isLoading,
    error,
    hasTranslations: Object.keys(translations).length > 0
  };
};
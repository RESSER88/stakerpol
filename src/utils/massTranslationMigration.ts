import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export const executeMassTranslationMigration = async () => {
  logger.log('🚀 ROZPOCZYNANIE MASOWEJ MIGRACJI TŁUMACZEŃ');
  
  const startTime = Date.now();
  const results = {
    totalProducts: 0,
    processedProducts: 0,
    successfulProducts: 0,
    failedProducts: 0,
    totalTranslations: 0,
    errors: [] as string[],
    processingTime: 0
  };

  try {
    // KROK 1: Pobierz wszystkie produkty
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at');

    if (productsError) {
      throw new Error(`Błąd pobierania produktów: ${productsError.message}`);
    }

    results.totalProducts = products?.length || 0;
    logger.log(`📊 Znaleziono ${results.totalProducts} produktów do przetworzenia`);

    if (!products || products.length === 0) {
      return { ...results, processingTime: Date.now() - startTime };
    }

    // KROK 2: Sprawdź istniejące tłumaczenia
    const { data: existingTranslations } = await supabase
      .from('product_translations')
      .select('product_id, language, field_name');

    const existingMap = new Map();
    existingTranslations?.forEach(t => {
      const key = `${t.product_id}-${t.language}-${t.field_name}`;
      existingMap.set(key, true);
    });

    logger.log(`📋 Znaleziono ${existingTranslations?.length || 0} istniejących tłumaczeń`);

    // KROK 3: Przetwarzaj każdy produkt
    for (const product of products) {
      logger.log(`\n🔄 Przetwarzanie produktu: ${product.name} (${product.id})`);
      results.processedProducts++;

      try {
        // Sprawdź czy produkt potrzebuje tłumaczenia
        const languages = ['en', 'de', 'sk', 'cs'];
        const fields = ['short_description', 'initial_lift', 'condition', 'drive_type', 'mast', 'wheels', 'foldable_platform', 'additional_options'];
        
        let needsTranslation = false;
        for (const lang of languages) {
          for (const field of fields) {
            const key = `${product.id}-${lang}-${field}`;
            if (!existingMap.has(key) && product[field] && product[field].trim() !== '') {
              needsTranslation = true;
              break;
            }
          }
          if (needsTranslation) break;
        }

        if (!needsTranslation) {
          logger.log(`⏭️ Produkt ${product.name} już ma wszystkie tłumaczenia`);
          results.successfulProducts++;
          continue;
        }

        // Przygotuj dane do tłumaczenia
        const productData = {
          short_description: product.short_description || '',
          initial_lift: product.initial_lift || '',
          condition: product.condition || '',
          drive_type: product.drive_type || '',
          mast: product.mast || '',
          wheels: product.wheels || '',
          foldable_platform: product.foldable_platform || '',
          additional_options: product.additional_options || '',
          detailed_description: product.detailed_description || ''
        };

        // POPRAWKA: Wykonaj tłumaczenie z płaską strukturą danych
        const translationPayload = {
          action: 'translate_product_fields',
          product_id: product.id,
          // Dane bezpośrednio w payload (bez product_data wrapper)
          ...productData
        };

        logger.log(`📤 Wysyłanie payload dla ${product.name}:`, translationPayload);

        const { data, error } = await supabase.functions.invoke('auto-translate', {
          body: translationPayload
        });

        if (error) {
          logger.error(`❌ Błąd tłumaczenia dla ${product.name}:`, error);
          results.errors.push(`${product.name}: ${error.message}`);
          results.failedProducts++;
        } else if (data?.success) {
          logger.log(`✅ Sukces tłumaczenia dla ${product.name}`);
          const successCount = data.results?.filter((r: any) => r.status === 'completed').length || 0;
          results.totalTranslations += successCount;
          results.successfulProducts++;
        } else {
          logger.error(`❌ Nieoczekiwana odpowiedź dla ${product.name}:`, data);
          results.errors.push(`${product.name}: Nieoczekiwana odpowiedź z API`);
          results.failedProducts++;
        }

        // Opóźnienie między produktami aby nie przeciążyć API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        logger.error(`❌ Błąd przetwarzania produktu ${product.name}:`, error);
        results.errors.push(`${product.name}: ${error.message}`);
        results.failedProducts++;
      }
    }

    results.processingTime = Date.now() - startTime;

    logger.log('\n🎯 PODSUMOWANIE MIGRACJI:');
    logger.log(`📊 Produkty: ${results.processedProducts}/${results.totalProducts} przetworzonych`);
    logger.log(`✅ Sukces: ${results.successfulProducts} produktów`);
    logger.log(`❌ Błędy: ${results.failedProducts} produktów`);
    logger.log(`🌐 Tłumaczenia: ${results.totalTranslations} utworzonych`);
    logger.log(`⏱️ Czas: ${Math.round(results.processingTime / 1000)}s`);

    if (results.errors.length > 0) {
      logger.log('\n❌ BŁĘDY:');
      results.errors.forEach(error => logger.log(`  - ${error}`));
    }

    return results;

  } catch (error) {
    logger.error('💥 KRYTYCZNY BŁĄD MIGRACJI:', error);
    results.processingTime = Date.now() - startTime;
    results.errors.push(`Krytyczny błąd: ${error.message}`);
    return results;
  }
};
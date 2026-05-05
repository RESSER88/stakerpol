import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TranslationRequest {
  action: string;
  productId?: string;
  productContent?: any;
  translationMode?: string;
  keyId?: string;
  text?: string;
  target_lang?: string;
  source_lang?: string;
}

interface DeepLResponse {
  translations: Array<{
    text: string;
    detected_source_language?: string;
  }>;
}

interface DeepLKey {
  id: string;
  api_key_encrypted: string;
  api_key_masked: string;
  is_primary: boolean;
  status: string;
  quota_used: number;
  quota_remaining: number;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to decrypt API key (simplified - in production use proper encryption)
function decryptApiKey(encrypted: string): string {
  // For now, assume the encrypted key is base64 encoded
  // In production, implement proper decryption
  try {
    return atob(encrypted);
  } catch {
    return encrypted; // Fallback if not base64
  }
}

// Get DeepL API keys with preference for primary
async function getApiKeys(): Promise<DeepLKey[]> {
  const { data, error } = await supabase
    .from('deepl_api_keys')
    .select('*')
    .eq('is_active', true)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('Error fetching API keys:', error);
    return [];
  }

  return data || [];
}

// Translate text using specific API key
async function translateText(
  text: string, 
  targetLang: string, 
  apiKey: string,
  sourceLang = 'pl'
): Promise<{ text: string; charactersUsed: number }> {
  const url = 'https://api-free.deepl.com/v2/translate';
  
  const params = new URLSearchParams({
    auth_key: apiKey,
    text: text,
    source_lang: sourceLang.toUpperCase(),
    target_lang: targetLang.toUpperCase(),
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepL API error (${response.status}): ${errorText}`);
  }

  const data: DeepLResponse = await response.json();
  return {
    text: data.translations[0]?.text || text,
    charactersUsed: text.length
  };
}

// Check API usage
async function checkApiUsage(apiKey: string): Promise<{ charactersUsed: number; charactersLimit: number }> {
  const url = 'https://api-free.deepl.com/v2/usage';
  
  const params = new URLSearchParams({
    auth_key: apiKey
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!response.ok) {
    throw new Error(`DeepL Usage API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    charactersUsed: data.character_count || 0,
    charactersLimit: data.character_limit || 500000
  };
}

// Test API connection
async function testApiConnection(apiKey: string): Promise<{ success: boolean; error?: string; usage?: any }> {
  try {
    const usage = await checkApiUsage(apiKey);
    return { success: true, usage };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update API key status and quota
async function updateApiKeyStatus(keyId: string, status: string, usage?: any) {
  const updateData: any = { 
    status,
    last_test_at: new Date().toISOString()
  };

  if (usage) {
    updateData.quota_used = usage.charactersUsed;
    updateData.quota_remaining = usage.charactersLimit - usage.charactersUsed;
    updateData.quota_limit = usage.charactersLimit;
    updateData.last_sync_at = new Date().toISOString();
  }

  await supabase
    .from('deepl_api_keys')
    .update(updateData)
    .eq('id', keyId);
}

// Log translation attempt
async function logTranslation(
  productId: string,
  apiKeyMasked: string,
  translationMode: string,
  fieldName: string,
  sourceLanguage: string,
  targetLanguage: string,
  requestPayload: any,
  responsePayload: any,
  status: string,
  charactersUsed: number,
  errorDetails?: string,
  processingTimeMs?: number
) {
  await supabase
    .from('translation_logs')
    .insert({
      product_id: productId,
      api_key_used: apiKeyMasked,
      translation_mode: translationMode,
      field_name: fieldName,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      request_payload: requestPayload,
      response_payload: responsePayload,
      status,
      characters_used: charactersUsed,
      error_details: errorDetails,
      processing_time_ms: processingTimeMs
    });
}

// Translate with fallback logic
async function translateWithFallback(
  text: string,
  targetLang: string,
  translationMode: string,
  sourceLang = 'pl'
): Promise<{ text: string; charactersUsed: number; apiKeyUsed: string }> {
  const apiKeys = await getApiKeys();
  
  if (apiKeys.length === 0) {
    throw new Error('No active DeepL API keys found');
  }

  let lastError: Error | null = null;

  // Try primary key first, then secondary
  for (const keyData of apiKeys) {
    try {
      const apiKey = decryptApiKey(keyData.api_key_encrypted);
      const result = await translateText(text, targetLang, apiKey, sourceLang);
      
      // Update usage stats
      const usage = await checkApiUsage(apiKey);
      await updateApiKeyStatus(keyData.id, 'active', usage);
      
      return {
        ...result,
        apiKeyUsed: keyData.api_key_masked
      };
    } catch (error) {
      lastError = error;
      console.error(`Translation failed with key ${keyData.api_key_masked}:`, error);
      
      // Update key status to error
      await updateApiKeyStatus(keyData.id, 'error');
      
      // If this is primary-only mode, don't try fallback
      if (translationMode === 'primary_only') {
        break;
      }
    }
  }

  throw lastError || new Error('All API keys failed');
}

async function updateMonthlyStats(charactersUsed: number) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const { data: existing } = await supabase
    .from('translation_stats')
    .select('*')
    .eq('month_year', currentMonth)
    .single();

  if (existing) {
    await supabase
      .from('translation_stats')
      .update({
        characters_used: existing.characters_used + charactersUsed,
        api_calls: existing.api_calls + 1,
      })
      .eq('month_year', currentMonth);
  } else {
    await supabase
      .from('translation_stats')
      .insert({
        month_year: currentMonth,
        characters_used: charactersUsed,
        api_calls: 1,
      });
  }
}

async function checkMonthlyLimit(): Promise<boolean> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const { data } = await supabase
    .from('translation_stats')
    .select('characters_used, characters_limit')
    .eq('month_year', currentMonth)
    .single();

  if (!data) return true; // No usage yet
  
  return data.characters_used < data.characters_limit;
}

// Main request handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ===== Authentication & admin authorization =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: claimsData.claims.sub,
      _role: 'admin'
    });
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    console.log('🚨 INCOMING REQUEST BODY:', JSON.stringify(body, null, 2));
    
    const { action, productId, productContent, translationMode = 'fallback', keyId, text, target_lang, source_lang = 'pl' }: TranslationRequest = body;
    
    switch (action) {
      case 'test_connection': {
        const { data: keyData } = await supabase
          .from('deepl_api_keys')
          .select('*')
          .eq('id', keyId)
          .single();

        if (!keyData) {
          return new Response(JSON.stringify({ success: false, error: 'API key not found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404
          });
        }

        const apiKey = decryptApiKey(keyData.api_key_encrypted);
        const result = await testApiConnection(apiKey);
        
        await updateApiKeyStatus(keyData.id, result.success ? 'active' : 'error', result.usage);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'refresh_usage': {
        const apiKeys = await getApiKeys();
        const results = [];

        for (const keyData of apiKeys) {
          try {
            const apiKey = decryptApiKey(keyData.api_key_encrypted);
            const usage = await checkApiUsage(apiKey);
            await updateApiKeyStatus(keyData.id, 'active', usage);
            results.push({ keyId: keyData.id, success: true, usage });
          } catch (error) {
            await updateApiKeyStatus(keyData.id, 'error');
            results.push({ keyId: keyData.id, success: false, error: error.message });
          }
        }

        return new Response(JSON.stringify({ results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'translate_product_specifications': {
        if (!productId || !productContent) {
          return new Response(JSON.stringify({ success: false, error: 'Missing productId or productContent' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          });
        }

        const targetLanguages = ['en', 'de', 'sk', 'cs'];
        const results = [];

        // Only translate specifications and short description
        const fieldsToTranslate = {
          shortDescription: productContent.shortDescription,
          additionalDescription: productContent.specs?.additionalDescription
        };

        for (const targetLang of targetLanguages) {
          for (const [fieldName, fieldValue] of Object.entries(fieldsToTranslate)) {
            if (!fieldValue) continue;

            const startTime = Date.now();
            
            try {
              const result = await translateWithFallback(
                fieldValue,
                targetLang,
                translationMode
              );

              const processingTime = Date.now() - startTime;

              // Save translation to database
              await supabase
                .from('product_translations')
                .upsert({
                  product_id: productId,
                  language: targetLang,
                  field_name: fieldName,
                  translated_value: result.text
                });

              // Log successful translation
              await logTranslation(
                productId,
                result.apiKeyUsed,
                translationMode,
                fieldName,
                'pl',
                targetLang,
                { text: fieldValue },
                { text: result.text },
                'success',
                result.charactersUsed,
                null,
                processingTime
              );

              results.push({
                field: fieldName,
                language: targetLang,
                success: true,
                charactersUsed: result.charactersUsed,
                apiKeyUsed: result.apiKeyUsed
              });

            } catch (error) {
              const processingTime = Date.now() - startTime;

              // Log failed translation
              await logTranslation(
                productId,
                'unknown',
                translationMode,
                fieldName,
                'pl',
                targetLang,
                { text: fieldValue },
                null,
                'error',
                0,
                error.message,
                processingTime
              );

              results.push({
                field: fieldName,
                language: targetLang,
                success: false,
                error: error.message
              });
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        return new Response(JSON.stringify({ success: true, results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_translation_stats': {
        // Get API keys usage (NEVER return api_key_encrypted)
        const { data: apiKeysRaw } = await supabase
          .from('deepl_api_keys')
          .select('id, api_key_masked, is_primary, is_active, status, quota_used, quota_remaining, created_at, updated_at')
          .eq('is_active', true);

        // Get recent translation logs
        const { data: recentLogs } = await supabase
          .from('translation_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        return new Response(JSON.stringify({
          success: true,
          apiKeys: apiKeysRaw || [],
          recentLogs: recentLogs || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'translate_text': {
        if (!await checkMonthlyLimit()) {
          throw new Error('Monthly translation limit exceeded');
        }
        
        const result = await translateWithFallback(text!, target_lang!, translationMode, source_lang);
        await updateMonthlyStats(result.charactersUsed);
        
        return new Response(JSON.stringify({ 
          translated_text: result.text,
          characters_used: result.charactersUsed 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'translate_faq': {
        console.log('Starting FAQ translation...');
        
        if (!await checkMonthlyLimit()) {
          throw new Error('Monthly translation limit exceeded');
        }

        const targetLanguages = ['en', 'de', 'sk', 'cs'];
        const faqItems = [
          { question: 'Czy model Toyota SWE 200d może bezpiecznie poruszać się po nawierzchni z kostki brukowej?', answer: 'Tak, model nadaje się do jazdy po kostce.' },
          { question: 'Czy model SWE 200d może być użytkowany na powierzchniach kamienistych?', answer: 'Nie, nie jest przystosowany do jazdy po kamieniach.' },
          { question: 'Czy wózek SWE 200d umożliwia rozładunek palet z naczepy TIR?', answer: 'Tak, umożliwia rozładunek z TIRa.' },
          // ... więcej elementów FAQ
        ];

        let totalCharacters = 0;
        const translations = {};

        for (const lang of targetLanguages) {
          console.log(`Translating FAQ to ${lang}...`);
          translations[lang] = [];
          
          for (const item of faqItems) {
            const questionResult = await translateWithFallback(item.question, lang, 'fallback');
            const answerResult = await translateWithFallback(item.answer, lang, 'fallback');
            
            totalCharacters += item.question.length + item.answer.length;
            
            translations[lang].push({
              question: questionResult.text,
              answer: answerResult.text
            });

            // Dodaj małe opóźnienie między żądaniami
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        await updateMonthlyStats(totalCharacters);
        
        return new Response(JSON.stringify({ 
          success: true,
          translations,
          characters_used: totalCharacters 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'process_pending_translations': {
        console.log('Processing pending translations...');
        
        if (!await checkMonthlyLimit()) {
          console.log('Monthly limit exceeded, skipping...');
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'Monthly limit exceeded' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Pobierz oczekujące tłumaczenia
        const { data: pendingJobs } = await supabase
          .from('translation_jobs')
          .select('*')
          .eq('status', 'pending')
          .order('created_at')
          .limit(10); // Przetwarzaj maksymalnie 10 na raz

        if (!pendingJobs || pendingJobs.length === 0) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'No pending translations' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let processedCount = 0;
        let totalCharacters = 0;

        for (const job of pendingJobs) {
          try {
            // Oznacz jako przetwarzane
            await supabase
              .from('translation_jobs')
              .update({ status: 'processing' })
              .eq('id', job.id);

            const result = await translateWithFallback(
              job.source_content, 
              job.target_language, 
              'fallback',
              job.source_language
            );

            // Zapisz tłumaczenie
            await supabase
              .from('translation_jobs')
              .update({
                status: 'completed',
                translated_content: result.text,
                characters_used: result.charactersUsed
              })
              .eq('id', job.id);

            totalCharacters += result.charactersUsed;
            processedCount++;

            console.log(`Processed translation job ${job.id}`);

            // Sprawdź limity po każdym tłumaczeniu
            if (!await checkMonthlyLimit()) {
              console.log('Monthly limit reached during processing');
              break;
            }

            // Małe opóźnienie między żądaniami
            await new Promise(resolve => setTimeout(resolve, 200));

          } catch (error) {
            console.error(`Error processing job ${job.id}:`, error);
            
            await supabase
              .from('translation_jobs')
              .update({
                status: 'failed',
                error_message: error.message
              })
              .eq('id', job.id);
          }
        }

        if (totalCharacters > 0) {
          await updateMonthlyStats(totalCharacters);
        }

        return new Response(JSON.stringify({ 
          success: true,
          processed_count: processedCount,
          characters_used: totalCharacters
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'translate_product_fields': {
        console.log('🔄 Processing product fields translation...');
        console.log('📥 Received data:', { productId, productContent });
        
        // POPRAWKA: Pobieranie product_id bezpośrednio z różnych źródeł
        const requestProductId = productId || productContent?.product_id;
        
        console.log('🆔 Product ID:', requestProductId);
        
        if (!requestProductId) {
          console.error('❌ BŁĄD: Product ID is required for translation');
          throw new Error('Product ID is required for translation');
        }
        
        if (!await checkMonthlyLimit()) {
          throw new Error('Monthly translation limit exceeded');
        }

        const targetLanguages = ['en', 'de', 'sk', 'cs'];
        const fieldsToTranslate = [
          'short_description', 'initial_lift', 'condition', 'drive_type', 
          'mast', 'wheels', 'foldable_platform', 'additional_options', 'detailed_description'
        ];

        let totalCharacters = 0;
        const results = [];

        for (const lang of targetLanguages) {
          console.log(`🌐 Translating product ${requestProductId} fields to ${lang}...`);
          
          for (const fieldName of fieldsToTranslate) {
            // POPRAWKA: Pobieranie danych bezpośrednio z productContent (bez product_data wrapper)
            const sourceText = productContent?.[fieldName];
            
            console.log(`📝 Field ${fieldName}: sourceText = "${sourceText ? sourceText.substring(0, 50) + '...' : 'EMPTY'}"`);
            
            if (!sourceText || sourceText.trim() === '') {
              console.log(`⏭️ Skipping empty field: ${fieldName}`);
              continue;
            }

            try {
              console.log(`Translating ${fieldName}: "${sourceText.substring(0, 50)}..." to ${lang}`);
              const result = await translateWithFallback(sourceText, lang, translationMode);
              totalCharacters += result.charactersUsed;

              const { data, error } = await supabase
                .from('product_translations')
                .upsert({
                  product_id: requestProductId,
                  language: lang,
                  field_name: fieldName,
                  translated_value: result.text
                }, {
                  onConflict: 'product_id,language,field_name'
                })
                .select();

              if (error) {
                console.error(`Error saving translation for ${fieldName}:`, error);
                results.push({ product_id: requestProductId, language: lang, field_name: fieldName, status: 'failed', error: error.message });
              } else {
                console.log(`Successfully saved translation for ${fieldName} in ${lang}`);
                results.push({ product_id: requestProductId, language: lang, field_name: fieldName, status: 'completed', data });
              }

              // Małe opóźnienie między żądaniami
              await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
              console.error(`Error translating ${fieldName} to ${lang}:`, error);
              results.push({ product_id: requestProductId, language: lang, field_name: fieldName, status: 'failed', error: error.message });
            }
          }
        }

        if (totalCharacters > 0) {
          await updateMonthlyStats(totalCharacters);
        }

        console.log(`Translation completed. Results:`, results.length, 'total operations');

        return new Response(JSON.stringify({ 
          success: true,
          results,
          characters_used: totalCharacters 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_stats': {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        const { data: stats } = await supabase
          .from('translation_stats')
          .select('*')
          .eq('month_year', currentMonth)
          .single();

        const { data: pendingCount } = await supabase
          .from('translation_jobs')
          .select('id', { count: 'exact' })
          .eq('status', 'pending');

        // Policz przetłumaczone pola produktów per język
        const translationProgress = {};
        const languages = ['en', 'de', 'sk', 'cs'];
        
        for (const lang of languages) {
          const { data: translatedFields } = await supabase
            .from('product_translations')
            .select('product_id', { count: 'exact' })
            .eq('language', lang);
          
          const { data: totalProducts } = await supabase
            .from('products')
            .select('id', { count: 'exact' });
          
          translationProgress[lang] = {
            translated_products: translatedFields?.length || 0,
            total_products: totalProducts?.length || 0
          };
        }

        return new Response(JSON.stringify({
          current_month: currentMonth,
          characters_used: stats?.characters_used || 0,
          characters_limit: stats?.characters_limit || 500000,
          api_calls: stats?.api_calls || 0,
          pending_jobs: pendingCount?.length || 0,
          limit_reached: stats ? stats.characters_used >= stats.characters_limit : false,
          translation_progress: translationProgress
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in auto-translate function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
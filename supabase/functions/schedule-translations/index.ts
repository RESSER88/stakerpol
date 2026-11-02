import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getSecretKey } from '../_shared/keys.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = getSecretKey();

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function scheduleProductTranslations(productId: string, productContent: any) {
  const targetLanguages = ['en', 'cs', 'sk', 'de'];
  
  // Przygotuj teksty do tłumaczenia
  const textsToTranslate = [
    { field: 'model', content: productContent.model || '' },
    { field: 'shortDescription', content: productContent.shortDescription || '' },
    { field: 'additionalDescription', content: productContent.specs?.additionalDescription || '' }
  ].filter(item => item.content.trim() !== '');

  console.log(`Scheduling translations for product ${productId}, ${textsToTranslate.length} texts, ${targetLanguages.length} languages`);

  // Utwórz zadania tłumaczenia dla każdego języka i pola
  for (const lang of targetLanguages) {
    for (const textItem of textsToTranslate) {
      const { error } = await supabase
        .from('translation_jobs')
        .insert({
          content_type: 'product',
          content_id: `${productId}:${textItem.field}`,
          source_language: 'pl',
          target_language: lang,
          source_content: textItem.content,
          status: 'pending'
        });

      if (error) {
        console.error(`Error scheduling translation for ${productId}:${textItem.field} to ${lang}:`, error);
      }
    }
  }
}

async function scheduleExistingProductsTranslations() {
  console.log('Scheduling translations for existing products...');
  
  // Pobierz wszystkie produkty z Supabase
  const { data: products, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    console.error('Error fetching products:', error);
    return { success: false, error: error.message };
  }

  if (!products || products.length === 0) {
    console.log('No products found in database');
    return { success: true, message: 'No products to translate' };
  }

  let scheduledCount = 0;

  for (const product of products) {
    try {
      await scheduleProductTranslations(product.id, {
        model: product.name,
        shortDescription: product.short_description,
        specs: {
          additionalDescription: product.detailed_description
        }
      });
      scheduledCount++;
    } catch (error) {
      console.error(`Error scheduling translations for product ${product.id}:`, error);
    }
  }

  console.log(`Scheduled translations for ${scheduledCount} products`);
  return { success: true, scheduled_products: scheduledCount };
}

async function scheduleFAQTranslations() {
  console.log('Scheduling FAQ translations...');
  
  const faqItems = [
    { question: 'Czy model Toyota SWE 200d może bezpiecznie poruszać się po nawierzchni z kostki brukowej?', answer: 'Tak, model nadaje się do jazdy po kostce.' },
    { question: 'Czy model SWE 200d może być użytkowany na powierzchniach kamienistych?', answer: 'Nie, nie jest przystosowany do jazdy po kamieniach.' },
    { question: 'Czy wózek SWE 200d umożliwia rozładunek palet z naczepy TIR?', answer: 'Tak, umożliwia rozładunek z TIRa.' },
    { question: 'Czy paleciak może wjechać do komory chłodniczej?', answer: 'Tak, może wjechać.' },
    { question: 'Czy wózek może pracować w chłodni przez dłuższy czas?', answer: 'Tak, jeśli zastosowano odpowiedni olej hydrauliczny.' },
    { question: 'Czy SWE 200d przejedzie przez bramę o wysokości 1,90 m?', answer: 'Tak, jego wysokość całkowita to 1,54 m.' },
    { question: 'Czy wymagane jest oddzielne pomieszczenie do ładowania pojedynczego wózka?', answer: 'Nie, nie jest wymagane.' },
    { question: 'Czy do obsługi tego wózka potrzebne są uprawnienia?', answer: 'Tak, wymagane są uprawnienia UDT.' },
    { question: 'Czy wózek z masztem musi przechodzić obowiązkowy przegląd UDT?', answer: 'Tak, wymagany jest ważny przegląd.' },
    { question: 'Na jak długo UDT wydaje decyzję eksploatacyjną dla wózka?', answer: 'Bez podestu – 24 miesiące, z podestem – 12 miesięcy.' },
    { question: 'Czy używane wózki są objęte gwarancją?', answer: 'Tak, gwarancja wynosi 3 miesiące.' },
    { question: 'W jaki sposób należy ładować akumulator wózka?', answer: 'Za pomocą dołączonego prostownika.' },
    { question: 'Czy możliwe jest przetestowanie wózka przed zakupem?', answer: 'Tak, można obejrzeć i przetestować wózek.' },
    { question: 'Jakie są dostępne formy dostawy wózka?', answer: 'Możliwy odbiór osobisty lub wysyłka kurierska.' },
    { question: 'Czy oferowane wózki używane przechodzą przegląd techniczny?', answer: 'Tak, każdy wózek jest sprawdzany technicznie.' },
    { question: 'Jak sprawdzany jest stan baterii w wózku elektrycznym?', answer: 'Poprzez diagnostykę, testy i pomiar parametrów elektrolitu.' },
    { question: 'Czy oferujecie serwis wózków po zakończeniu gwarancji?', answer: 'Tak, świadczymy serwis pogwarancyjny.' },
    { question: 'Czy posiadacie autoryzację do konserwacji wózków widłowych?', answer: 'Tak, posiadamy odpowiednie uprawnienia.' },
    { question: "Na czym polega funkcja 'creep to creep'?", answer: 'Funkcja umożliwia precyzyjne manewrowanie z niską prędkością.' },
    { question: 'Co oznacza kod błędu 2.001?', answer: 'Kod oznacza, że jest wciśnięty przycisk „grzybek" bezpieczeństwa.' },
    { question: 'Co oznacza kod błędu E50?', answer: 'Kod oznacza, że jest wciśnięty przycisk „grzybek" bezpieczeństwa.' },
    { question: 'W jakim stanie są koła i rolki w oferowanych wózkach?', answer: 'Są nowe lub mają niewielki stopień zużycia.' },
    { question: 'Jakie materiały są stosowane w kołach wózków?', answer: 'Najczęściej poliuretan – cichy, trwały, nie zostawia śladów.' },
    { question: 'Dlaczego paleciak nie podnosi ładunku i co zrobić?', answer: 'Sprawdź poziom baterii, wagę ładunku i skontaktuj się z serwisem.' },
    { question: 'W jakich warunkach najlepiej sprawdzą się wózki BT SWE?', answer: 'Wewnątrz i na zewnątrz, na równych powierzchniach, do załadunku/rozładunku.' },
    { question: 'Jak dobrać długość wideł do europalet?', answer: 'Standardowa długość 1150 mm pasuje do europalet.' },
    { question: 'Jak długo ładuje się bateria wózka?', answer: 'Pełne ładowanie trwa 6–8 godzin w zależności od modelu.' },
    { question: 'Na czym polega kompleksowe sprawdzenie baterii?', answer: 'Obejmuje testy obciążeniowe i kontrolę stanu elektrolitu.' },
    { question: 'Jak przebiega proces regeneracji baterii?', answer: 'Diagnostyka, czyszczenie, wymiany, testy wydajnościowe.' },
    { question: 'Czy oferujecie możliwość leasingu wózków?', answer: 'Tak, umożliwiamy leasing na atrakcyjnych warunkach.' },
    { question: 'Czy zapewniacie transport zakupionych wózków?', answer: 'Tak, dostarczamy wózek bezpiecznie pod wskazany adres.' },
    { question: 'Jak można sprawdzić stan używanego wózka?', answer: 'Każdy paleciak ma przegląd, zapraszamy na jazdę próbną.' },
    { question: 'Jakie modele Toyota BT posiadacie w ofercie?', answer: 'SWE120L, SWE140L, SWE200D – wersje z podestem i bez.' },
    { question: 'Jak bezpiecznie ładować baterię wózka?', answer: 'Zaparkować, wyłączyć, wentylować, stosować środki ochrony.' },
    { question: 'Co się dzieje przy niskim poziomie baterii?', answer: 'Włącza się sygnał ostrzegawczy, podnoszenie zostaje zablokowane.' }
  ];

  const targetLanguages = ['en', 'cs', 'sk', 'de'];
  let scheduledCount = 0;

  for (let i = 0; i < faqItems.length; i++) {
    const item = faqItems[i];
    
    for (const lang of targetLanguages) {
      // Schedule question translation
      const { error: questionError } = await supabase
        .from('translation_jobs')
        .insert({
          content_type: 'faq',
          content_id: `faq_${i}_question`,
          source_language: 'pl',
          target_language: lang,
          source_content: item.question,
          status: 'pending'
        });

      if (questionError) {
        console.error(`Error scheduling FAQ question ${i} translation to ${lang}:`, questionError);
        continue;
      }

      // Schedule answer translation
      const { error: answerError } = await supabase
        .from('translation_jobs')
        .insert({
          content_type: 'faq',
          content_id: `faq_${i}_answer`,
          source_language: 'pl',
          target_language: lang,
          source_content: item.answer,
          status: 'pending'
        });

      if (answerError) {
        console.error(`Error scheduling FAQ answer ${i} translation to ${lang}:`, answerError);
        continue;
      }

      scheduledCount += 2; // question + answer
    }
  }

  console.log(`Scheduled ${scheduledCount} FAQ translations`);
  return { success: true, scheduled_faq_items: scheduledCount };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    
    switch (action) {
      case 'schedule_new_product': {
        const { product_id, product_content } = params;
        
        console.log(`Scheduling translations for new product: ${product_id}`);
        await scheduleProductTranslations(product_id, product_content);
        
        return new Response(JSON.stringify({ 
          success: true,
          message: `Translations scheduled for product ${product_id}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'schedule_existing_products': {
        const result = await scheduleExistingProductsTranslations();
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'schedule_faq': {
        const result = await scheduleFAQTranslations();
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'initial_setup': {
        console.log('Running initial setup: scheduling all existing content for translation...');
        
        // Schedule FAQ translations
        const faqResult = await scheduleFAQTranslations();
        
        // Schedule existing products translations
        const productsResult = await scheduleExistingProductsTranslations();
        
        return new Response(JSON.stringify({
          success: true,
          faq_result: faqResult,
          products_result: productsResult,
          message: 'Initial translation scheduling completed'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in schedule-translations function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
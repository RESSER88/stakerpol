import { supabase } from '@/integrations/supabase/client';
import { faqTranslations } from '@/utils/translations/faq';

interface FAQMigrationData {
  language: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

export const migrateFAQData = async () => {
  console.log('Starting FAQ migration...');
  
  const languages = ['pl', 'en', 'de', 'cs', 'sk'];
  const faqsToInsert: FAQMigrationData[] = [];
  
  // Extract FAQ data from translations
  for (let i = 1; i <= 35; i++) {
    for (const language of languages) {
      const questionKey = `faq_${i}_question` as keyof typeof faqTranslations;
      const answerKey = `faq_${i}_answer` as keyof typeof faqTranslations;
      
      const questionTranslation = faqTranslations[questionKey];
      const answerTranslation = faqTranslations[answerKey];
      
      if (questionTranslation && answerTranslation) {
        const question = questionTranslation[language as keyof typeof questionTranslation];
        const answer = answerTranslation[language as keyof typeof answerTranslation];
        
        if (question && answer) {
          faqsToInsert.push({
            language,
            question,
            answer,
            display_order: i,
            is_active: true,
          });
        }
      }
    }
  }
  
  console.log(`Prepared ${faqsToInsert.length} FAQ entries for migration`);
  
  // Clear existing FAQs
  const { error: deleteError } = await supabase
    .from('faqs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (deleteError) {
    console.error('Error clearing existing FAQs:', deleteError);
    throw deleteError;
  }
  
  // Insert new FAQs in batches
  const batchSize = 50;
  for (let i = 0; i < faqsToInsert.length; i += batchSize) {
    const batch = faqsToInsert.slice(i, i + batchSize);
    
    const { error: insertError } = await supabase
      .from('faqs')
      .insert(batch as any);
    
    if (insertError) {
      console.error('Error inserting FAQ batch:', insertError);
      throw insertError;
    }
    
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(faqsToInsert.length / batchSize)}`);
  }
  
  console.log('FAQ migration completed successfully!');
  return faqsToInsert.length;
};

export const runFAQMigration = async () => {
  try {
    const count = await migrateFAQData();
    return { success: true, count };
  } catch (error) {
    console.error('FAQ migration failed:', error);
    return { success: false, error };
  }
};
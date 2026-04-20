
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface AutoMigrationStats {
  totalImages: number;
  base64Images: number;
  storageImages: number;
  migrationCompleted: boolean;
}

export const useAutoImageMigration = (isAdmin: boolean, products: any[]) => {
  const [migrationStats, setMigrationStats] = useState<AutoMigrationStats>({
    totalImages: 0,
    base64Images: 0,
    storageImages: 0,
    migrationCompleted: false
  });
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!products || products.length === 0) return;

    let base64Count = 0;
    let storageCount = 0;
    let totalCount = 0;

    products.forEach(product => {
      if (product.images) {
        product.images.forEach((img: string) => {
          totalCount++;
          if (img.startsWith('data:')) {
            base64Count++;
          } else if (img.includes('supabase.co/storage')) {
            storageCount++;
          }
        });
      }
    });

    setMigrationStats({
      totalImages: totalCount,
      base64Images: base64Count,
      storageImages: storageCount,
      migrationCompleted: base64Count === 0 && totalCount > 0
    });

    // Auto-start migration if needed
    if (isAdmin && base64Count > 0 && !isMigrating) {
      startAutoMigration(base64Count);
    }
  }, [products, isAdmin, isMigrating]);

  const startAutoMigration = async (imageCount: number) => {
    if (isMigrating) return;
    
    setIsMigrating(true);
    
    toast({
      title: "🚀 Automatyczna migracja rozpoczęta",
      description: `Migracja ${imageCount} obrazów do Supabase Storage...`,
      duration: 5000
    });

    try {
      logger.log('🔄 Auto-migration starting...');
      
      // Ensure bucket exists
      const { error: bucketError } = await supabase.storage.createBucket('product-images', { 
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (bucketError && !bucketError.message.includes('already exists')) {
        logger.warn('Bucket creation warning:', bucketError);
      }

      // Execute migration
      const { data, error } = await supabase.functions.invoke('migrate-images', {
        body: { autoMigration: true }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "✅ Migracja ukończona!",
          description: `Pomyślnie przeniesiono ${data.stats?.success || imageCount} obrazów. Strona będzie ładować się 50-80% szybciej!`,
          duration: 10000
        });

        setMigrationStats(prev => ({
          ...prev,
          base64Images: 0,
          storageImages: prev.storageImages + (data.stats?.success || 0),
          migrationCompleted: true
        }));

        // Refresh after successful migration
        setTimeout(() => window.location.reload(), 3000);
      } else {
        throw new Error(data?.error || 'Migration failed');
      }
    } catch (error: any) {
      logger.error('Auto-migration error:', error);
      toast({
        title: "⚠️ Błąd migracji",
        description: `Błąd: ${error.message}. Spróbuj ponownie w zakładce "Migracja zdjęć".`,
        variant: "destructive",
        duration: 8000
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return {
    migrationStats,
    isMigrating,
    startAutoMigration: () => startAutoMigration(migrationStats.base64Images)
  };
};

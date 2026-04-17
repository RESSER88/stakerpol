
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types';
import { useEffect } from 'react';
import { useProductTranslations } from './useProductTranslations';
import { 
  mapSupabaseProductToProduct,
  mapProductToSupabaseInsert,
  mapProductToSupabaseUpdate,
  SupabaseProduct,
  SupabaseProductImage
} from '@/types/supabase';

export const useSupabaseProducts = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { translateProductFields } = useProductTranslations();

  // Enhanced product fetching with better error handling
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['supabase-products'],
    queryFn: async () => {
      console.log('Fetching products from Supabase...');
      const startTime = performance.now();
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
        throw productsError;
      }

      const { data: imagesData, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (imagesError) {
        console.error('Error fetching images:', imagesError);
      }

      const mappedProducts = (productsData || []).map((product: SupabaseProduct) => {
        const productImages = (imagesData || []).filter(
          (img: SupabaseProductImage) => img.product_id === product.id
        );
        return mapSupabaseProductToProduct(product, productImages);
      });

      const endTime = performance.now();
      console.log(`Fetched ${mappedProducts.length} products in ${(endTime - startTime).toFixed(2)}ms`);
      
      return mappedProducts;
    },
    retry: 3,
    staleTime: 5 * 1000, // 5 seconds for admin panel
    gcTime: 10 * 60 * 1000, // 10 minutes in memory
    refetchOnWindowFocus: true,
  });

  // Enhanced realtime subscription
  useEffect(() => {
    console.log('Setting up admin realtime subscriptions...');
    
    const productsChannel = supabase
      .channel('admin-products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Admin products realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ['supabase-products'] });
          queryClient.invalidateQueries({ queryKey: ['public-products'] });
        }
      )
      .subscribe();

    const imagesChannel = supabase
      .channel('admin-product-images-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_images'
        },
        (payload) => {
          console.log('Admin product images realtime update:', payload);
          queryClient.invalidateQueries({ queryKey: ['supabase-products'] });
          queryClient.invalidateQueries({ queryKey: ['public-products'] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up admin realtime subscriptions...');
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(imagesChannel);
    };
  }, [queryClient]);

  const upsertBenefits = async (productId: string, benefits: any[] = []) => {
    if (!productId) return;
    await supabase.from('product_benefits' as any).delete().eq('product_id', productId);
    if (!benefits.length) return;
    const inserts = benefits.slice(0, 3).map((b: any, idx: number) => ({
      product_id: productId,
      icon_name: b.icon_name || 'check',
      title: b.title,
      description: b.description || null,
      sort_order: idx,
    }));
    const { error } = await supabase.from('product_benefits' as any).insert(inserts);
    if (error) console.error('Error saving benefits:', error);
  };

  // Enhanced add product mutation
  const addProductMutation = useMutation({
    mutationFn: async ({ product, images, benefits }: { product: any; images: string[]; benefits?: any[] }) => {
      console.log('=== ADDING PRODUCT TO DATABASE ===');
      console.log('Product data:', product);
      console.log('Images:', images);
      const startTime = performance.now();
      
      // Enhanced validation
      if (!product.model?.trim()) {
        throw new Error('Model produktu jest wymagany');
      }
      
      if (!product.specs?.serialNumber?.trim()) {
        throw new Error('Numer seryjny jest wymagany');
      }
      
      // Auth/session check to provide clearer errors before DB call
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Auth session retrieval error:', sessionError);
      }
      if (!session) {
        throw new Error('Brak aktywnej sesji. Zaloguj się jako administrator i spróbuj ponownie.');
      }
      console.log('Current auth user for addProduct:', session.user?.id);

      const supabaseProduct = mapProductToSupabaseInsert(product);
      console.log('Mapped to Supabase format:', supabaseProduct);
      
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([supabaseProduct])
        .select()
        .single();

      if (productError) {
        console.error('Error adding product:', productError);
        throw new Error(`Błąd dodawania produktu: ${productError.message}`);
      }

      console.log('Product added successfully:', newProduct);

      // Add images with better error handling
      if (images.length > 0 && newProduct) {
        const imageInserts = images.map((imageUrl, index) => ({
          product_id: newProduct.id,
          image_url: imageUrl,
          display_order: index + 1,
          alt_text: `${product.model} - zdjęcie ${index + 1}`
        }));

        console.log('Adding images:', imageInserts);
        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageInserts);

        if (imagesError) {
          console.error('Error adding images:', imagesError);
          // Don't throw here, product was created successfully
        } else {
          console.log('Images added successfully');
        }
      }

      // Trigger automatic translation in background (only if DeepL enabled)
      if (newProduct) {
        await upsertBenefits(newProduct.id, benefits || []);
        const { FEATURES } = await import('@/config/featureFlags');
        if (FEATURES.DEEPL_ENABLED) {
          translateProductFields(newProduct.id, product);
        }
      }

      const endTime = performance.now();
      console.log(`=== PRODUCT ADDED in ${(endTime - startTime).toFixed(2)}ms ===`);
      
      return newProduct;
    },
    onSuccess: () => {
      // Force immediate refresh of both admin and public queries
      queryClient.invalidateQueries({ queryKey: ['supabase-products'] });
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
      
      toast({
        title: "✅ Produkt dodany pomyślnie",
        description: "Nowy produkt został zapisany w bazie danych i będzie widoczny na stronie w ciągu kilku sekund.",
        duration: 5000
      });
    },
    onError: (error: any) => {
      console.error('Add product error:', error);
      let description = error?.message || "Nie udało się dodać produktu do bazy danych";

      const rawMsg = (error?.message || "").toLowerCase();
      if (error?.name === 'TypeError' && /failed to fetch|networkerror/i.test(error?.message)) {
        description = "Błąd sieci/CORS. Dodaj domenę aplikacji do Allowed CORS Origins w Supabase (Project Settings → API).";
      } else if (/row level security|rls|permission denied|not authorized|policy/.test(rawMsg)) {
        description = "Brak uprawnień (RLS). Upewnij się, że zalogowany użytkownik ma rolę admin oraz istnieją polityki INSERT dla tabel products i product_images.";
      } else if (/jwt|token|session/.test(rawMsg)) {
        description = "Sesja wygasła lub brak autoryzacji. Zaloguj się ponownie w panelu administratora.";
      }

      toast({
        title: "❌ Błąd dodawania produktu",
        description,
        variant: "destructive",
        duration: 7000
      });
    }
  });

  // Enhanced update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ product, images, benefits }: { product: any; images: string[]; benefits?: any[] }) => {
      console.log('=== UPDATING PRODUCT IN DATABASE ===');
      console.log('Product ID:', product.id);
      console.log('Product data:', product);
      console.log('Images:', images);
      const startTime = performance.now();
      
      if (!product.id) {
        throw new Error('ID produktu jest wymagane do aktualizacji');
      }
      
      if (!product.model?.trim()) {
        throw new Error('Model produktu jest wymagany');
      }
      
      const supabaseProduct = mapProductToSupabaseUpdate(product);
      console.log('Mapped for update:', supabaseProduct);
      
      const { data: updatedProduct, error: productError } = await supabase
        .from('products')
        .update(supabaseProduct)
        .eq('id', product.id)
        .select()
        .single();

      if (productError) {
        console.error('Error updating product:', productError);
        throw new Error(`Błąd aktualizacji produktu: ${productError.message}`);
      }

      console.log('Product updated successfully:', updatedProduct);

      // Update images - delete old and add new
      const { error: deleteImagesError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', product.id);

      if (deleteImagesError) {
        console.error('Error deleting old images:', deleteImagesError);
      }

      if (images.length > 0) {
        const imageInserts = images.map((imageUrl, index) => ({
          product_id: product.id,
          image_url: imageUrl,
          display_order: index + 1,
          alt_text: `${product.model} - zdjęcie ${index + 1}`
        }));

        console.log('Updating images:', imageInserts);
        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(imageInserts);

        if (imagesError) {
          console.error('Error adding new images:', imagesError);
        } else {
          console.log('Images updated successfully');
        }
      }

      // Trigger automatic translation in background (only if DeepL enabled)
      const { FEATURES } = await import('@/config/featureFlags');
      if (FEATURES.DEEPL_ENABLED) {
        translateProductFields(product.id, product);
      }

      const endTime = performance.now();
      console.log(`=== PRODUCT UPDATED in ${(endTime - startTime).toFixed(2)}ms ===`);
      
      return updatedProduct;
    },
    onSuccess: () => {
      // Force immediate refresh of both admin and public queries
      queryClient.invalidateQueries({ queryKey: ['supabase-products'] });
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
      
      toast({
        title: "✅ Produkt zaktualizowany pomyślnie",
        description: "Zmiany zostały zapisane w bazie danych i będą widoczne na stronie w ciągu kilku sekund.",
        duration: 5000
      });
    },
    onError: (error: any) => {
      console.error('Update product error:', error);
      toast({
        title: "❌ Błąd aktualizacji produktu",
        description: error.message || "Nie udało się zaktualizować produktu",
        variant: "destructive",
        duration: 7000
      });
    }
  });

  // Enhanced delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      console.log('=== DELETING PRODUCT FROM DATABASE ===');
      console.log('Product ID:', productId);
      const startTime = performance.now();
      
      if (!productId) {
        throw new Error('ID produktu jest wymagane do usunięcia');
      }
      
      // First delete images (foreign key constraint)
      const { error: imagesError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId);

      if (imagesError) {
        console.error('Error deleting product images:', imagesError);
      }
      
      // Then delete product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        throw new Error(`Błąd usuwania produktu: ${error.message}`);
      }

      const endTime = performance.now();
      console.log(`=== PRODUCT DELETED in ${(endTime - startTime).toFixed(2)}ms ===`);
    },
    onSuccess: () => {
      // Force immediate refresh of both admin and public queries
      queryClient.invalidateQueries({ queryKey: ['supabase-products'] });
      queryClient.invalidateQueries({ queryKey: ['public-products'] });
      
      toast({
        title: "✅ Produkt usunięty pomyślnie",
        description: "Produkt został usunięty z bazy danych i zniknie ze strony w ciągu kilku sekund.",
        duration: 5000
      });
    },
    onError: (error: any) => {
      console.error('Delete product error:', error);
      toast({
        title: "❌ Błąd usuwania produktu",
        description: error.message || "Nie udało się usunąć produktu",
        variant: "destructive",
        duration: 7000
      });
    }
  });

  return {
    products,
    isLoading,
    error,
    addProduct: (product: any, images: string[] = []) => 
      addProductMutation.mutate({ product, images }),
    updateProduct: (product: any, images: string[] = []) => 
      updateProductMutation.mutate({ product, images }),
    deleteProduct: (productId: string) => 
      deleteProductMutation.mutate(productId),
    isAddingProduct: addProductMutation.isPending,
    isUpdatingProduct: updateProductMutation.isPending,
    isDeletingProduct: deleteProductMutation.isPending
  };
};

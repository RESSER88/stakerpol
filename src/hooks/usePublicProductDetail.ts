import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapSupabaseProductToProduct, SupabaseProductImage } from '@/types/supabase';
import { logger } from '@/utils/logger';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const mapRow = (row: any) => {
  const { product_images, ...product } = row;
  const images = ((product_images || []) as SupabaseProductImage[])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  return mapSupabaseProductToProduct(product, images);
};

/**
 * Fetches a single public product by slug (or legacy id) together with its images.
 * Query keys are prefixed with 'public-products' so existing admin invalidations still apply.
 */
export const usePublicProductDetail = (slugOrId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['public-products', 'detail', slugOrId],
    enabled: !!slugOrId,
    queryFn: async () => {
      let q = supabase.from('products').select('*, product_images(*)');
      q = UUID_RE.test(slugOrId!)
        ? q.or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
        : q.eq('slug', slugOrId!);
      const { data, error } = await q.limit(1).maybeSingle();
      if (error) {
        logger.error('Error fetching product:', error);
        throw error;
      }
      return data ? mapRow(data) : null;
    },
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const productId = query.data?.id;

  // Live sync with admin changes, scoped to this product only
  useEffect(() => {
    if (!productId) return;
    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ['public-products', 'detail', slugOrId] });
    const channel = supabase
      .channel(`public-product-${productId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `id=eq.${productId}` }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images', filter: `product_id=eq.${productId}` }, invalidate)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, slugOrId, queryClient]);

  return { product: query.data ?? null, isLoading: query.isLoading };
};

/** Related products: same selection as before (newest 4 excluding current), fetched in one small query. */
export const usePublicRelatedProducts = (currentProductId: string | undefined) => {
  const { data = [] } = useQuery({
    queryKey: ['public-products', 'related', currentProductId],
    enabled: !!currentProductId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*)')
        .neq('id', currentProductId!)
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data || []).map(mapRow);
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  return data;
};

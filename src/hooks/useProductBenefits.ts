import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductBenefit {
  id: string;
  product_id: string;
  icon_name: string;
  title: string;
  description: string | null;
  sort_order: number;
}

export const useProductBenefits = (productId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: benefits = [], isLoading } = useQuery({
    queryKey: ['product-benefits', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('product_benefits' as any)
        .select('*')
        .eq('product_id', productId)
        .order('sort_order', { ascending: true });
      if (error) {
        console.error('Error fetching product benefits:', error);
        return [];
      }
      return (data || []) as unknown as ProductBenefit[];
    },
    enabled: !!productId,
    staleTime: 30 * 1000,
  });

  const replaceBenefits = useMutation({
    mutationFn: async ({ pid, items }: { pid: string; items: Array<Omit<ProductBenefit, 'id' | 'product_id'>> }) => {
      // Delete existing
      const { error: delErr } = await supabase
        .from('product_benefits' as any)
        .delete()
        .eq('product_id', pid);
      if (delErr) throw delErr;
      if (items.length === 0) return [];
      const inserts = items.slice(0, 3).map((b, idx) => ({
        product_id: pid,
        icon_name: b.icon_name || 'check',
        title: b.title,
        description: b.description || null,
        sort_order: idx,
      }));
      const { data, error } = await supabase
        .from('product_benefits' as any)
        .insert(inserts)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['product-benefits', vars.pid] });
    },
  });

  return { benefits, isLoading, replaceBenefits: replaceBenefits.mutateAsync };
};

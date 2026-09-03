import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Liczba nieobsłużonych zapytań (leads.status = 'new').
 * Wyłącznie odczyt — jedno lekkie zapytanie count przy montowaniu.
 */
export const useNewLeadsCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { count: c } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new');
      if (!active) return;
      setCount(c ?? 0);
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return { count, loading };
};

export default useNewLeadsCount;

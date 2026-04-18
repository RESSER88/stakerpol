import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaqRow {
  id: string;
  question: string;
}

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  max?: number;
}

const FaqMultiSelect = ({ selectedIds, onChange, max = 4 }: Props) => {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('faqs')
        .select('id, question')
        .eq('language', 'pl')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      setFaqs((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      if (selectedIds.length >= max) return;
      onChange([...selectedIds, id]);
    }
  };

  if (loading) {
    return <p className="text-xs text-editorial-muted italic">Ładowanie FAQ…</p>;
  }

  if (faqs.length === 0) {
    return (
      <p className="text-xs text-editorial-muted italic">
        Brak FAQ w bazie. Dodaj je w sekcji FAQ.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted">
          Wybrane: {selectedIds.length} / {max}
        </span>
      </div>
      <ul className="border border-editorial-line divide-y divide-editorial-line max-h-72 overflow-y-auto">
        {faqs.map((f) => {
          const checked = selectedIds.includes(f.id);
          const disabled = !checked && selectedIds.length >= max;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => toggle(f.id)}
                disabled={disabled}
                className={cn(
                  'w-full text-left px-3 py-2.5 flex items-start gap-2 text-sm transition-colors',
                  checked
                    ? 'bg-editorial-ink/5 text-editorial-ink'
                    : 'hover:bg-editorial-line/30 text-editorial-ink',
                  disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 h-4 w-4 border flex items-center justify-center shrink-0',
                    checked
                      ? 'bg-editorial-ink border-editorial-ink'
                      : 'border-editorial-line bg-editorial-bg'
                  )}
                >
                  {checked && <Check className="h-3 w-3 text-editorial-bg" />}
                </span>
                <span className="leading-snug">{f.question}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default FaqMultiSelect;

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductRow {
  id: string;
  name: string;
  slug: string | null;
  serial_number: string | null;
  availability_status: string;
}

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
  maxItems?: number;
}

const ProductMultiSelect = ({ value, onChange, maxItems = 3 }: Props) => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, serial_number, availability_status')
        .order('name', { ascending: true });
      setProducts((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string, ProductRow>();
    products.forEach((p) => m.set(p.id, p));
    return m;
  }, [products]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return products.slice(0, 50);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.serial_number || '').toLowerCase().includes(s)
      )
      .slice(0, 50);
  }, [products, search]);

  const atLimit = value.length >= maxItems;

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      if (atLimit) return;
      onChange([...value, id]);
    }
  };

  if (loading) {
    return <p className="text-xs text-editorial-muted italic">Ładowanie produktów…</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted">
          Wybrane: {value.length} / {maxItems}
        </span>
        {atLimit && (
          <span className="text-[10px] text-editorial-accent italic">
            Osiągnięto limit
          </span>
        )}
      </div>

      {/* Selected badges */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const p = byId.get(id);
            if (!p) {
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] border border-editorial-line bg-editorial-line/20 text-editorial-muted"
                >
                  (nieznany produkt)
                  <button type="button" onClick={() => toggle(id)} className="hover:text-editorial-bad">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            }
            const sold = p.availability_status !== 'available';
            return (
              <span
                key={id}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-1 text-[11px] border',
                  sold
                    ? 'border-editorial-line bg-editorial-line/30 text-editorial-muted'
                    : 'border-editorial-ink bg-editorial-ink/5 text-editorial-ink'
                )}
              >
                <span>{p.name}</span>
                {sold && <span className="italic">(sprzedany)</span>}
                <button type="button" onClick={() => toggle(id)} className="hover:text-editorial-bad">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-editorial-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Szukaj po nazwie lub numerze seryjnym…"
          className="w-full bg-editorial-line/20 border border-editorial-line pl-7 pr-3 py-2 text-sm text-editorial-ink placeholder:text-editorial-muted/50 focus:outline-none focus:border-editorial-ink"
        />
      </div>

      {open && (
        <ul className="border border-editorial-line divide-y divide-editorial-line max-h-60 overflow-y-auto">
          {filtered.length === 0 && (
            <li className="px-3 py-3 text-xs text-editorial-muted italic">Brak wyników</li>
          )}
          {filtered.map((p) => {
            const checked = value.includes(p.id);
            const sold = p.availability_status !== 'available';
            const disabled = !checked && atLimit;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  disabled={disabled}
                  className={cn(
                    'w-full text-left px-3 py-2 flex items-start gap-2 text-sm transition-colors',
                    checked ? 'bg-editorial-ink/5' : 'hover:bg-editorial-line/30',
                    disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 h-4 w-4 border flex items-center justify-center shrink-0',
                      checked ? 'bg-editorial-ink border-editorial-ink' : 'border-editorial-line bg-editorial-bg'
                    )}
                  >
                    {checked && <Check className="h-3 w-3 text-editorial-bg" />}
                  </span>
                  <span className="flex-1 leading-snug">
                    <span className="text-editorial-ink">{p.name}</span>
                    {p.serial_number && (
                      <span className="text-editorial-muted"> · {p.serial_number}</span>
                    )}
                    {sold && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-editorial-accent">
                        sprzedany
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ProductMultiSelect;

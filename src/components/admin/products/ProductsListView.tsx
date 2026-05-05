import { useMemo, useState } from 'react';
import { Product } from '@/types';
import { Search, Plus, Download, RefreshCw, ArrowUp, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import StatusDot from '../editorial/StatusDot';
import PDFQuoteGenerator from '../PDFQuoteGenerator';

interface Props {
  products: Product[];
  onEdit: (p: Product) => void;
  onCopy: (p: Product) => void;
  onDelete: (p: Product) => void;
  onAdd: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

type StatusFilter = 'all' | 'available' | 'sold';

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Wszystkie' },
  { key: 'available', label: 'Dostępne' },
  { key: 'sold', label: 'Sprzedane' },
];

const ProductsListView = ({
  products, onEdit, onCopy, onDelete, onAdd, onExport, onRefresh, refreshing,
}: Props) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filter !== 'all' && (p.availabilityStatus || 'available') !== filter) return false;
      if (!q) return true;
      return (
        p.model.toLowerCase().includes(q) ||
        (p.shortDescription || '').toLowerCase().includes(q) ||
        (p.specs.serialNumber || '').toLowerCase().includes(q)
      );
    });
  }, [products, search, filter]);

  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <header className="mb-6">
        <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-editorial-muted mb-2">
          {filtered.length} {filtered.length === 1 ? 'pozycja' : filtered.length < 5 ? 'pozycje' : 'pozycji'}
        </p>
        <h1 className="font-editorial text-3xl lg:text-4xl text-editorial-ink">Katalog</h1>
        <div className="mt-6 border-b border-editorial-line" />
      </header>

      {/* Toolbar: filters + search + actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'px-3 h-8 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors',
                filter === f.key
                  ? 'bg-editorial-ink text-white'
                  : 'text-editorial-muted hover:text-editorial-ink'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-editorial-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj…"
            className="w-full h-8 pl-7 pr-3 border-b border-editorial-line bg-transparent text-sm text-editorial-ink placeholder:text-editorial-muted focus:outline-none focus:border-editorial-ink"
          />
        </div>
        <div className="hidden lg:flex items-center gap-1">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="px-3 h-8 text-[11px] font-bold tracking-[0.15em] uppercase text-editorial-muted hover:text-editorial-ink transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
              Odśwież
            </button>
          )}
          {onExport && (
            <button
              onClick={onExport}
              className="px-3 h-8 text-[11px] font-bold tracking-[0.15em] uppercase text-editorial-muted hover:text-editorial-ink transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="h-3 w-3" />
              Eksport
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-center py-16 text-sm text-editorial-muted font-editorial italic">
          Brak produktów
        </p>
      ) : (
        <ul className="border-t border-editorial-line">
          {filtered.map((p, idx) => {
            const num = String(idx + 1).padStart(2, '0');
            const anyP = p as any;
            const currency = anyP.priceCurrency || 'PLN';
            const priceLabel =
              anyP.priceDisplayMode === 'show_price' && Number(anyP.netPrice) > 0
                ? new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(Number(anyP.netPrice)) + ' ' + currency
                : '— ' + currency;
            const meta: string[] = [];
            if (p.specs.serialNumber) meta.push(`#${p.specs.serialNumber}`);
            if (p.specs.productionYear) meta.push(p.specs.productionYear);
            if (p.specs.workingHours) meta.push(`${p.specs.workingHours} mh`);
            if (p.specs.mastLiftingCapacity || p.specs.capacity)
              meta.push(`${p.specs.mastLiftingCapacity || p.specs.capacity} kg`);
            if (p.specs.liftHeight) meta.push(`${p.specs.liftHeight} mm`);
            meta.push(priceLabel);

            return (
              <li key={p.id} className="border-b border-editorial-line group/row relative">
                <button
                  onClick={() => onEdit(p)}
                  className="w-full flex items-start gap-4 py-4 pr-24 md:pr-28 text-left group"
                >
                  <span className="flex items-center gap-1.5 w-auto pt-1 shrink-0">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-editorial-accent">
                      {num}
                    </span>
                    <StatusDot status={p.availabilityStatus} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.isFeatured && (
                        <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-editorial-accent">
                          ★ Polecany
                        </span>
                      )}
                      <span className="font-editorial text-[15px] text-editorial-ink group-hover:text-editorial-accent transition-colors">
                        {p.model}
                      </span>
                    </div>
                    <div className="text-[10px] md:text-[11px] text-editorial-muted mt-1 leading-relaxed">
                      {meta.join(' · ') || '—'}
                    </div>
                  </div>
                </button>

                {/* Actions cluster — right side */}
                <div className="absolute top-1/2 -translate-y-1/2 right-1 md:right-2 flex items-center gap-0 md:gap-0.5">
                  <div
                    className={cn(
                      'flex items-center gap-0 md:gap-0.5 transition-opacity',
                      'opacity-100 md:opacity-0 md:group-hover/row:opacity-100 md:focus-within:opacity-100'
                    )}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <PDFQuoteGenerator product={p} />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onCopy(p); }}
                      className="h-10 w-10 md:h-8 md:w-8 inline-flex items-center justify-center text-editorial-muted hover:text-editorial-ink hover:bg-editorial-line/40 transition-colors rounded-sm"
                      title="Duplikuj"
                      aria-label="Duplikuj"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onDelete(p); }}
                      className="h-10 w-10 md:h-8 md:w-8 inline-flex items-center justify-center text-editorial-bad hover:bg-editorial-bad/10 transition-colors rounded-sm"
                      title="Usuń"
                      aria-label="Usuń"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 text-[11px] text-editorial-muted text-center">
        Wyświetlono {filtered.length} z {products.length}
      </div>

      {/* Sticky add button */}
      <button
        onClick={onAdd}
        className="fixed lg:sticky bottom-16 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-auto lg:mt-6 lg:max-w-xs lg:mx-auto lg:flex z-30 inline-flex items-center justify-center gap-2 h-11 border border-editorial-ink bg-white/95 backdrop-blur text-editorial-ink hover:bg-editorial-ink hover:text-white text-[11px] font-bold tracking-[0.2em] uppercase transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Dodaj produkt
      </button>
    </div>
  );
};

export default ProductsListView;

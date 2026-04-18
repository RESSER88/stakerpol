import { useMemo, useState } from 'react';
import { Product } from '@/types';
import { Search, Plus, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCardMobile from './ProductCardMobile';
import ProductsTableDesktop from './ProductsTableDesktop';

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
  { key: 'available', label: 'Dostępny' },
  { key: 'sold', label: 'Sprzedany' },
];

const ProductsListView = ({
  products, onEdit, onCopy, onDelete, onAdd, onExport, onRefresh, refreshing
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
        p.shortDescription.toLowerCase().includes(q) ||
        (p.specs.serialNumber || '').toLowerCase().includes(q)
      );
    });
  }, [products, search, filter]);

  return (
    <div className="space-y-4 pb-24 lg:pb-0">
      {/* Toolbar — desktop */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj po modelu, nr seryjnym..."
              className="w-full h-10 pl-10 pr-3 rounded-lg border border-admin-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-admin-orange/30 focus:border-admin-orange"
            />
          </div>
          <div className="flex gap-1 bg-white border border-admin-border rounded-lg p-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 h-8 rounded-md text-xs font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-admin-orange text-white'
                    : 'text-admin-muted hover:text-admin-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Odśwież
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-1.5" />
              Eksport
            </Button>
          )}
          <Button size="sm" onClick={onAdd} className="bg-admin-orange hover:bg-admin-orange/90 text-white">
            <Plus className="h-4 w-4 mr-1.5" />
            Dodaj produkt
          </Button>
        </div>
      </div>

      {/* Toolbar — mobile */}
      <div className="lg:hidden space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj produktów..."
            className="w-full h-11 pl-10 pr-3 rounded-xl border border-admin-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-admin-orange/30 focus:border-admin-orange"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3 h-8 rounded-full text-xs font-medium border transition-colors ${
                filter === f.key
                  ? 'bg-admin-orange border-admin-orange text-white'
                  : 'bg-white border-admin-border text-admin-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <ProductsTableDesktop
          products={filtered}
          onEdit={onEdit}
          onCopy={onCopy}
          onDelete={onDelete}
        />
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-admin-muted text-sm bg-white rounded-xl border border-admin-border">
            Brak produktów
          </div>
        ) : (
          filtered.map((p) => (
            <ProductCardMobile
              key={p.id}
              product={p}
              onEdit={onEdit}
              onCopy={onCopy}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      <div className="text-xs text-admin-muted text-center">
        Wyświetlono {filtered.length} z {products.length} produktów
      </div>

      {/* Mobile sticky FAB */}
      <button
        onClick={onAdd}
        className="lg:hidden fixed bottom-20 right-4 z-30 h-14 px-5 rounded-full bg-admin-orange text-white font-semibold shadow-lg shadow-admin-orange/30 inline-flex items-center gap-2 active:scale-95 transition-transform"
      >
        <Plus className="h-5 w-5" />
        Dodaj produkt
      </button>
    </div>
  );
};

export default ProductsListView;

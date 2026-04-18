import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Inbox, CheckCircle2, Plus, Download, List, HelpCircle, ArrowRight, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { AdminSection } from '../layout/types';
import type { Product } from '@/types';

interface Props {
  productCount: number;
  products: Product[];
  onNavigate: (section: AdminSection) => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
}

const DashboardSection = ({ productCount, products, onNavigate, onAddProduct, onEditProduct }: Props) => {
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new');
      setNewLeadsCount(count ?? 0);
      setLoading(false);
    };
    load();
  }, []);

  const availableCount = products.filter(p => {
    // Default: treat all as available unless we have explicit info
    return true;
  }).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Dzień dobry';
    if (h < 18) return 'Miłego dnia';
    return 'Dobry wieczór';
  })();

  // Last 2 edited products by updated_at
  const recentlyEdited = [...products]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 2);

  const stats = [
    { label: 'Produkty w katalogu', value: productCount, icon: Package, accent: 'text-admin-orange' },
    { label: 'Nowe zapytania', value: newLeadsCount, icon: Inbox, accent: 'text-admin-green' },
    { label: 'Dostępnych', value: availableCount, icon: CheckCircle2, accent: 'text-admin-orange' },
  ];

  const quickActions = [
    { label: 'Dodaj produkt', icon: Plus, onClick: onAddProduct },
    { label: 'Eksport magazynu', icon: Download, onClick: () => onNavigate('export') },
    { label: 'Lista produktów', icon: List, onClick: () => onNavigate('products') },
    { label: 'Zarządzaj FAQ', icon: HelpCircle, onClick: () => onNavigate('faq') },
  ];

  return (
    <div className="space-y-6">
      {/* Hero / greeting */}
      <div className="rounded-2xl bg-admin-dark p-6 lg:p-8 -mx-4 lg:mx-0 lg:rounded-2xl">
        <h1 className="text-xl lg:text-2xl font-bold text-white mb-1">{greeting} 👋</h1>
        <p className="text-sm text-white/60 mb-5">Oto co dzieje się dziś w Twoim panelu</p>

        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white/5 backdrop-blur rounded-xl p-3 lg:p-4 border border-white/10">
                <Icon className={`h-4 w-4 mb-2 ${s.accent}`} />
                <div className="text-xl lg:text-3xl font-bold text-white leading-tight">
                  {loading && s.label === 'Nowe zapytania' ? '…' : s.value}
                </div>
                <div className="text-[10px] lg:text-xs text-white/60 mt-1 leading-tight">{s.label}</div>
              </div>
            );
          })}
        </div>

        {newLeadsCount > 0 && (
          <button
            onClick={() => onNavigate('inquiries')}
            className="mt-4 w-full flex items-center justify-between gap-2 bg-admin-green/20 hover:bg-admin-green/30 border border-admin-green/40 rounded-xl px-4 py-3 transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Inbox className="h-4 w-4 text-admin-green shrink-0" />
              <span className="text-sm text-white font-medium truncate">
                Masz {newLeadsCount} {newLeadsCount === 1 ? 'nowe zapytanie' : 'nowych zapytań'}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-admin-green shrink-0" />
          </button>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-admin-text mb-3">Szybkie akcje</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={a.onClick}
                className="bg-white border border-admin-border rounded-xl p-4 flex flex-col items-start gap-2 hover:border-admin-orange hover:shadow-md transition-all text-left"
              >
                <div className="h-9 w-9 rounded-lg bg-admin-orange/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-admin-orange" />
                </div>
                <span className="text-sm font-medium text-admin-text">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recently edited */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-admin-text">Ostatnio edytowane</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('products')}>
            Wszystkie produkty <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        {recentlyEdited.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-admin-muted text-sm">Brak produktów</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {recentlyEdited.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-16 w-16 rounded-lg bg-admin-bg overflow-hidden shrink-0 flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt={p.model} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Package className="h-6 w-6 text-admin-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-admin-text truncate">{p.model}</div>
                    <div className="text-xs text-admin-muted">
                      {p.specs?.serialNumber || '—'} · {p.specs?.productionYear || '—'}
                    </div>
                    <div className="text-[10px] text-admin-muted mt-1">
                      Edytowano {new Date(p.updatedAt).toLocaleDateString('pl-PL')}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => onEditProduct(p)} aria-label="Edytuj">
                    <Pencil className="h-4 w-4 text-admin-orange" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSection;

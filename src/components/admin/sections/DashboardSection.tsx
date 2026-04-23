import { useEffect, useState } from 'react';
import { ArrowRight, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { AdminSection } from '../layout/types';
import type { Product } from '@/types';
import StatusDot from '../editorial/StatusDot';

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

  const availableCount = products.filter(
    (p) => (p.availabilityStatus || 'available') === 'available'
  ).length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return { pre: 'Dzień', accent: 'dobry.' };
    if (h < 18) return { pre: 'Miłego', accent: 'dnia.' };
    return { pre: 'Dobry', accent: 'wieczór.' };
  })();

  const today = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const recentlyEdited = [...products]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 2);

  const stats: { label: string; value: string | number; onClick?: () => void }[] = [
    { label: 'Produkty', value: productCount, onClick: () => onNavigate('products') },
    { label: 'Nowe zapytania', value: loading ? '…' : newLeadsCount, onClick: () => onNavigate('inquiries') },
    { label: 'Dostępnych', value: availableCount },
  ];

  const quickActions: { label: string; onClick: () => void }[] = [
    { label: 'Dodaj produkt', onClick: onAddProduct },
    { label: 'Eksport magazynu', onClick: () => onNavigate('export') },
    { label: 'Lista produktów', onClick: () => onNavigate('products') },
    { label: 'Zarządzaj FAQ', onClick: () => onNavigate('faq') },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      {/* Greeting */}
      <header>
        <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-editorial-muted mb-4">
          {today}
        </p>
        <h1 className="font-editorial text-4xl lg:text-5xl text-editorial-ink leading-tight">
          {greeting.pre}{' '}
          <em className="text-editorial-accent not-italic font-normal italic">
            {greeting.accent}
          </em>
        </h1>
        {newLeadsCount > 0 && (
          <button
            onClick={() => onNavigate('inquiries')}
            className="mt-6 inline-flex items-center gap-2 text-sm text-editorial-ink hover:text-editorial-accent transition-colors group"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-editorial-ok animate-pulse" />
            Masz {newLeadsCount} {newLeadsCount === 1 ? 'nowe zapytanie' : 'nowych zapytań'}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </button>
        )}
      </header>

      {/* Stats — vertical lines */}
      <section className="grid grid-cols-3 border-y border-editorial-line py-8">
        {stats.map((s, i) => {
          const wrapperClass = i > 0
            ? 'pl-4 lg:pl-8 border-l border-editorial-line'
            : 'pr-4 lg:pr-8';
          const content = (
            <>
              <div className={cn(
                'font-editorial text-3xl lg:text-4xl transition-colors',
                s.onClick ? 'text-editorial-ink group-hover:text-editorial-accent' : 'text-editorial-ink'
              )}>
                {s.value}
              </div>
              <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted mt-2">
                {s.label}
              </div>
            </>
          );
          return s.onClick ? (
            <button
              key={s.label}
              onClick={s.onClick}
              className={cn(wrapperClass, 'text-left group cursor-pointer')}
            >
              {content}
            </button>
          ) : (
            <div key={s.label} className={wrapperClass}>{content}</div>
          );
        })}
      </section>

      {/* Quick actions */}
      <section>
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-xs font-bold tracking-[0.2em] text-editorial-accent">01</span>
          <h2 className="font-editorial text-lg text-editorial-ink">— Szybkie akcje</h2>
        </div>
        <ul className="border-t border-editorial-line">
          {quickActions.map((a) => (
            <li key={a.label} className="border-b border-editorial-line">
              <button
                onClick={a.onClick}
                className="w-full flex items-center justify-between py-4 text-left group"
              >
                <span className="font-editorial text-base text-editorial-ink group-hover:text-editorial-accent transition-colors">
                  {a.label}
                </span>
                <ArrowRight className="h-4 w-4 text-editorial-muted group-hover:text-editorial-accent group-hover:translate-x-1 transition-all" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Recently edited */}
      {recentlyEdited.length > 0 && (
        <section>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-xs font-bold tracking-[0.2em] text-editorial-accent">02</span>
            <h2 className="font-editorial text-lg text-editorial-ink">— Ostatnio edytowane</h2>
          </div>
          <ul className="border-t border-editorial-line">
            {recentlyEdited.map((p) => (
              <li key={p.id} className="border-b border-editorial-line">
                <button
                  onClick={() => onEditProduct(p)}
                  className="w-full flex items-center gap-4 py-4 text-left group"
                >
                  <div className="h-12 w-12 bg-editorial-line/40 overflow-hidden shrink-0 flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt={p.model} width={48} height={48} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Package className="h-5 w-5 text-editorial-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-editorial text-base text-editorial-ink group-hover:text-editorial-accent transition-colors truncate">
                      {p.model}
                    </div>
                    <div className="text-xs text-editorial-muted mt-0.5">
                      {p.specs?.serialNumber || '—'} · {new Date(p.updatedAt).toLocaleDateString('pl-PL')}
                    </div>
                  </div>
                  <StatusDot status={p.availabilityStatus} />
                  <ArrowRight className="h-4 w-4 text-editorial-muted group-hover:text-editorial-accent transition-colors" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default DashboardSection;

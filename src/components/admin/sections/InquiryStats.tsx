import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { leadSourceLabel } from './leadSources';

interface StatRow {
  created_at: string;
  status: string;
  source: string;
  product_id: string | null;
  sold_at: string | null;
}

const MONTH_SHORT = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

type Range = '7d' | '30d' | '12m';

const RANGES: { value: Range; label: string; caption: string }[] = [
  { value: '7d', label: '7 dni', caption: 'Ostatnie 7 dni' },
  { value: '30d', label: '30 dni', caption: 'Ostatnie 30 dni' },
  { value: '12m', label: '12 miesięcy', caption: 'Ostatnie 12 miesięcy' },
];

// Polska odmiana liczebników.
const pluralPl = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (n === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

interface Bucket {
  key: string;
  label: string;
  full: string;
  count: number;
  sold: number;
  showLabel: boolean;
}

const InquiryStats = () => {
  const [rows, setRows] = useState<StatRow[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>('12m');
  const [activeBucket, setActiveBucket] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('leads')
        .select('created_at, status, source, product_id')
        .order('created_at', { ascending: false });
      const list = (data ?? []) as StatRow[];

      const ids = Array.from(new Set(list.map((r) => r.product_id).filter(Boolean) as string[]));
      let names: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: prods } = await supabase.from('products').select('id, name').in('id', ids);
        names = Object.fromEntries((prods ?? []).map((p) => [p.id, p.name]));
      }
      if (cancelled) return;
      setRows(list);
      setProductNames(names);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Liczniki i listy — zawsze ze wszystkich zapytań, niezależnie od zakresu wykresu.
  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    let newCount = 0;
    let handledCount = 0;
    let overdue = 0;
    let thisMonth = 0;

    const sources = new Map<string, number>();
    const models = new Map<string, number>();
    let withoutProduct = 0;

    rows.forEach((r) => {
      const created = new Date(r.created_at);
      if (r.status === 'handled') handledCount++;
      if (r.status === 'new') {
        newCount++;
        if (created.getTime() < sevenDaysAgo) overdue++;
      }
      if (created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()) thisMonth++;

      sources.set(r.source, (sources.get(r.source) ?? 0) + 1);

      if (r.product_id) {
        models.set(r.product_id, (models.get(r.product_id) ?? 0) + 1);
      } else {
        withoutProduct++;
      }
    });

    return {
      total: rows.length,
      newCount,
      handledCount,
      overdue,
      thisMonth,
      sources: Array.from(sources.entries()).sort((a, b) => b[1] - a[1]),
      models: Array.from(models.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      withoutProduct,
    };
  }, [rows]);

  // Wykres — filtrowanie już pobranych danych, bez nowego zapytania.
  const buckets = useMemo<Bucket[]>(() => {
    const now = new Date();

    if (range === '12m') {
      const list: Bucket[] = [];
      const index = new Map<string, number>();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        index.set(key, list.length);
        list.push({
          key,
          label: MONTH_SHORT[d.getMonth()],
          full: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`,
          count: 0,
          showLabel: true,
        });
      }
      rows.forEach((r) => {
        const d = new Date(r.created_at);
        const i = index.get(`${d.getFullYear()}-${d.getMonth()}`);
        if (i !== undefined) list[i].count++;
      });
      return list;
    }

    const days = range === '7d' ? 7 : 30;
    const labelEvery = range === '7d' ? 1 : 5;
    const list: Bucket[] = [];
    const index = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const label = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
      index.set(key, list.length);
      list.push({
        key,
        label,
        full: label,
        count: 0,
        showLabel: false,
      });
    }
    // Podpisujemy co kilka słupków, licząc od ostatniego dnia.
    list.forEach((b, i) => {
      b.showLabel = (list.length - 1 - i) % labelEvery === 0;
    });
    rows.forEach((r) => {
      const d = new Date(r.created_at);
      const i = index.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      if (i !== undefined) list[i].count++;
    });
    return list;
  }, [rows, range]);

  if (loading) {
    return <p className="py-16 text-center text-sm text-editorial-muted font-editorial italic">Ładowanie…</p>;
  }

  if (stats.total === 0) {
    return <p className="py-16 text-center text-sm text-editorial-muted font-editorial italic">Brak danych do statystyk</p>;
  }

  const maxBucket = Math.max(...buckets.map((b) => b.count), 1);
  const active = buckets.find((b) => b.key === activeBucket) ?? null;
  const caption = RANGES.find((r) => r.value === range)!.caption;

  const counters: { value: number; label: string; highlight?: boolean }[] = [
    { value: stats.newCount, label: 'Nowe' },
    { value: stats.handledCount, label: 'Obsłużone' },
    { value: stats.overdue, label: 'Zaległe (>7 dni)', highlight: stats.overdue > 0 },
    { value: stats.thisMonth, label: 'W tym miesiącu' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-editorial-line">
        {counters.map((c) => (
          <div key={c.label} className="py-6 border-b border-editorial-line">
            <p
              className={cn(
                'font-editorial text-4xl leading-none',
                c.highlight ? 'text-editorial-accent' : 'text-editorial-ink'
              )}
            >
              {c.value}
            </p>
            <p className="mt-2 text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted">{c.label}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <div className="flex items-center gap-1 mb-3 flex-wrap">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                setRange(r.value);
                setActiveBucket(null);
              }}
              className={cn(
                'px-2.5 h-7 text-[10px] font-bold tracking-[0.15em] uppercase transition-colors',
                range === r.value
                  ? 'bg-editorial-ink text-white'
                  : 'text-editorial-muted hover:text-editorial-ink'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex items-baseline justify-between gap-4 mb-3 min-h-[18px]">
          <h2 className="text-[10px] font-bold tracking-[0.25em] uppercase text-editorial-muted">{caption}</h2>
          {active && (
            <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-editorial-ink">
              {active.full} — {active.count}{' '}
              {active.count === 1 ? 'zapytanie' : 'zapytań'}
            </p>
          )}
        </div>

        <div className="flex items-end gap-1 h-32 border-b border-editorial-line">
          {buckets.map((b) => (
            <button
              key={b.key}
              type="button"
              aria-label={`${b.full}: ${b.count}`}
              onMouseEnter={() => setActiveBucket(b.key)}
              onMouseLeave={() => setActiveBucket((k) => (k === b.key ? null : k))}
              onClick={() => setActiveBucket((k) => (k === b.key ? null : b.key))}
              className="flex-1 flex items-end h-full min-w-0"
            >
              <span
                className={cn(
                  'w-full block transition-colors',
                  activeBucket === b.key ? 'bg-editorial-ink' : 'bg-editorial-ink/60'
                )}
                style={{ height: `${Math.max((b.count / maxBucket) * 100, b.count > 0 ? 4 : 1)}%` }}
              />
            </button>
          ))}
        </div>
        <div className="flex gap-1 mt-2">
          {buckets.map((b) => (
            <span
              key={`l-${b.key}`}
              className="flex-1 text-center text-[9px] font-bold tracking-[0.05em] uppercase text-editorial-muted truncate"
            >
              {b.showLabel ? b.label : ''}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-[10px] font-bold tracking-[0.25em] uppercase text-editorial-muted mb-2">Źródła</h2>
        <ul className="border-t border-editorial-line">
          {stats.sources.map(([source, count]) => (
            <li key={source} className="flex items-baseline justify-between gap-4 py-3 border-b border-editorial-line">
              <span className="text-sm text-editorial-ink">{leadSourceLabel(source)}</span>
              <span className="font-editorial text-base text-editorial-ink">{count}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 mb-4">
        <h2 className="text-[10px] font-bold tracking-[0.25em] uppercase text-editorial-muted mb-2">
          Najczęściej pytane modele
        </h2>
        {stats.models.length === 0 ? (
          <p className="py-6 text-sm text-editorial-muted font-editorial italic">
            Brak zapytań powiązanych z produktem
          </p>
        ) : (
          <ul className="border-t border-editorial-line">
            {stats.models.map(([id, count]) => (
              <li key={id} className="flex items-baseline justify-between gap-4 py-3 border-b border-editorial-line">
                <span className="text-sm text-editorial-ink">{productNames[id] ?? 'Produkt usunięty'}</span>
                <span className="font-editorial text-base text-editorial-ink">{count}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted">
          Lista nie obejmuje {stats.withoutProduct}{' '}
          {stats.withoutProduct === 1 ? 'zapytania bez produktu' : 'zapytań bez produktu'}
        </p>
      </section>
    </div>
  );
};

export default InquiryStats;

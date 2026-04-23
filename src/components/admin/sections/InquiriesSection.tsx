import { useEffect, useState } from 'react';
import { Phone, Mail, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, Package, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  created_at: string;
  handled_at: string | null;
  name: string | null;
  phone: string;
  email: string | null;
  message: string | null;
  source: string;
  page_url: string | null;
  status: string;
  product_id: string | null;
  product_model?: string | null;
}

const PAGE_SIZE = 20;
const RETENTION_DAYS = 60;
type StatusFilter = 'all' | 'new' | 'handled';

const sourceLabel: Record<string, string> = {
  home_hero_form: 'Strona główna',
  product_page_inline: 'Strona produktu',
  contact_form: 'Kontakt',
};

interface Props {
  initialFilter?: StatusFilter;
}

const InquiriesSection = ({ initialFilter = 'new' }: Props) => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>(initialFilter);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('leads')
      .select('id, created_at, handled_at, name, phone, email, message, source, page_url, status, product_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (filter !== 'all') q = q.eq('status', filter);

    const { data, count } = await q;
    const rows = (data ?? []) as Lead[];

    const productIds = Array.from(new Set(rows.map((r) => r.product_id).filter(Boolean) as string[]));
    let nameMap: Record<string, string> = {};
    if (productIds.length > 0) {
      const { data: prods } = await supabase.from('products').select('id, name').in('id', productIds);
      nameMap = Object.fromEntries((prods ?? []).map((p) => [p.id, p.name]));
    }

    setLeads(rows.map((r) => ({ ...r, product_model: r.product_id ? nameMap[r.product_id] : null })));
    setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const markHandled = async (lead: Lead) => {
    setUpdating((prev) => new Set(prev).add(lead.id));
    const newStatus = lead.status === 'handled' ? 'new' : 'handled';
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', lead.id);
    setUpdating((prev) => {
      const n = new Set(prev);
      n.delete(lead.id);
      return n;
    });

    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: newStatus === 'handled' ? '✓ Oznaczono jako obsłużone' : 'Oznaczono jako nowe' });

    // Auto-switch tab so the user sees where the lead landed
    if (filter !== 'all') {
      setFilter(newStatus as StatusFilter);
      setPage(0);
    } else {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l)));
    }
  };

  const deleteLead = async (lead: Lead) => {
    if (!confirm(`Usunąć zapytanie od ${lead.name || lead.phone}? Tej operacji nie można cofnąć.`)) return;
    setUpdating((prev) => new Set(prev).add(lead.id));
    const { error } = await supabase.from('leads').delete().eq('id', lead.id);
    setUpdating((prev) => {
      const n = new Set(prev);
      n.delete(lead.id);
      return n;
    });
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Zapytanie usunięte' });
    setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    setTotal((t) => Math.max(0, t - 1));
  };

  const daysUntilDeletion = (handledAt: string | null): number | null => {
    if (!handledAt) return null;
    const handled = new Date(handledAt).getTime();
    const elapsedDays = (Date.now() - handled) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(RETENTION_DAYS - elapsedDays));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filterChips: { value: StatusFilter; label: string }[] = [
    { value: 'new', label: 'Nowe' },
    { value: 'handled', label: 'Obsłużone' },
    { value: 'all', label: 'Wszystkie' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6">
        <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-editorial-muted mb-2">
          {total} {total === 1 ? 'zapytanie' : 'zapytań'}
        </p>
        <h1 className="font-editorial text-3xl lg:text-4xl text-editorial-ink">Zapytania</h1>
        <div className="mt-6 border-b border-editorial-line" />
      </header>

      <div className="flex items-center gap-1 mb-6">
        {filterChips.map((c) => (
          <button
            key={c.value}
            onClick={() => {
              setFilter(c.value);
              setPage(0);
            }}
            className={cn(
              'px-3 h-8 text-[11px] font-bold tracking-[0.15em] uppercase transition-colors',
              filter === c.value
                ? 'bg-editorial-ink text-white'
                : 'text-editorial-muted hover:text-editorial-ink'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-editorial-muted font-editorial italic">Ładowanie…</p>
      ) : leads.length === 0 ? (
        <p className="py-16 text-center text-sm text-editorial-muted font-editorial italic">Brak zapytań</p>
      ) : (
        <ul className="border-t border-editorial-line">
          {leads.map((lead) => {
            const isExpanded = expanded.has(lead.id);
            const isLong = (lead.message?.length ?? 0) > 120;
            const shortMsg = isLong ? `${lead.message!.slice(0, 120)}…` : lead.message;
            const isHandled = lead.status === 'handled';
            const isUpdating = updating.has(lead.id);
            const daysLeft = isHandled ? daysUntilDeletion(lead.handled_at) : null;

            return (
              <li key={lead.id} className="border-b border-editorial-line py-5">
                <div className="flex items-start gap-3 flex-wrap">
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full mt-2 shrink-0',
                      isHandled ? 'bg-editorial-muted' : 'bg-editorial-ok animate-pulse'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span
                        className={cn(
                          'font-editorial text-base',
                          isHandled ? 'text-editorial-muted' : 'text-editorial-ink'
                        )}
                      >
                        {lead.name || 'Bez nazwy'}
                      </span>
                      <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted">
                        {sourceLabel[lead.source] || lead.source}
                      </span>
                    </div>

                    <div className="text-xs text-editorial-muted flex items-center gap-3 flex-wrap mt-1.5">
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-1 text-editorial-ink hover:text-editorial-accent transition-colors"
                      >
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </a>
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="inline-flex items-center gap-1 hover:text-editorial-accent transition-colors"
                        >
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </a>
                      )}
                      {lead.product_model && (
                        <span className="inline-flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {lead.product_model}
                        </span>
                      )}
                    </div>

                    {lead.message && (
                      <div className="mt-2.5">
                        <p className="text-sm text-editorial-ink whitespace-pre-wrap leading-relaxed">
                          {isExpanded ? lead.message : shortMsg}
                        </p>
                        {isLong && (
                          <button
                            onClick={() => toggleExpand(lead.id)}
                            className="text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-accent hover:underline mt-1.5 inline-flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                Zwiń <ChevronUp className="h-3 w-3" />
                              </>
                            ) : (
                              <>
                                Rozwiń <ChevronDown className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {isHandled && daysLeft !== null && (
                      <p className="mt-2 text-[10px] font-bold tracking-[0.2em] uppercase text-editorial-muted">
                        Zostanie usunięte za {daysLeft} {daysLeft === 1 ? 'dzień' : 'dni'}
                      </p>
                    )}
                  </div>

                  <div className="text-[11px] text-editorial-muted whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleString('pl-PL', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>

                <div className="flex gap-1 mt-3 pl-5 flex-wrap">
                  <a
                    href={`tel:${lead.phone}`}
                    className="px-3 h-8 inline-flex items-center gap-1.5 bg-editorial-ink text-white text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-editorial-ink/90 transition-colors"
                  >
                    <Phone className="h-3 w-3" />
                    Zadzwoń
                  </a>
                  <button
                    disabled={isUpdating}
                    onClick={() => markHandled(lead)}
                    className={cn(
                      'px-3 h-8 inline-flex items-center gap-1.5 border text-[11px] font-bold tracking-[0.15em] uppercase transition-colors disabled:opacity-50',
                      isHandled
                        ? 'border-editorial-line text-editorial-muted hover:border-editorial-ink hover:text-editorial-ink'
                        : 'border-editorial-ok text-editorial-ok hover:bg-editorial-ok hover:text-white'
                    )}
                  >
                    <Check className="h-3 w-3" />
                    {isHandled ? 'Cofnij' : 'Obsłużone'}
                  </button>
                  {isHandled && (
                    <button
                      disabled={isUpdating}
                      onClick={() => deleteLead(lead)}
                      className="px-3 h-8 inline-flex items-center gap-1.5 border border-destructive/40 text-destructive text-[11px] font-bold tracking-[0.15em] uppercase hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      Usuń
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 h-9 inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.15em] uppercase text-editorial-ink disabled:opacity-30"
          >
            <ChevronLeft className="h-3 w-3" /> Poprzednia
          </button>
          <span className="text-[11px] tracking-[0.15em] text-editorial-muted">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 h-9 inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.15em] uppercase text-editorial-ink disabled:opacity-30"
          >
            Następna <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default InquiriesSection;

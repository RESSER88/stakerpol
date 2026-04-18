import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  created_at: string;
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
type StatusFilter = 'all' | 'new' | 'handled';

const sourceLabel: Record<string, string> = {
  home_hero_form: 'Strona główna',
  product_page_inline: 'Strona produktu',
  contact_form: 'Kontakt',
};

const InquiriesSection = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('leads')
      .select('id, created_at, name, phone, email, message, source, page_url, status, product_id', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (filter !== 'all') q = q.eq('status', filter);

    const { data, count } = await q;
    const rows = (data ?? []) as Lead[];

    // Resolve product names in one batch
    const productIds = Array.from(new Set(rows.map(r => r.product_id).filter(Boolean) as string[]));
    let nameMap: Record<string, string> = {};
    if (productIds.length > 0) {
      const { data: prods } = await supabase.from('products').select('id, name').in('id', productIds);
      nameMap = Object.fromEntries((prods ?? []).map(p => [p.id, p.name]));
    }

    setLeads(rows.map(r => ({ ...r, product_model: r.product_id ? nameMap[r.product_id] : null })));
    setTotal(count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const markHandled = async (lead: Lead) => {
    setUpdating(prev => new Set(prev).add(lead.id));
    const newStatus = lead.status === 'handled' ? 'new' : 'handled';
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', lead.id);
    setUpdating(prev => { const n = new Set(prev); n.delete(lead.id); return n; });

    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: newStatus === 'handled' ? 'Oznaczono jako obsłużone' : 'Oznaczono jako nowe' });
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filterChips: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'new', label: 'Nowe' },
    { value: 'handled', label: 'Obsłużone' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {filterChips.map(c => (
          <button
            key={c.value}
            onClick={() => { setFilter(c.value); setPage(0); }}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
              filter === c.value
                ? 'bg-admin-orange text-white border-admin-orange'
                : 'bg-white text-admin-text border-admin-border hover:border-admin-orange'
            )}
          >
            {c.label}
          </button>
        ))}
        <div className="ml-auto text-sm text-admin-muted">{total} {total === 1 ? 'zapytanie' : 'zapytań'}</div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-admin-muted">Ładowanie...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-admin-muted">Brak zapytań</div>
          ) : (
            <div className="divide-y divide-admin-border">
              {leads.map((lead) => {
                const isExpanded = expanded.has(lead.id);
                const isLong = (lead.message?.length ?? 0) > 120;
                const shortMsg = isLong ? `${lead.message!.slice(0, 120)}…` : lead.message;
                const isHandled = lead.status === 'handled';
                const isUpdating = updating.has(lead.id);

                return (
                  <div key={lead.id} className={cn('p-4 transition-colors', isHandled ? 'bg-admin-bg/40' : 'hover:bg-admin-bg')}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={cn('font-semibold', isHandled ? 'text-admin-muted' : 'text-admin-text')}>
                            {lead.name || 'Bez nazwy'}
                          </span>
                          {isHandled ? (
                            <Badge className="bg-admin-green/15 text-admin-green hover:bg-admin-green/15 border-0 text-xs">
                              ✓ Obsłużone
                            </Badge>
                          ) : (
                            <Badge className="bg-admin-orange/15 text-admin-orange hover:bg-admin-orange/15 border-0 text-xs">
                              Nowe
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px] text-admin-muted border-admin-border">
                            {sourceLabel[lead.source] || lead.source}
                          </Badge>
                        </div>

                        <div className="text-sm text-admin-muted flex items-center gap-3 flex-wrap">
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-admin-orange">
                            <Phone className="h-3 w-3" />{lead.phone}
                          </a>
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-admin-orange">
                              <Mail className="h-3 w-3" />{lead.email}
                            </a>
                          )}
                          {lead.product_model && (
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />{lead.product_model}
                            </span>
                          )}
                        </div>

                        {lead.message && (
                          <div className="mt-2">
                            <div className="text-sm text-admin-text whitespace-pre-wrap">
                              {isExpanded ? lead.message : shortMsg}
                            </div>
                            {isLong && (
                              <button
                                onClick={() => toggleExpand(lead.id)}
                                className="text-xs text-admin-orange hover:underline mt-1 flex items-center gap-1"
                              >
                                {isExpanded ? <>Zwiń <ChevronUp className="h-3 w-3" /></> : <>Rozwiń <ChevronDown className="h-3 w-3" /></>}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-admin-muted whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Button asChild size="sm" className="bg-admin-orange hover:bg-admin-orange/90 text-white">
                        <a href={`tel:${lead.phone}`}>
                          <Phone className="h-3.5 w-3.5" /> Zadzwoń
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating}
                        onClick={() => markHandled(lead)}
                        className={isHandled ? 'border-admin-muted text-admin-muted' : 'border-admin-green text-admin-green hover:bg-admin-green/10'}
                      >
                        <Check className="h-3.5 w-3.5" />
                        {isHandled ? 'Cofnij' : 'Oznacz jako obsłużone'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" /> Poprzednia
          </Button>
          <span className="text-sm text-admin-muted">Strona {page + 1} z {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
            Następna <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default InquiriesSection;

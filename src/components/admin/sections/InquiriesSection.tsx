import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Lead {
  id: string;
  created_at: string;
  name: string | null;
  phone: string;
  email: string | null;
  message: string | null;
  source: string;
  page_url: string | null;
}

const PAGE_SIZE = 20;

const InquiriesSection = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let q = supabase
        .from('leads')
        .select('id, created_at, name, phone, email, message, source, page_url', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (sourceFilter !== 'all') q = q.eq('source', sourceFilter);

      const { data, count } = await q;
      setLeads((data ?? []) as Lead[]);
      setTotal(count ?? 0);
      setLoading(false);
    };
    load();
  }, [page, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtruj po źródle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie źródła</SelectItem>
            <SelectItem value="home_hero_form">Hero strony głównej</SelectItem>
            <SelectItem value="product_page_inline">Strona produktu</SelectItem>
            <SelectItem value="contact_form">Formularz kontaktu</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-admin-muted">{total} zapytań</div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-admin-muted">Ładowanie...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-admin-muted">Brak zapytań</div>
          ) : (
            <div className="divide-y divide-admin-border">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-admin-bg">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-admin-text">{lead.name || 'Bez nazwy'}</span>
                        <Badge variant="outline" className="text-xs">{lead.source}</Badge>
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
                      </div>
                      {lead.message && (
                        <div className="text-sm text-admin-text mt-2 whitespace-pre-wrap">{lead.message}</div>
                      )}
                    </div>
                    <div className="text-xs text-admin-muted whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
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

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Inbox, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import type { AdminSection } from '../layout/types';

interface Lead {
  id: string;
  created_at: string;
  name: string | null;
  phone: string;
  source: string;
  message: string | null;
}

interface Props {
  productCount: number;
  onNavigate: (section: AdminSection) => void;
}

const DashboardSection = ({ productCount, onNavigate }: Props) => {
  const [leadsToday, setLeadsToday] = useState(0);
  const [leads7d, setLeads7d] = useState(0);
  const [recent, setRecent] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [todayRes, weekRes, recentRes] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('leads').select('id, created_at, name, phone, source, message').order('created_at', { ascending: false }).limit(5),
      ]);

      setLeadsToday(todayRes.count ?? 0);
      setLeads7d(weekRes.count ?? 0);
      setRecent((recentRes.data ?? []) as Lead[]);
      setLoading(false);
    };
    load();
  }, []);

  const kpis = [
    { label: 'Produkty w katalogu', value: productCount, icon: Package, color: 'text-admin-orange' },
    { label: 'Zapytania dziś', value: leadsToday, icon: Clock, color: 'text-admin-green' },
    { label: 'Zapytania (7 dni)', value: leads7d, icon: TrendingUp, color: 'text-admin-orange' },
    { label: 'Wszystkie zapytania', value: recent.length > 0 ? '→' : 0, icon: Inbox, color: 'text-admin-muted' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs lg:text-sm text-admin-muted">{kpi.label}</span>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-admin-text">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Ostatnie zapytania</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('inquiries')}>
            Zobacz wszystkie →
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-admin-muted">Ładowanie...</div>
          ) : recent.length === 0 ? (
            <div className="text-sm text-admin-muted py-8 text-center">Brak zapytań</div>
          ) : (
            <div className="divide-y divide-admin-border">
              {recent.map((lead) => (
                <div key={lead.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-admin-text">
                      {lead.name || 'Bez nazwy'} · {lead.phone}
                    </div>
                    {lead.message && (
                      <div className="text-xs text-admin-muted truncate mt-0.5">{lead.message}</div>
                    )}
                  </div>
                  <div className="text-xs text-admin-muted whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSection;

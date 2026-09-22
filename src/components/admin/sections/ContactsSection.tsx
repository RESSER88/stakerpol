import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fmtDate, krokLabel } from '@/utils/contactLabels';
import { matchesContactQuery } from '@/utils/contactSearch';
import SectionHeader from '../editorial/SectionHeader';
import ContactCard from './contacts/ContactCard';
import AddContactDialog from './contacts/AddContactDialog';

interface ContactRow {
  id: string;
  osoba: string | null;
  firma: string | null;
  telefon: string | null;
  email: string | null;
  zrodlo: string;
  krok: string;
  termin_followup: string | null;
  termin_followup_note: string | null;
}

type SourceFilter = 'all' | 'telefon' | 'www';

const SOURCE_TABS: { value: SourceFilter; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'telefon', label: 'Telefon' },
  { value: 'www', label: 'WWW' },
];

const ContactsSection = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [lastContact, setLastContact] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SourceFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select(
        'id, osoba, firma, telefon, email, zrodlo, krok, termin_followup, termin_followup_note'
      )
      .eq('ukryty', false)
      .order('termin_followup', { ascending: true, nullsFirst: false })
      .order('zaktualizowany', { ascending: false });

    if (error) {
      toast({ title: 'Błąd odczytu', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const list = (data ?? []) as ContactRow[];
    setRows(list);

    if (list.length > 0) {
      const { data: acts } = await supabase
        .from('contact_activities')
        .select('contact_id, data')
        .in(
          'contact_id',
          list.map((r) => r.id)
        )
        .order('data', { ascending: false });
      const map: Record<string, string> = {};
      for (const a of acts ?? []) {
        if (!map[a.contact_id]) map[a.contact_id] = a.data;
      }
      setLastContact(map);
    } else {
      setLastContact({});
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    return rows.filter((r) => {
      if (source !== 'all' && r.zrodlo !== source) return false;
      return matchesContactQuery(r, query);
    });
  }, [rows, query, source]);

  return (
    <div className="max-w-4xl">
      <SectionHeader number="—" title="Kontakty" />

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 border-b border-editorial-line flex-1 min-w-[180px]">
          <Search className="h-3.5 w-3.5 text-editorial-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj: osoba, firma, telefon, e-mail"
            aria-label="Szukaj kontaktu"
            className="w-full bg-transparent py-2 text-sm text-editorial-ink placeholder:text-editorial-muted/60 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {SOURCE_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setSource(t.value)}
              className={`h-9 px-3 text-[11px] uppercase tracking-wider border transition-colors ${
                source === t.value
                  ? 'border-editorial-ink bg-editorial-ink text-background'
                  : 'border-editorial-line text-editorial-muted hover:border-editorial-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 h-9 px-3 text-[11px] uppercase tracking-wider border border-editorial-ink bg-editorial-ink text-background"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Dodaj kontakt
          </button>
        </div>
      </div>

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-editorial-muted" />
      ) : visible.length === 0 ? (
        <p className="text-xs text-editorial-muted italic">Brak kontaktów.</p>
      ) : (
        <ul className="border-t border-editorial-line">
          {visible.map((r) => (
            <li key={r.id} className="border-b border-editorial-line">
              <button
                type="button"
                onClick={() => setOpenId(r.id)}
                className="w-full text-left py-4 hover:bg-editorial-line/30 transition-colors px-1"
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-editorial text-base text-editorial-ink">
                    {r.osoba || r.firma || 'Bez nazwy'}
                  </span>
                  {r.firma && r.osoba && (
                    <span className="text-[11px] text-editorial-muted">{r.firma}</span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-muted">
                    {krokLabel(r.krok)}
                  </span>
                </div>
                <div className="text-[11px] text-editorial-muted mt-1 tracking-wide">
                  {r.telefon || 'brak telefonu'}
                  {r.email ? ` · ${r.email}` : ''} · {r.zrodlo} · ostatni kontakt:{' '}
                  {lastContact[r.id] ? fmtDate(lastContact[r.id]) : 'brak'} · termin:{' '}
                  {r.termin_followup ? fmtDate(r.termin_followup) : 'brak'}
                  {r.termin_followup && r.termin_followup_note
                    ? ` (${r.termin_followup_note})`
                    : ''}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ContactCard contactId={openId} onClose={() => setOpenId(null)} onChanged={() => void load()} />

      <AddContactDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(id) => {
          void load();
          setOpenId(id);
        }}
      />
    </div>
  );
};

export default ContactsSection;

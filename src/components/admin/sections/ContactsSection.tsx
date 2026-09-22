import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { fmtDate, KROK_OPTIONS, krokLabel } from '@/utils/contactLabels';
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

type StepFilter = 'all' | string;

const ContactsSection = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [step, setStep] = useState<StepFilter>('all');
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
      const { data: linkedOffers } = await supabase
        .from('shared_lists')
        .select('contact_id')
        .in(
          'contact_id',
          list.map((r) => r.id)
        );
      const counts: Record<string, number> = {};
      for (const offer of linkedOffers ?? []) {
        if (!offer.contact_id) continue;
        counts[offer.contact_id] = (counts[offer.contact_id] ?? 0) + 1;
      }
      setOfferCounts(counts);
    } else {
      setOfferCounts({});
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    return rows.filter((r) => {
      if (step !== 'all' && r.krok !== step) return false;
      return matchesContactQuery(r, query);
    });
  }, [rows, query, step]);

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
          {[{ value: 'all', label: 'Wszystkie' }, ...KROK_OPTIONS].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStep(option.value)}
              className={`h-9 px-3 text-[11px] uppercase tracking-wider border transition-colors ${
                step === option.value
                  ? 'border-editorial-ink bg-editorial-ink text-background'
                  : 'border-editorial-line text-editorial-muted hover:border-editorial-ink'
              }`}
            >
              {option.label}
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
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-editorial text-base text-editorial-ink">
                        {r.osoba || r.firma || 'Bez nazwy'}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] border border-editorial-line px-1.5 py-0.5 text-editorial-ink">
                        {krokLabel(r.krok)}
                      </span>
                    </div>
                    {r.firma && r.osoba && (
                      <p className="mt-0.5 text-xs text-editorial-muted truncate">{r.firma}</p>
                    )}
                    {(r.telefon || r.email) && (
                      <p className="mt-1 text-[11px] text-editorial-muted break-words">
                        {[r.telefon, r.email].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-start gap-x-5 gap-y-2 sm:justify-end sm:text-right">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-editorial-muted">
                        Następny kontakt
                      </p>
                      <p className="mt-0.5 text-xs text-editorial-ink">
                        {r.termin_followup ? fmtDate(r.termin_followup) : 'Brak terminu'}
                      </p>
                      {r.termin_followup_note && (
                        <p className="mt-0.5 max-w-52 text-[11px] text-editorial-muted line-clamp-1">
                          {r.termin_followup_note}
                        </p>
                      )}
                    </div>
                    <div className="min-w-16">
                      <p className="text-[10px] uppercase tracking-[0.15em] text-editorial-muted">
                        Oferty
                      </p>
                      <p className="mt-0.5 text-xs text-editorial-ink">{offerCounts[r.id] ?? 0}</p>
                    </div>
                  </div>
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

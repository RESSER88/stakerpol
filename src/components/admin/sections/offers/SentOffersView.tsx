import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Loader2, Ban, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buildUrl } from '@/utils/offerToken';
import { matchesContactQuery, normalizeQuery } from '@/utils/contactSearch';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ContactCard from '../contacts/ContactCard';


interface Props {
  reloadKey: number;
}

interface OfferRow {
  id: string;
  token: string;
  label: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  archived_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  contact_id: string | null;
  contacts: {
    osoba: string | null;
    firma: string | null;
    telefon: string | null;
    email: string | null;
    termin_followup: string | null;
    krok: string | null;
  } | null;


}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });

const DAY = 24 * 60 * 60 * 1000;

const KROK_LABELS: Record<string, string> = {
  nowy: 'Nowy',
  oferta: 'Oferta',
  oddzwonic: 'Oddzwonić',
  porownuje: 'Porównuje',
  cena: 'Cena',
  nieaktualne: 'Nieaktualne',
};

/** Chip terminu follow-upu: dziś/przeszłość → pilny, do 3 dni → bursztyn, dalej → szary. */
type FollowUp = { label: string; urgent: boolean; className: string };

const followUpOf = (termin: string | null | undefined): FollowUp | null => {
  if (!termin) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${termin}T00:00:00`);
  const diffDays = Math.round((due.getTime() - today.getTime()) / DAY);
  if (diffDays <= 0)
    return {
      label: 'Zadzwoń dziś',
      urgent: true,
      className:
        'text-destructive border-destructive bg-destructive/10 animate-pulse motion-reduce:animate-none',
    };
  if (diffDays <= 3)
    return {
      label: `termin ${formatDate(termin)}`,
      urgent: false,
      className: 'text-editorial-accent border-editorial-accent',
    };
  return {
    label: `termin ${formatDate(termin)}`,
    urgent: false,
    className: 'text-editorial-muted border-editorial-line',
  };
};

type Signal = { label: string; tone: 'good' | 'warn' | 'off' };

const signalOf = (row: OfferRow): Signal => {
  const now = Date.now();
  if (row.archived_at) return { label: 'archiwalna', tone: 'off' };
  if (row.revoked_at) return { label: 'zatrzymana', tone: 'off' };
  if (new Date(row.expires_at).getTime() < now) return { label: 'wygasła', tone: 'off' };
  if (row.view_count > 0 && row.last_viewed_at && now - new Date(row.last_viewed_at).getTime() <= 2 * DAY)
    return { label: 'ogląda', tone: 'good' };
  if (row.view_count > 0 && new Date(row.expires_at).getTime() - now <= 2 * DAY)
    return { label: 'wygasa', tone: 'warn' };
  if (row.view_count === 0 && now - new Date(row.created_at).getTime() > 5 * DAY)
    return { label: 'cisza', tone: 'warn' };
  return { label: 'brak otwarć', tone: 'off' };
};

const toneClass = (tone: Signal['tone']) =>
  tone === 'good'
    ? 'text-editorial-accent border-editorial-accent'
    : tone === 'warn'
      ? 'text-editorial-ink border-editorial-ink'
      : 'text-editorial-muted border-editorial-line';

const isActive = (row: OfferRow) =>
  !row.archived_at && !row.revoked_at && new Date(row.expires_at).getTime() > Date.now();

const newer = (a: OfferRow, b: OfferRow) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

const ts = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0);

/**
 * Jeden wiersz na kontakt: bieżąca oferta to najnowsza aktywna, a gdy takiej
 * nie ma — najnowsza ze wszystkich. Oferty bez kontaktu zostają osobno.
 * Kolejność: najnowsza aktywność kontaktu — max(created_at ofert, data rozmów).
 */
const groupRows = (
  rows: OfferRow[],
  lastActivity: Record<string, string>
): { row: OfferRow; extras: number; activityAt: number }[] => {
  const byContact = new Map<string, OfferRow[]>();
  const loose: { row: OfferRow; extras: number; activityAt: number }[] = [];

  for (const row of rows) {
    if (!row.contact_id) {
      loose.push({ row, extras: 0, activityAt: ts(row.created_at) });
      continue;
    }
    const list = byContact.get(row.contact_id);
    if (list) list.push(row);
    else byContact.set(row.contact_id, [row]);
  }

  const grouped = [...byContact.values()].map((list) => {
    const actives = list.filter(isActive).sort(newer);
    const current = actives[0] ?? [...list].sort(newer)[0];
    const newestOffer = Math.max(...list.map((r) => ts(r.created_at)));
    const activityAt = Math.max(newestOffer, ts(lastActivity[current.contact_id ?? '']));
    return { row: current, extras: list.length - 1, activityAt };
  });

  return [...grouped, ...loose].sort(
    (a, b) => b.activityAt - a.activityAt || newer(a.row, b.row)
  );
};




const SentOffersView = ({ reloadKey }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [lastActivity, setLastActivity] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<OfferRow | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [openContactId, setOpenContactId] = useState<string | null>(null);


  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shared_lists')
      .select(
        'id, token, label, created_at, expires_at, revoked_at, archived_at, last_viewed_at, view_count, contact_id, contacts(osoba, firma, telefon, email, termin_followup, krok)'
      )
      .order('created_at', { ascending: false });
    if (error) {
      toast({
        title: 'Błąd odczytu',
        description: 'Nie udało się pobrać listy ofert',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    const list = (data ?? []) as unknown as OfferRow[];
    setRows(list);

    const ids = [...new Set(list.map((r) => r.contact_id).filter(Boolean))] as string[];
    if (ids.length > 0) {
      const { data: acts } = await supabase
        .from('contact_activities')
        .select('contact_id, data')
        .in('contact_id', ids)
        .order('data', { ascending: false });
      const map: Record<string, string> = {};
      for (const a of acts ?? []) if (!map[a.contact_id]) map[a.contact_id] = a.data;
      setLastActivity(map);
    } else {
      setLastActivity({});
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const grouped = useMemo(() => groupRows(rows, lastActivity), [rows, lastActivity]);

  const visible = useMemo(
    () =>
      grouped.filter(
        (g) =>
          matchesContactQuery(g.row.contacts ?? {}, query) ||
          (g.row.label ?? '').toLowerCase().includes(normalizeQuery(query))
      ),
    [grouped, query]
  );



  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: '✓ Skopiowano', description: 'Adres linku jest w schowku' });
    } catch {
      toast({ title: 'Błąd', description: 'Nie udało się skopiować adresu', variant: 'destructive' });
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    const { error } = await supabase
      .from('shared_lists')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', revokeTarget.id);
    setRevoking(false);
    if (error) {
      toast({ title: 'Błąd', description: 'Nie udało się zatrzymać dostępu', variant: 'destructive' });
      return;
    }
    setRevokeTarget(null);
    toast({ title: '✓ Dostęp zatrzymany', description: 'Link nie jest już aktywny' });
    await load();
  };

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-editorial-muted" />;
  if (rows.length === 0)
    return <p className="text-xs text-editorial-muted italic">Brak wysłanych ofert.</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 border-b border-editorial-line mb-4">
        <Search className="h-3.5 w-3.5 text-editorial-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj: osoba, telefon, e-mail"
          aria-label="Szukaj kontaktu w wysłanych ofertach"
          className="w-full bg-transparent py-2 text-sm text-editorial-ink placeholder:text-editorial-muted/60 focus:outline-none"
        />
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-editorial-muted italic">Brak wyników.</p>
      ) : (
      <ul className="border-t border-editorial-line">
        {visible.map(({ row, extras }) => {

          const signal = signalOf(row);
          const followUp = followUpOf(row.contacts?.termin_followup);

          const active = !row.revoked_at && !row.archived_at;
          return (
            <li
              key={row.id}
              className={`flex flex-wrap items-center gap-3 py-4 border-b border-editorial-line ${
                followUp?.urgent
                  ? 'ring-1 ring-destructive/60 animate-pulse motion-reduce:animate-none'
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={() => row.contact_id && setOpenContactId(row.contact_id)}
                disabled={!row.contact_id}
                className="flex-1 min-w-0 text-left disabled:cursor-default"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-editorial-ink truncate">
                    {row.label || 'Bez nazwy'}
                  </span>
                  <span
                    className={`text-[10px] uppercase tracking-wider border px-1.5 py-0.5 ${toneClass(signal.tone)}`}
                  >
                    {signal.label}
                  </span>
                  {followUp && (
                    <span
                      className={`text-[10px] uppercase tracking-wider border px-1.5 py-0.5 ${followUp.className}`}
                    >
                      {followUp.label}
                      {row.contacts?.krok
                        ? ` · ${KROK_LABELS[row.contacts.krok] ?? row.contacts.krok}`
                        : ''}
                    </span>
                  )}
                  {extras > 0 && (
                    <span className="text-[10px] uppercase tracking-wider border px-1.5 py-0.5 text-editorial-muted border-editorial-line">
                      +{extras} {extras === 1 ? 'oferta' : 'ofert'} w historii
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-editorial-muted mt-1 tracking-wide">
                  {row.contacts?.telefon || 'brak telefonu'} · {row.view_count}{' '}
                  {row.view_count === 1 ? 'otwarcie' : 'otwarć'} ·{' '}
                  {row.last_viewed_at ? formatDate(row.last_viewed_at) : 'brak otwarć'} · do{' '}
                  {formatDate(row.expires_at)}
                </div>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => copy(buildUrl(row.token))}
                  aria-label="Kopiuj adres linku"
                  className="p-2 border border-editorial-line hover:border-editorial-ink"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {active && (
                  <button
                    type="button"
                    onClick={() => setRevokeTarget(row)}
                    className="flex items-center gap-1.5 px-2.5 py-2 text-[11px] uppercase tracking-wider border border-editorial-line text-editorial-muted hover:border-destructive hover:text-destructive"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Zatrzymaj
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      )}


      <ContactCard
        contactId={openContactId}
        onClose={() => setOpenContactId(null)}
        onChanged={() => void load()}
      />


      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zatrzymać dostęp?</AlertDialogTitle>
            <AlertDialogDescription>
              Link {revokeTarget?.label ? `„${revokeTarget.label}” ` : ''}przestanie działać
              natychmiast. Operacji nie da się cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleRevoke();
              }}
              disabled={revoking}
            >
              Zatrzymaj dostęp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SentOffersView;

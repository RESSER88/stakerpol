import { useCallback, useEffect, useState } from 'react';
import { Copy, Loader2, Ban } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buildUrl } from '@/utils/offerToken';
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
  contacts: { osoba: string | null; telefon: string | null } | null;

}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });

const DAY = 24 * 60 * 60 * 1000;

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
  return { label: '—', tone: 'off' };
};

const toneClass = (tone: Signal['tone']) =>
  tone === 'good'
    ? 'text-editorial-accent border-editorial-accent'
    : tone === 'warn'
      ? 'text-editorial-ink border-editorial-ink'
      : 'text-editorial-muted border-editorial-line';

const SentOffersView = ({ reloadKey }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokeTarget, setRevokeTarget] = useState<OfferRow | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [openContactId, setOpenContactId] = useState<string | null>(null);


  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shared_lists')
      .select(
        'id, token, label, created_at, expires_at, revoked_at, archived_at, last_viewed_at, view_count, contact_id, contacts(osoba, telefon)'
      )
      .order('last_viewed_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    if (error) {
      toast({
        title: 'Błąd odczytu',
        description: 'Nie udało się pobrać listy ofert',
        variant: 'destructive',
      });
    } else {
      setRows((data ?? []) as unknown as OfferRow[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

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
      <ul className="border-t border-editorial-line">
        {rows.map((row) => {
          const signal = signalOf(row);
          const active = !row.revoked_at && !row.archived_at;
          return (
            <li
              key={row.id}
              className="flex flex-wrap items-center gap-3 py-4 border-b border-editorial-line"
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
                    Zatrzymaj dostęp
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

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

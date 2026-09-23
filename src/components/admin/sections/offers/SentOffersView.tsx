import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Ban,
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  Pencil,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buildUrl } from '@/utils/offerToken';
import { matchesContactQuery, normalizeQuery } from '@/utils/contactSearch';
import { fmtDate } from '@/utils/contactLabels';
import { isOfferActive, offerState } from '@/utils/offerStatus';

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
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ContactCard from '../contacts/ContactCard';
import OfferEditDialog from './OfferEditDialog';
import AssignContactDialog from './AssignContactDialog';


interface Props {
  reloadKey: number;
}

interface OfferRow {
  id: string;
  token: string;
  label: string | null;
  note: string | null;
  channel: string | null;
  channel_detail: string | null;
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

/** Chip akcji: tylko gdy termin follow-upu wypada dziś lub minął. */
const callToday = (termin: string | null | undefined): boolean => {
  if (!termin) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${termin}T00:00:00`);
  return due.getTime() - today.getTime() <= 0;
};

/** Opis otwarć — wyłącznie view_count / last_viewed_at z shared_lists. */
const viewsText = (row: OfferRow): string =>
  row.view_count > 0
    ? `Oglądał ${row.view_count}×${row.last_viewed_at ? ` · ostatnio ${fmtDate(row.last_viewed_at)}` : ''}`
    : 'Brak otwarć';

const ACTION_CLASS =
  'h-9 w-9 rounded-none border-editorial-line text-editorial-muted hover:border-editorial-ink hover:bg-transparent hover:text-editorial-ink';

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}

const ActionButton = ({ label, onClick, destructive = false, children }: ActionButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onClick}
        aria-label={label}
        className={`${ACTION_CLASS} ${
          destructive ? 'hover:border-destructive hover:text-destructive' : ''
        }`}
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const SentOffersView = ({ reloadKey }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [completedOpen, setCompletedOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<OfferRow | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OfferRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openContactId, setOpenContactId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<OfferRow | null>(null);
  const [assignTarget, setAssignTarget] = useState<OfferRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shared_lists')
      .select(
        'id, token, label, note, channel, channel_detail, created_at, expires_at, revoked_at, archived_at, last_viewed_at, view_count, contact_id, contacts(osoba, firma, telefon, email, termin_followup, krok)'
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
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const visible = useMemo(
    () =>
      rows.filter(
        (row) =>
          matchesContactQuery(row.contacts ?? {}, query) ||
          (row.label ?? '').toLowerCase().includes(normalizeQuery(query))
      ),
    [rows, query]
  );

  const activeRows = useMemo(() => visible.filter(isOfferActive), [visible]);
  const completedRows = useMemo(() => visible.filter((row) => !isOfferActive(row)), [visible]);

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

  /** Archiwizacja: oferta znika z aktywnej pracy, ale rekord i historia zostają. */
  const handleArchive = async (row: OfferRow) => {
    const { error } = await supabase
      .from('shared_lists')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', row.id);
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✓ Oferta zarchiwizowana', description: 'Dane kontaktu i historia zostają' });
    await load();
  };

  /** Usunięcie dotyczy wyłącznie oferty — kontakt i jego historia zostają. */
  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const { error } = await supabase.from('shared_lists').delete().eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
      return;
    }
    setDeleteTarget(null);
    toast({ title: 'Oferta usunięta', description: 'Kontakt i historia rozmów pozostały' });
    await load();
  };

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-editorial-muted" />;
  if (rows.length === 0)
    return <p className="text-xs text-editorial-muted italic">Brak wysłanych ofert.</p>;

  const renderOffer = (row: OfferRow) => {
    const state = offerState(row);
    const urgent = callToday(row.contacts?.termin_followup);
    const offerName = row.label?.trim() || `Oferta ${row.id.slice(0, 8)}`;
    const contactName = row.contact_id
      ? row.contacts?.osoba || row.contacts?.firma || 'Kontakt bez nazwy'
      : 'Brak przypisanego kontaktu';
    const accessibleLink = !row.revoked_at && !row.archived_at;

    return (
      <li key={row.id} className="min-w-0 border-b border-editorial-line py-2.5 sm:py-3">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <h3 className="min-w-0 flex-1 break-words text-sm font-medium text-editorial-ink">
            {offerName}
          </h3>
          <span
            className={`shrink-0 border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${state.className}`}
          >
            {state.label}
          </span>
        </div>

        <button
          type="button"
          onClick={() => row.contact_id && setOpenContactId(row.contact_id)}
          disabled={!row.contact_id}
          className="mt-0.5 block max-w-full truncate text-left text-xs text-editorial-muted disabled:cursor-default"
        >
          {contactName}
        </button>

        {urgent && (
          <span className="mt-1 inline-block border border-destructive bg-destructive/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-destructive motion-safe:animate-pulse">
            Zadzwoń dziś
          </span>
        )}

        <p className="mt-1 min-w-0 break-words text-[11px] leading-snug text-editorial-muted">
          {viewsText(row)} · Wysłano {fmtDate(row.created_at)} · Ważna do {fmtDate(row.expires_at)}
        </p>

        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
          {!row.contact_id && (
            <ActionButton label="Przypisz kontakt" onClick={() => setAssignTarget(row)}>
              <UserPlus />
            </ActionButton>
          )}
          <ActionButton label="Kopiuj link" onClick={() => void copy(buildUrl(row.token))}>
            <Copy />
          </ActionButton>
          <ActionButton label="Edytuj ofertę" onClick={() => setEditTarget(row)}>
            <Pencil />
          </ActionButton>
          {accessibleLink && (
            <ActionButton label="Zatrzymaj ofertę" onClick={() => setRevokeTarget(row)} destructive>
              <Ban />
            </ActionButton>
          )}
          {!row.archived_at && (
            <ActionButton label="Archiwizuj ofertę" onClick={() => void handleArchive(row)}>
              <Archive />
            </ActionButton>
          )}
          <ActionButton label="Usuń ofertę" onClick={() => setDeleteTarget(row)} destructive>
            <Trash2 />
          </ActionButton>
        </div>
      </li>
    );
  };

  return (
    <TooltipProvider delayDuration={250}>
    <div className="w-full max-w-4xl min-w-0 overflow-x-hidden">
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
        <div className="min-w-0">
          <section aria-labelledby="active-offers-heading">
            <div className="flex items-center justify-between gap-3 border-b border-editorial-line pb-2">
              <h2 id="active-offers-heading" className="text-[11px] font-bold uppercase tracking-wider text-editorial-muted">
                Aktywne i wymagające uwagi
              </h2>
              <span className="text-[11px] tabular-nums text-editorial-muted">{activeRows.length}</span>
            </div>
            {activeRows.length > 0 ? (
              <ul>{activeRows.map(renderOffer)}</ul>
            ) : (
              <p className="py-4 text-xs italic text-editorial-muted">Brak aktywnych ofert.</p>
            )}
          </section>

          <section className="mt-6" aria-labelledby="completed-offers-heading">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCompletedOpen((open) => !open)}
              aria-expanded={completedOpen}
              aria-controls="completed-offers-list"
              className="h-auto w-full justify-between rounded-none border-y border-editorial-line px-0 py-3 hover:bg-transparent"
            >
              <span className="flex min-w-0 items-center gap-2">
                {completedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span id="completed-offers-heading" className="text-left text-[11px] font-bold uppercase tracking-wider text-editorial-muted">
                  Zakończone i archiwalne · {completedRows.length}
                </span>
              </span>
            </Button>
            {completedOpen && (
              <div id="completed-offers-list">
                {completedRows.length > 0 ? (
                  <ul>{completedRows.map(renderOffer)}</ul>
                ) : (
                  <p className="py-4 text-xs italic text-editorial-muted">Brak zakończonych ofert.</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      <ContactCard
        contactId={openContactId}
        onClose={() => setOpenContactId(null)}
        onChanged={() => void load()}
      />

      <OfferEditDialog
        offer={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => void load()}
      />

      <AssignContactDialog
        offer={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={() => void load()}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć ofertę?</AlertDialogTitle>
            <AlertDialogDescription>
              Oferta {deleteTarget?.label ? `„${deleteTarget.label}” ` : ''}zostanie usunięta razem z
              linkiem i statystykami otwarć. Kontakt i jego historia rozmów pozostaną bez zmian.
              Jeśli chcesz tylko schować ofertę z bieżącej pracy, użyj archiwizacji.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
            >
              Usuń ofertę
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
};

export default SentOffersView;

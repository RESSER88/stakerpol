import { useCallback, useEffect, useState } from 'react';
import { Copy, Link2, Loader2, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buildToken, buildUrl, MAX_TOKEN_ATTEMPTS } from '@/utils/offerToken';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CallForm from './CallForm';

interface Props {
  contactId: string | null;
  onClose: () => void;
  /** Wywoływane po zmianie danych kontaktu (zapis rozmowy, nowy link). */
  onChanged?: () => void;
}

interface ContactRow {
  id: string;
  osoba: string | null;
  firma: string | null;
  telefon: string | null;
  email: string | null;
  zrodlo: string;
  krok: string;
  termin_followup: string | null;
  udzwig_kg: number | null;
  wysokosc_m: number | null;
}

interface OfferRow {
  id: string;
  token: string;
  label: string | null;
  filters: unknown;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  archived_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  renewed_from: string | null;
}

interface ActivityRow {
  id: string;
  typ: string;
  data: string;
  tresc: string | null;
  wynik: string | null;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pl-PL', { dateStyle: 'short', timeStyle: 'short' });

const KROK_LABELS: Record<string, string> = {
  nowy: 'Nowy',
  oferta: 'Oferta',
  oddzwonic: 'Oddzwonić',
  porownuje: 'Porównuje',
  cena: 'Cena',
  nieaktualne: 'Nieaktualne',
};

const TYP_LABELS: Record<string, string> = {
  telefon: 'Rozmowa',
  formularz: 'Zgłoszenie z WWW',
  oferta: 'Oferta',
  sprzedaz: 'Sprzedaż',
  cofniecie_sprzedazy: 'Cofnięcie sprzedaży',
  ukrycie: 'Ukrycie',
  notatka: 'Notatka',
};

type OfferState = 'aktywna' | 'wygasła' | 'zatrzymana' | 'archiwalna';

const offerState = (o: OfferRow): OfferState => {
  if (o.archived_at) return 'archiwalna';
  if (o.revoked_at) return 'zatrzymana';
  if (new Date(o.expires_at).getTime() < Date.now()) return 'wygasła';
  return 'aktywna';
};

const ContactCard = ({ contactId, onClose, onChanged }: Props) => {
  const { toast } = useToast();
  const [contact, setContact] = useState<ContactRow | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [renewing, setRenewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    const [c, o, a] = await Promise.all([
      supabase
        .from('contacts')
        .select('id, osoba, firma, telefon, email, zrodlo, krok, termin_followup, udzwig_kg, wysokosc_m')
        .eq('id', contactId)
        .maybeSingle(),
      supabase
        .from('shared_lists')
        .select(
          'id, token, label, filters, created_at, expires_at, revoked_at, archived_at, view_count, last_viewed_at, renewed_from'
        )
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false }),
      supabase
        .from('contact_activities')
        .select('id, typ, data, tresc, wynik')
        .eq('contact_id', contactId)
        .order('data', { ascending: false }),
    ]);

    if (c.error) {
      toast({ title: 'Błąd odczytu', description: c.error.message, variant: 'destructive' });
    }
    setContact((c.data ?? null) as ContactRow | null);
    setOffers((o.data ?? []) as OfferRow[]);
    setActivities((a.data ?? []) as ActivityRow[]);
    setLoading(false);
  }, [contactId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: '✓ Skopiowano', description: 'Adres linku jest w schowku' });
    } catch {
      toast({ title: 'Błąd', description: 'Nie udało się skopiować adresu', variant: 'destructive' });
    }
  };

  const renew = async (offer: OfferRow) => {
    if (!contact || renewing) return;
    setRenewing(offer.id);
    const nazwa = offer.label || contact.osoba || contact.firma || 'Oferta';
    try {
      let token = '';
      let lastError: unknown = null;
      for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt++) {
        const candidate = buildToken(nazwa);
        const { error } = await supabase.rpc('create_offer', {
          _token: candidate,
          _filters: JSON.parse(JSON.stringify(offer.filters ?? {})),
          _nazwa: nazwa,
          _telefon: contact.telefon ?? '',
          _email: contact.email ?? undefined,
          _tygodnie: 2,
          _renewed_from: offer.id,
        });
        if (!error) {
          token = candidate;
          lastError = null;
          break;
        }
        lastError = error;
        if ((error as { code?: string }).code !== '23505') break;
      }
      if (!token) throw lastError;
      toast({ title: '✓ Nowy link utworzony', description: buildUrl(token) });
      await load();
      onChanged?.();
    } catch (e) {
      toast({
        title: 'Błąd',
        description: (e as { message?: string })?.message || 'Nie udało się utworzyć nowego linku',
        variant: 'destructive',
      });
    } finally {
      setRenewing(null);
    }
  };

  return (
    <Dialog open={!!contactId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-editorial text-xl text-editorial-ink">
            {contact?.osoba || contact?.firma || 'Kontakt'}
          </DialogTitle>
          <DialogDescription className="text-[11px] uppercase tracking-wider text-editorial-muted">
            {contact ? `${KROK_LABELS[contact.krok] ?? contact.krok} · źródło: ${contact.zrodlo}` : '—'}
          </DialogDescription>
        </DialogHeader>

        {loading && <Loader2 className="h-4 w-4 animate-spin text-editorial-muted" />}

        {contact && (
          <div className="space-y-6">
            <div className="space-y-1 text-sm text-editorial-ink">
              {contact.firma && <div className="text-editorial-muted">{contact.firma}</div>}
              {contact.telefon && (
                <a href={`tel:${contact.telefon}`} className="flex items-center gap-2 hover:text-editorial-accent">
                  <Phone className="h-3.5 w-3.5" />
                  {contact.telefon}
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-editorial-accent">
                  <Mail className="h-3.5 w-3.5" />
                  {contact.email}
                </a>
              )}
              <div className="text-[11px] text-editorial-muted pt-1">
                Termin powrotu: {contact.termin_followup ? fmtDate(contact.termin_followup) : 'brak'}
                {contact.udzwig_kg ? ` · ${contact.udzwig_kg} kg` : ''}
                {contact.wysokosc_m ? ` · ${contact.wysokosc_m} m` : ''}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-editorial-muted mb-3">
                Oferty ({offers.length})
              </div>
              {offers.length === 0 ? (
                <p className="text-xs text-editorial-muted italic">Brak ofert.</p>
              ) : (
                <ul className="border-t border-editorial-line">
                  {offers.map((o) => {
                    const state = offerState(o);
                    const canRenew = state !== 'aktywna';
                    return (
                      <li key={o.id} className="py-3 border-b border-editorial-line">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-editorial-ink">{o.label || 'Bez nazwy'}</span>
                          <span className="text-[10px] uppercase tracking-wider border px-1.5 py-0.5 border-editorial-line text-editorial-muted">
                            {state}
                          </span>
                          {o.renewed_from && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-editorial-accent">
                              <Link2 className="h-3 w-3" />
                              odnowiona
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-editorial-muted mt-1">
                          {o.view_count} {o.view_count === 1 ? 'otwarcie' : 'otwarć'} · do{' '}
                          {fmtDate(o.expires_at)}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => copy(buildUrl(o.token))}
                            aria-label="Kopiuj adres linku"
                            className="p-2 border border-editorial-line hover:border-editorial-ink"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          {canRenew && (
                            <button
                              type="button"
                              onClick={() => void renew(o)}
                              disabled={renewing === o.id}
                              className="h-9 px-3 text-[11px] uppercase tracking-wider border border-editorial-line text-editorial-ink hover:border-editorial-ink disabled:opacity-40"
                            >
                              {renewing === o.id ? 'Tworzę…' : 'Nowy link'}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-editorial-muted mb-3">
                Historia ({activities.length})
              </div>
              {activities.length === 0 ? (
                <p className="text-xs text-editorial-muted italic">Brak wpisów.</p>
              ) : (
                <ul className="border-t border-editorial-line">
                  {activities.map((a) => (
                    <li key={a.id} className="py-3 border-b border-editorial-line">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-editorial-ink">
                          {TYP_LABELS[a.typ] ?? a.typ}
                        </span>
                        <span className="text-[11px] text-editorial-muted">{fmtDateTime(a.data)}</span>
                      </div>
                      {a.tresc && (
                        <p className="text-sm text-editorial-ink whitespace-pre-wrap mt-1">{a.tresc}</p>
                      )}
                      {a.wynik && <p className="text-[11px] text-editorial-muted mt-1">{a.wynik}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <CallForm
              contactId={contact.id}
              udzwigStart={contact.udzwig_kg}
              wysokoscStart={contact.wysokosc_m}
              onSaved={() => {
                void load();
                onChanged?.();
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactCard;

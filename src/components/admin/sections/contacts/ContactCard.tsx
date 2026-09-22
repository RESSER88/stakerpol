import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Copy, EyeOff, Link2, Loader2, Mail, Pencil, Phone, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buildToken, buildUrl, MAX_TOKEN_ATTEMPTS } from '@/utils/offerToken';
import { fmtDate, fmtDateTime, KROK_OPTIONS, krokLabel, typLabel } from '@/utils/contactLabels';
import { offerState } from '@/utils/offerStatus';
import { emailError, phoneError } from '@/utils/contactValidation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import CallForm from './CallForm';
import OfferEditDialog, { EditableOffer } from '../offers/OfferEditDialog';

interface Props {
  contactId: string | null;
  onClose: () => void;
  /** Wywoływane po zmianie danych kontaktu (zapis rozmowy, nowy link, usunięcie). */
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
  termin_followup_note: string | null;
  udzwig_kg: number | null;
  wysokosc_m: number | null;
}

interface OfferRow {
  id: string;
  token: string;
  label: string | null;
  note: string | null;
  filters: unknown;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  archived_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  renewed_from: string | null;
  channel: string | null;
  channel_detail: string | null;
  contact_id: string | null;
}

interface ActivityRow {
  id: string;
  typ: string;
  data: string;
  tresc: string | null;
  wynik: string | null;
  shared_list_id: string | null;
}

type EditableKey = 'osoba' | 'firma' | 'telefon' | 'email' | 'krok' | 'termin_followup' | 'termin_note';

type Draft = Record<EditableKey, string>;

const toDraft = (c: ContactRow): Draft => ({
  osoba: c.osoba ?? '',
  firma: c.firma ?? '',
  telefon: c.telefon ?? '',
  email: c.email ?? '',
  krok: c.krok,
  termin_followup: c.termin_followup ?? '',
  termin_note: c.termin_followup_note ?? '',
});

const inputClass =
  'w-full bg-transparent border-b border-editorial-line py-1.5 text-sm text-editorial-ink placeholder:text-editorial-muted/60 focus:outline-none focus:border-editorial-ink';

const labelClass = 'block text-[10px] uppercase tracking-[0.2em] text-editorial-muted mb-1';

const sectionTitle = 'text-[11px] font-bold uppercase tracking-[0.2em] text-editorial-muted mb-3';

const ContactCard = ({ contactId, onClose, onChanged }: Props) => {
  const { toast } = useToast();
  const [contact, setContact] = useState<ContactRow | null>(null);
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [renewing, setRenewing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(
    { osoba: '', firma: '', telefon: '', email: '', krok: 'nowy', termin_followup: '', termin_note: '' }
  );
  const [savingFields, setSavingFields] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editingFollowup, setEditingFollowup] = useState(false);
  const [editOffer, setEditOffer] = useState<OfferRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    const [c, o, a] = await Promise.all([
      supabase
        .from('contacts')
        .select(
          'id, osoba, firma, telefon, email, zrodlo, krok, termin_followup, termin_followup_note, udzwig_kg, wysokosc_m'
        )
        .eq('id', contactId)
        .maybeSingle(),
      supabase
        .from('shared_lists')
        .select(
          'id, token, label, note, filters, created_at, expires_at, revoked_at, archived_at, view_count, last_viewed_at, renewed_from, channel, channel_detail, contact_id'
        )
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false }),
      supabase
        .from('contact_activities')
        .select('id, typ, data, tresc, wynik, shared_list_id')
        .eq('contact_id', contactId)
        .order('data', { ascending: false }),
    ]);

    if (c.error) {
      toast({ title: 'Błąd odczytu', description: c.error.message, variant: 'destructive' });
    }
    const row = (c.data ?? null) as ContactRow | null;
    setContact(row);
    if (row) setDraft(toDraft(row));
    setOffers((o.data ?? []) as OfferRow[]);
    setActivities((a.data ?? []) as ActivityRow[]);
    setLoading(false);
  }, [contactId, toast]);

  useEffect(() => {
    setEditing(false);
    setEditingFollowup(false);
    setEditOffer(null);
    void load();
  }, [load]);

  /**
   * Jedna oferta = jeden wpis w historii. Rekord z contact_activities ma
   * pierwszeństwo; pozycję syntetyczną ze shared_lists dokładamy tylko dla
   * ofert, które nie mają własnego wpisu (dane historyczne sprzed zmiany).
   */
  const timeline = useMemo(() => {
    const offerById = new Map(offers.map((o) => [o.id, o]));
    const coveredOffers = new Set(
      activities.map((a) => a.shared_list_id).filter(Boolean) as string[]
    );

    const items: {
      key: string;
      at: string;
      label: string;
      tresc: string | null;
      wynik: string | null;
      offer?: OfferRow;
    }[] = activities.map((a) => {
      const offer = a.shared_list_id ? offerById.get(a.shared_list_id) : undefined;
      return {
        key: `a-${a.id}`,
        at: a.data,
        label: typLabel(a.typ),
        tresc: a.tresc ?? (offer ? offer.label || 'Bez nazwy' : null),
        wynik: offer
          ? `${offerState(offer).label} · ${offer.view_count} ${
              offer.view_count === 1 ? 'otwarcie' : 'otwarć'
            } · do ${fmtDate(offer.expires_at)}`
          : a.wynik,
        offer,
      };
    });

    for (const o of offers) {
      if (coveredOffers.has(o.id)) continue;
      const at = o.revoked_at ?? o.archived_at ?? o.created_at;
      const label = o.revoked_at
        ? 'Oferta zatrzymana'
        : o.renewed_from
          ? 'Oferta odnowiona'
          : 'Oferta utworzona';
      items.push({
        key: `o-${o.id}`,
        at,
        label,
        tresc: o.label || 'Bez nazwy',
        wynik: `${offerState(o).label} · ${o.view_count} ${
          o.view_count === 1 ? 'otwarcie' : 'otwarć'
        } · do ${fmtDate(o.expires_at)}`,
        offer: o,
      });
    }

    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [activities, offers]);

  const telError = phoneError(draft.telefon);
  const mailError = emailError(draft.email);

  const saveFields = async () => {
    if (!contact || savingFields) return;
    if (telError || mailError) return;
    setSavingFields(true);
    const payload = {
      osoba: draft.osoba.trim() || null,
      firma: draft.firma.trim() || null,
      telefon: draft.telefon.trim() || null,
      email: draft.email.trim() || null,
      krok: draft.krok,
      termin_followup: draft.termin_followup || null,
      termin_followup_note: draft.termin_note.trim() || null,
    };
    const { error } = await supabase.from('contacts').update(payload).eq('id', contact.id);
    setSavingFields(false);
    if (error) {
      toast({ title: 'Błąd zapisu', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✓ Zapisano', description: 'Dane kontaktu zaktualizowane' });
    setEditing(false);
    await load();
    onChanged?.();
  };

  const saveFollowup = async () => {
    if (!contact || savingFields) return;
    setSavingFields(true);
    const { error } = await supabase
      .from('contacts')
      .update({
        termin_followup: draft.termin_followup || null,
        termin_followup_note: draft.termin_note.trim() || null,
      })
      .eq('id', contact.id);
    setSavingFields(false);
    if (error) {
      toast({ title: 'Błąd zapisu', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✓ Zapisano', description: 'Następny kontakt został zaktualizowany' });
    setEditingFollowup(false);
    await load();
    onChanged?.();
  };

  const editableOffer = useMemo<EditableOffer | null>(() => {
    if (!editOffer || !contact) return null;
    return {
      id: editOffer.id,
      label: editOffer.label,
      note: editOffer.note,
      channel: editOffer.channel,
      channel_detail: editOffer.channel_detail,
      contact_id: editOffer.contact_id,
      contacts: {
        osoba: contact.osoba,
        firma: contact.firma,
        telefon: contact.telefon,
        email: contact.email,
      },
    };
  }, [contact, editOffer]);

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
          _telefon: contact.telefon ?? undefined,
          _email: contact.email ?? undefined,
          _tygodnie: 2,
          _renewed_from: offer.id,
          _firma: contact.firma ?? undefined,
          _kanal: offer.channel ?? undefined,
          _kanal_detail: offer.channel_detail ?? undefined,
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

  const hideContact = async () => {
    if (!contact) return;
    const { error } = await supabase
      .from('contacts')
      .update({ ukryty: true })
      .eq('id', contact.id);
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✓ Kontakt ukryty', description: 'Zniknął z listy, dane zostały zachowane' });
    onChanged?.();
    onClose();
  };

  const deleteContact = async () => {
    if (!contact || deleting) return;
    setDeleting(true);
    const { error } = await supabase.from('contacts').delete().eq('id', contact.id);
    setDeleting(false);
    if (error) {
      toast({ title: 'Błąd', description: error.message, variant: 'destructive' });
      return;
    }
    setConfirmDelete(false);
    toast({ title: 'Kontakt usunięty', description: 'Oferty pozostały bez przypisanego kontaktu' });
    onChanged?.();
    onClose();
  };

  return (
    <Dialog open={!!contactId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <DialogTitle className="font-editorial text-xl text-editorial-ink">
            {contact?.osoba || contact?.firma || 'Kontakt'}
          </DialogTitle>
          <DialogDescription className="text-[11px] uppercase tracking-wider text-editorial-muted">
            {contact ? `Krok: ${krokLabel(contact.krok)}` : 'Karta kontaktu'}
          </DialogDescription>
        </DialogHeader>

        {loading && <Loader2 className="h-4 w-4 animate-spin text-editorial-muted" />}

        {contact && (
          <div className="space-y-6">
             <section className="space-y-3 text-sm text-editorial-ink">
              {!editing ? (
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                     {contact.firma && contact.osoba && (
                       <p className="text-sm text-editorial-muted">{contact.firma}</p>
                     )}
                    {contact.telefon && (
                      <a
                        href={`tel:${contact.telefon}`}
                        className="flex items-center gap-2 text-sm text-editorial-ink hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5 text-editorial-muted" />
                        {contact.telefon}
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-sm text-editorial-ink hover:underline break-all"
                      >
                        <Mail className="h-3.5 w-3.5 text-editorial-muted shrink-0" />
                        {contact.email}
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(toDraft(contact));
                      setEditing(true);
                    }}
                    aria-label="Edytuj dane kontaktu"
                    className="p-2 shrink-0 border border-editorial-line hover:border-editorial-ink"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label htmlFor="contact-osoba" className={labelClass}>
                      Osoba
                    </label>
                    <input
                      id="contact-osoba"
                      value={draft.osoba}
                      onChange={(e) => setDraft((d) => ({ ...d, osoba: e.target.value }))}
                      placeholder="Imię i nazwisko"
                      className={inputClass}
                    />
                  </div>
                   <div>
                     <label htmlFor="contact-krok" className={labelClass}>
                       Krok
                     </label>
                     <select
                       id="contact-krok"
                       value={draft.krok}
                       onChange={(e) => setDraft((d) => ({ ...d, krok: e.target.value }))}
                       className={inputClass}
                     >
                       {KROK_OPTIONS.map((option) => (
                         <option key={option.value} value={option.value}>
                           {option.label}
                         </option>
                       ))}
                     </select>
                   </div>
                  <div>
                    <label htmlFor="contact-firma" className={labelClass}>
                      Firma
                    </label>
                    <input
                      id="contact-firma"
                      value={draft.firma}
                      onChange={(e) => setDraft((d) => ({ ...d, firma: e.target.value }))}
                      placeholder="Nazwa firmy"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-telefon" className={labelClass}>
                      Telefon
                    </label>
                    <input
                      id="contact-telefon"
                      value={draft.telefon}
                      onChange={(e) => setDraft((d) => ({ ...d, telefon: e.target.value }))}
                      placeholder="np. +48 123 456 789"
                      className={inputClass}
                    />
                    {telError && <p className="text-[11px] text-destructive mt-1">{telError}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className={labelClass}>
                      E-mail
                    </label>
                    <input
                      id="contact-email"
                      value={draft.email}
                      onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                      placeholder="adres@firma.pl"
                      className={inputClass}
                    />
                    {mailError && <p className="text-[11px] text-destructive mt-1">{mailError}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="contact-termin" className={labelClass}>
                        Następny kontakt
                      </label>
                      <input
                        id="contact-termin"
                        type="date"
                        value={draft.termin_followup}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, termin_followup: e.target.value }))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-termin-note" className={labelClass}>
                        Powód
                      </label>
                      <input
                        id="contact-termin-note"
                        value={draft.termin_note}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, termin_note: e.target.value.slice(0, 160) }))
                        }
                        placeholder="np. potwierdzić termin"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void saveFields()}
                      disabled={savingFields || !!telError || !!mailError}
                      className="h-9 px-3 text-[11px] uppercase tracking-wider border border-editorial-ink bg-editorial-ink text-background disabled:opacity-40"
                    >
                      {savingFields ? 'Zapisuję…' : 'Zapisz'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(toDraft(contact));
                        setEditing(false);
                      }}
                      disabled={savingFields}
                      className="h-9 px-3 text-[11px] uppercase tracking-wider border border-editorial-line text-editorial-muted hover:border-editorial-ink"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              )}
             </section>

             <section className="border-y border-editorial-line py-4">
               <div className="flex items-start justify-between gap-3">
                 <div className="min-w-0">
                   <div className={sectionTitle}>Następny kontakt</div>
                   {!editingFollowup && (
                     <>
                       <div className="flex items-center gap-2 text-sm text-editorial-ink">
                         <CalendarDays className="h-4 w-4 shrink-0 text-editorial-muted" />
                         {contact.termin_followup
                           ? fmtDate(contact.termin_followup)
                           : 'Brak zaplanowanego kontaktu'}
                       </div>
                       {contact.termin_followup_note && (
                         <p className="mt-1.5 pl-6 text-xs text-editorial-muted">
                           {contact.termin_followup_note}
                         </p>
                       )}
                     </>
                   )}
                 </div>
                 {!editingFollowup && (
                   <button
                     type="button"
                     onClick={() => {
                       setDraft(toDraft(contact));
                       setEditingFollowup(true);
                     }}
                     aria-label="Edytuj następny kontakt"
                     className="p-2 shrink-0 border border-editorial-line hover:border-editorial-ink"
                   >
                     <Pencil className="h-3.5 w-3.5" />
                   </button>
                 )}
               </div>
               {editingFollowup && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div>
                     <label htmlFor="quick-followup-date" className={labelClass}>Data</label>
                     <input
                       id="quick-followup-date"
                       type="date"
                       value={draft.termin_followup}
                       onChange={(e) => setDraft((d) => ({ ...d, termin_followup: e.target.value }))}
                       className={inputClass}
                     />
                   </div>
                   <div>
                     <label htmlFor="quick-followup-note" className={labelClass}>Powód</label>
                     <input
                       id="quick-followup-note"
                       value={draft.termin_note}
                       onChange={(e) => setDraft((d) => ({ ...d, termin_note: e.target.value.slice(0, 160) }))}
                       placeholder="np. potwierdzić termin"
                       className={inputClass}
                     />
                   </div>
                   <div className="flex items-center gap-2 sm:col-span-2">
                     <button
                       type="button"
                       onClick={() => void saveFollowup()}
                       disabled={savingFields}
                       className="h-9 px-3 text-[11px] uppercase tracking-wider border border-editorial-ink bg-editorial-ink text-background disabled:opacity-40"
                     >
                       {savingFields ? 'Zapisuję…' : 'Zapisz'}
                     </button>
                     <button
                       type="button"
                       onClick={() => {
                         setDraft(toDraft(contact));
                         setEditingFollowup(false);
                       }}
                       disabled={savingFields}
                       className="h-9 px-3 text-[11px] uppercase tracking-wider border border-editorial-line text-editorial-muted hover:border-editorial-ink"
                     >
                       Anuluj
                     </button>
                   </div>
                 </div>
               )}
             </section>

            <div>
              <div className={sectionTitle}>Oferty ({offers.length})</div>
              {offers.length === 0 ? (
                <p className="text-xs text-editorial-muted italic">Brak ofert.</p>
              ) : (
                <ul className="border-t border-editorial-line">
                  {offers.map((o) => {
                    const state = offerState(o);
                    return (
                       <li
                        key={o.id}
                         className="border-b border-editorial-line"
                      >
                        <div className="flex flex-wrap items-center gap-2 py-3">
                         <button
                           type="button"
                           onClick={() => setEditOffer(o)}
                           className="flex-1 min-w-0 text-left hover:opacity-70 transition-opacity"
                         >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-editorial-ink truncate">
                               {o.label || `Oferta ${o.id.slice(0, 8)}`}
                            </span>
                            <span
                              className={`text-[10px] uppercase tracking-wider border px-1.5 py-0.5 ${state.className}`}
                            >
                              {state.label}
                            </span>
                            {o.renewed_from && (
                              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-editorial-accent">
                                <Link2 className="h-3 w-3" />
                                odnowiona
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-editorial-muted mt-0.5">
                             {fmtDate(o.created_at)} · {o.view_count}{' '}
                             {o.view_count === 1 ? 'otwarcie' : 'otwarć'}
                          </div>
                         </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => copy(buildUrl(o.token))}
                            aria-label="Kopiuj adres linku"
                            className="p-2 border border-editorial-line hover:border-editorial-ink"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void renew(o)}
                            disabled={renewing === o.id}
                            className="h-9 px-3 text-[11px] uppercase tracking-wider border border-editorial-line text-editorial-ink hover:border-editorial-ink disabled:opacity-40"
                          >
                            {renewing === o.id ? 'Tworzę…' : 'Nowy link'}
                          </button>
                        </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <div className={sectionTitle}>Historia ({timeline.length})</div>
              {timeline.length === 0 ? (
                <p className="text-xs text-editorial-muted italic">Brak wpisów.</p>
              ) : (
                <ul className="border-t border-editorial-line">
                  {timeline.map((item) => (
                    <li key={item.key} className="py-3 border-b border-editorial-line">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-editorial-ink">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-editorial-muted">
                          {fmtDateTime(item.at)}
                        </span>
                      </div>
                      {item.tresc && (
                        <p className="text-sm text-editorial-ink whitespace-pre-wrap mt-1">
                          {item.tresc}
                        </p>
                      )}
                      {item.wynik && (
                        <p className="text-[11px] text-editorial-muted mt-1">{item.wynik}</p>
                      )}
                       {item.offer && (
                         <button
                           type="button"
                           onClick={() => setEditOffer(item.offer ?? null)}
                           className="mt-1.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-editorial-muted hover:text-editorial-ink"
                         >
                           <Link2 className="h-3 w-3" />
                           {item.offer.label || `Oferta ${item.offer.id.slice(0, 8)}`}
                         </button>
                       )}
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

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-editorial-line">
              <button
                type="button"
                onClick={() => void hideContact()}
                className="flex items-center gap-1.5 h-9 px-3 text-[11px] uppercase tracking-wider border border-editorial-line text-editorial-muted hover:border-editorial-ink"
              >
                <EyeOff className="h-3.5 w-3.5" />
                Ukryj kontakt
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 h-9 px-3 text-[11px] uppercase tracking-wider border border-editorial-line text-editorial-muted hover:border-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Usuń kontakt
              </button>
            </div>
          </div>
        )}

        <AlertDialog open={confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usunąć kontakt na stałe?</AlertDialogTitle>
              <AlertDialogDescription>
                Kontakt {contact?.osoba || contact?.firma || ''} ma {offers.length}{' '}
                {offers.length === 1 ? 'ofertę' : 'ofert'} i {activities.length}{' '}
                {activities.length === 1 ? 'wpis historii' : 'wpisów historii'}. Usunięcie skasuje
                całą historię tego kontaktu, a jego oferty zostaną bez przypisanego kontaktu (linki
                nadal będą działać). Operacji nie da się cofnąć — jeśli chcesz tylko schować kontakt
                z listy, użyj „Ukryj kontakt”.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void deleteContact();
                }}
                disabled={deleting}
              >
                Usuń kontakt
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <OfferEditDialog
          offer={editableOffer}
          onClose={() => setEditOffer(null)}
          onSaved={() => {
            setEditOffer(null);
            void load();
            onChanged?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ContactCard;

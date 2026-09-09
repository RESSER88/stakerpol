import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CHANNEL_OTHER, OFFER_CHANNEL_OPTIONS } from './offerChannels';

export interface EditableOffer {
  id: string;
  label: string | null;
  note: string | null;
  channel: string | null;
  channel_detail: string | null;
  contact_id: string | null;
  contacts: {
    osoba: string | null;
    firma: string | null;
    telefon: string | null;
    email: string | null;
  } | null;
}

interface Props {
  offer: EditableOffer | null;
  onClose: () => void;
  /** Po udanym zapisie — do odświeżenia listy. */
  onSaved: () => void;
}

const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label
    htmlFor={htmlFor}
    className="block text-[11px] uppercase tracking-wider text-editorial-muted mb-2"
  >
    {children}
  </label>
);

const inputClass =
  'w-full bg-transparent border-b border-editorial-line py-2 text-sm text-editorial-ink placeholder:text-editorial-muted/60 focus:outline-none focus:border-editorial-ink';

const OfferEditDialog = ({ offer, onClose, onSaved }: Props) => {
  const { toast } = useToast();
  const [nazwa, setNazwa] = useState('');
  const [firma, setFirma] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [notatka, setNotatka] = useState('');
  const [kanal, setKanal] = useState<string | null>(null);
  const [skad, setSkad] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!offer) return;
    setNazwa(offer.contacts?.osoba ?? offer.label ?? '');
    setFirma(offer.contacts?.firma ?? '');
    setTelefon(offer.contacts?.telefon ?? '');
    setEmail(offer.contacts?.email ?? '');
    setNotatka(offer.note ?? '');
    setKanal(offer.channel);
    setSkad(offer.channel_detail ?? '');
  }, [offer]);

  const canSave = nazwa.trim().length > 0;

  const save = async () => {
    if (!offer || saving || !canSave) return;
    setSaving(true);

    const channelDetail = kanal === CHANNEL_OTHER ? skad.trim() || null : null;

    const { error: listError } = await supabase
      .from('shared_lists')
      .update({
        label: nazwa.trim(),
        note: notatka.trim() || null,
        channel: kanal,
        channel_detail: channelDetail,
      })
      .eq('id', offer.id);

    if (listError) {
      setSaving(false);
      toast({ title: 'Błąd zapisu', description: listError.message, variant: 'destructive' });
      return;
    }

    if (offer.contact_id) {
      const { error: contactError } = await supabase
        .from('contacts')
        .update({
          osoba: nazwa.trim(),
          firma: firma.trim() || null,
          telefon: telefon.trim() || null,
          email: email.trim() || null,
        })
        .eq('id', offer.contact_id);
      if (contactError) {
        setSaving(false);
        toast({
          title: 'Oferta zapisana, kontakt nie',
          description: contactError.message,
          variant: 'destructive',
        });
        onSaved();
        onClose();
        return;
      }
    }

    setSaving(false);
    toast({ title: '✓ Zapisano', description: 'Dane oferty zaktualizowane' });
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!offer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-editorial text-xl text-editorial-ink">
            Edytuj ofertę
          </DialogTitle>
          <DialogDescription className="text-[11px] uppercase tracking-wider text-editorial-muted">
            Zapis aktualizuje istniejącą ofertę — nie tworzy nowej
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div>
            <Label htmlFor="edit-nazwa">Nazwa *</Label>
            <input
              id="edit-nazwa"
              value={nazwa}
              onChange={(e) => setNazwa(e.target.value.slice(0, 120))}
              placeholder="Nazwa klienta lub firmy"
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="edit-firma">Firma (opcjonalnie)</Label>
            <input
              id="edit-firma"
              value={firma}
              onChange={(e) => setFirma(e.target.value.slice(0, 160))}
              placeholder="Nazwa firmy"
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="edit-telefon">Telefon (opcjonalnie)</Label>
            <input
              id="edit-telefon"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              placeholder="np. +48 123 456 789"
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="edit-email">E-mail (opcjonalnie)</Label>
            <input
              id="edit-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adres@firma.pl"
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="edit-notatka">Notatka (opcjonalnie)</Label>
            <textarea
              id="edit-notatka"
              value={notatka}
              onChange={(e) => setNotatka(e.target.value)}
              rows={3}
              placeholder="Ustalenia z rozmowy"
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <Label>Kanał — skąd pochodzi klient (opcjonalnie)</Label>
            <div className="flex flex-wrap gap-2">
              {OFFER_CHANNEL_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setKanal(kanal === c.value ? null : c.value)}
                  className={`px-3 py-2 text-xs border transition-colors ${
                    kanal === c.value
                      ? 'border-editorial-ink bg-editorial-ink text-background'
                      : 'border-editorial-line text-editorial-muted hover:border-editorial-ink'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {kanal === CHANNEL_OTHER && (
              <div className="mt-3">
                <Label htmlFor="edit-skad">Skąd?</Label>
                <input
                  id="edit-skad"
                  value={skad}
                  onChange={(e) => setSkad(e.target.value.slice(0, 120))}
                  placeholder="np. Polecenie, Baner, Targi"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !canSave}
              className="h-9 px-4 text-[11px] uppercase tracking-wider border border-editorial-ink bg-editorial-ink text-background disabled:opacity-40"
            >
              {saving ? 'Zapisuję…' : 'Zapisz zmiany'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-9 px-4 text-[11px] uppercase tracking-wider border border-editorial-line text-editorial-muted hover:border-editorial-ink"
            >
              Anuluj
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OfferEditDialog;

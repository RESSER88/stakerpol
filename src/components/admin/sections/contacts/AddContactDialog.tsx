import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { emailError, phoneError } from '@/utils/contactValidation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Zwraca id nowego kontaktu — pozwala od razu przypisać go do oferty. */
  onCreated: (contactId: string) => void;
  /** Wstępnie wpisana nazwa (np. z nazwy oferty bez kontaktu). */
  initialName?: string;
}

const inputClass =
  'w-full bg-transparent border-b border-editorial-line py-2 text-sm text-editorial-ink placeholder:text-editorial-muted/60 focus:outline-none focus:border-editorial-ink';

const labelClass = 'block text-[11px] uppercase tracking-wider text-editorial-muted mb-2';

/** Minimalny formularz: osoba, firma, telefon, e-mail. Nic więcej. */
const AddContactDialog = ({ open, onClose, onCreated, initialName = '' }: Props) => {
  const { toast } = useToast();
  const [osoba, setOsoba] = useState(initialName);
  const [firma, setFirma] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOsoba(initialName);
    setFirma('');
    setTelefon('');
    setEmail('');
  }, [open, initialName]);

  const telError = phoneError(telefon);
  const mailError = emailError(email);
  const canSave = osoba.trim().length > 0 && !telError && !mailError;

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        osoba: osoba.trim(),
        firma: firma.trim() || null,
        telefon: telefon.trim() || null,
        email: email.trim() || null,
        // zrodlo pozostaje przy domyślnej wartości modelu ('telefon')
      })
      .select('id')
      .single();
    setSaving(false);

    if (error || !data) {
      toast({
        title: 'Błąd zapisu',
        description: error?.message ?? 'Nie udało się dodać kontaktu',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: '✓ Kontakt dodany', description: osoba.trim() });
    onCreated(data.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-editorial text-xl text-editorial-ink">Dodaj kontakt</DialogTitle>
          <DialogDescription className="text-[11px] uppercase tracking-wider text-editorial-muted">
            Wystarczy nazwa — resztę można uzupełnić później
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div>
            <label htmlFor="new-contact-osoba" className={labelClass}>
              Osoba *
            </label>
            <input
              id="new-contact-osoba"
              value={osoba}
              onChange={(e) => setOsoba(e.target.value.slice(0, 120))}
              placeholder="Imię i nazwisko"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="new-contact-firma" className={labelClass}>
              Firma
            </label>
            <input
              id="new-contact-firma"
              value={firma}
              onChange={(e) => setFirma(e.target.value.slice(0, 160))}
              placeholder="Nazwa firmy"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="new-contact-telefon" className={labelClass}>
              Telefon
            </label>
            <input
              id="new-contact-telefon"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              placeholder="np. +48 123 456 789"
              className={inputClass}
            />
            {telError && <p className="text-[11px] text-destructive mt-1">{telError}</p>}
          </div>

          <div>
            <label htmlFor="new-contact-email" className={labelClass}>
              E-mail
            </label>
            <input
              id="new-contact-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adres@firma.pl"
              className={inputClass}
            />
            {mailError && <p className="text-[11px] text-destructive mt-1">{mailError}</p>}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => void save()}
              disabled={!canSave || saving}
              className="h-9 px-4 text-[11px] uppercase tracking-wider border border-editorial-ink bg-editorial-ink text-background disabled:opacity-40"
            >
              {saving ? 'Zapisuję…' : 'Zapisz'}
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

export default AddContactDialog;

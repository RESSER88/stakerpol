import { useCallback, useEffect, useState } from 'react';
import { Loader2, Search, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { matchesContactQuery } from '@/utils/contactSearch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AddContactDialog from '../contacts/AddContactDialog';

interface Props {
  /** Oferta bez kontaktu — jej id i nazwa historyczna (label). */
  offer: { id: string; label: string | null } | null;
  onClose: () => void;
  onAssigned: () => void;
}

interface Row {
  id: string;
  osoba: string | null;
  firma: string | null;
  telefon: string | null;
  email: string | null;
}

/** Przypisanie oferty do kontaktu — ustawia tylko shared_lists.contact_id. */
const AssignContactDialog = ({ offer, onClose, onAssigned }: Props) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    if (!offer) return;
    setQuery('');
    setLoading(true);
    void (async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, osoba, firma, telefon, email')
        .eq('ukryty', false)
        .order('zaktualizowany', { ascending: false })
        .limit(300);
      if (error) {
        toast({ title: 'Błąd odczytu', description: error.message, variant: 'destructive' });
      }
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, [offer, toast]);

  const assign = useCallback(
    async (contactId: string) => {
      if (!offer || saving) return;
      setSaving(true);
      const { error } = await supabase
        .from('shared_lists')
        .update({ contact_id: contactId })
        .eq('id', offer.id);
      setSaving(false);
      if (error) {
        toast({ title: 'Błąd zapisu', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: '✓ Przypisano', description: 'Oferta jest powiązana z kontaktem' });
      onAssigned();
      onClose();
    },
    [offer, saving, toast, onAssigned, onClose]
  );

  const visible = rows.filter((r) => matchesContactQuery(r, query)).slice(0, 40);

  return (
    <>
      <Dialog open={!!offer} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-editorial text-xl text-editorial-ink">
              Przypisz kontakt
            </DialogTitle>
            <DialogDescription className="text-[11px] uppercase tracking-wider text-editorial-muted">
              {offer?.label ? `Oferta: ${offer.label}` : 'Oferta bez kontaktu'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 border-b border-editorial-line">
            <Search className="h-3.5 w-3.5 text-editorial-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj: osoba, firma, telefon, e-mail"
              aria-label="Szukaj kontaktu do przypisania"
              className="w-full bg-transparent py-2 text-sm text-editorial-ink placeholder:text-editorial-muted/60 focus:outline-none"
            />
          </div>

          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-editorial-muted" />
          ) : visible.length === 0 ? (
            <p className="text-xs text-editorial-muted italic">Brak wyników.</p>
          ) : (
            <ul className="border-t border-editorial-line">
              {visible.map((r) => (
                <li key={r.id} className="border-b border-editorial-line">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void assign(r.id)}
                    className="w-full text-left py-3 px-1 hover:bg-editorial-line/30 disabled:opacity-40"
                  >
                    <div className="text-sm text-editorial-ink">
                      {r.osoba || r.firma || 'Bez nazwy'}
                      {r.firma && r.osoba && (
                        <span className="text-[11px] text-editorial-muted"> · {r.firma}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-editorial-muted mt-0.5">
                      {r.telefon || 'brak telefonu'}
                      {r.email ? ` · ${r.email}` : ''}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 h-9 px-3 text-[11px] uppercase tracking-wider border border-editorial-ink bg-editorial-ink text-background"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Utwórz nowy kontakt
          </button>
        </DialogContent>
      </Dialog>

      <AddContactDialog
        open={addOpen}
        initialName={offer?.label ?? ''}
        onClose={() => setAddOpen(false)}
        onCreated={(id) => void assign(id)}
      />
    </>
  );
};

export default AssignContactDialog;

import { useCallback, useEffect, useState } from 'react';
import { Copy, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types';
import ExportFilterPanel from '../ExportFilterPanel';
import {
  ExportFilterCriteria,
  DEFAULT_EXPORT_CRITERIA,
} from '@/utils/exportFilterCriteria';
import { buildToken, buildUrl, MAX_TOKEN_ATTEMPTS } from '@/utils/offerToken';

interface Props {
  products: Product[];
  onCreated: () => void;
}

const WEEK_OPTIONS = [1, 2, 3, 4] as const;

const CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'email', label: 'E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
  { value: 'telefon', label: 'Telefon' },
];

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

const NewOfferView = ({ products, onCreated }: Props) => {
  const { toast } = useToast();
  const [filtered, setFiltered] = useState<Product[]>(products);
  const [criteria, setCriteria] = useState<ExportFilterCriteria>(DEFAULT_EXPORT_CRITERIA);

  const [nazwa, setNazwa] = useState('');
  const [firma, setFirma] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [notatka, setNotatka] = useState('');
  const [kanal, setKanal] = useState<string | null>(null);
  const [weeks, setWeeks] = useState<number>(2);

  const [saving, setSaving] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  useEffect(() => {
    setFiltered(products);
  }, [products]);

  const handleFilterChange = useCallback((list: Product[], next: ExportFilterCriteria) => {
    setFiltered(list);
    setCriteria(next);
  }, []);

  const matchedCount = filtered.length;
  const canSubmit = matchedCount > 0 && nazwa.trim().length > 0 && telefon.trim().length > 0;

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: '✓ Skopiowano', description: 'Adres linku jest w schowku' });
    } catch {
      toast({ title: 'Błąd', description: 'Nie udało się skopiować adresu', variant: 'destructive' });
    }
  };

  const handleGenerate = async () => {
    if (saving || !canSubmit) return;
    setSaving(true);
    const nazwaValue = nazwa.trim();
    const firmaValue = firma.trim();
    try {
      let token = '';
      let kontaktNowy = true;
      let lastError: unknown = null;

      for (let attempt = 0; attempt < MAX_TOKEN_ATTEMPTS; attempt++) {
        const candidate = buildToken(nazwaValue);
        const { data, error } = await supabase.rpc('create_offer', {
          _token: candidate,
          _filters: JSON.parse(JSON.stringify(criteria)),
          _nazwa: nazwaValue,
          _telefon: telefon.trim(),
          _email: email.trim() || undefined,
          _tygodnie: weeks,
          _notatka: notatka.trim() || undefined,
          _kanal: kanal ?? undefined,
        });
        if (!error) {
          token = candidate;
          const row = Array.isArray(data) ? data[0] : data;
          kontaktNowy = row?.kontakt_nowy ?? true;
          // Firma nie jest parametrem create_offer — sygnatura funkcji zostaje
          // nietknięta, nazwę firmy dopisujemy osobnym UPDATE-em na kontakcie.
          if (firmaValue && row?.contact_id) {
            const { error: firmaError } = await supabase
              .from('contacts')
              .update({ firma: firmaValue })
              .eq('id', row.contact_id);
            if (firmaError) {
              toast({
                title: 'Oferta utworzona, firma niezapisana',
                description: firmaError.message,
                variant: 'destructive',
              });
            }
          }
          lastError = null;
          break;
        }
        lastError = error;
        // 23505 = naruszenie unikalności → ponów z nowym przyrostkiem
        if ((error as { code?: string }).code !== '23505') break;
      }

      if (!token) {
        if (lastError && (lastError as { code?: string }).code === '23505') {
          toast({
            title: 'Nie udało się nadać adresu',
            description: 'Zbyt wiele powtórzeń adresu. Zmień nazwę i spróbuj ponownie.',
            variant: 'destructive',
          });
          return;
        }
        throw lastError;
      }

      setLastUrl(buildUrl(token));
      setNazwa('');
      setFirma('');
      setTelefon('');
      setEmail('');
      setNotatka('');
      setKanal(null);
      setWeeks(2);

      toast({
        title: '✓ Oferta utworzona',
        description: kontaktNowy
          ? `Nowy kontakt · ${matchedCount} ${matchedCount === 1 ? 'pozycja' : 'pozycji'}`
          : 'Oferta trafiła do istniejącego kontaktu o tym numerze telefonu.',
      });
      onCreated();
    } catch {
      toast({
        title: 'Błąd zapisu',
        description: 'Nie udało się utworzyć oferty',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <ExportFilterPanel products={products} onChange={handleFilterChange} />

      <div className="text-xs font-bold tracking-[0.15em] uppercase text-editorial-muted mb-4">
        W ofercie: {matchedCount} z {products.length} produktów
      </div>

      <div className="border-t border-editorial-line pt-6 space-y-5">
        <div>
          <Label htmlFor="offer-nazwa">Nazwa *</Label>
          <input
            id="offer-nazwa"
            value={nazwa}
            onChange={(e) => setNazwa(e.target.value.slice(0, 120))}
            placeholder="Nazwa klienta lub firmy"
            className={inputClass}
          />
        </div>

        <div>
          <Label htmlFor="offer-firma">Firma (opcjonalnie)</Label>
          <input
            id="offer-firma"
            value={firma}
            onChange={(e) => setFirma(e.target.value.slice(0, 160))}
            placeholder="Nazwa firmy"
            className={inputClass}
          />
        </div>

        <div>
          <Label htmlFor="offer-telefon">Telefon *</Label>
          <input
            id="offer-telefon"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            placeholder="np. +48 123 456 789"
            className={inputClass}
          />
        </div>

        <div>
          <Label htmlFor="offer-email">E-mail (opcjonalnie)</Label>
          <input
            id="offer-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="adres@firma.pl"
            className={inputClass}
          />
        </div>

        <div>
          <Label htmlFor="offer-notatka">Notatka (opcjonalnie)</Label>
          <textarea
            id="offer-notatka"
            value={notatka}
            onChange={(e) => setNotatka(e.target.value)}
            rows={3}
            placeholder="Ustalenia z rozmowy"
            className={`${inputClass} resize-y`}
          />
        </div>

        <div>
          <Label>Kanał (opcjonalnie)</Label>
          <div className="flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map((c) => (
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
        </div>

        <div>
          <Label>Okres ważności</Label>
          <div className="flex flex-wrap gap-2">
            {WEEK_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeeks(w)}
                className={`px-3 py-2 text-xs border transition-colors ${
                  weeks === w
                    ? 'border-editorial-ink bg-editorial-ink text-background'
                    : 'border-editorial-line text-editorial-muted hover:border-editorial-ink'
                }`}
              >
                {w} {w === 1 ? 'tydzień' : 'tygodnie'}
              </button>
            ))}
          </div>
        </div>

        {matchedCount === 0 && (
          <p className="text-xs text-editorial-muted italic">
            Nie można wygenerować linku — filtr nie zwraca żadnej pozycji.
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={saving || !canSubmit}
          className="group w-full flex items-center gap-6 py-6 border-t border-b border-editorial-line text-left transition-colors hover:bg-editorial-line/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <span className="text-xs font-bold tracking-[0.2em] text-editorial-accent w-8 shrink-0">
            01
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-editorial text-base text-editorial-ink">Generuj</div>
            <div className="text-xs text-editorial-muted mt-0.5 tracking-wide">
              Oferta, kontakt i wpis w historii · {matchedCount}{' '}
              {matchedCount === 1 ? 'pozycja' : 'pozycji'}
            </div>
          </div>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin text-editorial-muted shrink-0" />
          ) : (
            <ArrowRight className="h-4 w-4 text-editorial-muted shrink-0 transition-transform group-hover:translate-x-1" />
          )}
        </button>

        {lastUrl && (
          <div className="border border-editorial-line p-3">
            <div className="text-[11px] uppercase tracking-wider text-editorial-muted mb-2">
              Wygenerowany adres
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 text-xs text-editorial-ink break-all">{lastUrl}</code>
              <button
                type="button"
                onClick={() => copy(lastUrl)}
                aria-label="Kopiuj adres linku"
                className="shrink-0 p-2 border border-editorial-line hover:border-editorial-ink"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewOfferView;

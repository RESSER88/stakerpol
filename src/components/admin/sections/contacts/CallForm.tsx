import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  contactId: string;
  /** Wartości startowe steppera — wyszarzone, dopóki użytkownik ich nie zmieni. */
  udzwigStart: number | null;
  wysokoscStart: number | null;
  onSaved: () => void;
}

const KROK_OPTIONS: { value: string; label: string }[] = [
  { value: 'nowy', label: 'Nowy' },
  { value: 'oferta', label: 'Oferta' },
  { value: 'oddzwonic', label: 'Oddzwonić' },
  { value: 'porownuje', label: 'Porównuje' },
  { value: 'cena', label: 'Cena' },
  { value: 'nieaktualne', label: 'Nieaktualne' },
];

type TerminOption = { value: string; label: string; days: number | null };

const TERMIN_OPTIONS: TerminOption[] = [
  { value: 'jutro', label: 'Jutro', days: 1 },
  { value: 'd7', label: 'Za 7', days: 7 },
  { value: 'd15', label: 'Za 15', days: 15 },
  { value: 'd30', label: 'Za 30', days: 30 },
  { value: 'nigdy', label: 'Nie wracać', days: null },
];

const addDays = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const pillClass = (active: boolean) =>
  `h-9 px-3 text-[11px] uppercase tracking-wider border transition-colors ${
    active
      ? 'border-editorial-ink bg-editorial-ink text-background'
      : 'border-editorial-line text-editorial-muted hover:border-editorial-ink'
  }`;

const labelClass = 'block text-[11px] uppercase tracking-wider text-editorial-muted mb-2';

const UDZWIG_DEFAULT = 1000;
const UDZWIG_STEP = 100;
const WYSOKOSC_DEFAULT = 3;
const WYSOKOSC_STEP = 0.5;

const Stepper = ({
  value,
  touched,
  onChange,
  suffix,
}: {
  value: number;
  touched: boolean;
  onChange: (next: number) => void;
  suffix: string;
}) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => onChange(value - 1)}
      aria-label="Zmniejsz"
      className="h-11 w-11 border border-editorial-line text-editorial-ink hover:border-editorial-ink"
    >
      −
    </button>
    <div
      className={`h-11 min-w-[104px] flex items-center justify-center border border-editorial-line text-sm ${
        touched ? 'text-editorial-ink' : 'text-editorial-muted/50'
      }`}
    >
      {value} {suffix}
    </div>
    <button
      type="button"
      onClick={() => onChange(value + 1)}
      aria-label="Zwiększ"
      className="h-11 w-11 border border-editorial-line text-editorial-ink hover:border-editorial-ink"
    >
      +
    </button>
  </div>
);

const CallForm = ({ contactId, udzwigStart, wysokoscStart, onSaved }: Props) => {
  const { toast } = useToast();
  const [krok, setKrok] = useState<string | null>(null);
  const [termin, setTermin] = useState<string | null>(null);
  const [tresc, setTresc] = useState('');
  const [saving, setSaving] = useState(false);

  const [udzwig, setUdzwig] = useState<number>(udzwigStart ?? UDZWIG_DEFAULT);
  const [udzwigTouched, setUdzwigTouched] = useState(false);
  const [wysokosc, setWysokosc] = useState<number>(wysokoscStart ?? WYSOKOSC_DEFAULT);
  const [wysokoscTouched, setWysokoscTouched] = useState(false);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const option = TERMIN_OPTIONS.find((t) => t.value === termin);
    const clear = option?.days === null;

    const { error } = await supabase.rpc('log_contact_activity', {
      _contact_id: contactId,
      _typ: 'telefon',
      _tresc: tresc.trim() || undefined,
      _krok: krok ?? undefined,
      _termin_followup: option && option.days !== null ? addDays(option.days) : undefined,
      _wyczysc_termin: clear === true,
      _udzwig_kg: udzwigTouched ? udzwig : undefined,
      _wysokosc_m: wysokoscTouched ? wysokosc : undefined,
    });
    setSaving(false);

    if (error) {
      toast({ title: 'Błąd zapisu', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✓ Rozmowa zapisana' });
    setKrok(null);
    setTermin(null);
    setTresc('');
    setUdzwigTouched(false);
    setWysokoscTouched(false);
    onSaved();
  };

  return (
    <div className="border-t border-editorial-line pt-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-editorial-muted mb-4">
        Zapis rozmowy
      </div>

      <div className="space-y-5">
        <div>
          <span className={labelClass}>Następny krok</span>
          <div className="flex flex-wrap gap-2">
            {KROK_OPTIONS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => setKrok(krok === k.value ? null : k.value)}
                className={pillClass(krok === k.value)}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={labelClass}>Termin powrotu</span>
          <div className="flex flex-wrap gap-2">
            {TERMIN_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTermin(termin === t.value ? null : t.value)}
                className={pillClass(termin === t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={labelClass}>Udźwig</span>
          <Stepper
            value={udzwig}
            touched={udzwigTouched}
            suffix="kg"
            onChange={(next) => {
              const step = udzwigTouched ? next - udzwig : 0;
              const v = udzwigTouched ? udzwig + (step > 0 ? UDZWIG_STEP : -UDZWIG_STEP) : udzwig;
              const target = udzwigTouched ? v : next > udzwig ? udzwig + UDZWIG_STEP : udzwig - UDZWIG_STEP;
              setUdzwig(Math.max(UDZWIG_STEP, target));
              setUdzwigTouched(true);
            }}
          />
        </div>

        <div>
          <span className={labelClass}>Wysokość</span>
          <Stepper
            value={wysokosc}
            touched={wysokoscTouched}
            suffix="m"
            onChange={(next) => {
              const target = next > wysokosc ? wysokosc + WYSOKOSC_STEP : wysokosc - WYSOKOSC_STEP;
              setWysokosc(Math.max(WYSOKOSC_STEP, Number(target.toFixed(1))));
              setWysokoscTouched(true);
            }}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="call-note">
            Notatka
          </label>
          <textarea
            id="call-note"
            value={tresc}
            onChange={(e) => setTresc(e.target.value)}
            rows={4}
            placeholder="Ustalenia z rozmowy"
            className="w-full min-h-[88px] bg-transparent border border-editorial-line p-3 text-sm text-editorial-ink placeholder:text-editorial-muted/60 focus:outline-none focus:border-editorial-ink resize-y"
          />
        </div>
      </div>

      <div
        className="sticky bottom-0 bg-background pt-3 mt-4 border-t border-editorial-line"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full h-11 flex items-center justify-center gap-2 bg-editorial-ink text-background text-[11px] font-bold uppercase tracking-[0.2em] disabled:opacity-40"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Zapisz rozmowę
        </button>
      </div>
    </div>
  );
};

export default CallForm;

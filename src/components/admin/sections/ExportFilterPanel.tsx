import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { Product } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getModelGroupKey, compareModelGroups, hasOperatorPlatform } from '@/utils/productNormalization';

type PlatformFilter = 'all' | 'with' | 'without';

interface Props {
  products: Product[];
  onChange: (filtered: Product[]) => void;
}

const AVAILABILITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'available', label: 'Dostępny' },
  { value: 'reserved', label: 'Zarezerwowany' },
  { value: 'sold', label: 'Sprzedany' },
];

const DEFAULT_AVAILABILITY = ['available', 'reserved'];

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const rangeOf = (values: (number | null)[], fb: [number, number]): [number, number] => {
  const list = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  if (!list.length) return fb;
  return [list[0], list[list.length - 1]];
};

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-editorial-muted mb-2">
    {children}
  </div>
);

const Chip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'px-3 h-8 text-xs tracking-wide border transition-colors',
      active
        ? 'border-editorial-ink bg-editorial-ink text-white'
        : 'border-editorial-line text-editorial-ink hover:bg-editorial-line/40'
    )}
  >
    {children}
  </button>
);

const ExportFilterPanel = ({ products, onChange }: Props) => {
  const [open, setOpen] = useState(false);

  const groupOptions = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const key = getModelGroupKey(p.model || '');
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => compareModelGroups(a[0], b[0]))
      .map(([key, count]) => ({ key, count }));
  }, [products]);

  const bounds = useMemo(() => {
    return {
      year: rangeOf(products.map((p) => num(p.specs?.productionYear)), [2010, new Date().getFullYear()]),
      hours: rangeOf(products.map((p) => num(p.specs?.workingHours)), [0, 10000]),
      height: rangeOf(products.map((p) => num(p.specs?.liftHeight)), [0, 6000]),
    };
  }, [products]);

  const [groups, setGroups] = useState<string[]>([]);
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [availability, setAvailability] = useState<string[]>(DEFAULT_AVAILABILITY);
  const [serial, setSerial] = useState('');
  const [year, setYear] = useState<[number, number]>(bounds.year);
  const [hours, setHours] = useState<[number, number]>(bounds.hours);
  const [height, setHeight] = useState<[number, number]>(bounds.height);

  useEffect(() => {
    setYear(bounds.year);
    setHours(bounds.hours);
    setHeight(bounds.height);
  }, [bounds]);

  const filtered = useMemo(() => {
    const q = serial.trim().toLowerCase();
    return products.filter((p) => {
      if (groups.length && !groups.includes(getModelGroupKey(p.model || ''))) return false;

      if (platform !== 'all') {
        const has = hasOperatorPlatform(p.specs?.operatorPlatform);
        if (platform === 'with' && !has) return false;
        if (platform === 'without' && has) return false;
      }

      if (availability.length && !availability.includes(p.availabilityStatus || 'available')) return false;

      if (q && !(p.specs?.serialNumber || '').toLowerCase().includes(q)) return false;

      const y = num(p.specs?.productionYear);
      if (y !== null && (y < year[0] || y > year[1])) return false;

      const h = num(p.specs?.workingHours);
      if (h !== null && (h < hours[0] || h > hours[1])) return false;

      const lh = num(p.specs?.liftHeight);
      if (lh !== null && (lh < height[0] || lh > height[1])) return false;

      return true;
    });
  }, [products, groups, platform, availability, serial, year, hours, height]);

  useEffect(() => {
    onChange(filtered);
  }, [filtered, onChange]);

  const reset = () => {
    setGroups([]);
    setPlatform('all');
    setAvailability(DEFAULT_AVAILABILITY);
    setSerial('');
    setYear(bounds.year);
    setHours(bounds.hours);
    setHeight(bounds.height);
  };

  const toggle = (list: string[], value: string, setter: (v: string[]) => void) =>
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  return (
    <div className="border border-editorial-line mb-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-editorial-line/30 transition-colors"
      >
        <span className="text-xs font-bold tracking-[0.18em] uppercase text-editorial-ink">
          Filtry eksportu
        </span>
        <span className="flex items-center gap-3">
          <span className="text-xs text-editorial-muted">
            {filtered.length} / {products.length}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 text-editorial-muted transition-transform', open && 'rotate-180')}
          />
        </span>
      </button>

      {open && (
        <div className="px-4 pb-5 pt-1 space-y-6 border-t border-editorial-line">
          <div>
            <FieldLabel>Grupa modelu</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {groupOptions.map((g) => (
                <Chip
                  key={g.key}
                  active={groups.includes(g.key)}
                  onClick={() => toggle(groups, g.key, setGroups)}
                >
                  {g.key} · {g.count}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Podest dla operatora</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {([
                ['all', 'Wszystkie'],
                ['with', 'Z podestem'],
                ['without', 'Bez podestu'],
              ] as [PlatformFilter, string][]).map(([v, label]) => (
                <Chip key={v} active={platform === v} onClick={() => setPlatform(v)}>
                  {label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>
              Rok produkcji — {year[0]}–{year[1]}
            </FieldLabel>
            <Slider
              min={bounds.year[0]}
              max={bounds.year[1]}
              step={1}
              value={year}
              onValueChange={(v) => setYear([v[0], v[1]])}
            />
          </div>

          <div>
            <FieldLabel>
              Godziny pracy (mh) — {hours[0]}–{hours[1]}
            </FieldLabel>
            <Slider
              min={bounds.hours[0]}
              max={bounds.hours[1]}
              step={10}
              value={hours}
              onValueChange={(v) => setHours([v[0], v[1]])}
            />
          </div>

          <div>
            <FieldLabel>
              Wysokość podnoszenia (mm) — {height[0]}–{height[1]}
            </FieldLabel>
            <Slider
              min={bounds.height[0]}
              max={bounds.height[1]}
              step={50}
              value={height}
              onValueChange={(v) => setHeight([v[0], v[1]])}
            />
          </div>

          <div>
            <FieldLabel>Dostępność</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  active={availability.includes(o.value)}
                  onClick={() => toggle(availability, o.value, setAvailability)}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Numer seryjny</FieldLabel>
            <Input
              value={serial}
              onChange={(e) => setSerial(e.target.value)}
              placeholder="np. 6512345"
              className="h-10 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-editorial-muted hover:text-editorial-ink transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Resetuj filtry
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportFilterPanel;

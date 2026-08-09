import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { Product } from '@/types';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getModelGroupKey, compareModelGroups } from '@/utils/productNormalization';
import { ExportFilterCriteria, ExportPlatformFilter } from '@/utils/exportFilterCriteria';

export interface ViewerFilterState {
  groups: string[];
  platform: ExportPlatformFilter;
  availability: string[];
  serial: string;
  year: [number, number] | null;
  hours: [number, number] | null;
  height: [number, number] | null;
}

export const EMPTY_VIEWER_FILTERS: ViewerFilterState = {
  groups: [],
  platform: 'all',
  availability: [],
  serial: '',
  year: null,
  hours: null,
  height: null,
};

export const viewerFiltersToCriteria = (s: ViewerFilterState): ExportFilterCriteria => ({
  version: 1,
  groups: s.groups,
  platform: s.platform,
  availability: s.availability,
  serial: s.serial,
  year: s.year,
  hours: s.hours,
  height: s.height,
});

export const isViewerFilterActive = (s: ViewerFilterState): boolean =>
  s.groups.length > 0 ||
  s.platform !== 'all' ||
  s.availability.length > 0 ||
  s.serial.trim() !== '' ||
  s.year !== null ||
  s.hours !== null ||
  s.height !== null;

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Dostępny' },
  { value: 'reserved', label: 'Zarezerwowany' },
  { value: 'sold', label: 'Sprzedany' },
];

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const rangeOf = (values: (number | null)[], fb: [number, number]): [number, number] => {
  const list = values.filter((v): v is number => v !== null).sort((a, b) => a - b);
  if (!list.length) return fb;
  return [list[0], list[list.length - 1]];
};

const Legend = ({ children }: { children: React.ReactNode }) => (
  <legend className="text-[11px] font-bold tracking-[0.16em] uppercase text-gray-700 mb-2">
    {children}
  </legend>
);

const Chip = ({
  active,
  onClick,
  children,
  pressedLabel,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  pressedLabel: string;
}) => (
  <button
    type="button"
    aria-pressed={active}
    aria-label={pressedLabel}
    onClick={onClick}
    className={cn(
      'px-3 h-9 text-xs tracking-wide border rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange focus-visible:ring-offset-2',
      active
        ? 'border-stakerpol-navy bg-stakerpol-navy text-white'
        : 'border-gray-300 text-gray-800 hover:bg-gray-100'
    )}
  >
    {children}
  </button>
);

interface Props {
  /** Zbiór ograniczony zapisanym filtrem — wyznacza dostępne zakresy. */
  scope: Product[];
  value: ViewerFilterState;
  onChange: (next: ViewerFilterState) => void;
}

const SharedOfferFilters = ({ scope, value, onChange }: Props) => {
  const groupOptions = useMemo(() => {
    const map = new Map<string, number>();
    scope.forEach((p) => {
      const key = getModelGroupKey(p.model || '');
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => compareModelGroups(a[0], b[0]))
      .map(([key, count]) => ({ key, count }));
  }, [scope]);

  const bounds = useMemo(
    () => ({
      year: rangeOf(scope.map((p) => num(p.specs?.productionYear)), [2010, new Date().getFullYear()]),
      hours: rangeOf(scope.map((p) => num(p.specs?.workingHours)), [0, 10000]),
      height: rangeOf(scope.map((p) => num(p.specs?.liftHeight)), [0, 6000]),
    }),
    [scope]
  );

  const set = <K extends keyof ViewerFilterState>(key: K, v: ViewerFilterState[K]) =>
    onChange({ ...value, [key]: v });

  const toggle = (key: 'groups' | 'availability', v: string) => {
    const list = value[key];
    set(key, list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };

  const year = value.year ?? bounds.year;
  const hours = value.hours ?? bounds.hours;
  const height = value.height ?? bounds.height;

  return (
    <div className="space-y-6">
      <fieldset>
        <Legend>Grupa modelu</Legend>
        <div className="flex flex-wrap gap-2">
          {groupOptions.map((g) => (
            <Chip
              key={g.key}
              active={value.groups.includes(g.key)}
              onClick={() => toggle('groups', g.key)}
              pressedLabel={`Model ${g.key}`}
            >
              {g.key} · {g.count}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <Legend>Podest dla operatora</Legend>
        <div className="flex flex-wrap gap-2">
          {([
            ['all', 'Wszystkie'],
            ['with', 'Z podestem'],
            ['without', 'Bez podestu'],
          ] as [ExportPlatformFilter, string][]).map(([v, label]) => (
            <Chip
              key={v}
              active={value.platform === v}
              onClick={() => set('platform', v)}
              pressedLabel={label}
            >
              {label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <Legend>Dostępność</Legend>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_OPTIONS.map((o) => (
            <Chip
              key={o.value}
              active={value.availability.includes(o.value)}
              onClick={() => toggle('availability', o.value)}
              pressedLabel={o.label}
            >
              {o.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div>
        <label className="block text-[11px] font-bold tracking-[0.16em] uppercase text-gray-700 mb-2" htmlFor="viewer-year">
          Rok produkcji — {year[0]}–{year[1]}
        </label>
        <Slider
          id="viewer-year"
          aria-label="Rok produkcji"
          min={bounds.year[0]}
          max={bounds.year[1]}
          step={1}
          value={year}
          onValueChange={(v) => set('year', [v[0], v[1]])}
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold tracking-[0.16em] uppercase text-gray-700 mb-2" htmlFor="viewer-hours">
          Motogodziny — {hours[0]}–{hours[1]}
        </label>
        <Slider
          id="viewer-hours"
          aria-label="Motogodziny"
          min={bounds.hours[0]}
          max={bounds.hours[1]}
          step={10}
          value={hours}
          onValueChange={(v) => set('hours', [v[0], v[1]])}
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold tracking-[0.16em] uppercase text-gray-700 mb-2" htmlFor="viewer-height">
          Wysokość podnoszenia (mm) — {height[0]}–{height[1]}
        </label>
        <Slider
          id="viewer-height"
          aria-label="Wysokość podnoszenia"
          min={bounds.height[0]}
          max={bounds.height[1]}
          step={50}
          value={height}
          onValueChange={(v) => set('height', [v[0], v[1]])}
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold tracking-[0.16em] uppercase text-gray-700 mb-2" htmlFor="viewer-serial">
          Numer seryjny
        </label>
        <Input
          id="viewer-serial"
          value={value.serial}
          onChange={(e) => set('serial', e.target.value)}
          placeholder="np. 6512345"
          className="h-10 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={() => onChange(EMPTY_VIEWER_FILTERS)}
        className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] uppercase text-gray-700 hover:text-stakerpol-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange focus-visible:ring-offset-2"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Wyczyść filtry
      </button>
    </div>
  );
};

export default SharedOfferFilters;

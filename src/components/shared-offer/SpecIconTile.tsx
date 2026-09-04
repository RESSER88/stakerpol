import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpecIconTileProps {
  Icon: LucideIcon;
  label: string;
  value?: string | number | null;
}

const isEmpty = (v: unknown) => {
  const s = String(v ?? '').trim();
  return s === '' || s === '—' || s === '-';
};

/**
 * Mały, bezstanowy kafel „ikona + podpis + wartość" dla strony oferty.
 * Tokeny wizualne strony oferty (stakerpol-navy / gray) — bez zależności
 * od stylów karty produktu.
 */
const SpecIconTile = ({ Icon, label, value }: SpecIconTileProps) => {
  const empty = isEmpty(value);
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 min-w-0',
        empty ? 'text-gray-400' : 'text-gray-700'
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn('h-4 w-4 shrink-0', empty ? 'text-gray-300' : 'text-stakerpol-navy')}
      />
      <span className="min-w-0">
        <span className="block text-[9px] uppercase tracking-wide font-semibold leading-none">
          {label}
        </span>
        <span
          className={cn(
            'block text-xs font-semibold leading-tight truncate',
            empty ? 'text-gray-400' : 'text-stakerpol-navy'
          )}
        >
          {empty ? '—' : String(value)}
        </span>
      </span>
    </div>
  );
};

export default SpecIconTile;

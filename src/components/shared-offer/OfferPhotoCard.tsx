import { ArrowUpFromLine, BatteryCharging, MoveVertical } from 'lucide-react';
import { ExportRow, formatPrice } from '@/utils/exportListModel';
import { cn } from '@/lib/utils';

interface Props {
  row: ExportRow;
  /** Główne zdjęcie produktu (pierwsze z galerii). */
  image?: string;
  /** Pierwsze karty ładujemy natychmiast, pozostałe leniwie. */
  eager?: boolean;
}

const dash = (v: unknown) => {
  const s = String(v ?? '').trim();
  return s === '' || s === '—' || s === '-' ? '—' : s;
};

const statusTone = (v: string) =>
  v === 'Sprzedany'
    ? 'bg-gray-200 text-gray-700'
    : v === 'Zarezerwowany'
    ? 'bg-amber-100 text-amber-900'
    : 'bg-emerald-100 text-emerald-900';

const Spec = ({
  Icon,
  label,
  value,
}: {
  Icon: typeof MoveVertical;
  label: string;
  value: string;
}) => {
  const empty = value === '—';
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon
        aria-hidden="true"
        className={cn('h-4 w-4 shrink-0', empty ? 'text-gray-300' : 'text-stakerpol-navy')}
      />
      <span className="min-w-0">
        <span className="block text-[9px] uppercase tracking-wide font-semibold leading-none text-gray-600">
          {label}
        </span>
        <span
          className={cn(
            'block text-xs font-semibold leading-tight truncate',
            empty ? 'text-gray-400' : 'text-stakerpol-navy'
          )}
        >
          {value}
        </span>
      </span>
    </div>
  );
};

/**
 * Pełnoekranowa karta przeglądania oferty — wizualnie w duchu eksportu
 * (biała ramka, navy/orange, znak wodny STAKERPOL). Bez akcji i bez galerii.
 */
const OfferPhotoCard = ({ row, image, eager }: Props) => (
  <article className="h-[100dvh] snap-start shrink-0 flex flex-col bg-gray-50 px-3 py-3">
    <div className="flex-1 min-h-0 bg-white border-4 border-white rounded-md shadow-sm ring-1 ring-gray-200 overflow-hidden relative flex items-center justify-center">
      {image ? (
        <img
          src={image}
          alt={`${row.model} ${row.serialNumber}`.trim()}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="max-h-full max-w-full w-auto h-auto object-contain"
        />
      ) : (
        <span className="text-sm text-gray-400">Brak zdjęcia</span>
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-lg font-bold tracking-[0.35em] text-white/70 [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]"
      >
        STAKERPOL
      </span>
    </div>

    <div className="shrink-0 mt-3 bg-white rounded-md ring-1 ring-gray-200 px-3 py-2.5">
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-bold text-stakerpol-navy truncate">{row.model}</span>
        <span className="h-1 w-8 bg-stakerpol-orange rounded-full shrink-0" />
      </div>
      <p className="mt-1 text-xs text-gray-700">
        {[
          row.productionYear ? String(row.productionYear) : null,
          row.serialNumber || null,
          row.workingHours ? `${row.workingHours} mth` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <div className="mt-2 grid grid-cols-3 gap-x-2">
        <Spec Icon={MoveVertical} label="Wys. konstr." value={dash(row.minHeight)} />
        <Spec Icon={ArrowUpFromLine} label="Podnoszenie" value={dash(row.liftHeight)} />
        <Spec Icon={BatteryCharging} label="Bateria" value={dash(row.battery)} />
      </div>
      <div className="mt-2.5 flex items-center justify-end gap-2">
        <span
          className={cn(
            'inline-block px-2 py-0.5 rounded text-[11px] font-semibold',
            statusTone(row.availability)
          )}
        >
          {row.availability}
        </span>
        <span className="text-sm font-semibold text-stakerpol-navy whitespace-nowrap">
          {row.showPrice ? `${formatPrice(row.netPrice)} ${row.priceCurrency}` : 'Cena na zapytanie'}
        </span>
      </div>
    </div>
  </article>
);

export default OfferPhotoCard;

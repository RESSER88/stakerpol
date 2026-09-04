import { ArrowUpFromLine, BatteryCharging, MoveVertical, Mail } from 'lucide-react';
import { COMPANY, ExportRow, formatPrice } from '@/utils/exportListModel';
import { cn } from '@/lib/utils';

interface Props {
  row: ExportRow;
  /** Wszystkie zdjęcia produktu (karuzela). */
  images?: string[];
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
const buildOrderMailto = (row: ExportRow) => {
  const title = `${row.model} ${row.serialNumber}`.trim();
  const subject = `Zamówienie - ${title}`;
  const price = row.showPrice
    ? `${formatPrice(row.netPrice)} ${row.priceCurrency} netto`
    : 'cena na zapytanie';
  const body = [
    'Dzień dobry,',
    '',
    'chcę zamówić poniższy wózek widłowy:',
    '',
    `Model: ${row.model}`,
    `Rok produkcji: ${dash(row.productionYear)}`,
    `Nr seryjny: ${dash(row.serialNumber)}`,
    `Motogodziny: ${row.workingHours ? `${row.workingHours} mth` : '—'}`,
    `Wys. konstrukcyjna: ${dash(row.minHeight)}`,
    `Podnoszenie: ${dash(row.liftHeight)}`,
    `Bateria: ${dash(row.battery)}`,
    `Cena: ${price}`,
    `Karta produktu: ${row.productUrl}`,
    '',
    'DANE DO FAKTURY',
    'Nazwa firmy / imię i nazwisko: ',
    'NIP: ',
    'Adres: ',
    '',
    'ADRES WYSYŁKI',
    'Adres dostawy: ',
    '',
    'OSOBA KONTAKTOWA',
    'Imię i nazwisko: ',
    'Telefon: ',
    'E-mail: ',
    '',
    'Uwagi: ',
  ].join('\r\n');
  return `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

const OfferPhotoCard = ({ row, images = [], eager }: Props) => (
  <article className="h-[100dvh] snap-start shrink-0 flex flex-col bg-gray-50">
    {/* Zdjęcie: ~70% wysokości karty, watermark jako warstwa NA zdjęciu */}
    <div className="h-[70%] shrink-0 min-h-0 bg-white overflow-hidden relative">
      {images.length > 0 ? (
        <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory overscroll-x-contain scrollbar-none">
          {images.map((src, i) => (
            <div key={src + i} className="h-full w-full shrink-0 snap-center flex items-center justify-center">
              <img
                src={src}
                alt={`${row.model} ${row.serialNumber} — zdjęcie ${i + 1}`.trim()}
                loading={eager && i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="h-full w-full object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-sm text-gray-400">Brak zdjęcia</span>
        </div>
      )}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-14 z-10 text-base font-bold tracking-[0.3em] text-white/70 [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]"
      >
        STAKERPOL
      </span>
      {images.length > 1 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 left-0 right-0 z-10 flex items-center justify-center gap-1.5"
        >
          {images.map((src, i) => (
            <span
              key={`dot-${src}-${i}`}
              className="h-1.5 w-1.5 rounded-full bg-stakerpol-navy/40 [box-shadow:0_0_0_1px_rgba(255,255,255,0.7)]"
            />
          ))}
        </div>
      )}
    </div>

    <div className="flex-1 min-h-0 bg-white border-t border-gray-200 px-3 py-2">

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
      <div className="mt-2 flex items-center justify-end gap-2">
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

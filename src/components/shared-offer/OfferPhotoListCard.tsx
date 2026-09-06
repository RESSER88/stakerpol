import { useRef, useState } from 'react';
import {
  ArrowUpFromLine,
  BatteryCharging,
  ChevronLeft,
  ChevronRight,
  Mail,
  MoveVertical,
  Package,
  Phone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { COMPANY, ExportRow, formatPrice } from '@/utils/exportListModel';
import { COMPANY_PHONE_TEL } from '@/lib/contact';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Props {
  row: ExportRow;
  /** Wszystkie zdjęcia produktu. */
  images?: string[];
  /** Pierwsze karty ładujemy natychmiast, pozostałe leniwie. */
  eager?: boolean;
  onActivate?: () => void;
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

const displayPrice = (row: ExportRow) => {
  if (!row.showPrice) return 'Cena na zapytanie';
  const currency = row.priceCurrency === 'PLN' ? 'zł' : row.priceCurrency;
  return `${new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(row.netPrice)} ${currency}`;
};

const displayMetric = (value: string) => {
  const normalized = dash(value);
  if (normalized === '—') return normalized;
  return normalized
    .replace('.', ',')
    .replace(/(\d)(kg|m|Ah)\b/i, '$1 $2');
};

/** Szkic zamówienia — dokładnie ta sama treść co w dotychczasowym trybie zdjęciowym. */
export const buildOrderMailto = (row: ExportRow) => {
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

const Spec = ({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) => {
  const empty = value === '—';
  return (
    <div className="flex items-start gap-2 min-w-0 py-1">
      <Icon
        aria-hidden="true"
        className={cn('mt-0.5 h-4 w-4 shrink-0', empty ? 'text-gray-300' : 'text-stakerpol-navy')}
      />
      <span className="min-w-0">
        <span className="block text-[9px] uppercase tracking-wide font-semibold leading-none text-gray-600">
          {label}
        </span>
        <span
          className={cn(
            'mt-1 block text-sm font-semibold leading-tight truncate',
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
 * Duża karta produktu w normalnym przepływie strony (tryb „widok zdjęciowy”).
 * Strzałki przełączają wyłącznie zdjęcia tego samego produktu.
 */
const OfferPhotoListCard = ({ row, images = [], eager, onActivate }: Props) => {
  const [idx, setIdx] = useState(0);
  const railRef = useRef<HTMLDivElement | null>(null);
  const count = images.length;
  const current = Math.min(idx, Math.max(0, count - 1));
  const step = (delta: number) => {
    if (count === 0) return;
    const next = (current + delta + count) % count;
    setIdx(next);
    const rail = railRef.current;
    if (rail) rail.scrollTo({ left: rail.clientWidth * next, behavior: 'smooth' });
  };

  const syncIndex = () => {
    const rail = railRef.current;
    if (!rail || rail.clientWidth === 0) return;
    setIdx(Math.min(count - 1, Math.max(0, Math.round(rail.scrollLeft / rail.clientWidth))));
  };

  return (
    <article
      data-offer-product-id={row.productId}
      className="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm md:rounded-lg"
      onPointerDown={onActivate}
      onFocusCapture={onActivate}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {count > 0 ? (
          <div
            ref={railRef}
            onScroll={syncIndex}
            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto no-scrollbar touch-pan-x"
          >
            {images.map((src, imageIndex) => (
              <div key={`${src}-${imageIndex}`} className="relative h-full w-full shrink-0 snap-center overflow-hidden">
                <img
                  src={src}
                  alt=""
                  aria-hidden="true"
                  loading={eager && imageIndex === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-50 blur-xl"
                  draggable={false}
                />
                <img
                  src={src}
                  alt={`${row.model} ${row.serialNumber} — zdjęcie ${imageIndex + 1}`.trim()}
                  loading={eager && imageIndex === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="relative h-full w-full object-contain"
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
          className={cn(
            'absolute left-3 top-3 z-10 inline-block px-2 py-0.5 rounded text-[11px] font-semibold',
            statusTone(row.availability)
          )}
        >
          {row.availability}
        </span>

        {count > 0 && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-stakerpol-navy/85 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            {current + 1}/{count}
          </span>
        )}

        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-14 z-10 text-base font-bold tracking-[0.3em] text-white/70 [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]"
        >
          STAKERPOL
        </span>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Poprzednie zdjęcie produktu"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-stakerpol-navy shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Następne zdjęcie produktu"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-stakerpol-navy shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      <div className="px-4 pb-4 pt-5 md:px-3 md:py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="min-w-0 text-lg font-bold leading-tight text-stakerpol-navy md:text-sm md:truncate">
              {row.model}
            </h3>
            <span className="hidden h-1 w-8 shrink-0 rounded-full bg-stakerpol-orange md:block" />
          </div>
          <div className="shrink-0 text-right md:hidden">
            <p className="text-lg font-bold leading-tight text-stakerpol-navy md:text-base">
              {displayPrice(row)}
            </p>
            {row.showPrice && <p className="mt-1 text-[11px] text-gray-500">Cena netto</p>}
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-600 md:text-xs">
          {[
            row.productionYear ? String(row.productionYear) : null,
            row.serialNumber || null,
            row.workingHours ? `${row.workingHours} mth` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-gray-200 py-4 sm:grid-cols-4 md:mt-2 md:gap-x-2 md:gap-y-2 md:border-0 md:py-0">
          <Spec Icon={Package} label="Udźwig" value={displayMetric(row.mastLiftingCapacity)} />
          <Spec Icon={MoveVertical} label="Wys. konstr." value={displayMetric(row.minHeight)} />
          <Spec Icon={ArrowUpFromLine} label="Podnoszenie" value={displayMetric(row.liftHeight)} />
          <Spec Icon={BatteryCharging} label="Bateria" value={displayMetric(row.battery)} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <a
            href={row.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-stakerpol-navy underline decoration-gray-300 underline-offset-4"
          >
            Karta produktu →
          </a>
          <span className="hidden whitespace-nowrap text-base font-bold text-stakerpol-navy md:inline">
            {row.showPrice ? `${formatPrice(row.netPrice)} ${row.priceCurrency}` : 'Cena na zapytanie'}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-[0.8fr_1.2fr] gap-2 md:mt-3 md:grid-cols-2">
          <Button asChild variant="outline" className="min-h-[48px] border-stakerpol-navy text-stakerpol-navy md:order-2">
            <a href={`tel:${COMPANY_PHONE_TEL}`}>
              <Phone aria-hidden="true" />
              Zadzwoń
            </a>
          </Button>
          <Button asChild className="min-h-[48px] bg-stakerpol-orange font-bold text-white hover:bg-stakerpol-orange/90 md:order-1">
            <a href={buildOrderMailto(row)}>
              <Mail aria-hidden="true" />
              Zamawiam ten model
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
};

export default OfferPhotoListCard;

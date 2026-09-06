import { useState } from 'react';
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

interface Props {
  row: ExportRow;
  /** Wszystkie zdjęcia produktu. */
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
 * Duża karta produktu w normalnym przepływie strony (tryb „widok zdjęciowy”).
 * Strzałki przełączają wyłącznie zdjęcia tego samego produktu.
 */
const OfferPhotoListCard = ({ row, images = [], eager }: Props) => {
  const [idx, setIdx] = useState(0);
  const count = images.length;
  const src = count > 0 ? images[Math.min(idx, count - 1)] : undefined;
  const step = (delta: number) => setIdx((i) => (count === 0 ? 0 : (i + delta + count) % count));

  return (
    <article className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {src ? (
          <>
            <img
              src={src}
              alt=""
              aria-hidden="true"
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover blur-xl scale-110 opacity-60"
              draggable={false}
            />
            <img
              src={src}
              alt={`${row.model} ${row.serialNumber} — zdjęcie ${Math.min(idx, count - 1) + 1}`.trim()}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              className="relative h-full w-full object-contain"
              draggable={false}
            />
          </>
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
            {Math.min(idx, count - 1) + 1}/{count}
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

      <div className="px-3 py-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-bold text-stakerpol-navy truncate">{row.model}</h3>
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

        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-2">
          <Spec Icon={Package} label="Udźwig" value={dash(row.mastLiftingCapacity)} />
          <Spec Icon={MoveVertical} label="Wys. konstr." value={dash(row.minHeight)} />
          <Spec Icon={ArrowUpFromLine} label="Podnoszenie" value={dash(row.liftHeight)} />
          <Spec Icon={BatteryCharging} label="Bateria" value={dash(row.battery)} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <a
            href={row.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-stakerpol-navy underline underline-offset-2 shrink-0"
          >
            Karta produktu →
          </a>
          <span className="text-base font-bold text-stakerpol-navy whitespace-nowrap">
            {row.showPrice ? `${formatPrice(row.netPrice)} ${row.priceCurrency}` : 'Cena na zapytanie'}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={buildOrderMailto(row)}
            className="inline-flex items-center justify-center gap-2 rounded-[4px] bg-stakerpol-orange min-h-[48px] px-3 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-navy"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Zamawiam
          </a>
          <a
            href={`tel:${COMPANY_PHONE_TEL}`}
            className="inline-flex items-center justify-center gap-2 rounded-[4px] bg-ink min-h-[48px] px-3 text-sm font-bold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Zadzwoń
          </a>
        </div>
      </div>
    </article>
  );
};

export default OfferPhotoListCard;

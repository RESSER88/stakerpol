import { Product } from '@/types';
import { normalizeModel, seriesRank, FALLBACK_GROUP } from '@/utils/productNormalization';

/* ------------------------------------------------------------------ */
/*  Wspólny model danych dla eksportów XLSX / PDF / JPG                */
/* ------------------------------------------------------------------ */

export const COMPANY = {
  name: 'FHU Stakerpol',
  person: 'Michał Seweryn',
  phone: '+48 694 133 592',
  email: 'info@stakerpol.pl',
  address: 'ul. Szewska 6, 32-043 Skała',
  tagline: 'Sprzedaż paleciaków elektrycznych BT Toyota',
  site: 'www.stakerpol.pl',
  nip: '6492111954',
  regon: '120724080',
};

/** Kolory w zapisie HEX (PDF/HTML). XLSX używa własnych stałych ARGB. */
export const COLORS = {
  navy: '#1E3A5F',
  orange: '#F97316',
  lightGray: '#F4F6F8',
  rowLine: '#E8EAED',
  grayText: '#6B7280',
  muted: '#9CA3AF',
  black: '#000000',
};

export type ExportAlign = 'left' | 'right' | 'center';

export const EXPORT_COLUMNS: { header: string; key: string; align: ExportAlign }[] = [
  { header: 'Nr', key: 'index', align: 'center' },
  { header: 'Model', key: 'model', align: 'left' },
  { header: 'Nr. seryjny', key: 'serialNumber', align: 'left' },
  { header: 'Rok', key: 'productionYear', align: 'center' },
  { header: 'Godziny (mh)', key: 'workingHours', align: 'right' },
  { header: 'Udźwig', key: 'mastLiftingCapacity', align: 'right' },
  { header: 'Podnoszenie', key: 'liftHeight', align: 'right' },
  { header: 'Maszt', key: 'mast', align: 'left' },
  { header: 'Bateria', key: 'battery', align: 'left' },
  { header: 'Dostępność', key: 'availability', align: 'left' },
  { header: 'Cena netto', key: 'netPrice', align: 'right' },
  { header: 'Waluta', key: 'priceCurrency', align: 'left' },
  { header: 'Zdjęcia', key: 'photos', align: 'center' },
];

/* --------------------------- helpery --------------------------- */

export const availabilityLabel = (s?: string) => {
  switch (s) {
    case 'available': return 'Dostępny';
    case 'reserved': return 'Zarezerwowany';
    case 'sold': return 'Sprzedany';
    default: return '—';
  }
};

export const normalizeMast = (raw?: string) => {
  const v = (raw || '').toLowerCase();
  if (v.includes('triplex')) return 'Triplex';
  if (v.includes('duplex')) return 'Duplex';
  if (v.includes('simplex')) return 'Simplex';
  return 'Brak';
};

export const normalizeBattery = (raw?: string) => {
  const m = (raw || '').match(/(\d{3})\s*Ah/i);
  return m ? `${m[1]} Ah` : '—';
};

export const formatCapacity = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `${n}kg` : '';
};

export const formatLift = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `${(n / 1000).toFixed(2)}m` : '';
};

export const formatPrice = (n: number) =>
  n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatDatePL = (d: Date = new Date()) => {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getFullYear()}`;
};

export const fileDateStamp = (d: Date = new Date()) => formatDatePL(d).replace(/\./g, '_');

export const escapeHtml = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/* --------------------------- model --------------------------- */

export interface ExportRow {
  index: number;
  productId: string;
  model: string;
  serialNumber: string;
  productionYear: string;
  workingHours: number | string;
  mastLiftingCapacity: string;
  liftHeight: string;
  mast: string;
  battery: string;
  availability: string;
  netPrice: number;
  priceCurrency: string;
  showPrice: boolean;
  isSold: boolean;
  productUrl: string;
  mailtoHref: string;
}

export interface ExportGroup {
  key: string;
  label: string;
  rows: ExportRow[];
  products: Product[];
}

export interface ExportModel {
  groups: ExportGroup[];
  total: number;
  availableCount: number;
  reservedCount: number;
  dateLabel: string;
  summary: string;
}

/**
 * Buduje pogrupowaną, posortowaną i ponumerowaną strukturę wierszy
 * używaną przez wszystkie trzy eksporty (XLSX, PDF, JPG).
 */
export function buildExportRows(products: Product[]): ExportModel {
  const grouped = new Map<string, Product[]>();
  const displayNames = new Map<string, string>();

  products.forEach((p) => {
    const { display, group } = normalizeModel(p.model);
    displayNames.set(p.id, display);
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(p);
  });

  const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
    const ra = seriesRank(a);
    const rb = seriesRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });

  let counter = 0;
  const groups: ExportGroup[] = sortedKeys.map((key) => {
    const items = grouped.get(key)!.slice().sort((a, b) => {
      const ya = Number(a.specs?.productionYear) || 0;
      const yb = Number(b.specs?.productionYear) || 0;
      if (yb !== ya) return yb - ya;
      const ha = Number(a.specs?.workingHours) || 0;
      const hb = Number(b.specs?.workingHours) || 0;
      return ha - hb;
    });

    const rows: ExportRow[] = items.map((p) => {
      counter++;
      const anyP = p as any;
      const isSold = p.availabilityStatus === 'sold';
      const priceMode = anyP.priceDisplayMode || 'inquiry_with_pricelist';
      const numericPrice =
        typeof anyP.netPrice === 'number' ? anyP.netPrice : Number(anyP.netPrice) || 0;
      const showPrice =
        (priceMode === 'show_price' || priceMode === 'inquiry_with_pricelist') && numericPrice > 0;
      const model = displayNames.get(p.id) || p.model || '';
      const serialNumber = p.specs?.serialNumber || '';
      const subject = `Zapytanie o cenę - ${model} ${serialNumber}`.trim();

      return {
        index: counter,
        productId: p.id,
        model,
        serialNumber,
        productionYear: p.specs?.productionYear || '',
        workingHours: Number(p.specs?.workingHours) || (p.specs?.workingHours as any) || '',
        mastLiftingCapacity: formatCapacity(p.specs?.mastLiftingCapacity),
        liftHeight: formatLift(p.specs?.liftHeight),
        mast: normalizeMast(p.specs?.mast),
        battery: normalizeBattery(p.specs?.battery),
        availability: availabilityLabel(p.availabilityStatus),
        netPrice: numericPrice,
        priceCurrency: showPrice ? anyP.priceCurrency || 'PLN' : '',
        showPrice,
        isSold,
        productUrl: `https://stakerpol.pl/products/${anyP.slug || p.id}`,
        mailtoHref: `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}`,
      };
    });

    return {
      key,
      label: key === FALLBACK_GROUP ? key : `Toyota BT ${key}`,
      rows,
      products: items,
    };
  });

  const availableCount = products.filter((p) => p.availabilityStatus === 'available').length;
  const reservedCount = products.filter((p) => p.availabilityStatus === 'reserved').length;

  return {
    groups,
    total: counter,
    availableCount,
    reservedCount,
    dateLabel: formatDatePL(),
    summary: `Łącznie pozycji: ${counter} · dostępnych: ${availableCount} · zarezerwowanych: ${reservedCount}`,
  };
}

import { Product } from '@/types';
import { getModelGroupKey, hasOperatorPlatform } from '@/utils/productNormalization';

export type ExportPlatformFilter = 'all' | 'with' | 'without';

/** Serializowalny komplet kryteriów filtrowania eksportu. Wyłącznie typy proste. */
export interface ExportFilterCriteria {
  version: 1;
  groups: string[];
  platform: ExportPlatformFilter;
  availability: string[];
  serial: string;
  /** [od, do] — wartości brzegowe wybrane przez administratora */
  year: [number, number] | null;
  hours: [number, number] | null;
  height: [number, number] | null;
}

export const DEFAULT_EXPORT_CRITERIA: ExportFilterCriteria = {
  version: 1,
  groups: [],
  platform: 'all',
  availability: [],
  serial: '',
  year: null,
  hours: null,
  height: null,
};

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const inRange = (value: number | null, range: [number, number] | null): boolean => {
  if (value === null || !range) return true;
  return value >= range[0] && value <= range[1];
};

/** Czysta funkcja dopasowania — brak zależności od stanu Reacta i bounds. */
export const matchesExportCriteria = (
  product: Product,
  criteria: ExportFilterCriteria
): boolean => {
  const { groups, platform, availability, serial, year, hours, height } = criteria;

  if (groups.length && !groups.includes(getModelGroupKey(product.model || ''))) return false;

  if (platform !== 'all') {
    const has = hasOperatorPlatform(product.specs?.operatorPlatform);
    if (platform === 'with' && !has) return false;
    if (platform === 'without' && has) return false;
  }

  if (availability.length && !availability.includes(product.availabilityStatus || 'available'))
    return false;

  const q = (serial || '').trim().toLowerCase();
  if (q && !(product.specs?.serialNumber || '').toLowerCase().includes(q)) return false;

  if (!inRange(num(product.specs?.productionYear), year)) return false;
  if (!inRange(num(product.specs?.workingHours), hours)) return false;
  if (!inRange(num(product.specs?.liftHeight), height)) return false;

  return true;
};

export const filterProductsByCriteria = (
  products: Product[],
  criteria: ExportFilterCriteria
): Product[] => products.filter((p) => matchesExportCriteria(p, criteria));

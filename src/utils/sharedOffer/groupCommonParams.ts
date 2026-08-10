import { ExportGroup, ExportRow } from '@/utils/exportListModel';
import { logger } from '@/utils/logger';

/** Klucze parametrów, które mogą zostać przejęte przez nagłówek grupy. */
export const COMMON_PARAM_KEYS = [
  'mastLiftingCapacity',
  'liftHeight',
  'mast',
  'battery',
] as const;

export type CommonParamKey = (typeof COMMON_PARAM_KEYS)[number];

export const COMMON_PARAM_LABELS: Record<CommonParamKey, string> = {
  mastLiftingCapacity: 'Udźwig',
  liftHeight: 'Podnoszenie',
  mast: 'Maszt',
  battery: 'Bateria',
};

const isBlank = (v: unknown) => {
  const s = String(v ?? '').trim();
  return s === '' || s === '—' || s === '-' || s.toLowerCase() === 'brak';
};

/**
 * Normalizacja wartości wyłącznie na potrzeby porównania:
 * usuwa białe znaki, ujednolica separator dziesiętny, wielkość liter
 * oraz zapis liczby (2.1 == 2.10) — wartość wyświetlana pozostaje surowa.
 */
export const normalizeParamValue = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  let s = String(v).replace(/\s+/g, '').replace(',', '.').toLowerCase();
  if (isBlank(s)) return '';
  s = s.replace(/(\d+\.\d*?)0+(?=[^\d]|$)/g, '$1').replace(/(\d+)\.(?=[^\d]|$)/g, '$1');
  return s;
};

/**
 * Zwraca wyłącznie te parametry, których wartość jest niepusta we wszystkich
 * wierszach grupy i po normalizacji identyczna. Funkcja tylko czyta gotowy
 * wynik buildExportRows — nie modyfikuje modelu eksportu.
 * Rozbieżności raportuje (numer seryjny + surowa wartość) i pozostawia parametr w wierszach.
 */
export const getGroupCommonParams = (
  group: Pick<ExportGroup, 'rows'> & { label?: string }
): Partial<Record<CommonParamKey, string>> => {
  const rows: ExportRow[] = group.rows || [];
  if (rows.length === 0) return {};

  const result: Partial<Record<CommonParamKey, string>> = {};

  COMMON_PARAM_KEYS.forEach((key) => {
    const normalized = rows.map((r) => normalizeParamValue(r[key]));
    if (normalized.some((n) => n === '')) return;

    const first = normalized[0];
    const outliers = rows.filter((_, i) => normalized[i] !== first);

    if (outliers.length === 0) {
      result[key] = String(rows[0][key] ?? '').trim();
      return;
    }

    logger.warn(
      `[shared-offer] Parametr "${COMMON_PARAM_LABELS[key]}" w grupie ${
        group.label || '?'
      } różni się między pozycjami: ` +
        outliers
          .map((r) => `${r.serialNumber || r.productId}: "${String(r[key] ?? '')}"`)
          .join(', ')
    );
  });

  return result;
};

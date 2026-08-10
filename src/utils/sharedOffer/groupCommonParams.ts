import { ExportGroup, ExportRow } from '@/utils/exportListModel';

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
  return s === '' || s === '—' || s.toLowerCase() === 'brak';
};

/**
 * Zwraca wyłącznie te parametry, których wartość jest identyczna (i niepusta)
 * we wszystkich wierszach grupy. Funkcja tylko czyta gotowy wynik
 * buildExportRows — nie modyfikuje modelu eksportu.
 */
export const getGroupCommonParams = (
  group: Pick<ExportGroup, 'rows'>
): Partial<Record<CommonParamKey, string>> => {
  const rows: ExportRow[] = group.rows || [];
  if (rows.length === 0) return {};

  const result: Partial<Record<CommonParamKey, string>> = {};

  COMMON_PARAM_KEYS.forEach((key) => {
    const first = String(rows[0][key] ?? '').trim();
    if (isBlank(first)) return;
    const allEqual = rows.every((r) => String(r[key] ?? '').trim() === first);
    if (allEqual) result[key] = first;
  });

  return result;
};

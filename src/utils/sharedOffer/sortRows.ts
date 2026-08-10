import { ExportRow } from '@/utils/exportListModel';

export type SortKey =
  | 'year_desc'
  | 'year_asc'
  | 'hours_asc'
  | 'hours_desc'
  | 'price_asc'
  | 'price_desc';

export const DEFAULT_SORT: SortKey = 'year_desc';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'year_desc', label: 'Rocznik: najnowsze' },
  { value: 'year_asc', label: 'Rocznik: najstarsze' },
  { value: 'hours_asc', label: 'Motogodziny: rosnąco' },
  { value: 'hours_desc', label: 'Motogodziny: malejąco' },
  { value: 'price_asc', label: 'Cena: rosnąco' },
  { value: 'price_desc', label: 'Cena: malejąco' },
];

const n = (v: unknown) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const hasPrice = (r: ExportRow) => r.showPrice && n(r.netPrice) > 0;

/** Sortuje wiersze wewnątrz grupy. Nie zmienia numeracji (row.index). */
export const sortExportRows = (rows: ExportRow[], key: SortKey): ExportRow[] => {
  const list = [...rows];

  if (key === 'price_asc' || key === 'price_desc') {
    return list.sort((a, b) => {
      const pa = hasPrice(a);
      const pb = hasPrice(b);
      if (pa !== pb) return pa ? -1 : 1; // pozycje bez ceny zawsze na końcu
      if (!pa) return a.index - b.index;
      const diff = n(a.netPrice) - n(b.netPrice);
      return key === 'price_asc' ? diff : -diff;
    });
  }

  return list.sort((a, b) => {
    if (key === 'year_desc' || key === 'year_asc') {
      const diff = n(a.productionYear) - n(b.productionYear);
      if (diff !== 0) return key === 'year_asc' ? diff : -diff;
      return a.index - b.index;
    }
    const diff = n(a.workingHours) - n(b.workingHours);
    if (diff !== 0) return key === 'hours_asc' ? diff : -diff;
    return a.index - b.index;
  });
};

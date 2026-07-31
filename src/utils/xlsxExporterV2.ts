import ExcelJS from 'exceljs';
import { Product } from '@/types';

const NAVY = 'FF1E3A5F';
const ORANGE = 'FFF97316';
const LIGHT_GRAY = 'FFF4F6F8';
const ROW_LINE = 'FFE8EAED';
const GRAY_TEXT = 'FF6B7280';
const MUTED = 'FF9CA3AF';

const COMPANY = {
  name: 'FHU Stakerpol',
  person: 'Michał Seweryn',
  phone: '+48 694 133 592',
  email: 'info@stakerpol.pl',
  address: 'ul. Szewska 6, 32-043 Skała',
};

const availabilityLabel = (s?: string) => {
  switch (s) {
    case 'available': return 'Dostępny';
    case 'reserved': return 'Zarezerwowany';
    case 'sold': return 'Sprzedany';
    default: return '—';
  }
};

const COLUMNS: { header: string; key: string; align: 'left' | 'right' | 'center' }[] = [
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

const COL_MARGIN = 2;
const COL_MIN = 6;
const COL_MAX = 34;

const displayLength = (v: unknown, key: string) => {
  if (v === null || v === undefined || v === '') return 0;
  if (key === 'netPrice' && typeof v === 'number') {
    return v.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).length;
  }
  return String(v).length;
};


const FALLBACK_GROUP = 'Pozostałe';
const SERIES_ORDER = ['SWE', 'LWE', 'SPE', 'RRE', 'LSE'];
const MODEL_ALIASES: Record<string, string> = { 'SWE 200': 'SWE 200D' };

const NOISE = /\b(toyota|bt|staxio|staker|levio|sztaplarka|elektryczny|paleciak|paletowy)\b/gi;

/** Returns { display, group } — display may include " EX", group never does. */
const normalizeModel = (raw?: string): { display: string; group: string } => {
  const original = (raw || '').trim();
  const cleaned = original.replace(NOISE, ' ');
  const m = cleaned.match(/\b(SWE|LWE|SPE|RRE|LSE)\s*(\d+)\s*([A-Z]{0,2})\b/i);
  if (!m) return { display: original, group: FALLBACK_GROUP };
  let base = `${m[1].toUpperCase()} ${m[2]}${(m[3] || '').toUpperCase()}`;
  base = MODEL_ALIASES[base] || base;
  const isEx = /\bEX\b/i.test(original);
  return { display: isEx ? `${base} EX` : base, group: base };
};

const normalizeMast = (raw?: string) => {
  const v = (raw || '').toLowerCase();
  if (v.includes('triplex')) return 'Triplex';
  if (v.includes('duplex')) return 'Duplex';
  if (v.includes('simplex')) return 'Simplex';
  return 'Brak';
};

const normalizeBattery = (raw?: string) => {
  const m = (raw || '').match(/(\d{3})\s*Ah/i);
  return m ? `${m[1]} Ah` : '—';
};

const seriesRank = (key: string) => {
  if (key === FALLBACK_GROUP) return 999;
  const idx = SERIES_ORDER.indexOf(key.split(' ')[0]);
  return idx === -1 ? 500 : idx;
};

const bottomLine = (color: string, style: 'thin' | 'medium' = 'thin') => ({
  bottom: { style, color: { argb: color } },
});

const lastColLetter = () => String.fromCharCode(64 + COLUMNS.length);

const formatCapacity = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `${n}kg` : '';
};

const formatLift = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `${(n / 1000).toFixed(2)}m` : '';
};

export async function exportProductListToBrandedXLSX(products: Product[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Stan magazynu');

  const maxLens = COLUMNS.map((c) => c.header.toUpperCase().length);


  const last = lastColLetter();

  // --- 1. NAGŁÓWEK PLIKU ---
  sheet.getRow(1).height = 32;
  for (let r = 2; r <= 4; r++) sheet.getRow(r).height = 16;

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dateLabel = `${dd}.${mm}.${today.getFullYear()}`;

  sheet.mergeCells('A1:C1');
  const brand = sheet.getCell('A1');
  brand.value = 'STAKERPOL';
  brand.font = { name: 'Arial', size: 22, bold: true, color: { argb: NAVY } };
  brand.alignment = { horizontal: 'left', vertical: 'middle' };

  sheet.mergeCells('A2:C2');
  const tagline = sheet.getCell('A2');
  tagline.value = 'Sprzedaż paleciaków elektrycznych BT Toyota';
  tagline.font = { name: 'Arial', size: 9, color: { argb: GRAY_TEXT } };
  tagline.alignment = { horizontal: 'left', vertical: 'middle' };

  const infoLines = [
    `${COMPANY.name} · ${COMPANY.person}`,
    `tel. ${COMPANY.phone} · ${COMPANY.email}`,
    COMPANY.address,
  ];
  infoLines.forEach((text, idx) => {
    const row = idx + 2;
    sheet.mergeCells(`F${row}:${last}${row}`);
    const cell = sheet.getCell(`F${row}`);
    cell.value = text;
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    cell.font = { name: 'Arial', size: 9, color: { argb: GRAY_TEXT } };
  });

  sheet.mergeCells(`F1:${last}1`);
  const dateCell = sheet.getCell('F1');
  dateCell.value = `Stan magazynu na ${dateLabel}`;
  dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
  dateCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: NAVY } };

  // pomarańczowa kreska akcentu pod "STAKERPOL"
  sheet.mergeCells('A5:C5');
  sheet.getRow(5).height = 3;
  sheet.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };

  // --- 2. NAGŁÓWEK TABELI ---
  const HEADER_ROW = 6;
  const headerRow = sheet.getRow(HEADER_ROW);
  headerRow.values = COLUMNS.map((c) => c.header.toUpperCase());
  headerRow.height = 20;
  COLUMNS.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: NAVY } };
    cell.alignment = { horizontal: c.align, vertical: 'middle', wrapText: true };
    cell.border = bottomLine(NAVY, 'medium');
  });

  // --- 3. GRUPOWANIE ---
  const groups = new Map<string, Product[]>();
  const displayNames = new Map<string, string>();
  products.forEach((p) => {
    const { display, group } = normalizeModel(p.model);
    displayNames.set(p.id, display);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(p);
  });

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    const ra = seriesRank(a);
    const rb = seriesRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });

  let rowIndex = HEADER_ROW;
  let counter = 0;
  let firstGroup = true;

  for (const key of sortedKeys) {
    const items = groups.get(key)!.slice().sort((a, b) => {
      const ya = Number(a.specs?.productionYear) || 0;
      const yb = Number(b.specs?.productionYear) || 0;
      if (yb !== ya) return yb - ya;
      const ha = Number(a.specs?.workingHours) || 0;
      const hb = Number(b.specs?.workingHours) || 0;
      return ha - hb;
    });

    if (!firstGroup) {
      rowIndex++;
      sheet.getRow(rowIndex).height = 8;
    }
    firstGroup = false;

    rowIndex++;
    sheet.mergeCells(`A${rowIndex}:${last}${rowIndex}`);
    sheet.getRow(rowIndex).height = 24;
    const groupRow = sheet.getRow(rowIndex);
    for (let i = 1; i <= COLUMNS.length; i++) {
      const cell = groupRow.getCell(i);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } };
      cell.border = bottomLine(NAVY, 'medium');
    }
    const gCell = sheet.getCell(`A${rowIndex}`);
    gCell.value = key === FALLBACK_GROUP ? key : `Toyota BT ${key}`;
    gCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: NAVY } };
    gCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    for (const p of items) {
      rowIndex++;
      counter++;
      const row = sheet.getRow(rowIndex);
      row.height = 17;

      const netPrice = (p as any).netPrice;
      const isSold = p.availabilityStatus === 'sold';
      const priceMode = (p as any).priceDisplayMode || 'inquiry_with_pricelist';
      const numericPrice = typeof netPrice === 'number' ? netPrice : Number(netPrice) || 0;
      const showPrice =
        (priceMode === 'show_price' || priceMode === 'inquiry_with_pricelist') && numericPrice > 0;

      const values: any[] = [
        counter,
        displayNames.get(p.id) || p.model || '',
        p.specs?.serialNumber || '',
        p.specs?.productionYear || '',
        Number(p.specs?.workingHours) || (p.specs?.workingHours as any) || '',
        formatCapacity(p.specs?.mastLiftingCapacity),
        formatLift(p.specs?.liftHeight),
        normalizeMast(p.specs?.mast),
        normalizeBattery(p.specs?.battery),
        availabilityLabel(p.availabilityStatus),
        showPrice ? numericPrice : 'Zapytaj o cenę',
        showPrice ? (p as any).priceCurrency || 'PLN' : '',
        'Kliknij',
      ];
      row.values = values;

      COLUMNS.forEach((c, i) => {
        const len = displayLength(values[i], c.key);
        if (len > maxLens[i]) maxLens[i] = len;
      });




      COLUMNS.forEach((c, i) => {
        const cell = row.getCell(i + 1);
        cell.border = bottomLine(ROW_LINE);
        cell.alignment = { horizontal: c.align, vertical: 'middle' };
        let color = isSold ? MUTED : 'FF000000';
        let bold = false;
        if (c.key === 'index') color = MUTED;
        if (c.key === 'netPrice') {
          cell.numFmt = '#,##0.00';
          if (!isSold) {
            color = NAVY;
            bold = true;
          }
        }
        cell.font = { name: 'Arial', size: 10, color: { argb: color }, bold };
      });

      const photoCell = row.getCell(COLUMNS.length);
      photoCell.value = {
        text: 'Kliknij',
        hyperlink: `https://stakerpol.pl/products/${(p as any).slug || p.id}`,
      };
      photoCell.font = {
        name: 'Arial',
        size: 10,
        color: { argb: isSold ? MUTED : NAVY },
        underline: true,
      };
      photoCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }

  maxLens.forEach((len, i) => {
    sheet.getColumn(i + 1).width = Math.min(COL_MAX, Math.max(COL_MIN, len + COL_MARGIN));
  });



  // --- PODSUMOWANIE ---
  const availableCount = products.filter((p) => p.availabilityStatus === 'available').length;
  const reservedCount = products.filter((p) => p.availabilityStatus === 'reserved').length;
  const summaryRow = rowIndex + 2;
  sheet.mergeCells(`A${summaryRow}:${last}${summaryRow}`);
  const sCell = sheet.getCell(`A${summaryRow}`);
  sCell.value = `Łącznie pozycji: ${counter} · dostępnych: ${availableCount} · zarezerwowanych: ${reservedCount}`;
  sCell.alignment = { horizontal: 'right', vertical: 'middle' };
  sCell.font = { name: 'Arial', size: 9, color: { argb: NAVY } };

  // --- STOPKA ---
  const footer1 = summaryRow + 2;
  const footer2 = summaryRow + 3;

  const separatorRow = sheet.getRow(footer1 - 1);
  separatorRow.height = 6;
  for (let i = 1; i <= COLUMNS.length; i++) {
    separatorRow.getCell(i).border = bottomLine(ROW_LINE);
  }

  sheet.mergeCells(`A${footer1}:${last}${footer1}`);
  const f1 = sheet.getCell(`A${footer1}`);
  f1.value = `www.stakerpol.pl · tel. ${COMPANY.phone} · ${COMPANY.email}`;
  f1.alignment = { horizontal: 'left', vertical: 'middle' };
  f1.font = { name: 'Arial', size: 8, color: { argb: GRAY_TEXT } };

  sheet.mergeCells(`A${footer2}:${last}${footer2}`);
  const f2 = sheet.getCell(`A${footer2}`);
  f2.value = `${COMPANY.name}, ${COMPANY.address} · NIP 6492111954 · REGON 120724080`;
  f2.alignment = { horizontal: 'left', vertical: 'middle' };
  f2.font = { name: 'Arial', size: 8, color: { argb: GRAY_TEXT } };

  sheet.views = [{ state: 'frozen', ySplit: HEADER_ROW }];

  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: `${HEADER_ROW}:${HEADER_ROW}`,
    margins: {
      left: 0.394,
      right: 0.394,
      top: 0.394,
      bottom: 0.394,
      header: 0,
      footer: 0,
    },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `stan-magazynu_${date}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

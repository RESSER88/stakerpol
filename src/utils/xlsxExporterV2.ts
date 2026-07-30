import ExcelJS from 'exceljs';
import { Product } from '@/types';

const NAVY = 'FF1E3A5F';
const ORANGE = 'FFF97316';
const GRAY_BORDER = 'FFE5E7EB';
const ZEBRA = 'FFF9FAFB';
const GRAY_TEXT = 'FF6B7280';
const LINK_BLUE = 'FF2563EB';

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

const COLUMNS: { header: string; key: string; width: number; align: 'left' | 'right' | 'center' }[] = [
  { header: 'Nr', key: 'index', width: 5, align: 'center' },
  { header: 'Model', key: 'model', width: 30, align: 'left' },
  { header: 'Numer seryjny', key: 'serialNumber', width: 14, align: 'left' },
  { header: 'Rok', key: 'productionYear', width: 8, align: 'center' },
  { header: 'Godziny (mh)', key: 'workingHours', width: 10, align: 'right' },
  { header: 'Udźwig', key: 'mastLiftingCapacity', width: 12, align: 'right' },
  { header: 'Podnoszenie', key: 'liftHeight', width: 13, align: 'right' },
  { header: 'Maszt', key: 'mast', width: 12, align: 'left' },
  { header: 'Bateria', key: 'battery', width: 22, align: 'left' },
  { header: 'Dostępność', key: 'availability', width: 12, align: 'left' },
  { header: 'Cena netto', key: 'netPrice', width: 12, align: 'right' },
  { header: 'Waluta', key: 'priceCurrency', width: 8, align: 'left' },
  { header: 'Zdjęcia', key: 'photos', width: 16, align: 'center' },
];

const FALLBACK_GROUP = 'SWE 120L 140L';
const SERIES_ORDER = ['SWE', 'LWE', 'SPE', 'RRE', 'LSE'];

const modelKey = (model?: string) => {
  const m = (model || '').match(/\b(SWE|LWE|SPE|RRE|LSE)\s*(\d+[A-Z]*)\b/i);
  if (!m) return FALLBACK_GROUP;
  return `${m[1].toUpperCase()} ${m[2].toUpperCase()}`;
};

const seriesRank = (key: string) => {
  if (key === FALLBACK_GROUP) return 999;
  const idx = SERIES_ORDER.indexOf(key.split(' ')[0]);
  return idx === -1 ? 500 : idx;
};

const thinBorder = {
  top: { style: 'thin' as const, color: { argb: GRAY_BORDER } },
  left: { style: 'thin' as const, color: { argb: GRAY_BORDER } },
  bottom: { style: 'thin' as const, color: { argb: GRAY_BORDER } },
  right: { style: 'thin' as const, color: { argb: GRAY_BORDER } },
};

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

  COLUMNS.forEach((c, i) => {
    sheet.getColumn(i + 1).width = c.width;
  });

  const last = lastColLetter();

  // --- 1. NAGŁÓWEK PLIKU ---
  sheet.getRow(1).height = 34;
  for (let r = 2; r <= 4; r++) sheet.getRow(r).height = 18;

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dateLabel = `${dd}.${mm}.${today.getFullYear()}`;

  sheet.mergeCells('A1:C1');
  const brand = sheet.getCell('A1');
  brand.value = 'STAKERPOL';
  brand.font = { name: 'Arial', size: 24, bold: true, color: { argb: NAVY } };
  brand.alignment = { horizontal: 'left', vertical: 'middle' };

  sheet.mergeCells('A2:C2');
  const tagline = sheet.getCell('A2');
  tagline.value = 'Sprzedaż paleciaków elektrycznych BT Toyota';
  tagline.font = { name: 'Arial', size: 10, color: { argb: GRAY_TEXT } };
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
    cell.font = { name: 'Arial', size: 10, bold: idx === 0, color: { argb: idx === 0 ? NAVY : GRAY_TEXT } };
  });

  sheet.mergeCells(`F1:${last}1`);
  const dateCell = sheet.getCell('F1');
  dateCell.value = `Stan magazynu na ${dateLabel}`;
  dateCell.alignment = { horizontal: 'right', vertical: 'middle' };
  dateCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: NAVY } };

  sheet.mergeCells(`A5:${last}5`);
  sheet.getRow(5).height = 4;
  sheet.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };

  // --- 2. NAGŁÓWEK TABELI ---
  const HEADER_ROW = 6;
  const headerRow = sheet.getRow(HEADER_ROW);
  headerRow.values = COLUMNS.map((c) => c.header);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });

  // --- 3. GRUPOWANIE ---
  const groups = new Map<string, Product[]>();
  products.forEach((p) => {
    const key = modelKey(p.model);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  });

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    const ra = seriesRank(a);
    const rb = seriesRank(b);
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });

  let rowIndex = HEADER_ROW;
  let counter = 0;

  for (const key of sortedKeys) {
    const items = groups.get(key)!.slice().sort((a, b) => {
      const ya = Number(a.specs?.productionYear) || 0;
      const yb = Number(b.specs?.productionYear) || 0;
      if (yb !== ya) return yb - ya;
      const ha = Number(a.specs?.workingHours) || 0;
      const hb = Number(b.specs?.workingHours) || 0;
      return ha - hb;
    });

    rowIndex++;
    sheet.mergeCells(`A${rowIndex}:${last}${rowIndex}`);
    sheet.getRow(rowIndex).height = 22;
    const gCell = sheet.getCell(`A${rowIndex}`);
    gCell.value = `Toyota BT ${key}`;
    gCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
    gCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    gCell.alignment = { horizontal: 'left', vertical: 'middle' };
    gCell.border = thinBorder;

    for (const p of items) {
      rowIndex++;
      counter++;
      const row = sheet.getRow(rowIndex);
      row.height = 15;

      const netPrice = (p as any).netPrice;
      row.values = [
        counter,
        p.model || '',
        p.specs?.serialNumber || '',
        p.specs?.productionYear || '',
        Number(p.specs?.workingHours) || (p.specs?.workingHours as any) || '',
        formatCapacity(p.specs?.mastLiftingCapacity),
        formatLift(p.specs?.liftHeight),
        p.specs?.mast || '',
        p.specs?.battery || '',
        availabilityLabel(p.availabilityStatus),
        typeof netPrice === 'number' ? netPrice : Number(netPrice) || '',
        (p as any).priceCurrency || 'PLN',
        '',
      ];

      const zebra = counter % 2 === 1;
      COLUMNS.forEach((c, i) => {
        const cell = row.getCell(i + 1);
        cell.border = thinBorder;
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { horizontal: c.align, vertical: 'middle' };
        if (zebra) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
        }
        if (c.key === 'netPrice') cell.numFmt = '#,##0.00';
      });

      const photoCell = row.getCell(COLUMNS.length);
      photoCell.value = {
        text: 'Zobacz zdjęcia',
        hyperlink: `https://stakerpol.pl/products/${(p as any).slug || p.id}`,
      };
      photoCell.font = { name: 'Arial', size: 10, color: { argb: LINK_BLUE }, underline: true };
      photoCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }

  // --- PODSUMOWANIE ---
  const availableCount = products.filter((p) => p.availabilityStatus === 'available').length;
  const reservedCount = products.filter((p) => p.availabilityStatus === 'reserved').length;
  const summaryRow = rowIndex + 2;
  sheet.mergeCells(`A${summaryRow}:${last}${summaryRow}`);
  const sCell = sheet.getCell(`A${summaryRow}`);
  sCell.value = `Łącznie pozycji: ${counter} · dostępnych: ${availableCount} · zarezerwowanych: ${reservedCount}`;
  sCell.alignment = { horizontal: 'right', vertical: 'middle' };
  sCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: NAVY } };

  // --- STOPKA ---
  const footer1 = summaryRow + 2;
  const footer2 = summaryRow + 3;

  sheet.mergeCells(`A${footer1}:${last}${footer1}`);
  const f1 = sheet.getCell(`A${footer1}`);
  f1.value = `www.stakerpol.pl · tel. ${COMPANY.phone} · ${COMPANY.email}`;
  f1.alignment = { horizontal: 'center', vertical: 'middle' };
  f1.font = { name: 'Arial', size: 10, bold: true, color: { argb: NAVY } };

  sheet.mergeCells(`A${footer2}:${last}${footer2}`);
  const f2 = sheet.getCell(`A${footer2}`);
  f2.value = `${COMPANY.name}, ${COMPANY.address} · NIP 6492111954 · REGON 120724080`;
  f2.alignment = { horizontal: 'center', vertical: 'middle' };
  f2.font = { name: 'Arial', size: 9, color: { argb: GRAY_TEXT } };

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

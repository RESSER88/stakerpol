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
  { header: 'Model', key: 'model', width: 30, align: 'left' },
  { header: 'Numer seryjny', key: 'serialNumber', width: 14, align: 'left' },
  { header: 'Rok', key: 'productionYear', width: 8, align: 'center' },
  { header: 'Godziny (mh)', key: 'workingHours', width: 10, align: 'right' },
  { header: 'Udźwig maszt (kg)', key: 'mastLiftingCapacity', width: 12, align: 'right' },
  { header: 'Wys. podnoszenia (mm)', key: 'liftHeight', width: 14, align: 'right' },
  { header: 'Maszt', key: 'mast', width: 12, align: 'left' },
  { header: 'Bateria', key: 'battery', width: 22, align: 'left' },
  { header: 'Dostępność', key: 'availability', width: 12, align: 'left' },
  { header: 'Stan', key: 'condition', width: 22, align: 'left' },
  { header: 'Cena netto', key: 'netPrice', width: 12, align: 'right' },
  { header: 'Waluta', key: 'priceCurrency', width: 8, align: 'left' },
  { header: 'Rata leasingu', key: 'leasing', width: 14, align: 'right' },
  { header: 'Gwarancja (mies.)', key: 'warranty', width: 10, align: 'center' },
  { header: 'Zdjęcia', key: 'photos', width: 16, align: 'center' },
];

const SERIES_LABELS: Record<string, string> = {
  SWE: 'Toyota BT SWE — stakery i paleciaki elektryczne z podestem',
  LWE: 'Toyota BT LWE — paleciaki elektryczne prowadzone',
  SPE: 'Toyota BT SPE — stakery elektryczne prowadzone',
  RRE: 'Toyota BT RRE — wózki wysokiego składowania (reach truck)',
  LSE: 'Toyota BT LSE — wózki kompletacyjne / paleciaki z podestem',
  OTHER: 'Pozostałe',
};

const seriesOf = (model?: string) => {
  const m = (model || '').match(/\b(SWE|LWE|SPE|RRE|LSE)\b/i);
  return m ? m[1].toUpperCase() : 'OTHER';
};

const thinBorder = {
  top: { style: 'thin' as const, color: { argb: GRAY_BORDER } },
  left: { style: 'thin' as const, color: { argb: GRAY_BORDER } },
  bottom: { style: 'thin' as const, color: { argb: GRAY_BORDER } },
  right: { style: 'thin' as const, color: { argb: GRAY_BORDER } },
};

const lastColLetter = () => String.fromCharCode(64 + COLUMNS.length); // 15 -> 'O'

/**
 * Logo. Nawigacja strony używa logotypu tekstowego (brak pliku graficznego),
 * więc renderujemy jego wersję rastrową na canvasie i wstawiamy jako obraz.
 * Jeśli w public/ pojawi się logo.png, zostanie użyte w pierwszej kolejności.
 */
async function loadLogoPng(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch('/logo.png');
    if (res.ok) {
      const buf = await res.arrayBuffer();
      if (buf.byteLength > 0) return buf;
    }
  } catch {
    /* fallback poniżej */
  }
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 420;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1E3A5F';
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('Stakerpol', 8, 56);
    ctx.fillStyle = '#F97316';
    ctx.fillRect(8, 98, 300, 8);
    const dataUrl = canvas.toDataURL('image/png');
    const bin = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  } catch {
    return null;
  }
}

export async function exportProductListToBrandedXLSX(products: Product[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Stan magazynu');

  COLUMNS.forEach((c, i) => {
    sheet.getColumn(i + 1).width = c.width;
  });

  const last = lastColLetter();

  // --- 1. NAGŁÓWEK PLIKU (wiersze 1-4) + linia (wiersz 5) ---
  for (let r = 1; r <= 4; r++) sheet.getRow(r).height = 18;

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dateLabel = `${dd}.${mm}.${today.getFullYear()}`;

  // logo w lewym górnym rogu
  const logo = await loadLogoPng();
  if (logo) {
    const imageId = workbook.addImage({ buffer: logo as any, extension: 'png' });
    sheet.addImage(imageId, {
      tl: { col: 0.2, row: 0.2 },
      ext: { width: 210, height: 60 },
    });
  }

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

  // pomarańczowa linia oddzielająca
  sheet.mergeCells(`A5:${last}5`);
  sheet.getRow(5).height = 4;
  sheet.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };

  // --- 2. NAGŁÓWEK TABELI (wiersz 6) ---
  const HEADER_ROW = 6;
  const headerRow = sheet.getRow(HEADER_ROW);
  headerRow.values = COLUMNS.map((c) => c.header);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = thinBorder;
  });

  // --- 3. GRUPOWANIE ---
  const groups = new Map<string, Product[]>();
  products.forEach((p) => {
    const key = seriesOf(p.model);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  });

  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === 'OTHER') return 1;
    if (b === 'OTHER') return -1;
    return a.localeCompare(b);
  });

  let rowIndex = HEADER_ROW;
  let dataCounter = 0;

  for (const key of sortedKeys) {
    const items = groups.get(key)!.slice().sort((a, b) => {
      const byModel = (a.model || '').localeCompare(b.model || '');
      if (byModel !== 0) return byModel;
      const ya = Number(a.specs?.productionYear) || 0;
      const yb = Number(b.specs?.productionYear) || 0;
      return yb - ya;
    });

    // nagłówek grupy
    rowIndex++;
    sheet.mergeCells(`A${rowIndex}:${last}${rowIndex}`);
    const gRow = sheet.getRow(rowIndex);
    gRow.height = 20;
    const gCell = sheet.getCell(`A${rowIndex}`);
    gCell.value = SERIES_LABELS[key] || key;
    gCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };
    gCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    gCell.alignment = { horizontal: 'left', vertical: 'middle' };
    gCell.border = thinBorder;

    for (const p of items) {
      rowIndex++;
      dataCounter++;
      const row = sheet.getRow(rowIndex);
      row.height = 18;

      const netPrice = (p as any).netPrice;
      const values: (string | number)[] = [
        p.model || '',
        p.specs?.serialNumber || '',
        p.specs?.productionYear || '',
        Number(p.specs?.workingHours) || (p.specs?.workingHours as any) || '',
        Number(p.specs?.mastLiftingCapacity) || (p.specs?.mastLiftingCapacity as any) || '',
        Number(p.specs?.liftHeight) || (p.specs?.liftHeight as any) || '',
        p.specs?.mast || '',
        p.specs?.battery || '',
        availabilityLabel(p.availabilityStatus),
        p.specs?.condition || '',
        typeof netPrice === 'number' ? netPrice : Number(netPrice) || '',
        (p as any).priceCurrency || 'PLN',
        p.leasingMonthlyFromPln ?? '',
        p.warrantyMonths ?? '',
        '',
      ];
      row.values = values;

      const zebra = dataCounter % 2 === 1;
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

      // kolumna Zdjęcia — hiperłącze
      const photoCell = row.getCell(COLUMNS.length);
      photoCell.value = {
        text: 'Zobacz zdjęcia',
        hyperlink: `https://stakerpol.pl/products/${(p as any).slug || p.id}`,
      };
      photoCell.font = { name: 'Arial', size: 10, color: { argb: LINK_BLUE }, underline: true };
      photoCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }
  }

  // --- 7. STOPKA ---
  const footer1 = rowIndex + 2;
  const footer2 = rowIndex + 3;

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

  // --- 8. WIDOK WYDRUKU ---
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

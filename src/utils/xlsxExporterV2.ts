import ExcelJS from 'exceljs';
import { Product } from '@/types';
import {
  COMPANY,
  WAREHOUSE,
  EXPORT_COLUMNS as COLUMNS,
  buildExportRows,
  formatPrice,
} from '@/utils/exportListModel';
import { MAPS_ICON_BASE64 } from '@/utils/exportMapsIcon';

const NAVY = 'FF1E3A5F';
const ORANGE = 'FFF97316';
const LIGHT_GRAY = 'FFF4F6F8';
const ROW_LINE = 'FFE8EAED';
const GRAY_TEXT = 'FF6B7280';
const MUTED = 'FF9CA3AF';

const COL_MARGIN = 2;
const COL_MIN = 6;
const COL_MAX = 34;

const displayLength = (v: unknown, key: string) => {
  if (v === null || v === undefined || v === '') return 0;
  if (key === 'netPrice' && typeof v === 'number') {
    return formatPrice(v).length;
  }
  return String(v).length;
};

const bottomLine = (color: string, style: 'thin' | 'medium' = 'thin') => ({
  bottom: { style, color: { argb: color } },
});

const lastColLetter = () => String.fromCharCode(64 + COLUMNS.length);

export async function exportProductListToBrandedXLSX(products: Product[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Stan magazynu');

  const maxLens = COLUMNS.map((c) => c.header.length);

  const last = lastColLetter();

  const model = buildExportRows(products);

  // --- 1. NAGŁÓWEK PLIKU ---
  sheet.getRow(1).height = 32;
  for (let r = 2; r <= 4; r++) sheet.getRow(r).height = 16;

  const dateLabel = model.dateLabel;

  sheet.mergeCells('A1:C1');
  const brand = sheet.getCell('A1');
  brand.value = 'STAKERPOL';
  brand.font = { name: 'Arial', size: 22, bold: true, color: { argb: NAVY } };
  brand.alignment = { horizontal: 'left', vertical: 'middle' };

  sheet.mergeCells('A2:C2');
  const tagline = sheet.getCell('A2');
  tagline.value = COMPANY.tagline;
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

  // --- blok "Prowadź do magazynu" (po lewej stronie nagłówka) ---
  const iconId = workbook.addImage({ base64: MAPS_ICON_BASE64, extension: 'png' });
  sheet.addImage(iconId, {
    tl: { col: 0.15, row: 2.15 } as any,
    ext: { width: 28, height: 28 },
    editAs: 'oneCell',
  });

  sheet.mergeCells('B3:D3');
  const whLabel = sheet.getCell('B3');
  whLabel.value = { text: WAREHOUSE.label, hyperlink: WAREHOUSE.mapsUrl };
  whLabel.font = { name: 'Arial', size: 9, color: { argb: NAVY }, underline: true };
  whLabel.alignment = { horizontal: 'left', vertical: 'middle' };

  sheet.mergeCells('B4:D4');
  const whAddress = sheet.getCell('B4');
  whAddress.value = WAREHOUSE.address;
  whAddress.font = { name: 'Arial', size: 8, color: { argb: MUTED } };
  whAddress.alignment = { horizontal: 'left', vertical: 'middle' };

  // pomarańczowa kreska akcentu pod "STAKERPOL"
  sheet.mergeCells('A5:C5');
  sheet.getRow(5).height = 3;
  sheet.getCell('A5').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ORANGE } };


  // --- 2. NAGŁÓWEK TABELI ---
  const HEADER_ROW = 6;
  const headerRow = sheet.getRow(HEADER_ROW);
  headerRow.values = COLUMNS.map((c) => c.header);
  headerRow.height = 20;
  COLUMNS.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: NAVY } };
    cell.alignment = { horizontal: c.align, vertical: 'middle', wrapText: true };
    cell.border = bottomLine(NAVY, 'medium');
  });

  // --- 3. GRUPOWANIE ---
  let rowIndex = HEADER_ROW;
  let firstGroup = true;

  for (const group of model.groups) {
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
    gCell.value = group.label;
    gCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: NAVY } };
    gCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    for (const r of group.rows) {
      rowIndex++;
      const row = sheet.getRow(rowIndex);
      row.height = 17;

      const isSold = r.isSold;
      const showPrice = r.showPrice;

      const values: any[] = [
        r.index,
        r.model,
        r.serialNumber,
        r.productionYear,
        r.workingHours,
        r.mastLiftingCapacity,
        r.liftHeight,
        r.mast,
        r.battery,
        r.availability,
        showPrice ? r.netPrice : 'Zapytaj o cenę',
        r.priceCurrency,
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
        if (c.key === 'netPrice' && showPrice) {
          cell.numFmt = '#,##0.00';
          if (!isSold) {
            color = NAVY;
            bold = true;
          }
        }
        cell.font = { name: 'Arial', size: 10, color: { argb: color }, bold };
      });

      if (!showPrice) {
        const priceIdx = COLUMNS.findIndex((c) => c.key === 'netPrice') + 1;
        const priceCell = row.getCell(priceIdx);
        priceCell.value = {
          text: 'Zapytaj o cenę',
          hyperlink: r.mailtoHref,
        };
        priceCell.numFmt = 'General';
        priceCell.font = {
          name: 'Arial',
          size: 9,
          color: { argb: NAVY },
          underline: true,
          bold: false,
        };
        priceCell.alignment = {
          horizontal: COLUMNS[priceIdx - 1].align,
          vertical: 'middle',
        };

      }

      const photoCell = row.getCell(COLUMNS.length);
      photoCell.value = {
        text: 'Kliknij',
        hyperlink: r.productUrl,
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
  const summaryRow = rowIndex + 2;
  sheet.mergeCells(`A${summaryRow}:${last}${summaryRow}`);
  const sCell = sheet.getCell(`A${summaryRow}`);
  sCell.value = model.summary;
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
  f1.value = `${COMPANY.site} · tel. ${COMPANY.phone} · ${COMPANY.email}`;
  f1.alignment = { horizontal: 'left', vertical: 'middle' };
  f1.font = { name: 'Arial', size: 8, color: { argb: GRAY_TEXT } };

  sheet.mergeCells(`A${footer2}:${last}${footer2}`);
  const f2 = sheet.getCell(`A${footer2}`);
  f2.value = `${COMPANY.name}, ${COMPANY.address} · NIP ${COMPANY.nip} · REGON ${COMPANY.regon}`;
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

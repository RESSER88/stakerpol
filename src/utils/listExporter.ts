import jsPDF from 'jspdf';
import autoTable, { CellHookData } from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Product } from '@/types';
import {
  COMPANY,
  WAREHOUSE,
  COLORS,
  EXPORT_COLUMNS,
  buildExportRows,
  formatPrice,
  fileDateStamp,
  escapeHtml,
  ExportModel,
  ExportRow,
} from '@/utils/exportListModel';
import { MAPS_ICON_DATA_URI } from '@/utils/exportMapsIcon';

/* ------------------------------------------------------------------ */
/*  FONT Z POLSKIMI ZNAKAMI (ładowany w locie, nie trafia do bundla)   */
/* ------------------------------------------------------------------ */

const FONT_FAMILY = 'Roboto';
const FONT_FILES: { style: 'normal' | 'bold'; file: string; vfs: string }[] = [
  { style: 'normal', file: '/fonts/Roboto-Regular.ttf', vfs: 'Roboto-Regular.ttf' },
  { style: 'bold', file: '/fonts/Roboto-Bold.ttf', vfs: 'Roboto-Bold.ttf' },
];

const fontCache = new Map<string, string>();

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
};

async function registerPolishFont(doc: jsPDF): Promise<void> {
  for (const { style, file, vfs } of FONT_FILES) {
    let base64 = fontCache.get(file);
    if (!base64) {
      const res = await fetch(file);
      if (!res.ok) {
        throw new Error(`Nie udało się załadować fontu ${file} (HTTP ${res.status}).`);
      }
      const buffer = await res.arrayBuffer();
      if (!buffer.byteLength) {
        throw new Error(`Plik fontu ${file} jest pusty.`);
      }
      base64 = arrayBufferToBase64(buffer);
      fontCache.set(file, base64);
    }
    doc.addFileToVFS(vfs, base64);
    doc.addFont(vfs, FONT_FAMILY, style);
  }
  const available = doc.getFontList()[FONT_FAMILY];
  if (!available || !available.includes('normal') || !available.includes('bold')) {
    throw new Error('Font z polskimi znakami nie został poprawnie zarejestrowany.');
  }
  doc.setFont(FONT_FAMILY, 'normal');
}

/* ------------------------------------------------------------------ */
/*  Pomocnicze                                                         */
/* ------------------------------------------------------------------ */

const hexToRgb = (hex: string): [number, number, number] => {
  const v = hex.replace('#', '');
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
};

const RGB = {
  navy: hexToRgb(COLORS.navy),
  orange: hexToRgb(COLORS.orange),
  lightGray: hexToRgb(COLORS.lightGray),
  rowLine: hexToRgb(COLORS.rowLine),
  grayText: hexToRgb(COLORS.grayText),
  muted: hexToRgb(COLORS.muted),
  black: hexToRgb(COLORS.black),
};

const PRICE_COL = EXPORT_COLUMNS.findIndex((c) => c.key === 'netPrice');
const PHOTO_COL = EXPORT_COLUMNS.findIndex((c) => c.key === 'photos');

type RowMeta =
  | { kind: 'group' }
  | { kind: 'data'; row: ExportRow }
  | { kind: 'summary' };

const priceText = (r: ExportRow) => (r.showPrice ? formatPrice(r.netPrice) : 'Zapytaj o cenę');

/* ------------------------------------------------------------------ */
/*  PDF — dokument tekstowy (jspdf-autotable)                          */
/* ------------------------------------------------------------------ */

export const exportProductListToPDF = async (products: Product[]): Promise<void> => {
  const doc = new jsPDF('l', 'mm', 'a4');
  await registerPolishFont(doc);

  const model = buildExportRows(products);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;

  const body: any[][] = [];
  const meta: RowMeta[] = [];

  model.groups.forEach((group) => {
    body.push([{ content: group.label, colSpan: EXPORT_COLUMNS.length }]);
    meta.push({ kind: 'group' });
    group.rows.forEach((r) => {
      body.push([
        String(r.index),
        r.model,
        r.serialNumber,
        r.productionYear,
        r.workingHours === '' ? '' : String(r.workingHours),
        r.mastLiftingCapacity,
        r.liftHeight,
        r.mast,
        r.battery,
        r.availability,
        priceText(r),
        r.priceCurrency,
        'Kliknij',
      ]);
      meta.push({ kind: 'data', row: r });
    });
  });

  body.push([{ content: model.summary, colSpan: EXPORT_COLUMNS.length }]);
  meta.push({ kind: 'summary' });

  const columnStyles: Record<number, any> = {};
  EXPORT_COLUMNS.forEach((c, i) => {
    columnStyles[i] = { halign: c.align };
  });
  columnStyles[0].cellWidth = 9;

  const drawHeader = () => {
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...RGB.navy);
    doc.text('STAKERPOL', margin, 13);

    doc.setFillColor(...RGB.orange);
    doc.rect(margin, 15.5, 34, 1, 'F');

    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...RGB.grayText);
    doc.text(COMPANY.tagline, margin, 20.5);

    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...RGB.navy);
    doc.text(`Stan magazynu na ${model.dateLabel}`, pageWidth - margin, 10, { align: 'right' });

    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...RGB.grayText);
    doc.text(`${COMPANY.name} · ${COMPANY.person}`, pageWidth - margin, 14.5, { align: 'right' });
    doc.text(`tel. ${COMPANY.phone} · ${COMPANY.email}`, pageWidth - margin, 18.5, { align: 'right' });
    doc.text(COMPANY.address, pageWidth - margin, 22.5, { align: 'right' });

    // blok "Prowadź do magazynu" — wolna przestrzeń po lewej, pod tagline
    const whX = margin + 62;
    const whIconY = 9;
    const whIconSize = 8;
    doc.addImage(MAPS_ICON_DATA_URI, 'PNG', whX, whIconY, whIconSize, whIconSize);

    const textX = whX + whIconSize + 2.5;
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...RGB.navy);
    doc.text(WAREHOUSE.label, textX, whIconY + 3.5);

    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...RGB.muted);
    doc.text(WAREHOUSE.address, textX, whIconY + 7.5);

    const linkWidth = whIconSize + 2.5 + Math.max(
      doc.getTextWidth(WAREHOUSE.label),
      doc.getTextWidth(WAREHOUSE.address)
    );
    doc.link(whX, whIconY - 1, linkWidth, whIconSize + 3, { url: WAREHOUSE.mapsUrl });
  };


  const drawFooter = () => {
    const y = pageHeight - 8;
    doc.setDrawColor(...RGB.rowLine);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 6, pageWidth - margin, y - 6);

    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...RGB.grayText);

    const siteWidth = doc.getTextWidth(COMPANY.site);
    doc.text(`${COMPANY.site} · tel. ${COMPANY.phone} · ${COMPANY.email}`, margin, y - 2.5);
    doc.link(margin, y - 5.5, siteWidth, 4, { url: `https://${COMPANY.site}` });

    doc.text(
      `${COMPANY.name}, ${COMPANY.address} · NIP ${COMPANY.nip} · REGON ${COMPANY.regon}`,
      margin,
      y + 1.5
    );
  };

  const drawPageNumbers = () => {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFont(FONT_FAMILY, 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...RGB.grayText);
      doc.text(`Strona ${i} z ${total}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
    }
  };

  autoTable(doc, {
    head: [EXPORT_COLUMNS.map((c) => c.header)],
    body,
    startY: 27,
    margin: { top: 27, left: margin, right: margin, bottom: 16 },
    showHead: 'everyPage',
    theme: 'plain',
    styles: {
      font: FONT_FAMILY,
      fontSize: 7.5,
      cellPadding: { top: 1.4, bottom: 1.4, left: 1.6, right: 1.6 },
      lineColor: RGB.rowLine,
      lineWidth: { bottom: 0.15, top: 0, left: 0, right: 0 },
      textColor: RGB.black,
      overflow: 'ellipsize',
    },
    headStyles: {
      font: FONT_FAMILY,
      fontStyle: 'bold',
      fontSize: 7,
      textColor: RGB.navy,
      fillColor: false as any,
      lineColor: RGB.navy,
      lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 },
      valign: 'middle',
    },
    columnStyles,
    didParseCell: (data: CellHookData) => {
      if (data.section !== 'body') return;
      const info = meta[data.row.index];
      if (!info) return;

      if (info.kind === 'group') {
        data.cell.styles.fillColor = RGB.lightGray;
        data.cell.styles.textColor = RGB.navy;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 8.5;
        data.cell.styles.halign = 'left';
        data.cell.styles.lineColor = RGB.navy;
        data.cell.styles.lineWidth = { bottom: 0.4, top: 0, left: 0, right: 0 } as any;
        data.cell.styles.cellPadding = { top: 2, bottom: 2, left: 1.6, right: 1.6 };
        return;
      }

      if (info.kind === 'summary') {
        data.cell.styles.textColor = RGB.navy;
        data.cell.styles.halign = 'right';
        data.cell.styles.fontSize = 7.5;
        data.cell.styles.lineWidth = { bottom: 0, top: 0, left: 0, right: 0 } as any;
        data.cell.styles.cellPadding = { top: 3, bottom: 1, left: 1.6, right: 1.6 };
        return;
      }

      const r = info.row;
      const col = data.column.index;
      if (r.isSold) data.cell.styles.textColor = RGB.muted;
      if (col === 0) data.cell.styles.textColor = RGB.muted;
      if (col === PRICE_COL) {
        if (r.showPrice && !r.isSold) {
          data.cell.styles.textColor = RGB.navy;
          data.cell.styles.fontStyle = 'bold';
        } else if (!r.showPrice) {
          data.cell.styles.textColor = RGB.navy;
          data.cell.styles.fontSize = 7;
        }
      }
      if (col === PHOTO_COL) {
        data.cell.styles.textColor = r.isSold ? RGB.muted : RGB.navy;
      }
    },
    didDrawCell: (data: CellHookData) => {
      if (data.section !== 'body') return;
      const info = meta[data.row.index];
      if (!info || info.kind !== 'data') return;
      const r = info.row;
      const col = data.column.index;
      const { x, y, width, height } = data.cell;

      if (col === PHOTO_COL) {
        doc.link(x, y, width, height, { url: r.productUrl });
      }
      if (col === PRICE_COL && !r.showPrice) {
        doc.link(x, y, width, height, { url: r.mailtoHref });
      }
    },
    didDrawPage: () => {
      drawHeader();
      drawFooter();
    },
  });

  drawPageNumbers();

  doc.save(`Stan_magazynu_${fileDateStamp()}.pdf`);
};

/* ------------------------------------------------------------------ */
/*  Szablon HTML (tylko dla JPG) — style inline, bez webfontów         */
/* ------------------------------------------------------------------ */

const FONT_STACK = "Arial, Helvetica, 'Liberation Sans', sans-serif";

const renderListHTML = (model: ExportModel): string => {
  const cellBase = (align: string, extra = '') =>
    `padding:5px 6px;text-align:${align};border-bottom:1px solid ${COLORS.rowLine};white-space:nowrap;${extra}`;

  const rowsHtml = model.groups
    .map((group) => {
      const groupRow = `
        <tr>
          <td colspan="${EXPORT_COLUMNS.length}" style="padding:8px 6px;background:${COLORS.lightGray};color:${COLORS.navy};font-weight:bold;font-size:14px;border-bottom:2px solid ${COLORS.navy};">
            ${escapeHtml(group.label)}
          </td>
        </tr>`;

      const items = group.rows
        .map((r) => {
          const base = r.isSold ? COLORS.muted : COLORS.black;
          const priceStyle = !r.showPrice
            ? `color:${COLORS.navy};`
            : r.isSold
              ? `color:${COLORS.muted};`
              : `color:${COLORS.navy};font-weight:bold;`;
          const photoLabel = r.serialNumber ? `nr ${r.serialNumber}` : '—';

          const al = (i: number) => EXPORT_COLUMNS[i].align;
          const cells = [
            `<td style="${cellBase(al(0), `color:${COLORS.muted};`)}">${r.index}</td>`,
            `<td style="${cellBase(al(1), `color:${base};`)}">${escapeHtml(r.model)}</td>`,
            `<td style="${cellBase(al(2), `color:${base};`)}">${escapeHtml(r.serialNumber)}</td>`,
            `<td style="${cellBase(al(3), `color:${base};`)}">${escapeHtml(r.productionYear)}</td>`,
            `<td style="${cellBase(al(4), `color:${base};`)}">${escapeHtml(r.workingHours)}</td>`,
            `<td style="${cellBase(al(5), `color:${base};`)}">${escapeHtml(r.mastLiftingCapacity)}</td>`,
            `<td style="${cellBase(al(6), `color:${base};`)}">${escapeHtml(r.liftHeight)}</td>`,
            `<td style="${cellBase(al(7), `color:${base};`)}">${escapeHtml(r.mast)}</td>`,
            `<td style="${cellBase(al(8), `color:${base};`)}">${escapeHtml(r.battery)}</td>`,
            `<td style="${cellBase(al(9), `color:${base};`)}">${escapeHtml(r.availability)}</td>`,
            `<td style="${cellBase(al(10), priceStyle)}">${escapeHtml(priceText(r))}</td>`,
            `<td style="${cellBase(al(11), `color:${base};`)}">${escapeHtml(r.priceCurrency)}</td>`,
            `<td style="${cellBase(al(12), `color:${r.isSold ? COLORS.muted : COLORS.navy};`)}">${escapeHtml(photoLabel)}</td>`,
          ].join('');


          return `<tr>${cells}</tr>`;
        })
        .join('');

      return groupRow + items;
    })
    .join('');

  const head = EXPORT_COLUMNS.map(
    (c) =>
      `<th style="padding:6px;text-align:${c.align};vertical-align:middle;color:${COLORS.navy};font-size:11px;font-weight:bold;border-bottom:2px solid ${COLORS.navy};white-space:nowrap;">${escapeHtml(c.header)}</th>`
  ).join('');

  return `
    <div style="font-family:${FONT_STACK};background:#ffffff;padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        <tr>
          <td style="text-align:left;vertical-align:top;">
            <div style="font-size:34px;font-weight:bold;color:${COLORS.navy};line-height:1;">STAKERPOL</div>
            <div style="width:150px;height:4px;background:${COLORS.orange};margin:8px 0 6px;"></div>
            <div style="font-size:12px;color:${COLORS.grayText};">${escapeHtml(COMPANY.tagline)}</div>
          </td>
          <td style="text-align:left;vertical-align:top;padding-left:36px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <img id="export-maps-icon" src="${MAPS_ICON_DATA_URI}" width="28" height="28" alt="" style="display:block;width:28px;height:28px;" />
              <div>
                <div style="font-size:13px;font-weight:bold;color:${COLORS.navy};">${escapeHtml(WAREHOUSE.label)}</div>
                <div style="font-size:11px;color:${COLORS.muted};">${escapeHtml(WAREHOUSE.address)}</div>
              </div>
            </div>
          </td>
          <td style="text-align:right;vertical-align:top;">

            <div style="font-size:14px;font-weight:bold;color:${COLORS.navy};">Stan magazynu na ${escapeHtml(model.dateLabel)}</div>
            <div style="font-size:12px;color:${COLORS.grayText};margin-top:6px;">${escapeHtml(`${COMPANY.name} · ${COMPANY.person}`)}</div>
            <div style="font-size:12px;color:${COLORS.grayText};">${escapeHtml(`tel. ${COMPANY.phone} · ${COMPANY.email}`)}</div>
            <div style="font-size:12px;color:${COLORS.grayText};">${escapeHtml(COMPANY.address)}</div>
          </td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:14px;">
        <thead><tr>${head}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div style="text-align:right;font-size:12px;color:${COLORS.navy};margin-top:14px;">${escapeHtml(model.summary)}</div>

      <div style="border-top:1px solid ${COLORS.rowLine};margin-top:18px;padding-top:10px;">
        <div style="font-size:11px;color:${COLORS.grayText};">${escapeHtml(`${COMPANY.site} · tel. ${COMPANY.phone} · ${COMPANY.email}`)}</div>
        <div style="font-size:11px;color:${COLORS.grayText};">${escapeHtml(`${COMPANY.name}, ${COMPANY.address} · NIP ${COMPANY.nip} · REGON ${COMPANY.regon}`)}</div>
      </div>
    </div>
  `;
};

/* ------------------------------------------------------------------ */
/*  JPG — renderListHTML + html2canvas                                 */
/* ------------------------------------------------------------------ */

export const exportProductListToJPG = async (products: Product[]): Promise<void> => {
  const model = buildExportRows(products);

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.style.width = '1600px';
  tempDiv.style.backgroundColor = '#ffffff';
  tempDiv.innerHTML = renderListHTML(model);

  document.body.appendChild(tempDiv);

  try {
    const canvas = await html2canvas(tempDiv, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    );
    if (!blob) throw new Error('Nie udało się wygenerować obrazu JPG.');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Stan_magazynu_${fileDateStamp()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(tempDiv);
  }
};

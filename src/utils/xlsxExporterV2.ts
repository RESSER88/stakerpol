import ExcelJS from 'exceljs';
import { Product } from '@/types';

const availabilityLabel = (s?: string) => {
  switch (s) {
    case 'available': return 'Dostępny';
    case 'reserved': return 'Zarezerwowany';
    case 'sold': return 'Sprzedany';
    default: return '—';
  }
};

const COLUMNS: { header: string; key: string }[] = [
  { header: 'Model', key: 'model' },
  { header: 'Numer seryjny', key: 'serialNumber' },
  { header: 'Rok', key: 'productionYear' },
  { header: 'Godziny (mh)', key: 'workingHours' },
  { header: 'Udźwig maszt (kg)', key: 'mastLiftingCapacity' },
  { header: 'Wys. podnoszenia (mm)', key: 'liftHeight' },
  { header: 'Maszt', key: 'mast' },
  { header: 'Bateria', key: 'battery' },
  { header: 'Dostępność', key: 'availability' },
  { header: 'Stan', key: 'condition' },
  { header: 'Cena netto', key: 'netPrice' },
  { header: 'Waluta', key: 'priceCurrency' },
  { header: 'Rata leasingu (PLN/mies.)', key: 'leasing' },
  { header: 'Gwarancja (mies.)', key: 'warranty' },
];

export async function exportProductListToBrandedXLSX(products: Product[]): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Stan magazynu');

  sheet.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key }));

  const rows = products.map((p) => ({
    model: p.model || '',
    serialNumber: p.specs?.serialNumber || '',
    productionYear: p.specs?.productionYear || '',
    workingHours: p.specs?.workingHours || '',
    mastLiftingCapacity: p.specs?.mastLiftingCapacity || '',
    liftHeight: p.specs?.liftHeight || '',
    mast: p.specs?.mast || '',
    battery: p.specs?.battery || '',
    availability: availabilityLabel(p.availabilityStatus),
    condition: p.specs?.condition || '',
    netPrice: (p as any).netPrice ?? '',
    priceCurrency: (p as any).priceCurrency || 'PLN',
    leasing: p.leasingMonthlyFromPln ?? '',
    warranty: p.warrantyMonths ?? '',
  }));

  rows.forEach((r) => sheet.addRow(r));

  COLUMNS.forEach((c, i) => {
    const maxLen = Math.max(
      c.header.length,
      ...rows.map((r) => String((r as any)[c.key] ?? '').length)
    );
    sheet.getColumn(i + 1).width = Math.min(Math.max(maxLen + 2, 10), 40);
  });

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

import * as XLSX from 'xlsx';
import { Product } from '@/types';

const availabilityLabel = (s?: string) => {
  switch (s) {
    case 'available': return 'Dostępny';
    case 'reserved': return 'Zarezerwowany';
    case 'sold': return 'Sprzedany';
    default: return '—';
  }
};

export const exportProductListToXLSX = (products: Product[]) => {
  const rows = products.map((p) => ({
    'Model': p.model || '',
    'Numer seryjny': p.specs?.serialNumber || '',
    'Rok': p.specs?.productionYear || '',
    'Godziny (mh)': p.specs?.workingHours || '',
    'Udźwig maszt (kg)': p.specs?.mastLiftingCapacity || '',
    'Wys. podnoszenia (mm)': p.specs?.liftHeight || '',
    'Maszt': p.specs?.mast || '',
    'Bateria': p.specs?.battery || '',
    'Dostępność': availabilityLabel(p.availabilityStatus),
    'Stan': p.specs?.condition || '',
    'Cena netto': (p as any).netPrice ?? '',
    'Waluta': (p as any).priceCurrency || 'PLN',
    'Rata leasingu (PLN/mies.)': p.leasingMonthlyFromPln ?? '',
    'Gwarancja (mies.)': p.warrantyMonths ?? '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto column widths
  const cols = Object.keys(rows[0] || {}).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.map((r) => String((r as any)[key] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });
  (ws as any)['!cols'] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Stan magazynu');

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `stan-magazynu_${date}.xlsx`);
};

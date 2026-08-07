import { useState, useCallback, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Product } from '@/types';
import { exportProductListToPDF, exportProductListToJPG } from '@/utils/listExporter';
import { exportProductListToBrandedXLSX } from '@/utils/xlsxExporterV2';
import { useToast } from '@/hooks/use-toast';
import SectionHeader from '../editorial/SectionHeader';
import ExportFilterPanel from './ExportFilterPanel';
import { ExportFilterCriteria, DEFAULT_EXPORT_CRITERIA } from '@/utils/exportFilterCriteria';



interface Props {
  products: Product[];
}

interface RowProps {
  number: string;
  title: string;
  description: string;
  count: number;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

const ExportRow = ({ number, title, description, count, loading, disabled, onClick }: RowProps) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className="group w-full flex items-center gap-6 py-6 border-b border-editorial-line text-left transition-colors hover:bg-editorial-line/30 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
  >
    <span className="text-xs font-bold tracking-[0.2em] text-editorial-accent w-8 shrink-0">
      {number}
    </span>
    <div className="flex-1 min-w-0">
      <div className="font-editorial text-base text-editorial-ink">{title}</div>
      <div className="text-xs text-editorial-muted mt-0.5 tracking-wide">
        {description} · {count} {count === 1 ? 'produkt' : 'produktów'}
      </div>
    </div>
    {loading ? (
      <Loader2 className="h-4 w-4 animate-spin text-editorial-muted shrink-0" />
    ) : (
      <ArrowRight className="h-4 w-4 text-editorial-muted shrink-0 transition-transform group-hover:translate-x-1" />
    )}
  </button>
);

const ExportSection = ({ products }: Props) => {
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingJPG, setExportingJPG] = useState(false);
  const [exportingXLSX, setExportingXLSX] = useState(false);
  const [filtered, setFiltered] = useState<Product[]>(products);
  const [criteria, setCriteria] = useState<ExportFilterCriteria>(DEFAULT_EXPORT_CRITERIA);
  const { toast } = useToast();

  useEffect(() => {
    setFiltered(products);
  }, [products]);

  const handleFilterChange = useCallback((list: Product[], next: ExportFilterCriteria) => {
    setFiltered(list);
    setCriteria(next);
  }, []);


  const empty = filtered.length === 0;

  const handlePDF = async () => {
    if (empty) return;
    setExportingPDF(true);
    try {
      await exportProductListToPDF(filtered);
      toast({ title: '✓ Zapisano', description: `Stan magazynu PDF (${filtered.length} produktów)` });
    } catch {
      toast({ title: 'Błąd eksportu', description: 'Nie udało się wygenerować PDF', variant: 'destructive' });
    } finally {
      setExportingPDF(false);
    }
  };

  const handleJPG = async () => {
    if (empty) return;
    setExportingJPG(true);
    try {
      await exportProductListToJPG(filtered);
      toast({ title: '✓ Zapisano', description: `Stan magazynu JPG (${filtered.length} produktów)` });
    } catch {
      toast({ title: 'Błąd eksportu', description: 'Nie udało się wygenerować JPG', variant: 'destructive' });
    } finally {
      setExportingJPG(false);
    }
  };

  const handleXLSX = async () => {
    if (empty) return;
    setExportingXLSX(true);
    try {
      await exportProductListToBrandedXLSX(filtered);
      toast({ title: '✓ Zapisano', description: `Stan magazynu XLSX (${filtered.length} produktów)` });
    } catch {
      toast({ title: 'Błąd eksportu', description: 'Nie udało się wygenerować XLSX', variant: 'destructive' });
    } finally {
      setExportingXLSX(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <SectionHeader number="—" title="Eksport stanu magazynu" />

      <ExportFilterPanel products={products} onChange={handleFilterChange} />

      <div className="text-xs font-bold tracking-[0.15em] uppercase text-editorial-muted mb-2">
        Do eksportu: {filtered.length} z {products.length} produktów
      </div>

      <div className="border-t border-editorial-line">
        <ExportRow
          number="01"
          title="Pobierz jako PDF"
          description="Dokument do druku i archiwizacji"
          count={filtered.length}
          loading={exportingPDF}
          disabled={empty}
          onClick={handlePDF}
        />
        <ExportRow
          number="02"
          title="Pobierz jako JPG"
          description="Obraz do publikacji w mediach społecznościowych"
          count={filtered.length}
          loading={exportingJPG}
          disabled={empty}
          onClick={handleJPG}
        />
        <ExportRow
          number="03"
          title="Pobierz jako XLSX"
          description="Arkusz Excel ze stanem magazynu"
          count={filtered.length}
          loading={exportingXLSX}
          disabled={empty}
          onClick={handleXLSX}
        />
      </div>

      {empty && (
        <p className="text-xs text-editorial-muted mt-6 italic">
          Brak produktów spełniających kryteria.
        </p>
      )}
    </div>
  );
};


export default ExportSection;

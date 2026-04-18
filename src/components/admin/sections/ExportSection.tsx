import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Product } from '@/types';
import { exportProductListToPDF, exportProductListToJPG } from '@/utils/listExporter';
import { useToast } from '@/hooks/use-toast';
import SectionHeader from '../editorial/SectionHeader';

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
  const { toast } = useToast();

  const empty = products.length === 0;

  const handlePDF = async () => {
    if (empty) return;
    setExportingPDF(true);
    try {
      await exportProductListToPDF(products);
      toast({ title: '✓ Zapisano', description: `Stan magazynu PDF (${products.length} produktów)` });
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
      await exportProductListToJPG(products);
      toast({ title: '✓ Zapisano', description: `Stan magazynu JPG (${products.length} produktów)` });
    } catch {
      toast({ title: 'Błąd eksportu', description: 'Nie udało się wygenerować JPG', variant: 'destructive' });
    } finally {
      setExportingJPG(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <SectionHeader number="—" title="Eksport stanu magazynu" />

      <div className="border-t border-editorial-line">
        <ExportRow
          number="01"
          title="Pobierz jako PDF"
          description="Dokument do druku i archiwizacji"
          count={products.length}
          loading={exportingPDF}
          disabled={empty}
          onClick={handlePDF}
        />
        <ExportRow
          number="02"
          title="Pobierz jako JPG"
          description="Obraz do publikacji w mediach społecznościowych"
          count={products.length}
          loading={exportingJPG}
          disabled={empty}
          onClick={handleJPG}
        />
      </div>

      {empty && (
        <p className="text-xs text-editorial-muted mt-6 italic">
          Brak produktów do eksportu.
        </p>
      )}
    </div>
  );
};

export default ExportSection;

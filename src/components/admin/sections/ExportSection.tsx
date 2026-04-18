import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Product } from '@/types';
import { exportProductListToPDF, exportProductListToJPG } from '@/utils/listExporter';
import { useToast } from '@/hooks/use-toast';

interface Props {
  products: Product[];
}

const ExportSection = ({ products }: Props) => {
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingJPG, setExportingJPG] = useState(false);
  const { toast } = useToast();

  const handlePDF = async () => {
    if (products.length === 0) {
      toast({ title: 'Brak produktów', description: 'Nie ma produktów do eksportu', variant: 'destructive' });
      return;
    }
    setExportingPDF(true);
    try {
      await exportProductListToPDF(products);
      toast({ title: 'Sukces!', description: `Stan magazynu PDF (${products.length} produktów)` });
    } catch (e) {
      toast({ title: 'Błąd eksportu', description: 'Nie udało się wygenerować PDF', variant: 'destructive' });
    } finally {
      setExportingPDF(false);
    }
  };

  const handleJPG = async () => {
    if (products.length === 0) {
      toast({ title: 'Brak produktów', description: 'Nie ma produktów do eksportu', variant: 'destructive' });
      return;
    }
    setExportingJPG(true);
    try {
      await exportProductListToJPG(products);
      toast({ title: 'Sukces!', description: `Stan magazynu JPG (${products.length} produktów)` });
    } catch (e) {
      toast({ title: 'Błąd eksportu', description: 'Nie udało się wygenerować JPG', variant: 'destructive' });
    } finally {
      setExportingJPG(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2 max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-admin-orange/10 text-admin-orange">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Eksport PDF</CardTitle>
              <CardDescription>Stan magazynu jako dokument PDF</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={handlePDF} disabled={exportingPDF || products.length === 0} className="w-full">
            {exportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Pobierz PDF ({products.length})
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-admin-green/10 text-admin-green">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Eksport JPG</CardTitle>
              <CardDescription>Stan magazynu jako obraz JPG</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={handleJPG} disabled={exportingJPG || products.length === 0} className="w-full" variant="outline">
            {exportingJPG ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            Pobierz JPG ({products.length})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportSection;


import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Download } from 'lucide-react';
import ProductList from './ProductList';
import ProductDetailsModal from './ProductDetailsModal';
import ExportFormatModal from './ExportFormatModal';
import { Product } from '@/types';
import { exportProductListToPDF, exportProductListToJPG } from '@/utils/listExporter';
import { useToast } from '@/hooks/use-toast';

interface ProductManagerProps {
  // State
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  selectedProduct: Product | null;
  productImages: string[];
  setProductImages: (images: string[]) => void;
  products: Product[];
  defaultNewProduct: Product;
  
  // Actions
  handleEdit: (product: Product) => void;
  handleAdd: () => void;
  handleCopy: (product: Product) => void;
  handleDelete: (product: Product) => void;
  addProduct: (product: Product, images: string[], benefits?: any[]) => void;
  updateProduct: (product: Product, images: string[], benefits?: any[]) => void;
}

const ProductManager = ({
  isEditDialogOpen,
  setIsEditDialogOpen,
  selectedProduct,
  productImages,
  setProductImages,
  products,
  defaultNewProduct,
  handleEdit,
  handleAdd,
  handleCopy,
  handleDelete,
  addProduct,
  updateProduct
}: ProductManagerProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingJPG, setExportingJPG] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    setRefreshing(true);
    // Trigger a data refresh by temporarily setting a flag
    setTimeout(() => {
      setRefreshing(false);
      window.location.reload();
    }, 500);
  };

  const handleExportPDF = async () => {
    if (products.length === 0) {
      toast({
        title: "Brak produktów",
        description: "Nie ma produktów do eksportu",
        variant: "destructive"
      });
      return;
    }

    setExportingPDF(true);
      try {
        await exportProductListToPDF(products);
        toast({
          title: "Sukces!",
          description: `Stan magazynu PDF został wygenerowany (${products.length} produktów)`,
        });
        setIsExportModalOpen(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Błąd eksportu",
        description: "Nie udało się wygenerować stanu magazynu PDF",
        variant: "destructive"
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const handleExportJPG = async () => {
    if (products.length === 0) {
      toast({
        title: "Brak produktów",
        description: "Nie ma produktów do eksportu",
        variant: "destructive"
      });
      return;
    }

    setExportingJPG(true);
    try {
      await exportProductListToJPG(products);
      toast({
        title: "Sukces!",
        description: `Stan magazynu JPG został wygenerowany (${products.length} produktów)`,
      });
      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Error exporting JPG:', error);
      toast({
        title: "Błąd eksportu",
        description: "Nie udało się wygenerować stanu magazynu JPG",
        variant: "destructive"
      });
    } finally {
      setExportingJPG(false);
    }
  };

  const handleExportStockStatus = () => {
    if (products.length === 0) {
      toast({
        title: "Brak produktów",
        description: "Nie ma produktów do eksportu",
        variant: "destructive"
      });
      return;
    }
    setIsExportModalOpen(true);
  };

  const handleSave = (product: Product, images: string[], benefits: any[] = []) => {
    const isEditingExisting = selectedProduct && 
      selectedProduct.id && 
      !selectedProduct.model.includes('(kopia)') &&
      products.some(p => p.id === selectedProduct.id);
    
    if (isEditingExisting) {
      updateProduct(product, images, benefits);
    } else {
      addProduct(product, images, benefits);
    }
    
    setIsEditDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stakerpol-navy">Zarządzanie Produktami</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Zarządzaj produktami w katalogu ({products.length} produktów)
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <Button
            onClick={handleExportStockStatus}
            variant="outline"
            size="sm"
            disabled={products.length === 0}
            className="flex-1 sm:flex-initial"
          >
            <Download className="mr-2 h-4 w-4" />
            Eksport stan magazyn
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="flex-1 sm:flex-initial"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Odśwież
          </Button>
          <Button 
            onClick={handleAdd}
            className="cta-button flex-1 sm:flex-initial"
          >
            <Plus className="mr-2 h-4 w-4" />
            Dodaj Produkt
          </Button>
        </div>
      </div>

      <ProductList
        products={products}
        onEdit={handleEdit}
        onCopy={handleCopy}
        onDelete={handleDelete}
      />

      <ProductDetailsModal
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        selectedProduct={selectedProduct}
        defaultNewProduct={defaultNewProduct}
        productImages={productImages}
        onImagesChange={setProductImages}
        onSave={handleSave}
        products={products}
      />
      
      <ExportFormatModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportPDF={handleExportPDF}
        onExportJPG={handleExportJPG}
        isExportingPDF={exportingPDF}
        isExportingJPG={exportingJPG}
      />
    </div>
  );
};

export default ProductManager;

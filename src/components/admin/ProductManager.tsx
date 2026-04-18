
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import ProductList from './ProductList';
import ProductDetailsModal from './ProductDetailsModal';
import { Product } from '@/types';
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
  const { toast } = useToast();

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      window.location.reload();
    }, 500);
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
          <h2 className="text-xl font-semibold text-admin-text">Zarządzanie produktami</h2>
          <p className="text-sm text-admin-muted mt-1">
            {products.length} produktów w katalogu
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
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
            size="sm"
            className="bg-admin-orange hover:bg-admin-orange/90 text-white flex-1 sm:flex-initial"
          >
            <Plus className="mr-2 h-4 w-4" />
            Dodaj produkt
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
    </div>
  );
};

export default ProductManager;

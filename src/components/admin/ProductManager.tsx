import { useState } from 'react';
import ProductDetailsModal from './ProductDetailsModal';
import ProductsListView from './products/ProductsListView';
import { Product } from '@/types';
import { AdminSection } from './layout/types';

interface ProductManagerProps {
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  selectedProduct: Product | null;
  productImages: string[];
  setProductImages: (images: string[]) => void;
  products: Product[];
  defaultNewProduct: Product;
  handleEdit: (product: Product) => void;
  handleAdd: () => void;
  handleCopy: (product: Product) => void;
  handleDelete: (product: Product) => void;
  addProduct: (product: Product, images: string[], benefits?: any[]) => void;
  updateProduct: (product: Product, images: string[], benefits?: any[]) => void;
  onNavigate?: (section: AdminSection) => void;
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
  updateProduct,
  onNavigate,
}: ProductManagerProps) => {
  const [refreshing, setRefreshing] = useState(false);

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
    <>
      <ProductsListView
        products={products}
        onEdit={handleEdit}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onAdd={handleAdd}
        onExport={onNavigate ? () => onNavigate('export') : undefined}
        onRefresh={handleRefresh}
        refreshing={refreshing}
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
    </>
  );
};

export default ProductManager;

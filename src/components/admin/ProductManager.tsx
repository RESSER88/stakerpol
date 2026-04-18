import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import ProductsListView from './products/ProductsListView';
import ProductEditorView from './editor/ProductEditorView';
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
  addProductAsync: (product: any, images: string[], benefits?: any[]) => Promise<any>;
  updateProductAsync: (product: any, images: string[], benefits?: any[]) => Promise<any>;
  onNavigate?: (section: AdminSection) => void;
}

const ProductManager = ({
  isEditDialogOpen,
  setIsEditDialogOpen,
  selectedProduct,
  productImages,
  products,
  defaultNewProduct,
  handleEdit,
  handleAdd,
  handleCopy,
  handleDelete,
  addProductAsync,
  updateProductAsync,
  onNavigate,
}: ProductManagerProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      window.location.reload();
    }, 500);
  };

  const requestDelete = (p: Product) => setDeleteCandidate(p);
  const confirmDelete = () => {
    if (deleteCandidate) {
      handleDelete(deleteCandidate);
      setDeleteCandidate(null);
    }
  };

  // isCreate = brak id LUB id puste i nie ma takiego produktu w liście
  const isCreate =
    !selectedProduct?.id ||
    !products.some((p) => p.id === selectedProduct.id);

  const initialProduct = selectedProduct || defaultNewProduct;

  return (
    <>
      <ProductsListView
        products={products}
        onEdit={handleEdit}
        onCopy={handleCopy}
        onDelete={requestDelete}
        onAdd={handleAdd}
        onExport={onNavigate ? () => onNavigate('export') : undefined}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <ProductEditorView
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        initialProduct={initialProduct}
        initialImages={productImages}
        isCreate={isCreate}
        addProductAsync={addProductAsync}
        updateProductAsync={updateProductAsync}
        onCopy={(p) => {
          setIsEditDialogOpen(false);
          setTimeout(() => handleCopy(p), 100);
        }}
        onDelete={requestDelete}
      />

      <AlertDialog open={!!deleteCandidate} onOpenChange={(o) => !o && setDeleteCandidate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-editorial">Usunąć produkt?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć produkt „{deleteCandidate?.model}"? Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-editorial-bad hover:bg-editorial-bad/90 text-white"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductManager;

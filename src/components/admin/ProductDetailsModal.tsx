
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Product } from '@/types';
import ProductImageManager from './ProductImageManager';
import ProductForm from './ProductForm';
import { useProductFormValidation } from '@/hooks/useProductFormValidation';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: Product | null;
  defaultNewProduct: Product;
  productImages: string[];
  onImagesChange: (images: string[]) => void;
  onSave: (product: Product, images: string[]) => void;
  products: Product[];
}

const ProductDetailsModal = ({ 
  isOpen, 
  onClose, 
  selectedProduct, 
  defaultNewProduct,
  productImages,
  onImagesChange,
  onSave,
  products
}: ProductDetailsModalProps) => {
  const [editedProduct, setEditedProduct] = useState<Product>(defaultNewProduct);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { validateProduct } = useProductFormValidation(products);

  useEffect(() => {
    if (selectedProduct) {
      console.log('Setting edited product from selected:', selectedProduct);
      setEditedProduct({...selectedProduct});
    } else {
      const newProduct = {
        ...defaultNewProduct, 
        id: `new-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      console.log('Setting new product:', newProduct);
      setEditedProduct(newProduct);
    }
  }, [selectedProduct, defaultNewProduct]);

  const updateField = (field: string, value: string | string[]) => {
    setEditedProduct({...editedProduct, [field]: value});
  };
  
  const updateSpecsField = (field: string, value: string) => {
    setEditedProduct({
      ...editedProduct, 
      specs: {...editedProduct.specs, [field]: value}
    });
  };

  const handleSave = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log('=== MODAL SAVE ===');
      console.log('Selected product for validation:', selectedProduct);
      console.log('Edited product:', editedProduct);
      
      // For validation, use the original product ID if editing existing
      const productIdForValidation = selectedProduct?.id && !selectedProduct.model.includes('(kopia)') 
        ? selectedProduct.id 
        : undefined;
      
      console.log('Using product ID for validation:', productIdForValidation);
      
      if (!validateProduct(editedProduct, productImages, productIdForValidation)) {
        setIsLoading(false);
        return;
      }

      // Determine if this is editing existing vs new/copy
      const isEditingExisting = selectedProduct && 
        selectedProduct.id && 
        !selectedProduct.model.includes('(kopia)') &&
        products.some(p => p.id === selectedProduct.id);

      const productToSave = {
        ...editedProduct,
        id: isEditingExisting ? selectedProduct!.id : editedProduct.id,
        updatedAt: new Date().toISOString()
      };

      console.log('Final product to save:', productToSave);
      console.log('Is editing existing in modal:', isEditingExisting);

      onSave(productToSave, productImages);
      
      toast({
        title: isEditingExisting ? "Zapisywanie zmian..." : "Dodawanie produktu...",
        description: `Przetwarzanie danych produktu ${editedProduct.model}`,
        duration: 3000
      });
      
    } catch (error) {
      console.error('Error in modal handleSave:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać produktu",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isEditMode = selectedProduct && !selectedProduct.model.includes('(kopia)');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {isEditMode ? `Edytuj: ${selectedProduct.model}` : 'Dodaj nowy produkt'}
          </DialogTitle>
          {isEditMode && (
            <p className="text-sm text-muted-foreground">
              ID produktu: {selectedProduct.id}
            </p>
          )}
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 py-4 sm:py-6">
          <div className="space-y-4 sm:space-y-6">
            <ProductImageManager
              onImagesChange={onImagesChange}
              maxImages={10}
              currentImages={productImages}
            />
          </div>
          
          <ProductForm
            product={editedProduct}
            onFieldChange={updateField}
            onSpecsFieldChange={updateSpecsField}
          />
        </div>
        
        <DialogFooter className="border-t pt-4 flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Anuluj
          </Button>
          <Button 
            className="cta-button w-full sm:w-auto" 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Zapisywanie...' : (isEditMode ? 'Zapisz zmiany' : 'Dodaj produkt')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;

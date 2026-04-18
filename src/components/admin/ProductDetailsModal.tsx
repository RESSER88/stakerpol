
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Copy, Trash2 } from 'lucide-react';
import { Product } from '@/types';
import ProductImageManager from './ProductImageManager';
import ProductForm from './ProductForm';
import { BenefitDraft } from './BenefitsEditor';
import { useProductFormValidation } from '@/hooks/useProductFormValidation';
import { supabase } from '@/integrations/supabase/client';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: Product | null;
  defaultNewProduct: Product;
  productImages: string[];
  onImagesChange: (images: string[]) => void;
  onSave: (product: Product, images: string[], benefits: BenefitDraft[]) => void;
  products: Product[];
  onCopy?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

const ProductDetailsModal = ({
  isOpen,
  onClose,
  selectedProduct,
  defaultNewProduct,
  productImages,
  onImagesChange,
  onSave,
  products,
  onCopy,
  onDelete,
}: ProductDetailsModalProps) => {
  const [editedProduct, setEditedProduct] = useState<Product>(defaultNewProduct);
  const [benefits, setBenefits] = useState<BenefitDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { validateProduct } = useProductFormValidation(products);

  useEffect(() => {
    const load = async () => {
      if (selectedProduct?.id && !selectedProduct.id.startsWith('new-') && !selectedProduct.model.includes('(kopia)')) {
        const { data } = await supabase
          .from('product_benefits' as any)
          .select('*')
          .eq('product_id', selectedProduct.id)
          .order('sort_order', { ascending: true });
        setBenefits(((data as any[]) || []).map((b: any) => ({
          icon_name: b.icon_name,
          title: b.title,
          description: b.description || '',
        })));
      } else {
        setBenefits([]);
      }
    };
    if (isOpen) load();
  }, [selectedProduct, isOpen]);

  useEffect(() => {
    if (selectedProduct) {
      setEditedProduct({ ...selectedProduct });
    } else {
      setEditedProduct({
        ...defaultNewProduct,
        id: `new-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [selectedProduct, defaultNewProduct]);

  const updateField = (field: string, value: any) =>
    setEditedProduct({ ...editedProduct, [field]: value });

  const updateSpecsField = (field: string, value: string) =>
    setEditedProduct({ ...editedProduct, specs: { ...editedProduct.specs, [field]: value } });

  const isEditMode = selectedProduct && !selectedProduct.model.includes('(kopia)');

  const handleSave = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const productIdForValidation =
        selectedProduct?.id && !selectedProduct.model.includes('(kopia)')
          ? selectedProduct.id
          : undefined;

      if (!validateProduct(editedProduct, productImages, productIdForValidation)) {
        setIsLoading(false);
        return;
      }

      const isEditingExisting =
        selectedProduct &&
        selectedProduct.id &&
        !selectedProduct.model.includes('(kopia)') &&
        products.some((p) => p.id === selectedProduct.id);

      onSave(
        {
          ...editedProduct,
          id: isEditingExisting ? selectedProduct!.id : editedProduct.id,
          updatedAt: new Date().toISOString(),
        },
        productImages,
        benefits.filter((b) => b.title.trim())
      );

      toast({ title: '✓ Zapisano', description: editedProduct.model, duration: 2500 });
    } catch (error) {
      console.error('Error in modal handleSave:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się zapisać',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b border-editorial-line pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-editorial-muted">
                {isEditMode && selectedProduct?.specs?.serialNumber
                  ? `#${selectedProduct.specs.serialNumber} · Edycja`
                  : 'Nowy produkt'}
              </p>
              <DialogTitle className="font-editorial text-2xl text-editorial-ink mt-1 truncate">
                {isEditMode ? selectedProduct.model : 'Dodaj produkt'}
              </DialogTitle>
            </div>
            {isEditMode && (onCopy || onDelete) && selectedProduct && (
              <DropdownMenu>
                <DropdownMenuTrigger className="p-2 -mr-2 text-editorial-muted hover:text-editorial-ink transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onCopy && (
                    <DropdownMenuItem
                      onClick={() => {
                        onClose();
                        onCopy(selectedProduct);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Duplikuj produkt
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          onClose();
                          onDelete(selectedProduct);
                        }}
                        className="text-editorial-bad focus:text-editorial-bad"
                      >
                        <Trash2 className="h-4 w-4" />
                        Usuń produkt
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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
            benefits={benefits}
            onBenefitsChange={setBenefits}
          />
        </div>

        <DialogFooter className="border-t border-editorial-line pt-4 flex-col sm:flex-row gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-5 h-11 text-[11px] font-bold tracking-[0.2em] uppercase text-editorial-muted hover:text-editorial-ink transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full sm:w-auto px-6 h-11 bg-editorial-ink text-white hover:bg-editorial-ink/90 disabled:opacity-50 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors"
          >
            {isLoading ? 'Zapisywanie…' : 'Zapisz zmiany'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailsModal;

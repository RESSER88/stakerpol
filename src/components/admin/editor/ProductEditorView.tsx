import { useState, useEffect, useMemo } from 'react';
import { Product } from '@/types';
import { toast } from 'sonner';
import { X, MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import ChaptersList from './ChaptersList';
import { useChapterCompletion } from './useChapterCompletion';
import Chapter01_Images from './chapters/Chapter01_Images';
import Chapter02_Basic from './chapters/Chapter02_Basic';
import Chapter03_Technical from './chapters/Chapter03_Technical';

interface Props {
  open: boolean;
  onClose: () => void;
  initialProduct: Product;
  initialImages: string[];
  isCreate: boolean;
  onCopy?: (p: Product) => void;
  onDelete?: (p: Product) => void;
  addProductAsync: (product: any, images: string[], benefits?: any[]) => Promise<any>;
  updateProductAsync: (product: any, images: string[], benefits?: any[]) => Promise<any>;
}

const ProductEditorView = ({
  open,
  onClose,
  initialProduct,
  initialImages,
  isCreate: initialIsCreate,
  onCopy,
  onDelete,
  addProductAsync,
  updateProductAsync,
}: Props) => {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [images, setImages] = useState<string[]>(initialImages);
  const [mode, setMode] = useState<'create' | 'edit'>(initialIsCreate ? 'create' : 'edit');
  const [activeChapter, setActiveChapter] = useState(initialIsCreate ? 2 : 1);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setProduct(initialProduct);
      setImages(initialImages);
      const create = initialIsCreate;
      setMode(create ? 'create' : 'edit');
      setActiveChapter(create ? 2 : 1);
    }
  }, [open, initialProduct, initialImages, initialIsCreate]);

  const chapters = useChapterCompletion(product, images, mode);
  const completedCount = chapters.filter((c) => c.complete).length;

  const handleSelectChapter = (id: number) => {
    const ch = chapters.find((c) => c.id === id);
    if (!ch?.enabled) {
      toast.error('Najpierw zapisz dane podstawowe (rozdział 02)');
      return;
    }
    setActiveChapter(id);
  };

  const saveBasic = async () => {
    setSaving(true);
    try {
      if (mode === 'create') {
        const newProduct = await addProductAsync(product, images, []);
        if (newProduct?.id) {
          setProduct({ ...product, id: newProduct.id });
          setMode('edit');
          toast.success('✓ Zapisano');
        }
      } else {
        await updateProductAsync(product, images, []);
        toast.success('✓ Zapisano');
      }
    } catch (e: any) {
      toast.error('Nie udało się zapisać', { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const saveImagesOrTechnical = async () => {
    if (mode === 'create' || !product.id) {
      toast.error('Najpierw zapisz dane podstawowe (rozdział 02)');
      return;
    }
    setSaving(true);
    try {
      await updateProductAsync(product, images, []);
      toast.success('✓ Zapisano');
    } catch (e: any) {
      toast.error('Nie udało się zapisać', { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const headerTitle = useMemo(() => {
    if (mode === 'create') return 'Nowy produkt';
    return product.model || 'Bez nazwy';
  }, [mode, product.model]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-editorial-bg overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-editorial-bg border-b border-editorial-line">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 hover:bg-editorial-line/50 transition-colors"
            aria-label="Zamknij"
          >
            <X className="h-4 w-4 text-editorial-ink" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold tracking-[0.2em] text-editorial-muted uppercase">
              {product.specs?.serialNumber ? `#${product.specs.serialNumber}` : 'BRAK SERIAL'} · {mode === 'create' ? 'NOWY' : 'EDYCJA'}
            </div>
            <h1 className="font-editorial text-lg md:text-xl text-editorial-ink truncate">
              {headerTitle}
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-editorial-muted">
            <span className="font-bold text-editorial-ink">{completedCount}</span>
            <span>/ 6 rozdziałów</span>
            <div className="w-24 h-px bg-editorial-line relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-editorial-ink transition-all"
                style={{ width: `${(completedCount / 6) * 100}%` }}
              />
            </div>
          </div>

          {mode === 'edit' && product.id && (
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 hover:bg-editorial-line/50 transition-colors">
                <MoreHorizontal className="h-4 w-4 text-editorial-ink" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="font-editorial">
                {onCopy && (
                  <DropdownMenuItem onClick={() => onCopy(product)}>
                    <Copy className="h-3.5 w-3.5 mr-2" /> Duplikuj
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-editorial-bad focus:text-editorial-bad"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Usuń
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile progress bar */}
        <div className="md:hidden h-px bg-editorial-line">
          <div
            className="h-full bg-editorial-ink transition-all"
            style={{ width: `${(completedCount / 6) * 100}%` }}
          />
        </div>
      </header>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 grid gap-6 md:grid-cols-[260px_1fr]">
        <aside>
          <ChaptersList chapters={chapters} active={activeChapter} onSelect={handleSelectChapter} />
        </aside>

        <main className="min-w-0">
          {activeChapter === 1 && (
            <Chapter01_Images
              images={images}
              onChange={setImages}
              onSave={saveImagesOrTechnical}
              saving={saving}
            />
          )}
          {activeChapter === 2 && (
            <Chapter02_Basic
              product={product}
              onChange={setProduct}
              onSave={saveBasic}
              saving={saving}
              isCreate={mode === 'create'}
            />
          )}
          {activeChapter === 3 && (
            <Chapter03_Technical
              product={product}
              onChange={setProduct}
              onSave={saveImagesOrTechnical}
              saving={saving}
            />
          )}
          {activeChapter > 3 && (
            <div className="text-center py-16 text-editorial-muted">
              <p className="font-editorial text-lg mb-2">Wkrótce</p>
              <p className="text-xs">Ten rozdział pojawi się w kolejnym etapie wdrożenia.</p>
            </div>
          )}
        </main>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-editorial">Usunąć produkt?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz usunąć produkt „{product.model}"? Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(product);
                setShowDeleteConfirm(false);
                onClose();
              }}
              className="bg-editorial-bad hover:bg-editorial-bad/90 text-white"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductEditorView;

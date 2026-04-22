import { useState, useCallback } from 'react';
import { Upload, X, Star, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { optimizeImage, validateImageFile, createImagePreview } from '@/utils/imageOptimization';
import { cn } from '@/lib/utils';

interface ProductImageManagerProps {
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  currentImages?: string[];
  className?: string;
  useSupabaseStorage?: boolean;
}

const ProductImageManager = ({ 
  onImagesChange, 
  maxImages = 10, 
  currentImages = [],
  className,
  useSupabaseStorage = true // Domyślnie używamy Supabase Storage
}: ProductImageManagerProps) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>(currentImages);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const { toast } = useToast();

  const uploadToSupabaseStorage = async (file: File, fileName: string): Promise<string | null> => {
    try {
      console.log('Uploading to Supabase Storage:', fileName);
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading to Supabase Storage:', error);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(data.path);

      console.log('Successfully uploaded to:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error with Supabase Storage upload:', error);
      return null;
    }
  };

  const handleFileSelect = useCallback(async (files: FileList) => {
    if (previews.length >= maxImages) {
      toast({
        title: "Limit zdjęć osiągnięty",
        description: `Możesz dodać maksymalnie ${maxImages} zdjęć`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const newPreviews: string[] = [];

    try {
      for (let i = 0; i < files.length && previews.length + newPreviews.length < maxImages; i++) {
        const file = files[i];
        
        // Validate file
        const validationError = validateImageFile(file);
        if (validationError) {
          toast({
            title: "Błąd pliku",
            description: validationError,
            variant: "destructive"
          });
          continue;
        }

        // Optimize image
        const optimizedFile = await optimizeImage(file, {
          maxWidth: 1600,
          maxHeight: 1200,
          quality: 0.85,
          format: 'webp'
        });

        let finalUrl: string;

        if (useSupabaseStorage) {
          // Upload to Supabase Storage
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(2, 15);
          const fileName = `product-${timestamp}-${randomId}.webp`;
          const uploadedUrl = await uploadToSupabaseStorage(optimizedFile, fileName);
          
          if (!uploadedUrl) {
            toast({
              title: "Błąd uploadu",
              description: "Nie udało się przesłać zdjęcia do Supabase Storage",
              variant: "destructive"
            });
            continue;
          }
          
          finalUrl = uploadedUrl;
        } else {
          // Create local preview (fallback)
          finalUrl = await createImagePreview(optimizedFile);
        }

        newPreviews.push(finalUrl);
      }

      const updatedPreviews = [...previews, ...newPreviews];
      setPreviews(updatedPreviews);
      onImagesChange(updatedPreviews);

      if (newPreviews.length > 0) {
        toast({
          title: "Zdjęcia dodane",
          description: `Dodano ${newPreviews.length} zoptymalizowanych zdjęć do Supabase Storage`
        });
      }
    } catch (error) {
      console.error('Error processing images:', error);
      toast({
        title: "Błąd przetwarzania",
        description: "Nie udało się przetworzyć niektórych zdjęć",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [previews, maxImages, onImagesChange, toast, useSupabaseStorage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  const removeImage = useCallback(async (index: number) => {
    const imageUrl = previews[index];
    
    // If using Supabase Storage, try to delete the file
    if (useSupabaseStorage && imageUrl.includes('supabase.co/storage')) {
      try {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        await supabase.storage
          .from('product-images')
          .remove([fileName]);
        
        console.log('Deleted file from storage:', fileName);
      } catch (error) {
        console.error('Error deleting from Supabase Storage:', error);
      }
    }
    
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    onImagesChange(updatedPreviews);
    
    // Adjust main image index if necessary
    if (mainImageIndex >= updatedPreviews.length) {
      setMainImageIndex(Math.max(0, updatedPreviews.length - 1));
    } else if (index <= mainImageIndex && mainImageIndex > 0) {
      setMainImageIndex(mainImageIndex - 1);
    }
  }, [previews, onImagesChange, mainImageIndex, useSupabaseStorage]);

  const setAsMainImage = useCallback((index: number) => {
    setMainImageIndex(index);
    // Reorder array to put main image first
    const reorderedPreviews = [...previews];
    const [mainImage] = reorderedPreviews.splice(index, 1);
    reorderedPreviews.unshift(mainImage);
    setPreviews(reorderedPreviews);
    onImagesChange(reorderedPreviews);
    setMainImageIndex(0);
    
    toast({
      title: "Zdjęcie główne ustawione",
      description: "Wybrane zdjęcie zostało ustawione jako główne"
    });
  }, [previews, onImagesChange, toast]);

  const generateThumbnailWithWhiteBackground = useCallback((src: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const size = 300; // Square thumbnail size
        canvas.width = size;
        canvas.height = size;
        
        // Fill with white background
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
          
          // Calculate dimensions to fit image within square while maintaining aspect ratio
          const scale = Math.min(size / img.width, size / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          const x = (size - scaledWidth) / 2;
          const y = (size - scaledHeight) / 2;
          
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        }
        
        resolve(canvas.toDataURL('image/webp', 0.9));
      };
      
      img.src = src;
    });
  }, []);

  return (
    <div className={cn("space-y-5", className)}>
      <div className="border border-dashed border-gray-200 rounded-lg bg-white">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="px-4 py-6 sm:py-8 text-center hover:border-stakerpol-navy/40 transition-colors min-h-[140px] sm:min-h-[170px] flex flex-col items-center justify-center"
        >
          <ImageIcon className="h-9 w-9 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-base font-medium mb-1 text-stakerpol-navy">
            Dodaj zdjęcia produktu
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Przeciągnij zdjęcia tutaj lub kliknij, aby wybrać (maksymalnie {maxImages})
          </p>
          
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            id="product-images-upload"
            disabled={uploading || previews.length >= maxImages}
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            asChild
            disabled={uploading || previews.length >= maxImages}
            className="h-9 px-4 border-stakerpol-navy text-stakerpol-navy hover:bg-stakerpol-navy/5"
          >
            <label htmlFor="product-images-upload" className="cursor-pointer">
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-stakerpol-navy border-t-transparent rounded-full animate-spin mr-2" />
                  Przesyłanie...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-2" />
                  Wybierz zdjęcia
                </>
              )}
            </label>
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Obsługiwane formaty: JPG, PNG, WebP • Automatyczny upload • Max 50MB
          </p>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Podgląd zdjęć ({previews.length}/{maxImages})
            <span className="ml-2 text-muted-foreground/70 normal-case font-normal">(Supabase Storage)</span>
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className={cn(
                  "relative aspect-[4/3] bg-white rounded-md overflow-hidden border transition-all",
                  index === mainImageIndex 
                    ? "border-stakerpol-orange/60 ring-1 ring-stakerpol-orange/30" 
                    : "border-gray-200 hover:border-gray-300"
                )}>
                  <img
                    src={preview}
                    alt={`Zdjęcie produktu ${index + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Main image indicator */}
                  {index === mainImageIndex && (
                    <div className="absolute top-1.5 left-1.5 bg-stakerpol-orange/10 text-stakerpol-orange px-2 py-0.5 rounded text-xs font-medium flex items-center">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Główne
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {index !== mainImageIndex && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-6 w-6 p-0 bg-white/90 hover:bg-white"
                        onClick={() => setAsMainImage(index)}
                        title="Ustaw jako zdjęcie główne"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                      title="Usuń zdjęcie"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2 text-center">
                  <span className="text-sm text-gray-600">
                    Zdjęcie {index + 1}
                    {index === mainImageIndex && (
                      <span className="text-stakerpol-orange font-semibold"> (Główne)</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {previews.length < maxImages && (
            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('product-images-upload')?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Dodaj więcej zdjęć ({maxImages - previews.length} pozostało)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImageManager;

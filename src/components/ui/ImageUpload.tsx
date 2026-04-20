
import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { optimizeImage, validateImageFile, createImagePreview } from '@/utils/imageOptimization';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  currentImages?: string[];
  className?: string;
}

const ImageUpload = ({ 
  onImagesChange, 
  maxImages = 10, 
  currentImages = [],
  className 
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>(currentImages);
  const { toast } = useToast();

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
          quality: 0.8,
          format: 'webp'
        });

        // Create preview
        const preview = await createImagePreview(optimizedFile);
        newPreviews.push(preview);
      }

      const updatedPreviews = [...previews, ...newPreviews];
      setPreviews(updatedPreviews);
      onImagesChange(updatedPreviews);

      if (newPreviews.length > 0) {
        toast({
          title: "Zdjęcia dodane",
          description: `Dodano ${newPreviews.length} zoptymalizowanych zdjęć`
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
  }, [previews, maxImages, onImagesChange, toast]);

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

  const removeImage = useCallback((index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    onImagesChange(updatedPreviews);
  }, [previews, onImagesChange]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-stakerpol-orange transition-colors"
      >
        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">
          Przeciągnij zdjęcia tutaj lub kliknij, aby wybrać
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Maksymalnie {maxImages} zdjęć • Automatyczna optymalizacja do WebP • Maksymalnie 300KB
        </p>
        
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          id="image-upload"
          disabled={uploading || previews.length >= maxImages}
        />
        
        <Button
          type="button"
          variant="outline"
          asChild
          disabled={uploading || previews.length >= maxImages}
        >
          <label htmlFor="image-upload" className="cursor-pointer">
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-stakerpol-orange rounded-full animate-spin mr-2" />
                Przetwarzanie...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Wybierz zdjęcia
              </>
            )}
          </label>
        </Button>
      </div>

      {/* Image previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={preview}
                  alt={`Podgląd ${index + 1}`}
                  width={300}
                  height={400}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              {index === 0 && (
                <div className="absolute bottom-1 left-1 bg-stakerpol-orange text-white text-xs px-2 py-1 rounded">
                  Główne
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;

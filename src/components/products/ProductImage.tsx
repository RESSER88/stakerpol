import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import LazyImage from '@/components/ui/LazyImage';
import ProductImageBadges from './ProductImageBadges';

interface ProductImageProps {
  image: string;
  alt: string;
  images?: string[];
  productionYear?: string | number;
  availabilityStatus?: 'available' | 'reserved' | 'sold';
  isFeatured?: boolean;
}

const ProductImage = ({ image, alt, images, productionYear, availabilityStatus, isFeatured }: ProductImageProps) => {
  // Use images array if provided, otherwise fallback to single image
  const allImages = images && images.length > 0 ? images : [image].filter(Boolean);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showZoom, setShowZoom] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  
  // Reset to first image when images prop changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [images]);
  
  const currentImage = allImages[currentImageIndex] || image;
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };
  
  const openZoom = () => setShowZoom(true);
  const closeZoom = () => setShowZoom(false);
  
  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && allImages.length > 1) {
      nextImage();
    }
    if (isRightSwipe && allImages.length > 1) {
      prevImage();
    }
  };

  if (!currentImage) {
    return (
      <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Brak zdjęcia</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in product-detail-image">
      {/* Main Image Container */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden group">
        <div 
          className="aspect-[3/4] cursor-zoom-in relative"
          onClick={openZoom}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <LazyImage
            src={currentImage}
            alt={alt}
            aspectRatio="3:4"
            className="transition-transform duration-300 group-hover:scale-105"
          />

          <ProductImageBadges
            productionYear={productionYear}
            availabilityStatus={availabilityStatus}
            isFeatured={isFeatured}
          />
          
          {/* Navigation arrows for multiple images */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70 z-10 touch-manipulation"
                aria-label="Poprzednie zdjęcie"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/70 z-10 touch-manipulation"
                aria-label="Następne zdjęcie"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          
          {/* Image counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm py-1 px-3 rounded-full">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          )}
          
          {/* Zoom hint */}
          <div className="absolute bottom-3 right-3 bg-stakerpol-orange text-white text-sm py-1 px-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Kliknij, aby powiększyć
          </div>
        </div>
      </div>
      
      {/* Thumbnail Gallery for multiple images */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2 product-detail-thumbnails">
          {allImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`aspect-[3/4] rounded overflow-hidden border-2 transition-all duration-300 hover:scale-105 touch-manipulation ${
                index === currentImageIndex 
                  ? 'border-stakerpol-orange shadow-md ring-2 ring-stakerpol-orange/30' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <LazyImage
                src={img}
                alt={`${alt} - zdjęcie ${index + 1}`}
                aspectRatio="3:4"
                className="transition-transform duration-300"
              />
            </button>
          ))}
        </div>
      )}

      {/* Mobile-Optimized Zoom Modal */}
      {showZoom && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-2 touch-manipulation" 
          onClick={closeZoom}
        >
          <div className="relative w-full h-full max-w-4xl max-h-full flex items-center justify-center">
            <img 
              src={currentImage} 
              alt={alt} 
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain animate-scale-in"
              loading="eager"
              style={{ touchAction: 'pinch-zoom' }}
            />
            
            {/* Close button - larger for mobile */}
            <button 
              onClick={closeZoom}
              className="absolute top-4 right-4 text-white p-3 rounded-full bg-stakerpol-orange hover:bg-orange-600 transition-colors z-10 touch-manipulation"
              aria-label="Zamknij"
            >
              <X size={24} />
            </button>
            
            {/* Navigation in zoom mode - larger touch targets */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-colors touch-manipulation"
                  aria-label="Poprzednie zdjęcie"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-4 rounded-full hover:bg-black/70 transition-colors touch-manipulation"
                  aria-label="Następne zdjęcie"
                >
                  <ChevronRight size={24} />
                </button>
                
                {/* Image counter in zoom */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImage;

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

interface LazyImageProps {
  src: string;
  alt: string;
  aspectRatio?: '4:3' | '3:4' | '1:1' | 'auto';
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  generateThumbnail?: boolean;
  priority?: boolean;
  width?: number;
  height?: number;
}

const LazyImage = ({ 
  src, 
  alt, 
  aspectRatio = 'auto',
  className,
  onLoad,
  onError,
  generateThumbnail = false,
  priority = false,
  width,
  height
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset states when src changes
    setIsLoaded(false);
    setHasError(false);
    setImgSrc('');
    
    if (priority) {
      setIsInView(true);
      return;
    }
    
    // Add a small delay to ensure proper initialization
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { 
          threshold: 0.1,
          rootMargin: '100px' // Start loading 100px before the image comes into view
        }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, 50);

    return () => clearTimeout(timer);
  }, [src, priority]);

  useEffect(() => {
    if (isInView && src && !imgSrc && !hasError) {
      // Check if it's a data URL (base64)
      if (src.startsWith('data:')) {
        setImgSrc(src);
        return;
      }

      // For regular URLs, preload the image
      const img = new Image();
      
      img.onload = () => {
        setImgSrc(src);
        logger.log(`Image loaded successfully: ${src.substring(0, 50)}...`);
      };
      
      img.onerror = () => {
        logger.error(`Failed to load image: ${src.substring(0, 50)}...`);
        setHasError(true);
        onError?.();
      };
      
      // Start loading
      img.src = src;
    }
  }, [isInView, src, imgSrc, hasError, onError]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
    logger.log(`Image displayed: ${src.substring(0, 50)}...`);
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
    logger.error(`Image display error: ${src.substring(0, 50)}...`);
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case '4:3':
        return 'aspect-[4/3]';
      case '3:4':
        return 'aspect-[3/4]';
      case '1:1':
        return 'aspect-square';
      default:
        return '';
    }
  };

  const getImageStyle = () => {
    if (generateThumbnail && aspectRatio === '1:1') {
      return 'object-contain bg-white';
    }
    return 'object-cover';
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-gray-100 rounded-lg',
        generateThumbnail && aspectRatio === '1:1' ? 'bg-white' : 'bg-gray-100',
        getAspectRatioClass(),
        className
      )}
    >
      {/* Loading placeholder */}
      {!isLoaded && !hasError && isInView && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-stakerpol-orange rounded-full animate-spin" />
        </div>
      )}
      
      {/* Initial placeholder before loading starts */}
      {!isInView && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 text-gray-300">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
        </div>
      )}
      
      {/* Error placeholder */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4">
          <div className="text-4xl mb-2">📷</div>
          <span className="text-sm text-center">Błąd ładowania zdjęcia</span>
          <span className="text-xs text-center mt-1 opacity-75 truncate max-w-full">
            {src.substring(0, 30)}...
          </span>
        </div>
      )}
      
      {/* Actual image */}
      {imgSrc && !hasError && (
        <img
          ref={imgRef}
          src={imgSrc}
          alt={alt}
          {...(width !== undefined ? { width } : {})}
          {...(height !== undefined ? { height } : {})}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            getImageStyle(),
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  );
};

export default LazyImage;


import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  aspectRatio?: '4:3' | '3:4' | '1:1' | 'auto';
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
}

const OptimizedImage = ({ 
  src, 
  alt, 
  aspectRatio = 'auto',
  className,
  onLoad,
  onError,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  width,
  height
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    setImgSrc('');
    
    if (priority) {
      setIsInView(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [src, priority]);

  useEffect(() => {
    if (isInView && src && !imgSrc && !hasError) {
      // Check cache first
      const cachedImage = document.querySelector(`img[src="${src}"]`) as HTMLImageElement;
      if (cachedImage?.complete) {
        setImgSrc(src);
        setIsLoaded(true);
        return;
      }

      if (src.startsWith('data:')) {
        setImgSrc(src);
        return;
      }

      const img = new Image();
      
      img.onload = () => {
        setImgSrc(src);
      };
      
      img.onerror = () => {
        setHasError(true);
        onError?.();
      };
      
      img.src = src;
    }
  }, [isInView, src, imgSrc, hasError, onError]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
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

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-gray-100 rounded-lg',
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
      
      {/* Initial placeholder */}
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
        </div>
      )}
      
      {/* Actual image with performance optimizations */}
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
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          sizes={sizes}
        />
      )}
    </div>
  );
};

export default OptimizedImage;

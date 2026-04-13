
import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import OptimizedImage from '@/components/ui/OptimizedImage';
import LiftHeightBadge from '@/components/products/LiftHeightBadge';
import { trackPhoneClick } from '@/utils/analytics';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

const ProductCard = ({ product, priority = false }: ProductCardProps) => {
  const { language } = useLanguage();
  const t = useTranslation(language);

  // Use the first image from images array, fallback to image field
  const displayImage = product.images?.[0] || product.image;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in border-none rounded-lg shadow h-full flex flex-col product-card-enhanced">
      <Link to={`/products/${product.slug || product.id}`} className="block">
        <div className="aspect-[3/4] overflow-hidden bg-stakerpol-lightgray image-hover-zoom relative">
          <OptimizedImage
            src={displayImage}
            alt={product.model}
            aspectRatio="3:4"
            priority={priority}
            className="h-full w-full"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Lift Height Badge positioned over the image */}
          <LiftHeightBadge product={product} language={language} />
        </div>
      </Link>
      <CardContent className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col card-content">
        <Link to={`/products/${product.slug || product.id}`} className="block hover:text-stakerpol-orange transition-colors">
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-2 md:mb-3 lg:mb-4 text-stakerpol-navy">{product.model}</h3>
        </Link>
        <p className="text-muted-foreground mb-4 md:mb-5 lg:mb-6 line-clamp-2 flex-1 text-sm md:text-base leading-relaxed">{product.shortDescription}</p>
        <div className="flex flex-col gap-2 md:gap-3 pt-2 mt-auto">
          <Button 
            className="cta-button w-full text-sm md:text-base py-2 md:py-3"
            asChild
          >
            <a href="tel:+48694133592" onClick={() => trackPhoneClick(`product_card_${product.model}`)}>
              <Phone className="mr-2 h-3 w-3 md:h-4 md:w-4" />
              {t('callNow')}
            </a>
          </Button>
          <Button 
            className="secondary-button w-full text-sm md:text-base py-2 md:py-3"
            variant="outline"
            asChild
          >
            <Link to={`/products/${product.slug || product.id}`}>
              {t('specifications')}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

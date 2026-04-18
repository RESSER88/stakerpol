import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import SimpleRelatedCard from './SimpleRelatedCard';

interface RelatedProductsProps {
  currentProductId: string;
  products: Product[];
}

const RelatedProducts = ({ currentProductId, products }: RelatedProductsProps) => {
  const { language } = useLanguage();
  const t = useTranslation(language);

  const relatedProducts = products.filter((p) => p.id !== currentProductId).slice(0, 4);

  if (relatedProducts.length === 0) return null;

  return (
    <section className="bg-surface-soft py-10 md:py-12 px-4 md:px-6">
      <div className="container-custom max-w-[1200px]">
        <div className="bg-white border border-border-line rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-5 md:p-8">
          <h2 className="text-xl md:text-2xl font-extrabold text-navy-brand mb-5 md:text-center">
            {t('relatedProducts')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {relatedProducts.map((product) => (
              <SimpleRelatedCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RelatedProducts;

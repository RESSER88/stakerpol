import { Product } from '@/types';
import { Language } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import ModernSpecificationsTable from './ModernSpecificationsTable';

interface ProductInfoProps {
  product: Product;
  language: Language;
}

const ProductInfo = ({ product, language }: ProductInfoProps) => {
  const t = useTranslation(language);

  return (
    <div className="animate-slide-in">
      <h2 className="text-2xl font-bold mb-4">{t('specifications')}</h2>
      <ModernSpecificationsTable product={product} language={language} />
    </div>
  );
};

export default ProductInfo;

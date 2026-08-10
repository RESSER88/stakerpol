
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { ROUTES } from '@/config/routes';

const ProductHeader = () => {
  const { language } = useLanguage();
  const t = useTranslation(language);

  return (
    <Link to={ROUTES.products} className="text-stakerpol-orange hover:underline mb-6 inline-flex items-center group animate-fade-in">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 group-hover:-translate-x-1 transition-transform">
        <path d="m15 18-6-6 6-6"/>
      </svg>
      Powrót do {t('electricTrolleys').toLowerCase()}
    </Link>
  );
};

export default ProductHeader;

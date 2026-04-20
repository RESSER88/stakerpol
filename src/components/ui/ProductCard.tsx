import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MoveVertical, Calendar, Clock, Package } from 'lucide-react';
import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import OptimizedImage from '@/components/ui/OptimizedImage';
import InquiryModal from '@/components/contact/InquiryModal';
import { trackPhoneClick } from '@/utils/analytics';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

const formatPL = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '—';
  const num = typeof val === 'string' ? parseFloat(val.replace(/\s/g, '').replace(',', '.')) : val;
  if (isNaN(num as number)) return String(val);
  return new Intl.NumberFormat('pl-PL').format(num as number);
};

const ProductCard = ({ product, priority = false }: ProductCardProps) => {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const displayImage = product.images?.[0] || product.image;
  const productLink = `/products/${product.slug || product.id}`;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <div className="bg-white rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.18)] hover:-translate-y-[3px] transition-all duration-[250ms] ease-out h-full flex flex-col overflow-hidden">
        {/* Image with chips */}
        <Link to={productLink} className="block relative">
          <div className="aspect-[3/4] overflow-hidden bg-stakerpol-lightgray relative">
            <OptimizedImage
              src={displayImage}
              alt={product.model}
              aspectRatio="3:4"
              priority={priority}
              className="h-full w-full object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Year chip - top left */}
            {product.specs.productionYear && (
              <span className="absolute top-2.5 left-2.5 bg-[#0E0E0E] text-white font-mono text-[10px] tracking-[0.08em] font-semibold px-2 py-1 rounded">
                {t('cardYearChip')} {product.specs.productionYear}
              </span>
            )}
            {/* Availability chip - top right */}
            <span className="absolute top-2.5 right-2.5 bg-white text-[#0E0E0E] text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14A84A]" />
              {t('cardAvailable')}
            </span>
          </div>
        </Link>

        {/* Content */}
        <div className="px-3.5 pt-3 pb-3.5 flex-1 flex flex-col">
          {/* Title */}
          <Link to={productLink} className="block hover:text-stakerpol-orange transition-colors">
            <h3 className="font-sans font-extrabold text-stakerpol-navy text-base md:text-lg lg:text-xl leading-tight tracking-[-0.01em] mb-3">
              {product.model}
            </h3>
          </Link>

          {/* Spec bar */}
          <div className="grid grid-cols-4 border-y border-[#E5E1D8] divide-x divide-[#E5E1D8] py-2.5 mb-3">
            <div className="flex flex-col items-center text-center px-1">
              <MoveVertical className="w-4 h-4 text-[#C8102E] mb-1" />
              <span className="font-mono font-bold text-xs text-[#0E0E0E] leading-none">
                {formatPL(product.specs.liftHeight)}
              </span>
              <span className="text-[8.5px] uppercase tracking-[0.04em] font-semibold text-[#5B5B5B] mt-1">
                {t('cardSpecHeight')}
              </span>
            </div>
            <div className="flex flex-col items-center text-center px-1">
              <Calendar className="w-4 h-4 text-[#C8102E] mb-1" />
              <span className="font-mono font-bold text-xs text-[#0E0E0E] leading-none">
                {product.specs.productionYear || '—'}
              </span>
              <span className="text-[8.5px] uppercase tracking-[0.04em] font-semibold text-[#5B5B5B] mt-1">
                {t('cardSpecYear')}
              </span>
            </div>
            <div className="flex flex-col items-center text-center px-1">
              <Clock className="w-4 h-4 text-[#C8102E] mb-1" />
              <span className="font-mono font-bold text-xs text-[#0E0E0E] leading-none">
                {formatPL(product.specs.workingHours)}
              </span>
              <span className="text-[8.5px] uppercase tracking-[0.04em] font-semibold text-[#5B5B5B] mt-1">
                {t('cardSpecHours')}
              </span>
            </div>
            <div className="flex flex-col items-center text-center px-1">
              <Package className="w-4 h-4 text-[#C8102E] mb-1" />
              <span className="font-mono font-bold text-xs text-[#0E0E0E] leading-none">
                {formatPL(product.specs.mastLiftingCapacity)}
              </span>
              <span className="text-[8.5px] uppercase tracking-[0.04em] font-semibold text-[#5B5B5B] mt-1">
                {t('cardSpecCapacity')}
              </span>
            </div>
          </div>

          {/* CTA grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-2 mt-auto">
            <a
              href="tel:+48694133592"
              onClick={(e) => {
                stop(e);
                trackPhoneClick(`product_card_grid_${product.model}`);
              }}
              className="bg-stakerpol-orange hover:brightness-110 text-white font-bold text-[13px] py-2.5 px-2 rounded flex items-center justify-center gap-1.5 transition-all"
            >
              <Phone className="w-3.5 h-3.5" />
              {t('cardCallBtn')}
            </a>
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                setInquiryOpen(true);
              }}
              className="bg-[#0E0E0E] hover:bg-[#222] text-white font-bold text-[13px] py-2.5 px-2 rounded flex items-center justify-center gap-1.5 transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              {t('cardAskBtn')}
            </button>
          </div>

          {/* Full spec link */}
          <Link
            to={productLink}
            className="block text-center bg-white border border-[#E5E1D8] hover:bg-[#F8F6F2] text-[#0E0E0E] font-semibold text-xs py-2 px-2 rounded transition-colors"
          >
            {t('cardFullSpec')}
          </Link>
        </div>
      </div>

      <InquiryModal
        isOpen={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        source="product_list"
        productId={product.id}
        productModel={product.model}
        serialNumber={product.specs?.serialNumber}
      />
    </>
  );
};

export default ProductCard;

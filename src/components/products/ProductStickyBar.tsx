import { useState } from 'react';
import { Phone, Mail } from 'lucide-react';
import { Product } from '@/types';
import PriceInquiryModal from './PriceInquiryModal';

interface Props {
  product: Product;
}

const PHONE_TEL = '+48694133592';

const ProductStickyBar = ({ product }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden sticky bottom-0 z-30 bg-white border-t border-border-line shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.15)] px-3 py-2.5">
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${PHONE_TEL}`}
            className="flex items-center justify-center gap-2 rounded-[4px] font-bold text-white bg-orange-cta min-h-[48px] text-sm active:scale-[0.97] active:brightness-95 transition-transform"
          >
            <Phone size={16} />
            Zadzwoń
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center justify-center gap-2 rounded-[4px] font-bold text-white bg-ink min-h-[48px] text-sm active:scale-[0.97] active:brightness-95 transition-transform"
          >
            <Mail size={16} />
            Zapytaj
          </button>
        </div>
      </div>
      <PriceInquiryModal isOpen={open} onClose={() => setOpen(false)} product={product} />
    </>
  );
};

export default ProductStickyBar;

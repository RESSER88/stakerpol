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
      <div
        className="md:hidden sticky bottom-0 z-30 bg-white"
        style={{
          borderTop: '1px solid #E5E1D8',
          boxShadow: '0 -4px 16px -8px rgba(0,0,0,0.15)',
          padding: '10px 12px',
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${PHONE_TEL}`}
            className="flex items-center justify-center gap-2 rounded-[4px] font-bold text-white"
            style={{ background: '#E85C1E', padding: 12, fontSize: 13 }}
          >
            <Phone size={14} />
            Zadzwoń
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex items-center justify-center gap-2 rounded-[4px] font-bold text-white"
            style={{ background: '#0E0E0E', padding: 12, fontSize: 13 }}
          >
            <Mail size={14} />
            Zapytaj
          </button>
        </div>
      </div>
      <PriceInquiryModal isOpen={open} onClose={() => setOpen(false)} product={product} />
    </>
  );
};

export default ProductStickyBar;

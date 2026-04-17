import { Phone, Mail, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Product } from '@/types';
import PriceInquiryModal from './PriceInquiryModal';

interface Props {
  product: Product;
}

const PHONE_DISPLAY = '+48 694 133 592';
const PHONE_TEL = '+48694133592';
const PHONE_WA = '48694133592';

const ProductCTAButtons = ({ product }: Props) => {
  const [open, setOpen] = useState(false);
  const waText = encodeURIComponent(`Dzień dobry, interesuje mnie ${product.model}`);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`tel:${PHONE_TEL}`}
          className="flex items-center justify-center gap-2 rounded-[5px] font-bold text-white"
          style={{
            background: '#E85C1E',
            padding: '13px',
            fontSize: 14,
            boxShadow: '0 4px 12px -4px rgba(232,92,30,.5)',
          }}
        >
          <Phone size={16} />
          Zadzwoń
        </a>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 rounded-[5px] font-bold text-white"
          style={{ background: '#0E0E0E', padding: '13px', fontSize: 14 }}
        >
          <Mail size={16} />
          Wyślij zapytanie
        </button>
      </div>
      <a
        href={`https://wa.me/${PHONE_WA}?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-[5px] font-bold bg-white"
        style={{
          color: '#25D366',
          border: '1px solid #25D366',
          padding: '10px',
          fontSize: 12.5,
        }}
      >
        <MessageCircle size={16} />
        Napisz na WhatsApp
      </a>
      <PriceInquiryModal isOpen={open} onClose={() => setOpen(false)} product={product} />
    </div>
  );
};

export default ProductCTAButtons;

import { Phone, Mail, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Product } from '@/types';
import InquiryModal from '@/components/contact/InquiryModal';

interface Props {
  product: Product;
}

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
          className="flex items-center justify-center gap-2 rounded-[5px] font-bold text-white bg-orange-cta py-3 text-sm shadow-[0_4px_12px_-4px_hsl(var(--color-orange-cta)/0.5)] hover:opacity-95 transition"
        >
          <Phone size={16} />
          Zadzwoń
        </a>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 rounded-[5px] font-bold text-white bg-ink py-3 text-sm hover:opacity-90 transition"
        >
          <Mail size={16} />
          Wyślij zapytanie
        </button>
      </div>
      <a
        href={`https://wa.me/${PHONE_WA}?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-[5px] font-bold bg-white text-whatsapp border border-whatsapp py-2.5 text-[12.5px] hover:bg-whatsapp/5 transition"
      >
        <MessageCircle size={16} />
        Napisz na WhatsApp
      </a>
      <InquiryModal
        isOpen={open}
        onClose={() => setOpen(false)}
        source="product_page"
        productId={product.id}
        productModel={product.model}
        serialNumber={product.specs?.serialNumber}
      />
    </div>
  );
};

export default ProductCTAButtons;

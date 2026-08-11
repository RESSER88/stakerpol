import { useState } from 'react';
import { Phone, Mail } from 'lucide-react';
import { Product } from '@/types';
import InquiryModal from '@/components/contact/InquiryModal';
import { COMPANY_PHONE_TEL } from '@/lib/contact';
import { cn } from '@/lib/utils';

interface Props {
  /** Kontekst produktu — opcjonalny, gdy pasek jest użyty poza kartą produktu. */
  product?: Product;
  /** Nadpisanie akcji „Zapytaj" — gdy podane, wbudowany formularz nie jest używany. */
  onInquiryClick?: () => void;
  /** 'sticky' (domyślnie, jak na podstronie produktu) lub 'fixed' na dole ekranu. */
  variant?: 'sticky' | 'fixed';
}

const PHONE_TEL = COMPANY_PHONE_TEL;

const ProductStickyBar = ({ product, onInquiryClick, variant = 'sticky' }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          'md:hidden z-30 bg-white border-t border-border-line shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.15)] px-3 py-2.5',
          variant === 'fixed'
            ? 'fixed bottom-0 left-0 right-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]'
            : 'sticky bottom-0'
        )}
      >
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
            onClick={() => (onInquiryClick ? onInquiryClick() : setOpen(true))}
            className="flex items-center justify-center gap-2 rounded-[4px] font-bold text-white bg-ink min-h-[48px] text-sm active:scale-[0.97] active:brightness-95 transition-transform"
          >
            <Mail size={16} />
            Zapytaj
          </button>
        </div>
      </div>
      {!onInquiryClick && product && (
        <InquiryModal
          isOpen={open}
          onClose={() => setOpen(false)}
          source="product_page"
          productId={product.id}
          productModel={product.model}
          serialNumber={product.specs?.serialNumber}
        />
      )}
    </>
  );
};

export default ProductStickyBar;

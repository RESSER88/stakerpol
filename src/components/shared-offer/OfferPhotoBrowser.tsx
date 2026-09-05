import { useEffect, useRef, useState } from 'react';
import { X, Phone, Mail } from 'lucide-react';
import { ExportRow } from '@/utils/exportListModel';
import { COMPANY_PHONE_TEL } from '@/lib/contact';
import PriceInquiryModal from '@/components/products/PriceInquiryModal';
import OfferPhotoCard from './OfferPhotoCard';

interface Props {
  rows: ExportRow[];
  /** productId -> wszystkie zdjęcia produktu */
  imageById: Map<string, string[]>;
  onClose: () => void;
}

/**
 * Pełnoekranowy tryb przeglądania oferty ze zdjęciami.
 * Pionowe przewijanie natywnym CSS scroll-snap — jedna karta = jeden produkt.
 */
const OfferPhotoBrowser = ({ rows, imageById, onClose }: Props) => {
  const [current, setCurrent] = useState(1);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight) + 1;
    setCurrent(Math.min(Math.max(idx, 1), rows.length));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Przeglądanie oferty ze zdjęciami"
      className="fixed inset-0 z-50 bg-gray-50"
    >
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <span className="rounded-full bg-stakerpol-navy/85 text-white text-xs font-semibold px-3 py-1.5">
          {current} / {rows.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij tryb przeglądania"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stakerpol-navy text-white shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory overscroll-contain pb-[calc(64px+env(safe-area-inset-bottom))]"
      >
        {rows.map((row, i) => (
          <OfferPhotoCard
            key={row.productId}
            row={row}
            images={imageById.get(row.productId) ?? []}
            eager={i < 2}
          />
        ))}
      </div>

      {/* Stały pasek Zadzwoń / Zapytaj — widoczny na każdej karcie, nad treścią overlayu */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border-line shadow-[0_-4px_16px_-8px_rgba(0,0,0,0.15)] px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`tel:${COMPANY_PHONE_TEL}`}
            className="flex items-center justify-center gap-2 rounded-[4px] font-bold text-white bg-orange-cta min-h-[48px] text-sm active:scale-[0.97] active:brightness-95 transition-transform"
          >
            <Phone size={16} />
            Zadzwoń
          </a>
          <button
            type="button"
            onClick={() => setInquiryOpen(true)}
            className="flex items-center justify-center gap-2 rounded-[4px] font-bold text-white bg-ink min-h-[48px] text-sm active:scale-[0.97] active:brightness-95 transition-transform"
          >
            <Mail size={16} />
            Zapytaj
          </button>
        </div>
      </div>

      {inquiryOpen && (
        <PriceInquiryModal isOpen onClose={() => setInquiryOpen(false)} />
      )}
    </div>
  );
};

export default OfferPhotoBrowser;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronDown, ExternalLink } from 'lucide-react';
import { FAQ, FAQCategory } from '@/hooks/useSupabaseFAQ';
import { Product } from '@/types';
import PriceInquiryModal from '@/components/products/PriceInquiryModal';
import InquiryModal from '@/components/contact/InquiryModal';
import FormModal from './FormModal';
import { trackFAQOpen, trackFAQCTAClick } from '@/utils/analytics';

interface FAQItemEnhancedProps {
  faq: FAQ;
  products: Product[];
}

const CATEGORY_BADGE: Record<FAQCategory, { label: string; cls: string }> = {
  pre_purchase: { label: 'Przed zakupem', cls: 'bg-orange-cta/10 text-orange-cta border-orange-cta/30' },
  tech_specs: { label: 'Specyfikacja', cls: 'bg-navy-brand/10 text-navy-brand border-navy-brand/30' },
  delivery: { label: 'Dostawa', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  service_warranty: { label: 'Serwis', cls: 'bg-amber-100 text-amber-700 border-amber-300' },
};

type ModalKind = null | 'inquiry' | 'booking' | 'test_drive' | 'transport' | 'callback';

const FAQItemEnhanced: React.FC<FAQItemEnhancedProps> = ({ faq, products }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalKind>(null);

  const linked = (faq.linked_product_ids || [])
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  const allSold = linked.length > 0 && linked.every((p) => p.availabilityStatus !== 'available');
  const primaryProduct = linked[0];

  const badge = CATEGORY_BADGE[faq.category];
  const ctaActive = !!faq.inline_cta_action && faq.inline_cta_action !== 'none' && !!faq.inline_cta_label;

  const handleToggle = () => {
    setOpen((o) => {
      if (!o) {
        trackFAQOpen({
          faq_id: faq.id,
          question: (faq.question || '').substring(0, 100),
          category: faq.category,
          language: faq.language,
        });
      }
      return !o;
    });
  };

  const handleCTA = () => {
    trackFAQCTAClick({
      faq_id: faq.id,
      cta_action: faq.inline_cta_action ?? '',
      cta_label: faq.inline_cta_label ?? '',
      category: faq.category,
    });
    switch (faq.inline_cta_action) {
      case 'open_inquiry_modal':
        setActiveModal('inquiry');
        break;
      case 'open_booking_modal':
        setActiveModal('booking');
        break;
      case 'open_test_drive':
        setActiveModal('test_drive');
        break;
      case 'transport_quote':
        setActiveModal('transport');
        break;
      case 'request_callback':
        setActiveModal('callback');
        break;
      case 'link_to_contact':
        navigate('/kontakt');
        break;
      case 'link_to_leasing':
        window.location.href = 'tel:+48694133592';
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <button
          type="button"
          onClick={handleToggle}
          className="w-full flex items-start gap-3 p-4 md:p-5 text-left hover:bg-muted/40 transition-colors"
          aria-expanded={open}
        >
          <span className="flex-1 font-medium text-foreground leading-snug">{faq.question}</span>
          {faq.is_featured && <Star className="w-4 h-4 text-orange-cta fill-orange-cta shrink-0 mt-1" />}
          <ChevronDown className={`w-4 h-4 shrink-0 mt-1 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="px-4 md:px-5 pb-5 pt-0 space-y-4 border-t border-border">
            <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line pt-4">
              {faq.answer}
            </div>

            {linked.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Powiązane modele
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {linked.map((p) => {
                    const sold = p.availabilityStatus !== 'available';
                    return (
                      <a
                        key={p.id}
                        href={`/products/${p.slug || p.id}`}
                        className="flex items-center gap-3 border border-border rounded-md p-2.5 hover:border-orange-cta/60 transition-colors group"
                      >
                        {p.image && (
                          <img
                            src={p.image}
                            alt={p.model}
                            loading="lazy"
                            className="w-12 h-12 object-contain bg-muted rounded shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate group-hover:text-orange-cta transition-colors">
                            {p.model}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {p.specs?.serialNumber ? `nr ${p.specs.serialNumber}` : p.slug}
                            {sold && <span className="ml-2 inline-block px-1.5 py-0.5 bg-muted text-foreground/70 rounded text-[10px] font-bold uppercase">Sprzedany</span>}
                          </div>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </a>
                    );
                  })}
                </div>
                {allSold && (
                  <a
                    href="/products"
                    className="inline-block text-sm font-medium text-orange-cta hover:underline"
                  >
                    Zobacz podobne dostępne modele →
                  </a>
                )}
              </div>
            )}

            {ctaActive && (
              <div>
                <button
                  type="button"
                  onClick={handleCTA}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-cta text-white text-sm font-bold rounded-md hover:opacity-90 transition-opacity"
                >
                  {faq.inline_cta_label} →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {primaryProduct && activeModal === 'inquiry' && (
        <PriceInquiryModal
          isOpen
          onClose={() => setActiveModal(null)}
          product={primaryProduct}
        />
      )}
      {activeModal === 'booking' && (
        <InquiryModal
          isOpen
          onClose={() => setActiveModal(null)}
          source="product_page"
          productId={primaryProduct?.id}
          productModel={primaryProduct?.model}
          serialNumber={primaryProduct?.specs?.serialNumber}
        />
      )}
      <FormModal
        open={activeModal === 'test_drive'}
        onClose={() => setActiveModal(null)}
        source="faq_test_drive"
        title="Umów test wózka"
        prefilledMessage={`Chciałbym umówić się na test wózka. Pytanie: ${faq.question}`}
      />
      <FormModal
        open={activeModal === 'transport'}
        onClose={() => setActiveModal(null)}
        source="faq_transport"
        title="Wycena transportu"
        prefilledMessage="Proszę o wycenę transportu. Adres dostawy: "
      />
      <FormModal
        open={activeModal === 'callback'}
        onClose={() => setActiveModal(null)}
        source="faq_callback"
        title="Poproś o oddzwonienie"
        prefilledMessage={`Proszę o telefon w sprawie: ${faq.question}`}
      />
    </>
  );
};

export default FAQItemEnhanced;

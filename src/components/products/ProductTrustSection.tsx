import { ClipboardCheck, Wrench, BatteryCharging, SprayCan, Headset, Package, CalendarCheck, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { trackCTAClick, trackPhoneClick, trackWhatsAppClick } from '@/utils/analytics';

interface ProductTrustSectionProps {
  productModel: string;
  productSlug?: string;
}

const ProductTrustSection = ({ productModel, productSlug }: ProductTrustSectionProps) => {
  const { language } = useLanguage();
  const t = useTranslation(language);

  const steps = [
    { num: '01', Icon: ClipboardCheck, title: t('trustStep1Title' as any), desc: t('trustStep1Desc' as any) },
    { num: '02', Icon: Wrench, title: t('trustStep2Title' as any), desc: t('trustStep2Desc' as any) },
    { num: '03', Icon: BatteryCharging, title: t('trustStep3Title' as any), desc: t('trustStep3Desc' as any) },
    { num: '04', Icon: SprayCan, title: t('trustStep4Title' as any), desc: t('trustStep4Desc' as any) },
  ];

  const supports = [
    { Icon: Headset, title: t('trustSupport1Title' as any), desc: t('trustSupport1Desc' as any) },
    { Icon: Package, title: t('trustSupport2Title' as any), desc: t('trustSupport2Desc' as any) },
    { Icon: CalendarCheck, title: t('trustSupport3Title' as any), desc: t('trustSupport3Desc' as any) },
  ];

  const waText = encodeURIComponent(`Dzień dobry, pytanie o ${productModel}`);
  const waHref = `https://wa.me/48694133592?text=${waText}`;
  const presentationHref = `/contact#form?subject=prezentacja&product=${productSlug || ''}`;

  return (
    <>
      {/* Część 1 — Proces przygotowania */}
      <section className="bg-white py-16">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-stakerpol-navy mb-4">
              {t('trustProcessTitle' as any)}
            </h2>
            <p className="text-lg text-gray-600">{t('trustProcessSubtitle' as any)}</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-12 left-[12%] right-[12%] border-t-2 border-dashed border-stakerpol-orange/30" aria-hidden="true" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {steps.map(({ num, Icon, title, desc }) => (
                <div key={num} className="relative text-center px-2">
                  <span className="absolute -top-4 right-2 md:right-4 text-6xl md:text-7xl font-extrabold text-stakerpol-orange/20 select-none pointer-events-none leading-none">
                    {num}
                  </span>
                  <div className="relative z-10 inline-flex items-center justify-center w-24 h-24 rounded-full bg-stakerpol-orange/10 mb-4 border-4 border-white">
                    <Icon className="w-10 h-10 text-stakerpol-orange" />
                  </div>
                  <h3 className="text-lg font-bold text-stakerpol-navy mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Część 2 — Wsparcie posprzedażowe */}
      <section className="bg-gray-50 py-16">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-stakerpol-navy">
              {t('trustSupportTitle' as any)}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {supports.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-lg shadow-sm p-6 text-center hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-stakerpol-navy/10 mb-4">
                  <Icon className="w-8 h-8 text-stakerpol-navy" />
                </div>
                <h3 className="text-lg font-bold text-stakerpol-navy mb-2">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Część 3 — CTA konwersja */}
      <section className="bg-stakerpol-navy text-white py-16">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('trustCtaTitle' as any)}</h2>
          <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">{t('trustCtaSubtitle' as any)}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center">
            <Button className="bg-stakerpol-orange hover:bg-stakerpol-orange/90 text-white font-semibold min-h-[44px]" size="lg" asChild>
              <a href={presentationHref} onClick={() => trackCTAClick('product_process_presentation')}>
                <CalendarCheck className="mr-2" />
                {t('trustCtaPresentation' as any)}
              </a>
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold min-h-[44px]" size="lg" asChild>
              <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick('product_process')}>
                <svg className="mr-2 w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.515" />
                </svg>
                WhatsApp
              </a>
            </Button>
            <Button variant="outline" className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-stakerpol-navy font-semibold min-h-[44px]" size="lg" asChild>
              <a href="tel:+48694133592" onClick={() => trackPhoneClick('product_process')}>
                <Phone className="mr-2" />
                {t('trustCtaCall' as any)}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductTrustSection;

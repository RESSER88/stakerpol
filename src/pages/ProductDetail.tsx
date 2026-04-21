
import { useParams, Link } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { usePublicSupabaseProducts } from '@/hooks/usePublicSupabaseProducts';
import { useProductTranslationsDisplay } from '@/hooks/useProductTranslationsDisplay';
import ProductImage from '@/components/products/ProductImage';
import ProductInfo from '@/components/products/ProductInfo';
import ProductHeader from '@/components/products/ProductHeader';
import RelatedProducts from '@/components/products/RelatedProducts';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { generateProductSchema } from '@/utils/seo/generateProductSchema';
import { useProductSEO } from '@/hooks/useProductSEO';
import { trackViewItem } from '@/utils/analytics';
import { Loader2 } from 'lucide-react';
import FAQSection from '@/components/ui/FAQSection';
import FAQSchema from '@/components/seo/FAQSchema';
import { FEATURES } from '@/config/featureFlags';
import { useSupabaseFAQ } from '@/hooks/useSupabaseFAQ';
import ProductStatusBadges from '@/components/products/ProductStatusBadges';
import ProductKeySpecsBar from '@/components/products/ProductKeySpecsBar';
import ProductPriceBlock from '@/components/products/ProductPriceBlock';
import ProductCTAButtons from '@/components/products/ProductCTAButtons';
import ProductTrustStrip from '@/components/products/ProductTrustStrip';
import ProductAboutSection from '@/components/products/ProductAboutSection';
import ProductLeadCallback from '@/components/products/ProductLeadCallback';
import ProductStickyBar from '@/components/products/ProductStickyBar';
import ProductProcessSteps from '@/components/products/ProductProcessSteps';
import InlineContextualCTA from '@/components/products/InlineContextualCTA';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { products, isLoading } = usePublicSupabaseProducts();

  const product = products.find((p) => p.slug === id || p.id === id);

  const { translations, isLoading: translationsLoading } = useProductTranslationsDisplay(
    product?.id || '',
    language
  );

  const { seoSettings } = useProductSEO(product?.id || '');
  const { faqs: allFaqs, fetchFAQs } = useSupabaseFAQ();

  useEffect(() => {
    if (FEATURES.PRODUCT_FAQ) {
      fetchFAQs(language);
    }
  }, [language]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    if (product?.id) {
      trackViewItem({
        id: product.id,
        model: product.model,
        brand: 'Toyota',
        year: product.specs?.productionYear,
      });
    }
  }, [product?.id]);

  const productFaqItems = useMemo(() => {
    if (!product) return [];
    if (FEATURES.PRODUCT_FAQ && allFaqs.length > 0) {
      const langFiltered = allFaqs.filter(f => f.language === language);
      const typedProduct = product as any;
      if (typedProduct?.faqIds && typedProduct.faqIds.length > 0) {
        const assigned = langFiltered.filter(f => typedProduct.faqIds.includes(f.id));
        return assigned.slice(0, 4).map(f => ({ question: f.question, answer: f.answer }));
      }
      return langFiltered.slice(0, 4).map(f => ({ question: f.question, answer: f.answer }));
    }
    return [
      { question: t('product_faq_surface_question' as any).replace('{model}', product.model), answer: t('product_faq_surface_answer' as any) },
      { question: t('product_faq_truck_question' as any).replace('{model}', product.model), answer: t('product_faq_truck_answer' as any) },
      { question: t('product_faq_cold_question' as any), answer: t('product_faq_cold_answer' as any) },
      { question: t('product_faq_height_question' as any).replace('{model}', product.model), answer: t('product_faq_height_answer' as any) },
    ];
  }, [allFaqs, product, t, language]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container-custom py-12">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-stakerpol-orange mx-auto mb-4" />
              <p className="text-muted-foreground">Ładowanie produktu...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container-custom py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-stakerpol-navy">{t('productNotFound')}</h1>
          <Link to="/products" className="text-stakerpol-orange hover:underline text-lg">
            {t('backToProducts')}
          </Link>
        </div>
      </Layout>
    );
  }

  const breadcrumbItems = [
    { name: 'Strona główna', url: 'https://stakerpol.pl' },
    { name: 'Produkty', url: 'https://stakerpol.pl/products' },
    { name: product.model, url: `https://stakerpol.pl/products/${product.slug || product.id}` }
  ];

  const getMetaTitle = () => {
    const serialNumber = product.specs?.serialNumber ? ` (${product.specs.serialNumber})` : '';
    const type = product.specs?.driveType === 'Elektryczny' ? 'Wózek elektryczny' : 'Wózek widłowy';
    return `${product.model}${serialNumber} - ${type} | Stakerpol`;
  };

  const getMetaDescription = () => {
    const specs = [];
    if (product.specs?.liftHeight) specs.push(`${product.specs.liftHeight}mm wysokość podnoszenia`);
    if (product.specs?.mastLiftingCapacity) specs.push(`${product.specs.mastLiftingCapacity}kg udźwig`);
    if (product.specs?.productionYear) specs.push(`rok ${product.specs.productionYear}`);
    if (product.specs?.workingHours) specs.push(`${product.specs.workingHours}mth`);
    const specsText = specs.length > 0 ? ` - ${specs.join(', ')}` : '';
    return `${product.shortDescription || product.model}${specsText}. Profesjonalna sprzedaż używanych wózków paletowych Toyota/BT. Sprawdź ofertę Stakerpol.`;
  };

  const getOgImage = () => {
    if (product.images && product.images.length > 0) return product.images[0];
    return product.image || '';
  };

  const productSchemaData = generateProductSchema(product, seoSettings);

  return (
    <Layout>
      <Helmet>
        <title>{getMetaTitle()}</title>
        <meta name="description" content={getMetaDescription()} />
        <meta property="og:title" content={getMetaTitle()} />
        <meta property="og:description" content={getMetaDescription()} />
        <meta property="og:image" content={getOgImage()} />
        <meta property="og:url" content={`https://stakerpol.pl/products/${product.slug || product.id}`} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getMetaTitle()} />
        <meta name="twitter:description" content={getMetaDescription()} />
        <meta name="twitter:image" content={getOgImage()} />
        <link rel="canonical" href={`https://stakerpol.pl/products/${product.slug || product.id}`} />
        <script type="application/ld+json">
          {JSON.stringify(productSchemaData, null, 2)}
        </script>
      </Helmet>
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* HERO — mobile (1 column) + desktop (2 columns inside max-w-1200) */}
      <section id="product-details" className="bg-white pt-6 pb-8 md:pt-10 md:pb-10 px-4 md:px-6">
        <div className="container-custom max-w-[1200px]">
          <ProductHeader />

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-8">
            <ProductImage
              image={product.image}
              alt={product.model}
              images={product.images}
              productionYear={product.specs?.productionYear}
              availabilityStatus={(product as any).availabilityStatus}
              isFeatured={(product as any).isFeatured}
            />
            <div className="space-y-4 lg:py-2">
              <ProductStatusBadges product={product as any} />
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 text-navy-brand leading-tight">
                  {product.model}
                </h1>
                {(product as any).slogan && (
                  <p className="font-medium text-[13px] text-ink-soft">
                    {(product as any).slogan}
                  </p>
                )}
                <p className="text-base md:text-lg text-foreground/80 leading-relaxed mt-3">
                  {translations.shortDescription || product.shortDescription}
                  {translationsLoading && language !== 'pl' && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin inline" />
                    </span>
                  )}
                </p>
              </div>
              <ProductKeySpecsBar product={product as any} />
              <ProductPriceBlock product={product as any} />
              <ProductCTAButtons product={product as any} />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP — full-width banner between hero and cards */}
      <section className="bg-surface-soft py-4 md:py-5 px-4 md:px-6">
        <div className="container-custom max-w-[1200px]">
          <ProductTrustStrip warrantyMonths={(product as any).warrantyMonths || 3} />
        </div>
      </section>

      {/* CARD 01 — Full specifications (FIRST) */}
      <section className="bg-white py-8 md:py-12 px-4 md:px-6">
        <div className="container-custom max-w-[1200px]">
          <div className="bg-white border border-border-line rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-5 md:p-8">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-mono font-bold text-[13px] text-red-accent">01</span>
              <span className="text-ink-soft">·</span>
              <h2 className="font-extrabold text-lg md:text-xl text-navy-brand">Pełna specyfikacja</h2>
            </div>
            <ProductInfo product={product} language={language} />
            <InlineContextualCTA
              variant="soft"
              accentColor="red"
              question="Nie masz pewności co do parametrów?"
              actionLabel="Zadzwoń i zapytaj"
              actionType="phone"
            />
          </div>
        </div>
      </section>

      {/* CARD 02 — About this model (SECOND) */}
      <ProductAboutSection product={product as any} />

      {/* CARD — Process steps (condensed) */}
      <ProductProcessSteps modelName={product.model} />

      {/* DARK SECTION — Inline lead form */}
      <ProductLeadCallback productId={product.id} />

      {/* CARD — FAQ */}
      <section className="bg-surface-soft py-4 md:py-12 px-4 md:px-6">
        <div className="container-custom max-w-[1200px]">
          <div className="bg-white border border-border-line rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-3 md:p-8">
            <h2 className="text-xl md:text-2xl font-extrabold text-navy-brand mb-4">
              Najczęstsze pytania
            </h2>
            <FAQSection title="" items={productFaqItems} />
            <InlineContextualCTA
              variant="line"
              question="Nie znalazłeś odpowiedzi?"
              actionLabel="Zadzwoń do nas"
              actionType="phone"
            />
          </div>
        </div>
      </section>
      <FAQSchema items={productFaqItems} />

      {/* CARD — Related products (simplified) */}
      <RelatedProducts currentProductId={product.id} products={products} />

      <ProductStickyBar product={product as any} />
    </Layout>
  );
};

export default ProductDetail;

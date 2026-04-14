
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { usePublicSupabaseProducts } from '@/hooks/usePublicSupabaseProducts';
import { useProductTranslationsDisplay } from '@/hooks/useProductTranslationsDisplay';
import CallToAction from '@/components/ui/CallToAction';
import ProductImage from '@/components/products/ProductImage';
import ProductInfo from '@/components/products/ProductInfo';
import ProductHeader from '@/components/products/ProductHeader';
import RelatedProducts from '@/components/products/RelatedProducts';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { generateProductSchema } from '@/utils/seo/generateProductSchema';
import { useProductSEO } from '@/hooks/useProductSEO';
import { Loader2 } from 'lucide-react';
import FAQSection from '@/components/ui/FAQSection';
import FAQSchema from '@/components/seo/FAQSchema';
import { FEATURES } from '@/config/featureFlags';
import { useSupabaseFAQ } from '@/hooks/useSupabaseFAQ';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { products, isLoading } = usePublicSupabaseProducts();
  
  const product = products.find((p) => p.slug === id || p.id === id);
  
  // Fetch translations for the current product and language
  const { translations, isLoading: translationsLoading } = useProductTranslationsDisplay(
    product?.id || '', 
    language
  );

  // Fetch SEO settings for dynamic JSON-LD schema
  const { seoSettings } = useProductSEO(product?.id || '');
  
  useEffect(() => {
    // Scroll to top when component mounts or when ID changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

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

  // Dynamic meta data
  const getMetaTitle = () => {
    const brand = product.model?.includes('Toyota') || product.model?.includes('BT') ? 'Toyota' : 'Toyota';
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
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return product.image || '';
  };

  // Dynamic FAQ: fetch from Supabase or fall back to static
  const { faqs: allFaqs, fetchFAQs } = useSupabaseFAQ();

  useEffect(() => {
    if (FEATURES.PRODUCT_FAQ) {
      fetchFAQs(language);
    }
  }, [language]);

  const productFaqItems = useMemo(() => {
    if (FEATURES.PRODUCT_FAQ && allFaqs.length > 0) {
      // If product has assigned FAQ IDs, use those; otherwise pick random 4
      let selectedFaqs = allFaqs;
      if (product?.faqIds && product.faqIds.length > 0) {
        const assigned = allFaqs.filter(f => product.faqIds!.includes(f.id));
        if (assigned.length > 0) selectedFaqs = assigned;
      }
      // Take up to 4
      const limited = selectedFaqs.slice(0, 4);
      return limited.map(f => ({ question: f.question, answer: f.answer }));
    }

    // Fallback: static FAQ from translations
    return [
      {
        question: t('product_faq_surface_question' as any).replace('{model}', product?.model || ''),
        answer: t('product_faq_surface_answer' as any),
      },
      {
        question: t('product_faq_truck_question' as any).replace('{model}', product?.model || ''),
        answer: t('product_faq_truck_answer' as any),
      },
      {
        question: t('product_faq_cold_question' as any),
        answer: t('product_faq_cold_answer' as any),
      },
      {
        question: t('product_faq_height_question' as any).replace('{model}', product?.model || ''),
        answer: t('product_faq_height_answer' as any),
      },
    ];
  }, [allFaqs, product, t, language]);

  const productSchemaData = generateProductSchema(product, seoSettings);

  return (
    <Layout>
      <Helmet>
        <title>{getMetaTitle()}</title>
        <meta name="description" content={getMetaDescription()} />
        <meta property="og:title" content={getMetaTitle()} />
        <meta property="og:description" content={getMetaDescription()} />
        <meta property="og:image" content={getOgImage()} />
        <meta property="og:url" content={`https://stakerpol.pl/${language}/products/${product.slug || product.id}`} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={getMetaTitle()} />
        <meta name="twitter:description" content={getMetaDescription()} />
        <meta name="twitter:image" content={getOgImage()} />
        <link rel="canonical" href={`https://stakerpol.pl/${language}/products/${product.slug || product.id}`} />
        
        {/* Product Schema JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(productSchemaData, null, 2)}
        </script>
      </Helmet>
      <BreadcrumbSchema items={breadcrumbItems} />
      <section id="product-details" className="bg-white py-12">
        <div className="container-custom">
          <ProductHeader />
          
          <div className="grid lg:grid-cols-2 gap-12">
            <ProductImage 
              image={product.image} 
              alt={product.model} 
              images={product.images} 
            />
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-stakerpol-navy leading-tight">
                  {product.model}
                </h1>
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  {translations.shortDescription || product.shortDescription}
                  {translationsLoading && language !== 'pl' && (
                    <span className="ml-2 text-sm text-gray-500">
                      <Loader2 className="h-3 w-3 animate-spin inline" />
                    </span>
                  )}
                </p>
              </div>
              <ProductInfo product={product} language={language} />
            </div>
          </div>
        </div>
      </section>

      <FAQSection title={`FAQ – ${product.model}`} items={productFaqItems} />
      <FAQSchema items={productFaqItems} />
      
      <RelatedProducts currentProductId={product.id} products={products} />
      
      <CallToAction />
    </Layout>
  );
};

export default ProductDetail;

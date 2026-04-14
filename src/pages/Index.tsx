
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import CallToAction from '@/components/ui/CallToAction';
import ProductCard from '@/components/ui/ProductCard';
import WhyChooseUs from '@/components/ui/WhyChooseUs';
import ProductsEmptyState from '@/components/ui/ProductsEmptyState';
import LocalBusinessSchema from '@/components/seo/LocalBusinessSchema';
import { usePublicSupabaseProducts } from '@/hooks/usePublicSupabaseProducts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { getRandomItems } from '@/utils/randomUtils';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { getMetaTitle } from '@/config/featureFlags';
import FAQSection from '@/components/ui/FAQSection';
import FAQSchema from '@/components/seo/FAQSchema';

const Index = () => {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { products, isLoading } = usePublicSupabaseProducts();

  // Get 4 random products on each page load
  const featuredProducts = useMemo(() => {
    return getRandomItems(products, 4);
  }, [products]);

  const renderFeaturedProducts = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-stakerpol-orange mx-auto mb-4" />
            <p className="text-muted-foreground">Ładowanie produktów...</p>
          </div>
        </div>
      );
    }

    if (products.length === 0) {
      return <ProductsEmptyState />;
    }

    return (
      <>
        <div className="product-grid-desktop mt-8">
          {featuredProducts.map((product, index) => (
            <div key={product.id} style={{ animationDelay: `${index * 100}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg"
            className="secondary-button"
            asChild
          >
            <Link to="/products">
              {t('viewAllProducts')}
            </Link>
          </Button>
        </div>
      </>
    );
  };

  const homeFaqItems = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => ({
      question: t(`home_faq_${index + 1}_question` as any),
      answer: t(`home_faq_${index + 1}_answer` as any),
    }));
  }, [t]);
  return (
    <Layout>
      <Helmet>
        <title>{getMetaTitle()}</title>
        <meta name="description" content="Profesjonalna sprzedaż używanych wózków paletowych Toyota i BT. Elektryczne paleciaki magazynowe z serwisem. Sprawdź ofertę w Stakerpol." />
        <meta property="og:title" content="Stakerpol - Wózki widłowe Toyota BT | Sprzedaż używanych wózków" />
        <meta property="og:description" content="Profesjonalna sprzedaż używanych wózków widłowych Toyota i BT. Elektryczne i spalinowe paleciaki magazynowe z serwisem." />
        <meta property="og:image" content="/lovable-uploads/cba7623d-e272-43d2-9cb1-c4864cb74fde.png" />
        <meta property="og:url" content={`https://stakerpol.pl/${language}`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Stakerpol - Wózki widłowe Toyota BT" />
        <meta name="twitter:description" content="Profesjonalna sprzedaż używanych wózków widłowych Toyota i BT. Elektryczne i spalinowe paleciaki magazynowe." />
        <meta name="twitter:image" content="/lovable-uploads/cba7623d-e272-43d2-9cb1-c4864cb74fde.png" />
        <link rel="canonical" href={`https://stakerpol.pl/${language}`} />
        <meta name="keywords" content="wózki widłowe, toyota, bt, elektryczne, spalinowe, paleciaki, magazynowe, używane, serwis, stakerpol" />
        {/* Preload hero image for faster LCP */}
        <link rel="preload" as="image" href="/lovable-uploads/cba7623d-e272-43d2-9cb1-c4864cb74fde.png" />
      </Helmet>
      <LocalBusinessSchema />
      {/* Hero Section with Background Image */}
      <section 
        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-toyota-black text-white min-h-[600px] flex items-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.1) 100%), url('/lovable-uploads/cba7623d-e272-43d2-9cb1-c4864cb74fde.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container-custom py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 md:pr-8 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {t('heroTitle')}
              </h1>
              <p className="text-lg text-gray-300 md:text-xl">
                {t('heroSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  className="cta-button text-lg"
                  size="lg"
                  asChild
                >
            <Link to="/products">
              {t('browseProducts')}
            </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="border-2 border-white text-black bg-white hover:bg-gray-100 hover:text-black text-lg transition-all duration-300"
                  size="lg"
                  asChild
                >
                  <Link to="/contact">
                    {t('contact')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="section-title text-center">{t('aboutUsTitle')}</h2>
          <p className="section-subtitle text-center max-w-3xl mx-auto">
            {t('aboutUsDescription')}
          </p>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <WhyChooseUs />

      {/* Featured Products Section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <h2 className="section-title text-center">{t('featuredProducts')}</h2>
          <p className="text-center text-gray-600 mb-8">
            {t('featuredProductsSubtitle')}
          </p>
          
          {renderFeaturedProducts()}
        </div>
      </section>

      <FAQSection title={t('faq_section_title')} items={homeFaqItems} />
      <FAQSchema items={homeFaqItems} />

      <CallToAction />
    </Layout>
  );
};

export default Index;

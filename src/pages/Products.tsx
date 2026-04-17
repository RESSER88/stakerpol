
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/ui/ProductCard';
import CallToAction from '@/components/ui/CallToAction';
import ProductsEmptyState from '@/components/ui/ProductsEmptyState';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { usePublicSupabaseProducts } from '@/hooks/usePublicSupabaseProducts';
import { Link } from 'react-router-dom';
import { Shield, Loader2 } from 'lucide-react';
import FAQSection from '@/components/ui/FAQSection';
import FAQSchema from '@/components/seo/FAQSchema';
import { Helmet } from 'react-helmet-async';
import ProductFilter from '@/components/products/ProductFilter';
import React, { useState, useMemo } from 'react';
import { Product } from '@/types';
import { getSiteDescription } from '@/config/featureFlags';
const Products = () => {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { products, isLoading } = usePublicSupabaseProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Update filtered products when products load
  React.useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const getPageDescription = () => getSiteDescription(language);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
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

    const displayProducts = filteredProducts.length > 0 ? filteredProducts : products;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {displayProducts.map((product, index) => (
          <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <ProductCard product={product} priority={index < 3} />
          </div>
        ))}
      </div>
    );
  };

  const categoryFaqItems = useMemo(() => {
    return Array.from({ length: 4 }, (_, index) => ({
      question: t(`category_faq_${index + 1}_question` as any),
      answer: t(`category_faq_${index + 1}_answer` as any),
    }));
  }, [t]);
  return (
    <Layout>
      <Helmet>
        <title>Wózki widłowe BT Toyota – oferta | Stakerpol</title>
        <meta name="description" content={getPageDescription()} />
        <link rel="canonical" href={`https://stakerpol.pl/${language}/products`} />
        <meta property="og:title" content="Wózki widłowe BT Toyota – oferta | Stakerpol" />
        <meta property="og:description" content={getPageDescription()} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://stakerpol.pl/${language}/products`} />
        <meta name="twitter:card" content="summary" />
      </Helmet>
      <section className="bg-gradient-to-b from-stakerpol-lightgray to-white py-8 relative">
        <div className="container-custom relative">
          <h1 className="sr-only">Wózki widłowe BT Toyota – oferta</h1>

          <Link
            to="/admin"
            className="absolute top-0 right-4 text-muted-foreground/50 hover:text-stakerpol-orange transition-colors z-10"
            title="Panel administracyjny"
          >
            <Shield size={18} />
          </Link>

          <div className="hidden md:flex justify-center mb-8">
            <ProductFilter
              products={products}
              onFilterChange={setFilteredProducts}
              language={language}
            />
          </div>

          {renderContent()}
        </div>

        {/* Floating filter button - mobile only */}
        <div className="md:hidden fixed right-4 top-1/2 -translate-y-1/2 z-40">
          <ProductFilter
            products={products}
            onFilterChange={setFilteredProducts}
            language={language}
            variant="floating"
          />
        </div>
      </section>
      <FAQSection title={t('category_faq_title')} items={categoryFaqItems} />
      <FAQSchema items={categoryFaqItems} />
      
      <CallToAction />
    </Layout>
  );
};

export default Products;

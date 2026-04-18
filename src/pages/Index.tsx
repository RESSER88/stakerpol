import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import LocalBusinessSchema from '@/components/seo/LocalBusinessSchema';
import { usePublicSupabaseProducts } from '@/hooks/usePublicSupabaseProducts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { getRandomItems } from '@/utils/randomUtils';
import { getMetaTitle } from '@/config/featureFlags';
import HeroContactForm from '@/components/contact/HeroContactForm';
import TrustStrip from '@/components/home/TrustStrip';
import HomeFeaturedProducts from '@/components/home/HomeFeaturedProducts';
import HomeAboutSection from '@/components/home/HomeAboutSection';
import HomeFAQ from '@/components/home/HomeFAQ';
import HomeReadyToBuy from '@/components/home/HomeReadyToBuy';

const Index = () => {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { products, isLoading } = usePublicSupabaseProducts();

  // 4 wyróżnione lub losowe produkty dostępne
  const featuredProducts = useMemo(() => {
    const available = products.filter((p: any) => p.availabilityStatus !== 'sold');
    const featured = available.filter((p: any) => p.is_featured);
    if (featured.length >= 4) return featured.slice(0, 4);
    return getRandomItems(available, 4);
  }, [products]);

  return (
    <Layout>
      <Helmet>
        <title>{getMetaTitle()}</title>
        <meta name="description" content="Profesjonalna sprzedaż używanych wózków paletowych Toyota i BT. Elektryczne paleciaki magazynowe z serwisem. Sprawdź ofertę w Stakerpol." />
        <meta property="og:title" content={getMetaTitle()} />
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
        <link rel="preload" as="image" href="/lovable-uploads/cba7623d-e272-43d2-9cb1-c4864cb74fde.png" />
      </Helmet>
      <LocalBusinessSchema />

      {/* Hero Section — bez zmian (Etap 2 zajmie się przebudową) */}
      <section
        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-toyota-black text-white min-h-[600px] flex items-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.1) 100%), url('/lovable-uploads/cba7623d-e272-43d2-9cb1-c4864cb74fde.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="container-custom py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 md:pr-8 animate-fade-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                {t('heroTitle')}
              </h1>
              <p className="text-lg text-gray-300 md:text-xl">
                {t('heroSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button className="cta-button text-lg" size="lg" asChild>
                  <Link to="/products">{t('browseProducts')}</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-white text-black bg-white hover:bg-gray-100 hover:text-black text-lg transition-all duration-300"
                  size="lg"
                  asChild
                >
                  <Link to="/contact">{t('contact')}</Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block animate-fade-in">
              <HeroContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <TrustStrip />

      {/* 01 — Nasze wózki */}
      <HomeFeaturedProducts products={featuredProducts} isLoading={isLoading} />

      {/* 02 — O firmie + statystyki + zalety */}
      <HomeAboutSection />

      {/* 03 — FAQ */}
      <HomeFAQ />

      {/* Gotowy na zakup? */}
      <HomeReadyToBuy />
    </Layout>
  );
};

export default Index;

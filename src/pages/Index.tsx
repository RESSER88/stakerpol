import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useMemo } from 'react';

import Layout from '@/components/layout/Layout';
import LocalBusinessSchema from '@/components/seo/LocalBusinessSchema';
import { usePublicSupabaseProducts } from '@/hooks/usePublicSupabaseProducts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { getRandomItems } from '@/utils/randomUtils';
import { getMetaTitle } from '@/config/featureFlags';
import HomeHeroForm from '@/components/home/HomeHeroForm';
import HomeHeroFormSection from '@/components/home/HomeHeroFormSection';
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

      {/* Hero Section — 2-kolumnowy desktop, 1-kolumnowy mobile */}
      <section
        className="relative text-white min-h-[480px] lg:min-h-[520px] flex items-center"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 25% 60%, hsl(var(--color-orange-cta) / 0.35), transparent 60%),
            radial-gradient(ellipse at 80% 30%, hsl(var(--color-red-accent) / 0.28), transparent 60%),
            linear-gradient(135deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.35) 100%),
            url('/lovable-uploads/cba7623d-e272-43d2-9cb1-c4864cb74fde.png')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="container-custom max-w-[1200px] py-10 lg:py-12 px-5 lg:px-8 w-full">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 items-center">
            <div className="space-y-4 lg:space-y-5 animate-fade-in">
              <div className="font-mono text-[11px] lg:text-xs tracking-[0.14em] text-white/70 uppercase">
                // Używane wózki Toyota · od 2008
              </div>
              <h1 className="text-2xl md:text-4xl lg:text-[clamp(28px,3.6vw,42px)] font-extrabold leading-[1.1] tracking-tight">
                {t('heroTitle')}
              </h1>
              <p className="text-sm md:text-base lg:text-[15px] text-white/90 leading-[1.55] max-w-[480px]">
                {t('heroSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 lg:gap-3 pt-2">
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center bg-orange-cta hover:opacity-90 text-white font-bold text-sm py-3.5 px-6 rounded-md transition-opacity"
                >
                  {t('browseProducts')} →
                </Link>
                <a
                  href="#ready"
                  className="inline-flex items-center justify-center bg-transparent border border-white/30 hover:bg-white/10 text-white font-bold text-sm py-3.5 px-6 rounded-md transition-colors"
                >
                  {t('contact')}
                </a>
              </div>
            </div>

            {/* Formularz po prawej — tylko desktop */}
            <div className="hidden lg:block animate-fade-in">
              <div
                className="bg-white rounded-lg p-[22px] max-w-[360px] ml-auto"
                style={{ boxShadow: '0 12px 30px -10px rgba(0,0,0,0.25)' }}
              >
                <HomeHeroForm isInHero />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <TrustStrip />

      {/* Formularz jako osobna sekcja (mobile + tablet, ukryte na lg) */}
      <HomeHeroFormSection />

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

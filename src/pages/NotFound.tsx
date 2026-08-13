
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "@/utils/translations";
import { useEffect } from "react";

const NotFound = () => {
  const { language } = useLanguage();
  const t = useTranslation(language);
  
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      window.location.pathname
    );
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>Strona nie znaleziona | Stakerpol</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="container-custom py-20 text-center">
        <h1 className="text-6xl font-bold mb-4 text-toyota-red">404</h1>
        <p className="text-2xl text-gray-600 mb-8">
          {t('pageNotFound')}
        </p>
        <Button className="cta-button" asChild>
          <Link to="/">
            {t('returnToHome')}
          </Link>
        </Button>
      </div>
    </Layout>
  );
};

export default NotFound;

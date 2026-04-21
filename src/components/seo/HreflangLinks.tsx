import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const SUPPORTED_LANGS = ['pl','en','cs','sk','de'] as const;

const HreflangLinks = () => {
  const location = useLocation();

  const pathname = location.pathname;
  // Strip leading language if present (legacy)
  const firstSeg = pathname.split('/')[1];
  const basePath = SUPPORTED_LANGS.includes(firstSeg as any)
    ? pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/'
    : pathname;

  // Routing has no language prefix — all languages point to the same canonical URL.
  // Language is selected client-side via LanguageContext.
  const url = `https://stakerpol.pl${basePath === '/' ? '/' : basePath}`;

  return (
    <Helmet>
      {SUPPORTED_LANGS.map((lang) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={url} />
    </Helmet>
  );
};

export default HreflangLinks;

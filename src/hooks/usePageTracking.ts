import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/utils/analytics';

/** Trasy wykluczone z raportowania odsłon (adresy zawierające token dostępu). */
const EXCLUDED_PREFIXES = ['/oferta/'];

const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    if (EXCLUDED_PREFIXES.some((p) => location.pathname.startsWith(p))) return;
    trackPageView(location.pathname + location.search);
  }, [location]);
};

export default usePageTracking;

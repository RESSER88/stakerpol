
import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import usePageTracking from "./hooks/usePageTracking";
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from "./contexts/LanguageContext";
import { SupabaseAuthProvider } from "./hooks/useSupabaseAuth";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { logger } from "@/utils/logger";
import Index from "./pages/Index";
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const Contact = lazy(() => import("./pages/Contact"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import('./pages/Admin'));
const FAQ = lazy(() => import("./pages/FAQ"));
const Privacy = lazy(() => import("./pages/Privacy"));
const SharedOffer = lazy(() => import("./pages/SharedOffer"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const LegacyProductRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`${ROUTES.products}/${id}`} replace />;
};

const AppRoutes = () => {
  usePageTracking();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Ładowanie...</div>}>
      <Routes>
        <Route path={ROUTES.home} element={<Index />} />
        <Route path={ROUTES.products} element={<Products />} />
        <Route path={ROUTES.productDetail} element={<ProductDetail />} />
        <Route path={ROUTES.testimonials} element={<Testimonials />} />
        <Route path={ROUTES.contact} element={<Contact />} />
        <Route path={ROUTES.faq} element={<FAQ />} />
        <Route path={ROUTES.privacy} element={<Privacy />} />
        <Route path={ROUTES.admin} element={<Admin />} />
        <Route path={ROUTES.sharedOffer} element={<SharedOffer />} />

        {/* Przekierowania ze starych (angielskich) adresów */}
        <Route path="/products" element={<Navigate to={ROUTES.products} replace />} />
        <Route path="/products/:id" element={<LegacyProductRedirect />} />
        <Route path="/contact" element={<Navigate to={ROUTES.contact} replace />} />
        <Route path="/testimonials" element={<Navigate to={ROUTES.testimonials} replace />} />
        <Route path="/privacy" element={<Navigate to={ROUTES.privacy} replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>

    </Suspense>
  );
};

const App = () => {
  useEffect(() => {
    if (import.meta.env.PROD) {
      try {
        import('./utils/performance').then(({ trackWebVitals }) => {
          trackWebVitals();
        }).catch((error) => {
          logger.warn('Failed to load performance tracking:', error);
        });
      } catch (error) {
        logger.warn('Error setting up performance tracking:', error);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <HelmetProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <SupabaseAuthProvider>
                  <AppRoutes />
                </SupabaseAuthProvider>
              </BrowserRouter>
            </HelmetProvider>
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;


import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const AppRoutes = () => {
  usePageTracking();
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/testimonials" element={<Testimonials />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/admin" element={
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Ładowanie...</div>}>
          <Admin />
        </Suspense>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
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

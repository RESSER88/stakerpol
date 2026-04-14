import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, Settings, BarChart3, CheckCircle, AlertCircle, Upload, Languages, Search } from 'lucide-react';
import AdminLogin from '@/components/admin/AdminLogin';
import ProductManager from '@/components/admin/ProductManager';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useMigrationMonitor } from '@/hooks/useMigrationMonitor';
import TranslationStatsPanel from '@/components/admin/TranslationStatsPanel';
import TranslationManager from '@/components/admin/TranslationManager';
import FAQManager from '@/components/admin/FAQManager';
import ImageStatusCard from '@/components/admin/ImageStatusCard';
import HealthCheck from '@/components/monitoring/HealthCheck';
import ProductionReadinessPanel from '@/components/admin/ProductionReadinessPanel';
import SEOManagerTool from '@/components/admin/SEOManagerTool';
import { FEATURES } from '@/config/featureFlags';

const Admin = () => {
  const { user, loading: authLoading, isAdmin, adminLoading, signOut } = useSupabaseAuth();
  const { 
    products, 
    isLoading: productsLoading, 
    addProduct, 
    updateProduct, 
    deleteProduct 
  } = useSupabaseProducts();
  
  // Migration monitoring
  const { stats: migrationStats, isMonitoring, completeMigration } = useMigrationMonitor(products || []);
  
  // ProductManager state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  
  // Settings panel states
  const [isTranslationStatsOpen, setIsTranslationStatsOpen] = useState(false);
  const [isImageStatusOpen, setIsImageStatusOpen] = useState(false);
  
  const { toast } = useToast();

  // ProductManager handlers - Fixed defaultNewProduct with correct Product interface properties
  const defaultNewProduct: Product = {
    id: '',
    model: '',
    image: '', // First image URL for backward compatibility
    images: [], // Array of image URLs
    shortDescription: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    specs: {
      // Main section (always visible)
      productionYear: new Date().getFullYear().toString(),
      serialNumber: '',
      mastLiftingCapacity: '0',
      preliminaryLiftingCapacity: '0',
      workingHours: '0',
      liftHeight: '0',
      minHeight: '0',
      preliminaryLifting: '',
      battery: '',
      condition: 'bardzo-dobry',
      
      // Expandable section (hidden by default)
      driveType: '',
      mast: '',
      freeStroke: '0',
      dimensions: '',
      wheels: '',
      operatorPlatform: '',
      additionalOptions: '',
      additionalDescription: '',
      
      // Legacy fields for backward compatibility
      capacity: '0',
      charger: ''
    }
  };

  const handleEdit = (product: Product) => {
    console.log('Editing product:', product);
    setSelectedProduct(product);
    setProductImages(product.images || []);
    setIsEditDialogOpen(true);
  };

  const handleAdd = () => {
    console.log('Adding new product');
    setSelectedProduct(defaultNewProduct);
    setProductImages([]);
    setIsEditDialogOpen(true);
  };

  const handleCopy = (product: Product) => {
    console.log('Copying product:', product);
    const copiedProduct = {
      ...product,
      id: '',
      model: `${product.model} (kopia)`,
      specs: {
        ...product.specs,
        serialNumber: `${product.specs.serialNumber}-COPY`
      }
    };
    setSelectedProduct(copiedProduct);
    setProductImages(product.images || []);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (window.confirm(`Czy na pewno chcesz usunąć produkt "${product.model}"?`)) {
      try {
        await deleteProduct(product.id);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="absolute top-4 right-4">
          {user && (
            <Button variant="outline" onClick={signOut}>
              Wyloguj
            </Button>
          )}
        </div>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-stakerpol-orange mx-auto mb-4" />
          <p className="text-gray-600">
            {authLoading ? 'Sprawdzanie uprawnień...' : 'Weryfikacja roli administratora...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-stakerpol-navy mb-2">
                Panel Administracyjny
              </h1>
              <p className="text-gray-600">
                Zarządzanie produktami i systemem
              </p>
            </div>
            <Button variant="outline" onClick={signOut}>
              Wyloguj
            </Button>
          </div>
          
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produkty
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              SEO & Schema
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Ustawienia
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="production" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Production
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductManager
              isEditDialogOpen={isEditDialogOpen}
              setIsEditDialogOpen={setIsEditDialogOpen}
              selectedProduct={selectedProduct}
              productImages={productImages}
              setProductImages={setProductImages}
              products={products}
              defaultNewProduct={defaultNewProduct}
              handleEdit={handleEdit}
              handleAdd={handleAdd}
              handleCopy={handleCopy}
              handleDelete={handleDelete}
              addProduct={addProduct}
              updateProduct={updateProduct}
            />
          </TabsContent>

          <TabsContent value="seo">
            <SEOManagerTool />
          </TabsContent>

          <TabsContent value="faq">
            <FAQManager />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Translation Management Panel — hidden when DeepL disabled */}
              {FEATURES.DEEPL_ENABLED && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Languages className="h-5 w-5" />
                      Tłumaczenia AI
                    </CardTitle>
                    <CardDescription>
                      Zarządzanie automatycznymi tłumaczeniami produktów za pomocą DeepL API
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TranslationManager />
                  </CardContent>
                </Card>
              )}

              {/* Image Status Card (Collapsible) */}
              <ImageStatusCard 
                products={products || []}
                isMonitoring={isMonitoring}
                completeMigration={completeMigration}
                isOpen={isImageStatusOpen}
                onOpenChange={setIsImageStatusOpen}
              />

              {/* Translation Stats Panel — hidden when DeepL disabled */}
              {FEATURES.DEEPL_ENABLED && (
                <TranslationStatsPanel 
                  isOpen={isTranslationStatsOpen}
                  onOpenChange={setIsTranslationStatsOpen}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="monitoring">
            <HealthCheck />
          </TabsContent>

          <TabsContent value="production">
            <ProductionReadinessPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;

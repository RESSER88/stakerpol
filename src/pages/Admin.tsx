import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseProducts } from '@/hooks/useSupabaseProducts';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import AdminLogin from '@/components/admin/AdminLogin';
import ProductManager from '@/components/admin/ProductManager';
import FAQManager from '@/components/admin/FAQManager';
import SEOManagerTool from '@/components/admin/SEOManagerTool';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { AdminSection } from '@/components/admin/layout/types';
import DashboardSection from '@/components/admin/sections/DashboardSection';
import InquiriesSection from '@/components/admin/sections/InquiriesSection';
import ExportSection from '@/components/admin/sections/ExportSection';
import PermissionDenied from '@/components/ui/PermissionDenied';
import { Product } from '@/types';

const Admin = () => {
  const { user, loading: authLoading, isAdmin, adminLoading, adminError, signOut } = useSupabaseAuth();
  const { products, addProduct, updateProduct, deleteProduct, addProductAsync, updateProductAsync } = useSupabaseProducts() as any;

  const [activeSection, setActiveSection] = useState<AdminSection>('start');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);

  const defaultNewProduct: Product = {
    id: '',
    model: '',
    image: '',
    images: [],
    shortDescription: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    specs: {
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
      driveType: '',
      mast: '',
      freeStroke: '0',
      dimensions: '',
      wheels: '',
      operatorPlatform: '',
      additionalOptions: '',
      additionalDescription: '',
      capacity: '0',
      charger: ''
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setProductImages(product.images || []);
    setIsEditDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(defaultNewProduct);
    setProductImages([]);
    setIsEditDialogOpen(true);
  };

  const handleCopy = (product: Product) => {
    const copiedProduct = {
      ...product,
      id: '',
      model: `${product.model} (kopia)`,
      specs: { ...product.specs, serialNumber: `${product.specs.serialNumber}-COPY` }
    };
    setSelectedProduct(copiedProduct);
    setProductImages(product.images || []);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.id);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="absolute top-4 right-4">
          {user && <Button variant="outline" onClick={signOut}>Wyloguj</Button>}
        </div>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-admin-orange mx-auto mb-4" />
          <p className="text-admin-muted">
            {authLoading ? 'Sprawdzanie uprawnień...' : 'Weryfikacja roli administratora...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <AdminLogin />;
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-bg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-admin-orange mx-auto mb-4" />
          <p className="text-admin-muted">Weryfikacja roli administratora...</p>
        </div>
      </div>
    );
  }
  if (adminError) return <PermissionDenied message={adminError} />;
  if (!isAdmin && !adminLoading) return <Navigate to="/" replace />;

  const renderSection = () => {
    switch (activeSection) {
      case 'start':
        return (
          <DashboardSection
            productCount={products.length}
            products={products}
            onNavigate={setActiveSection}
            onAddProduct={() => { setActiveSection('products'); handleAdd(); }}
            onEditProduct={(p) => { setActiveSection('products'); handleEdit(p); }}
          />
        );
      case 'products':
        return (
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
            addProductAsync={addProductAsync}
            updateProductAsync={updateProductAsync}
            onNavigate={setActiveSection}
          />
        );
      case 'inquiries':
        return <InquiriesSection />;
      case 'export':
        return <ExportSection products={products} />;
      case 'seo':
        return <SEOManagerTool />;
      case 'faq':
        return <FAQManager />;
      default:
        return null;
    }
  };

  return (
    <AdminLayout active={activeSection} onChange={setActiveSection} onSignOut={signOut}>
      {renderSection()}
    </AdminLayout>
  );
};

export default Admin;

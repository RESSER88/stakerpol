
import { Package, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

interface ProductsEmptyStateProps {
  isAdmin?: boolean;
}

const ProductsEmptyState = ({ isAdmin = false }: ProductsEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-4">
            <Package className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isAdmin ? "Brak produktów w katalogu" : "Wkrótce dostępne produkty"}
          </h3>
          <p className="text-gray-600 mb-6">
            {isAdmin 
              ? "Rozpocznij dodawanie produktów do katalogu, aby były widoczne dla klientów."
              : "Aktualnie przygotowujemy nasze produkty do publikacji. Sprawdź ponownie wkrótce lub skontaktuj się z nami bezpośrednio."
            }
          </p>
          
          {isAdmin && (
            <Button asChild className="cta-button">
              <Link to="/admin">
                <Plus className="mr-2 h-4 w-4" />
                Dodaj pierwszy produkt
              </Link>
            </Button>
          )}
          
          {!isAdmin && (
            <div className="space-y-4">
              <Button asChild className="cta-button w-full">
                <Link to={ROUTES.contact}>
                  Skontaktuj się z nami
                </Link>
              </Button>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm text-blue-800">
                    Jesteś administratorem? <Link to="/admin" className="font-semibold underline hover:text-blue-900">Zaloguj się do panelu</Link>
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsEmptyState;

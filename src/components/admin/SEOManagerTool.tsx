import { useState } from 'react';
import { usePublicSupabaseProducts } from '@/hooks/usePublicSupabaseProducts';
import { useProductSEO, ProductSEOSettings } from '@/hooks/useProductSEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { generateProductSchema } from '@/utils/seo/generateProductSchema';
import { validateProductSchema, checkGoogleCompliance } from '@/utils/seo/schemaValidator';

const SEOManagerTool = () => {
  const { products, isLoading } = usePublicSupabaseProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const { seoSettings, updateSEOSettings, isUpdating } = useProductSEO(selectedProductId);

  const [formData, setFormData] = useState<Partial<ProductSEOSettings>>({});

  // Update form when product or settings change
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    setFormData({});
  };

  const handleUpdateField = (field: keyof ProductSEOSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateSEOSettings({
      ...seoSettings,
      ...formData,
    });
  };

  const getCurrentSettings = (): Partial<ProductSEOSettings> => ({
    ...seoSettings,
    ...formData,
  });

  const testInGoogleRichResults = () => {
    if (!selectedProduct) return;
    const url = `https://stakerpol.pl/products/${selectedProduct.slug || selectedProduct.id}`;
    const testUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(url)}`;
    window.open(testUrl, '_blank');
  };

  const validateCurrentSchema = () => {
    if (!selectedProduct) return null;
    const schema = generateProductSchema(selectedProduct, getCurrentSettings() as ProductSEOSettings);
    const basicValidation = validateProductSchema(schema);
    const googleCompliance = checkGoogleCompliance(schema);
    
    return {
      ...basicValidation,
      googleIssues: googleCompliance,
    };
  };

  const filteredProducts = products.filter(p => 
    p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.specs?.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const validation = selectedProduct ? validateCurrentSchema() : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SEO & JSON-LD Schema Manager</CardTitle>
          <CardDescription>
            Zarządzaj ustawieniami SEO i JSON-LD dla każdego produktu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Selection */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Wyszukaj produkt</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Model, numer seryjny..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Numer seryjny</TableHead>
                    <TableHead>Status Schema</TableHead>
                    <TableHead>Cena</TableHead>
                    <TableHead>Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow 
                      key={product.id}
                      className={selectedProductId === product.id ? 'bg-muted' : ''}
                    >
                      <TableCell className="font-medium">{product.model}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.specs?.serialNumber || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          Włączony
                        </Badge>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={selectedProductId === product.id ? 'default' : 'outline'}
                          onClick={() => handleProductSelect(product.id)}
                        >
                          {selectedProductId === product.id ? 'Wybrany' : 'Edytuj'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* SEO Settings Form */}
          {selectedProduct && (
            <div className="space-y-6 border-t pt-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Ustawienia SEO: {selectedProduct.model}
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Cena, waluta, dostępność i stan pochodzą teraz z danych produktu
                    (sekcja Cennik / Podstawowe) i nie są już edytowalne tutaj. */}

                {/* Price Valid Until */}
                <div className="space-y-2">
                  <Label htmlFor="priceValidUntil">Cena ważna do</Label>
                  <Input
                    id="priceValidUntil"
                    type="date"
                    value={formData.price_valid_until ?? seoSettings?.price_valid_until ?? ''}
                    onChange={(e) => handleUpdateField('price_valid_until', e.target.value)}
                  />
                </div>



                {/* GTIN */}
                <div className="space-y-2">
                  <Label htmlFor="gtin">GTIN</Label>
                  <Input
                    id="gtin"
                    placeholder="Global Trade Item Number"
                    value={formData.gtin ?? seoSettings?.gtin ?? ''}
                    onChange={(e) => handleUpdateField('gtin', e.target.value)}
                  />
                </div>

                {/* MPN */}
                <div className="space-y-2">
                  <Label htmlFor="mpn">MPN</Label>
                  <Input
                    id="mpn"
                    placeholder="Manufacturer Part Number"
                    value={formData.mpn ?? seoSettings?.mpn ?? ''}
                    onChange={(e) => handleUpdateField('mpn', e.target.value)}
                  />
                </div>

                {/* Enable Schema */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-schema"
                    checked={formData.enable_schema ?? seoSettings?.enable_schema ?? true}
                    onCheckedChange={(checked) => handleUpdateField('enable_schema', checked)}
                  />
                  <Label htmlFor="enable-schema">Włącz JSON-LD Schema</Label>
                </div>
              </div>

              {/* Validation Results */}
              {validation && (
                <div className="space-y-3 border-t pt-4">
                  <h4 className="font-semibold">Walidacja schematu</h4>
                  
                  <div className="space-y-2">
                    {validation.isValid ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Schema jest poprawna</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Schema zawiera błędy</span>
                      </div>
                    )}

                    {validation.errors.map((error, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-red-600">
                        <XCircle className="h-4 w-4 mt-0.5" />
                        <span><strong>{error.field}:</strong> {error.message}</span>
                      </div>
                    ))}

                    {validation.warnings.map((warning, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-yellow-600">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span><strong>{warning.field}:</strong> {warning.message}</span>
                      </div>
                    ))}

                    {validation.googleIssues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span><strong>Google:</strong> {issue.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 border-t pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Zapisywanie...' : 'Zapisz ustawienia'}
                </Button>
                <Button
                  variant="outline"
                  onClick={testInGoogleRichResults}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test w Google Rich Results
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SEOManagerTool;

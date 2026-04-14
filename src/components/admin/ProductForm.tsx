
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Product } from '@/types';
import { useSupabaseFAQ, FAQ } from '@/hooks/useSupabaseFAQ';
import { FEATURES } from '@/config/featureFlags';

interface ProductFormProps {
  product: Product;
  onFieldChange: (field: string, value: string | string[]) => void;
  onSpecsFieldChange: (field: string, value: string) => void;
}

interface ValidationErrors {
  [key: string]: string;
}

const ProductForm = ({ product, onFieldChange, onSpecsFieldChange }: ProductFormProps) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { faqs } = useSupabaseFAQ();
  const [faqLang, setFaqLang] = useState('pl');

  const availableFaqs = faqs.filter(f => f.language === faqLang);
  const selectedFaqIds = product.faqIds || [];

  const validateField = (field: string, value: string, maxLength?: number): string => {
    if (maxLength && value.length > maxLength) {
      return `Maksymalnie ${maxLength} znaków (obecnie: ${value.length})`;
    }
    
    // Check for HTML/script tags
    const htmlRegex = /<[^>]*>/;
    if (htmlRegex.test(value)) {
      return 'HTML nie jest dozwolony w tym polu';
    }
    
    return '';
  };

  const handleFieldChange = (field: string, value: string, maxLength?: number) => {
    const error = validateField(field, value, maxLength);
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
    
    onFieldChange(field, value);
  };

  const handleSpecsFieldChange = (field: string, value: string, maxLength?: number) => {
    const error = validateField(field, value, maxLength);
    setErrors(prev => ({
      ...prev,
      [`specs.${field}`]: error
    }));
    
    onSpecsFieldChange(field, value);
  };

  const renderFieldError = (fieldName: string) => {
    const error = errors[fieldName];
    if (!error) return null;
    
    return (
      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    );
  };
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-4">
        <h3 className="font-semibold text-base sm:text-lg text-stakerpol-navy">Informacje podstawowe</h3>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Model <span className="text-destructive">*</span>
          </label>
          <Input 
            value={product.model} 
            onChange={(e) => handleFieldChange('model', e.target.value, 100)}
            placeholder="np. BT Toyota SWE200D"
            className={`w-full ${errors.model ? 'border-destructive' : ''}`}
            maxLength={100}
          />
          {renderFieldError('model')}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Krótki opis
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (maks. 300 znaków)
            </span>
          </label>
          <Textarea 
            value={product.shortDescription} 
            onChange={(e) => handleFieldChange('shortDescription', e.target.value, 300)}
            placeholder="Krótki opis produktu dla klientów"
            rows={3}
            className={`w-full ${errors.shortDescription ? 'border-destructive' : ''}`}
            maxLength={300}
          />
          <div className="flex justify-between items-center mt-1">
            {renderFieldError('shortDescription')}
            <span className="text-xs text-muted-foreground">
              {product.shortDescription.length}/300
            </span>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="main" className="space-y-4">
        <TabsList className={`grid w-full ${FEATURES.PRODUCT_FAQ ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="main">Sekcja główna</TabsTrigger>
          <TabsTrigger value="extended">Sekcja rozwijana</TabsTrigger>
          {FEATURES.PRODUCT_FAQ && <TabsTrigger value="faq"><HelpCircle className="h-4 w-4 mr-1" />FAQ</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="main" className="space-y-4">
          <h3 className="font-semibold text-base sm:text-lg text-stakerpol-navy">Sekcja główna (zawsze widoczna)</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Numer seryjny</label>
              <Input 
                value={product.specs.serialNumber || ''} 
                onChange={(e) => onSpecsFieldChange('serialNumber', e.target.value)} 
                placeholder="ABC123456"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Rok produkcji</label>
              <Input 
                value={product.specs.productionYear} 
                onChange={(e) => onSpecsFieldChange('productionYear', e.target.value)} 
                placeholder="2023"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Udźwig przy podnoszeniu masztu [kg]</label>
              <Input 
                value={product.specs.mastLiftingCapacity || product.specs.capacity || ''} 
                onChange={(e) => onSpecsFieldChange('mastLiftingCapacity', e.target.value)} 
                placeholder="2000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Udźwig przy podnoszeniu wstępnym [kg]</label>
              <Input 
                value={product.specs.preliminaryLiftingCapacity || ''} 
                onChange={(e) => onSpecsFieldChange('preliminaryLiftingCapacity', e.target.value)} 
                placeholder="1800"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Godziny pracy [mh]</label>
              <Input 
                value={product.specs.workingHours} 
                onChange={(e) => onSpecsFieldChange('workingHours', e.target.value)} 
                placeholder="3200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Wysokość podnoszenia [mm]</label>
              <Input 
                value={product.specs.liftHeight} 
                onChange={(e) => onSpecsFieldChange('liftHeight', e.target.value)} 
                placeholder="1600"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Wysokość konstrukcyjna [mm]</label>
              <Input 
                value={product.specs.minHeight} 
                onChange={(e) => onSpecsFieldChange('minHeight', e.target.value)} 
                placeholder="85"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Wstępne podnoszenie</label>
              <Input 
                value={product.specs.preliminaryLifting} 
                onChange={(e) => onSpecsFieldChange('preliminaryLifting', e.target.value)} 
                placeholder="120 mm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Bateria</label>
              <Input 
                value={product.specs.battery} 
                onChange={(e) => onSpecsFieldChange('battery', e.target.value)} 
                placeholder="48V 120Ah z ładowarką 230V"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Stan</label>
              <Input 
                value={product.specs.condition} 
                onChange={(e) => onSpecsFieldChange('condition', e.target.value)} 
                placeholder="Bardzo dobry"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="extended" className="space-y-4">
          <h3 className="font-semibold text-base sm:text-lg text-stakerpol-navy">Sekcja rozwijana</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Rodzaj napędu</label>
              <Input 
                value={product.specs.driveType} 
                onChange={(e) => onSpecsFieldChange('driveType', e.target.value)} 
                placeholder="Elektryczny"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Maszt</label>
              <Input 
                value={product.specs.mast} 
                onChange={(e) => onSpecsFieldChange('mast', e.target.value)} 
                placeholder="Duplex"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Wolny skok [mm]</label>
              <Input 
                value={product.specs.freeStroke} 
                onChange={(e) => onSpecsFieldChange('freeStroke', e.target.value)} 
                placeholder="150"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Wymiary (długość / szerokość) [mm]</label>
              <Input 
                value={product.specs.dimensions} 
                onChange={(e) => onSpecsFieldChange('dimensions', e.target.value)} 
                placeholder="1900/720"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Koła</label>
              <Input 
                value={product.specs.wheels} 
                onChange={(e) => onSpecsFieldChange('wheels', e.target.value)} 
                placeholder="Poliuretan"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Składany podest dla operatora</label>
              <Input 
                value={product.specs.operatorPlatform} 
                onChange={(e) => onSpecsFieldChange('operatorPlatform', e.target.value)} 
                placeholder="Tak/Nie"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Opcje dodatkowe</label>
              <Input 
                value={product.specs.additionalOptions} 
                onChange={(e) => onSpecsFieldChange('additionalOptions', e.target.value)} 
                placeholder="Platforma operatora, czujniki"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Opis dodatkowy
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (maks. 1000 znaków)
                </span>
              </label>
              <Textarea 
                value={product.specs.additionalDescription} 
                onChange={(e) => handleSpecsFieldChange('additionalDescription', e.target.value, 1000)}
                placeholder="Szczegółowy opis dodatkowy produktu. Tekst będzie automatycznie dopasowywany do szerokości okna."
                rows={4}
                className={`w-full ${errors['specs.additionalDescription'] ? 'border-destructive' : ''}`}
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-1">
                {renderFieldError('specs.additionalDescription')}
                <span className="text-xs text-muted-foreground">
                  {(product.specs.additionalDescription || '').length}/1000
                </span>
              </div>
            </div>
          </div>
        </TabsContent>
        {FEATURES.PRODUCT_FAQ && (
          <TabsContent value="faq" className="space-y-4">
            <h3 className="font-semibold text-base sm:text-lg text-stakerpol-navy">FAQ przypisane do produktu (max 4)</h3>
            
            <div className="flex gap-2 mb-4">
              {['pl', 'en', 'de', 'cs', 'sk'].map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setFaqLang(lang)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    faqLang === lang 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {availableFaqs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak FAQ w języku {faqLang.toUpperCase()}. Dodaj FAQ w panelu FAQ.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {availableFaqs.map(faq => {
                  const isSelected = selectedFaqIds.includes(faq.id);
                  const isDisabled = !isSelected && selectedFaqIds.length >= 4;
                  return (
                    <label
                      key={faq.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onCheckedChange={(checked) => {
                          const newIds = checked
                            ? [...selectedFaqIds, faq.id]
                            : selectedFaqIds.filter(id => id !== faq.id);
                          onFieldChange('faqIds', newIds);
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{faq.question}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Zaznaczono: {selectedFaqIds.length}/4. Jeśli brak zaznaczonych — wyświetlą się losowe FAQ.
            </p>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ProductForm;

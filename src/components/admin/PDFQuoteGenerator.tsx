
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUp } from 'lucide-react';
import { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { generatePDFQuote } from '@/utils/pdfGenerator';

interface PDFQuoteGeneratorProps {
  product: Product;
}

const PDFQuoteGenerator = ({ product }: PDFQuoteGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Dane cenowe
  const [netPrice, setNetPrice] = useState('');
  const [transportPrice, setTransportPrice] = useState('');
  
  // Dane klienta
  const [clientName, setClientName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Nowe pola biznesowe
  const [paymentMethod, setPaymentMethod] = useState('');
  const [leasingAvailable, setLeasingAvailable] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    // Sprawdź czy przynajmniej jedno pole jest wypełnione
    const hasAnyData = netPrice || transportPrice || clientName || companyName || 
                      email || phone || address || paymentMethod || leasingAvailable || additionalNotes;
    
    if (!hasAnyData) {
      toast({
        title: "Informacja",
        description: "Wypełnij przynajmniej jedno pole aby wygenerować ofertę",
        variant: "destructive"
      });
      return;
    }

    // Walidacja cen jeśli są wypełnione
    if (netPrice && (isNaN(Number(netPrice)) || Number(netPrice) <= 0)) {
      toast({
        title: "Błąd walidacji",
        description: "Cena netto musi być poprawną liczbą większą od 0",
        variant: "destructive"
      });
      return;
    }

    if (transportPrice && (isNaN(Number(transportPrice)) || Number(transportPrice) < 0)) {
      toast({
        title: "Błąd walidacji",
        description: "Cena transportu musi być poprawną liczbą większą lub równą 0",
        variant: "destructive"
      });
      return;
    }

    // Walidacja emaila jeśli jest wypełniony
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Błąd walidacji",
        description: "Podaj poprawny adres e-mail",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      await generatePDFQuote({
        product,
        netPrice: netPrice ? Number(netPrice) : undefined,
        transportPrice: transportPrice ? Number(transportPrice) : undefined,
        clientName: clientName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        paymentMethod: paymentMethod || undefined,
        leasingAvailable: leasingAvailable || undefined,
        additionalNotes: additionalNotes.trim() || undefined
      });

      toast({
        title: "Sukces!",
        description: "Profesjonalna oferta PDF została wygenerowana i pobrana",
      });

      // Reset formularza i zamknij dialog
      setNetPrice('');
      setTransportPrice('');
      setClientName('');
      setCompanyName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setPaymentMethod('');
      setLeasingAvailable(false);
      setAdditionalNotes('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Błąd generowania PDF",
        description: "Nie udało się wygenerować oferty PDF",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-blue-600 border-blue-200 hover:bg-blue-50 px-2 sm:px-3"
          title="Wygeneruj profesjonalną ofertę PDF"
        >
          <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl mx-4 w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-stakerpol-navy text-base sm:text-lg">
            Generuj profesjonalną ofertę PDF
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            {product.model}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Wszystkie pola są opcjonalne. Wypełnij tylko te informacje, które chcesz umieścić w ofercie.
          </p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Sekcja: Dane klienta */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stakerpol-navy border-b pb-2 flex items-center gap-2">
              👤 Dane klienta (opcjonalne)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-sm">Imię i nazwisko</Label>
                <Input
                  id="clientName"
                  type="text"
                  placeholder="np. Jan Kowalski"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm">Nazwa firmy</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="np. Firma ABC Sp. z o.o."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="np. klient@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="np. +48 123 456 789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm">Adres</Label>
              <Textarea
                id="address"
                placeholder="np. ul. Przykładowa 123&#10;00-000 Warszawa"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Sekcja: Warunki handlowe */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stakerpol-navy border-b pb-2 flex items-center gap-2">
              💰 Warunki handlowe (opcjonalne)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="netPrice" className="text-sm">Cena netto (PLN)</Label>
                <Input
                  id="netPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="np. 25000.00"
                  value={netPrice}
                  onChange={(e) => setNetPrice(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transportPrice" className="text-sm">Cena transportu (PLN)</Label>
                <Input
                  id="transportPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="np. 500.00"
                  value={transportPrice}
                  onChange={(e) => setTransportPrice(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="text-sm">Forma płatności</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz formę płatności" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="przedplata">Przedpłata 100%</SelectItem>
                    <SelectItem value="przelew">Przelew tradycyjny</SelectItem>
                    <SelectItem value="leasing">Leasing</SelectItem>
                    <SelectItem value="raty">Płatność ratalna</SelectItem>
                    <SelectItem value="negocjacja">Do negocjacji</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="leasing" 
                    checked={leasingAvailable}
                    onCheckedChange={(checked) => setLeasingAvailable(checked as boolean)}
                  />
                  <Label htmlFor="leasing" className="text-sm">Leasing możliwy</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Sekcja: Uwagi dodatkowe */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-stakerpol-navy border-b pb-2 flex items-center gap-2">
              📝 Uwagi dodatkowe (opcjonalne)
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="additionalNotes" className="text-sm">Dodatkowe informacje</Label>
              <Textarea
                id="additionalNotes"
                placeholder="np. Specjalne warunki, terminy dostawy, gwarancje..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Przyciski akcji */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isGenerating}
              className="w-full sm:w-auto"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="cta-button w-full sm:w-auto"
            >
              {isGenerating ? 'Generowanie...' : 'Wygeneruj profesjonalną ofertę PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFQuoteGenerator;

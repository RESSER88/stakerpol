
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
      <DialogContent className="sm:max-w-2xl mx-4 w-[calc(100vw-2rem)] sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 [&>button]:h-11 [&>button]:w-11 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:right-2 [&>button]:top-2">
        <DialogHeader className="space-y-1 pr-8">
          <DialogTitle className="text-stakerpol-navy text-lg sm:text-xl font-semibold">
            Generuj ofertę PDF
          </DialogTitle>
          <p className="text-sm font-medium text-muted-foreground">
            {product.model}
          </p>
          <p className="text-xs text-muted-foreground">
            Wszystkie pola są opcjonalne. Wypełnij tylko te informacje, które chcesz umieścić w ofercie.
          </p>
        </DialogHeader>
        
        <div className="space-y-5 py-3">
          {/* Sekcja: Dane klienta */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1.5">
              Dane klienta (opcjonalne)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="clientName" className="text-xs font-medium">Imię i nazwisko</Label>
                <Input
                  id="clientName"
                  type="text"
                  placeholder="np. Jan Kowalski"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="companyName" className="text-xs font-medium">Nazwa firmy</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="np. Firma ABC Sp. z o.o."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-medium">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="np. klient@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-medium">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="np. +48 123 456 789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs font-medium">Adres</Label>
              <Textarea
                id="address"
                placeholder="np. ul. Przykładowa 123&#10;00-000 Warszawa"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full resize-none text-sm min-h-0"
                rows={2}
              />
            </div>
          </div>

          {/* Sekcja: Warunki handlowe */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1.5">
              Warunki handlowe (opcjonalne)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="netPrice" className="text-xs font-medium">Cena netto (PLN)</Label>
                <Input
                  id="netPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="np. 25000.00"
                  value={netPrice}
                  onChange={(e) => setNetPrice(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="transportPrice" className="text-xs font-medium">Cena transportu (PLN)</Label>
                <Input
                  id="transportPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="np. 500.00"
                  value={transportPrice}
                  onChange={(e) => setTransportPrice(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="paymentMethod" className="text-xs font-medium">Forma płatności</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-9 text-sm">
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
              <div className="flex items-end h-9">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="leasing" 
                    checked={leasingAvailable}
                    onCheckedChange={(checked) => setLeasingAvailable(checked as boolean)}
                  />
                  <Label htmlFor="leasing" className="text-xs font-medium">Leasing możliwy</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Sekcja: Uwagi dodatkowe */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1.5">
              Uwagi dodatkowe (opcjonalne)
            </h3>
            
            <div className="space-y-1">
              <Label htmlFor="additionalNotes" className="text-xs font-medium">Dodatkowe informacje</Label>
              <Textarea
                id="additionalNotes"
                placeholder="np. Specjalne warunki, terminy dostawy, gwarancje..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full resize-none text-sm min-h-0"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Sticky przyciski akcji */}
        <div className="sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background border-t border-border flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(false)}
            disabled={isGenerating}
            className="h-9"
          >
            Anuluj
          </Button>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="h-9 bg-stakerpol-navy hover:bg-stakerpol-navy/90 text-white"
          >
            {isGenerating ? 'Generowanie...' : 'Generuj PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFQuoteGenerator;

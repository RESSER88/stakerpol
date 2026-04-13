
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Mail, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { supabase } from '@/integrations/supabase/client';
import { trackFormSubmit, trackEmailClick } from '@/utils/analytics';

interface PriceInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const PriceInquiryModal = ({ isOpen, onClose, product }: PriceInquiryModalProps) => {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateEmailContent = () => {
    const productDetails = [
      `${t('model')}: ${product.model}`,
      product.specs.productionYear && `${t('productionYear')}: ${product.specs.productionYear}`,
      product.specs.serialNumber && `${t('serialNumber')}: ${product.specs.serialNumber}`
    ].filter(Boolean).join('\n');

    const phoneInfo = phoneNumber ? `\n${t('yourPhone')}: ${phoneNumber}` : '';

    const messages = {
      pl: `Witam,

jestem zainteresowany produktem:

${productDetails}

Proszę o przesłanie oferty cenowej oraz informacji o dostępności.${phoneInfo}

Pozdrawiam`,
      en: `Hello,

I am interested in the product:

${productDetails}

Please send me a price quote and availability information.${phoneInfo}

Best regards`,
      cs: `Dobrý den,

zajímám se o produkt:

${productDetails}

Prosím o zaslání cenové nabídky a informací o dostupnosti.${phoneInfo}

S pozdravem`,
      sk: `Dobrý deň,

zaujímam sa o produkt:

${productDetails}

Prosím o zaslanie cenovej ponuky a informácií o dostupnosti.${phoneInfo}

S pozdravom`,
      de: `Hallo,

ich interessiere mich für das Produkt:

${productDetails}

Bitte senden Sie mir ein Preisangebot und Verfügbarkeitsinformationen.${phoneInfo}

Mit freundlichen Grüßen`
    };

    const polishVersion = language !== 'pl' ? `

---

Wersja w języku polskim:

Witam,

jestem zainteresowany produktem:

${productDetails}

Proszę o przesłanie oferty cenowej oraz informacji o dostępności.${phoneInfo}

Pozdrawiam` : '';

    return messages[language] + polishVersion;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone.trim()) return true; // Optional field
    
    // Basic phone validation - allows +48 format, spaces, dashes
    const phoneRegex = /^(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateForm = (): boolean => {
    setPhoneError('');

    if (!privacyAccepted) {
      toast({
        title: t('validationError'),
        description: t('privacyPolicyRequired'),
        variant: "destructive"
      });
      return false;
    }

    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      setPhoneError(t('phoneValidationError'));
      return false;
    }

    return true;
  };

  const handleEmailRedirect = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const subject = encodeURIComponent(`${t('priceInquiry')} - ${product.model}`);
    const body = encodeURIComponent(generateEmailContent());
    const mailtoLink = `mailto:info@stakerpol.pl?subject=${subject}&body=${body}`;

    // Prepare lead payload
    const isUuid = /^[0-9a-f-]{36}$/i.test(product.id);
    const leadPayload = {
      product_id: isUuid ? product.id : undefined,
      product_model: product.model,
      production_year: product.specs?.productionYear || null,
      serial_number: product.specs?.serialNumber || null,
      phone: phoneNumber || null,
      language,
      message: decodeURIComponent(body),
      page_url: typeof window !== 'undefined' ? window.location.href : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    } as const;

    try {
      // Save to DB
      const { data, error } = await supabase
        .from('price_inquiries')
        .insert(leadPayload as any)
        .select('id')
        .maybeSingle();

      // Fire notification (email/webhook)
      await supabase.functions.invoke('notify-lead', {
        body: { ...leadPayload, id: data?.id },
      });
    } catch (e) {
      console.warn('Lead save/notify failed (continuing with mailto):', e);
    }

    // Track analytics events
    trackFormSubmit('price_inquiry', product.model);
    trackEmailClick('price_inquiry_modal');

    // Always open email client
    window.location.href = mailtoLink;

    toast({
      title: t('success'),
      description: `${t('emailRedirectSuccess')} ${t('responseTime24h')}`,
      variant: "default"
    });

    setIsSubmitting(false);
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('askForPrice')}
          </DialogTitle>
          <DialogDescription>
            {t('emailRedirectDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">{t('productModel')}:</h4>
            <p className="text-sm">{product.model}</p>
            {product.specs.productionYear && (
              <p className="text-sm mt-1">{t('productionYear')}: {product.specs.productionYear}</p>
            )}
            {product.specs.serialNumber && (
              <p className="text-sm mt-1">{t('serialNumber')}: {product.specs.serialNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              {t('phoneNumberOptional')}
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder={t('phoneNumberPlaceholder')}
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (phoneError) setPhoneError('');
              }}
              className={phoneError ? 'border-destructive' : ''}
            />
            {phoneError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {phoneError}
              </p>
            )}
          </div>

          <Alert variant="info" className="border-blue-200">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t('privacyNotice')}
            </AlertDescription>
          </Alert>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
              className="mt-1"
            />
            <label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
              {t('privacyPolicyAccept')} <span className="text-destructive">*</span>
            </label>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">{t('email')}:</h4>
            <p className="text-sm font-mono">info@stakerpol.pl</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleEmailRedirect}
              className="flex-1"
              disabled={!privacyAccepted || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {t('openEmailClient')}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PriceInquiryModal;

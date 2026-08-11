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
import { Mail, AlertCircle, Shield, Send } from 'lucide-react';
import { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/utils/translations';
import { useLeadSubmit } from '@/hooks/useLeadSubmit';
import { ROUTES } from '@/config/routes';

interface PriceInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Kontekst produktu — opcjonalny, gdy zapytanie dotyczy całej listy. */
  product?: Product;
}

const PriceInquiryModal = ({ isOpen, onClose, product }: PriceInquiryModalProps) => {
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { submit, isSubmitting, error, clearError } = useLeadSubmit();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Product context is stored as a readable prefix in leads.message,
  // since the leads table has no dedicated model/year/serial columns.
  const buildMessage = () => {
    const details = [
      product?.model && `Model: ${product.model}`,
      product?.specs?.productionYear && `Rocznik: ${product.specs.productionYear}`,
      product?.specs?.serialNumber && `Nr seryjny: ${product.specs.serialNumber}`,
    ]
      .filter(Boolean)
      .join(' | ');

    return `[Zapytanie o cenę — FAQ] ${details}`;
  };

  const handleSubmit = async () => {
    // Honeypot: silently block bots
    if (honeypot) return;

    setConsentError('');
    if (!privacyAccepted) {
      setConsentError(t('privacyPolicyRequired'));
      return;
    }

    const isUuid = !!product && /^[0-9a-f-]{36}$/i.test(product.id);
    const ok = await submit(phoneNumber, isUuid ? product!.id : undefined, {
      source: 'faq_price_inquiry',
      message: buildMessage(),
      rodoAccepted: true,
      formLabel: 'price_inquiry',
      productModel: product?.model,
      successTitle: '✅ Dziękujemy!',
      successDescription: 'Zapytanie zostało wysłane. Odpowiemy w ciągu 24 godzin.',
    });

    if (ok) {
      setPhoneNumber('');
      setPrivacyAccepted(false);
      onClose();
    }
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
            Zostaw numer telefonu — przygotujemy ofertę cenową i informację o dostępności.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
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
              Numer telefonu <span className="text-destructive">*</span>
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="+48 ___ ___ ___"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (error) clearError();
              }}
              className={error ? 'border-destructive' : ''}
              disabled={isSubmitting}
            />
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          {/* Honeypot */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none', position: 'absolute', left: '-9999px' }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          <Alert variant="info" className="border-blue-200">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {t('privacyNotice')}
            </AlertDescription>
          </Alert>

          <div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="privacy"
                checked={privacyAccepted}
                onCheckedChange={(checked) => {
                  setPrivacyAccepted(checked as boolean);
                  if (checked) setConsentError('');
                }}
                className="mt-1"
                disabled={isSubmitting}
              />
              <label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                Akceptuję{' '}
                <a
                  href={ROUTES.privacy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stakerpol-orange underline"
                >
                  politykę prywatności
                </a>{' '}
                <span className="text-destructive">*</span>
              </label>
            </div>
            {consentError && (
              <p className="text-sm text-destructive mt-1 ml-6">{consentError}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Wyślij zapytanie
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

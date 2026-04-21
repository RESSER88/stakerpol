import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface ConsentState {
  analytics: boolean;
  ads: boolean;
  functional: boolean;
}

const STORAGE_KEY = 'cookie-consent-v1';

const CookieConsent = () => {
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({ analytics: false, ads: false, functional: true });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        setOpen(true);
      } else {
        const parsed: ConsentState = JSON.parse(saved);
        setConsent(parsed);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const updateConsent = (next: ConsentState) => {
    // Consent Mode v2 update
    const payload: Record<string, 'granted' | 'denied'> = {
      analytics_storage: next.analytics ? 'granted' : 'denied',
      ad_storage: next.ads ? 'granted' : 'denied',
      functionality_storage: next.functional ? 'granted' : 'denied',
      security_storage: 'granted',
      ad_user_data: next.ads ? 'granted' : 'denied',
      ad_personalization: next.ads ? 'granted' : 'denied',
    };

    try {
      // @ts-ignore
      window.gtag?.('consent', 'update', payload);
    } catch {}

    // Microsoft Clarity — start/stop based on analytics consent
    try {
      if (next.analytics) {
        window.dispatchEvent(new Event('clarity-consent-granted'));
      } else {
        // @ts-ignore
        window.clarity?.('stop');
      }
    } catch {}

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const onAcceptAll = () => {
    const next = { analytics: true, ads: true, functional: true };
    setConsent(next);
    updateConsent(next);
    setOpen(false);
  };

  const onRejectAll = () => {
    const next = { analytics: false, ads: false, functional: false };
    setConsent(next);
    updateConsent(next);
    setOpen(false);
  };

  const onSave = () => {
    updateConsent(consent);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <Card className="max-w-3xl mx-auto p-4 md:p-6 shadow-lg">
        <div className="md:flex md:items-start md:justify-between gap-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Zgody na pliki cookie</h3>
            <p className="text-sm text-muted-foreground">
              Używamy plików cookie do celów analitycznych i reklamowych. Możesz zarządzać zgodami zgodnie z RODO (Consent Mode v2).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={true} disabled />
                Niezbędne
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={consent.analytics} onCheckedChange={(v) => setConsent((c) => ({ ...c, analytics: Boolean(v) }))} />
                Analityczne
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={consent.ads} onCheckedChange={(v) => setConsent((c) => ({ ...c, ads: Boolean(v) }))} />
                Reklamowe
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={consent.functional} onCheckedChange={(v) => setConsent((c) => ({ ...c, functional: Boolean(v) }))} />
                Funkcjonalne
              </label>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-stretch gap-2">
            <Button variant="outline" onClick={onRejectAll}>Odrzuć</Button>
            <Button variant="secondary" onClick={onSave}>Zapisz wybór</Button>
            <Button onClick={onAcceptAll}>Akceptuj wszystkie</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CookieConsent;

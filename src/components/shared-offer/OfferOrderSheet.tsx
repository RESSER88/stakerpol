import { useEffect, useState } from 'react';
import { Check, Loader2, Phone, ShoppingCart, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ExportRow, formatPrice } from '@/utils/exportListModel';
import { COMPANY_PHONE_TEL } from '@/lib/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

interface Props {
  row: ExportRow | null;
  image?: string;
  onClose: () => void;
}

const dash = (v: unknown) => {
  const s = String(v ?? '').trim();
  return s === '' || s === '—' || s === '-' ? '—' : s;
};

const metric = (value: string) => {
  const v = dash(value);
  return v === '—' ? v : v.replace('.', ',').replace(/(\d)(kg|m|Ah)\b/i, '$1 $2');
};

const priceLine = (row: ExportRow) =>
  row.showPrice ? `${formatPrice(row.netPrice)} ${row.priceCurrency} netto` : 'Cena na zapytanie';

const shortPrice = (row: ExportRow) => {
  if (!row.showPrice) return 'Cena na zapytanie';
  const label = row.priceCurrency === 'PLN' ? 'zł' : row.priceCurrency;
  return `${new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(row.netPrice)} ${label} netto`;
};

const Field = ({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-semibold text-stakerpol-navy">
      {label}
      {required && <span className="text-stakerpol-orange"> *</span>}
    </span>
    {children}
    {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
  </label>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-gray-200 px-4 py-5">
    <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>
);

const inputCls = 'h-12 text-base';

/** Mobilny formularz zamówienia konkretnej maszyny z oferty. */
const OfferOrderSheet = ({ row, image, onClose }: Props) => {
  const [company, setCompany] = useState('');
  const [nip, setNip] = useState('');
  const [invoiceAddress, setInvoiceAddress] = useState('');
  const [sameAddress, setSameAddress] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [optWheels, setOptWheels] = useState(false);
  const [optBattery, setOptBattery] = useState(false);
  const [optUdt, setOptUdt] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');

  useEffect(() => {
    if (!row) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [row]);

  if (!row) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!company.trim()) next.company = 'Podaj nazwę firmy lub imię i nazwisko';
    if (!invoiceAddress.trim()) next.invoiceAddress = 'Podaj adres';
    if (!sameAddress && !shippingAddress.trim()) next.shippingAddress = 'Podaj adres dostawy';
    if (!name.trim()) next.name = 'Podaj imię i nazwisko';
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) next.phone = 'Podaj poprawny numer telefonu';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = 'Podaj poprawny adres e-mail';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (sending) return;
    if (!validate()) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('notify-lead', {
        body: {
          kind: 'offer_order',
          product: {
            model: row.model,
            productionYear: String(row.productionYear || ''),
            serialNumber: row.serialNumber,
            workingHours: row.workingHours ? `${row.workingHours} mth` : '',
            minHeight: metric(row.minHeight),
            liftHeight: metric(row.liftHeight),
            battery: metric(row.battery),
            price: priceLine(row),
            productUrl: row.productUrl,
          },
          invoice: { company: company.trim(), nip: nip.trim(), address: invoiceAddress.trim() },
          shipping: {
            sameAsInvoice: sameAddress,
            address: sameAddress ? '' : shippingAddress.trim(),
          },
          contact: { name: name.trim(), phone: phone.trim(), email: email.trim() },
          options: { wheels: optWheels, battery: optBattery, udt: optUdt },
          notes: notes.trim(),
        },
      });
      if (error || data?.ok !== true) throw error || new Error('order failed');
      setStatus('success');
    } catch (e) {
      logger.warn('offer order failed');
      setStatus('error');
    } finally {
      setSending(false);
    }
  };

  const selectedOptions = [
    optWheels && 'Nowe koła',
    optBattery && 'Nowa bateria',
    optUdt && 'Przygotowanie i wykonanie badań przez UDT',
  ].filter(Boolean) as string[];

  const detailLine = [
    row.productionYear ? String(row.productionYear) : null,
    row.serialNumber || null,
    row.workingHours ? `${row.workingHours} mth` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <h2 className="min-w-0 flex-1 text-base font-bold text-stakerpol-navy">
          {status === 'success' ? 'Zamówienie przesłane' : 'Zamawiam ten wózek'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij formularz zamówienia"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-stakerpol-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-stakerpol-orange"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      {status === 'success' ? (
        <div className="flex-1 overflow-y-auto px-6 py-10 text-center">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check className="h-9 w-9" />
          </span>
          <h3 className="mt-5 text-xl font-bold text-stakerpol-navy">
            Twoje zamówienie zostało przesłane
          </h3>
          <div className="mt-5 space-y-1 text-sm text-gray-700">
            <p className="text-base font-bold text-stakerpol-navy">{row.model}</p>
            {row.serialNumber && <p>Nr seryjny: {row.serialNumber}</p>}
            {row.productionYear && <p>Rok produkcji: {row.productionYear}</p>}
          </div>
          <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-gray-700">
            Otrzymaliśmy Twoje zamówienie. W ciągu 24 godzin skontaktujemy się z Tobą telefonicznie,
            aby potwierdzić szczegóły zamówienia.
          </p>
          <Button
            onClick={onClose}
            className="mt-8 min-h-[48px] w-full bg-stakerpol-navy font-bold text-white hover:bg-stakerpol-navy/90"
          >
            Wróć do oferty
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto overscroll-contain pb-4">
            {/* Wybrana maszyna — bez możliwości zmiany */}
            <div className="flex items-start gap-3 px-4 py-4">
              {image ? (
                <img
                  src={image}
                  alt=""
                  aria-hidden="true"
                  className="h-20 w-20 shrink-0 rounded-md bg-gray-100 object-cover"
                />
              ) : (
                <span className="h-20 w-20 shrink-0 rounded-md bg-gray-100" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <p className="text-base font-bold text-stakerpol-navy">{row.model}</p>
                <p className="mt-0.5 text-xs text-gray-600">{detailLine}</p>
                <p className="mt-2 text-sm font-bold text-stakerpol-navy">{shortPrice(row)}</p>
              </div>
            </div>

            {status === 'error' && (
              <div className="mx-4 mb-2 rounded-md border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  Nie udało się wysłać zamówienia.
                </p>
                <p className="mt-1 text-sm text-red-700">
                  Spróbuj ponownie lub skontaktuj się z nami telefonicznie.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      setStatus('form');
                      void submit();
                    }}
                    className="min-h-[48px] bg-stakerpol-orange font-bold text-white hover:bg-stakerpol-orange/90"
                  >
                    Spróbuj ponownie
                  </Button>
                  <Button asChild variant="outline" className="min-h-[48px] border-stakerpol-navy text-stakerpol-navy">
                    <a href={`tel:${COMPANY_PHONE_TEL}`}>
                      <Phone aria-hidden="true" />
                      Zadzwoń
                    </a>
                  </Button>
                </div>
              </div>
            )}

            <Section title="Dane do faktury">
              <Field label="Nazwa firmy / imię i nazwisko" required error={errors.company}>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  maxLength={200}
                  autoComplete="organization"
                  className={inputCls}
                />
              </Field>
              <Field label="NIP" error={errors.nip}>
                <Input
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  inputMode="numeric"
                  maxLength={20}
                  className={inputCls}
                />
              </Field>
              <Field label="Adres" required error={errors.invoiceAddress}>
                <Textarea
                  value={invoiceAddress}
                  onChange={(e) => setInvoiceAddress(e.target.value)}
                  rows={3}
                  maxLength={400}
                  className="text-base"
                />
              </Field>
            </Section>

            <Section title="Adres wysyłki">
              <label className="flex items-center gap-3">
                <Checkbox
                  checked={sameAddress}
                  onCheckedChange={(v) => setSameAddress(v === true)}
                  className="h-6 w-6"
                />
                <span className="text-sm text-stakerpol-navy">Taki sam jak adres do faktury</span>
              </label>
              {!sameAddress && (
                <Field label="Adres dostawy" required error={errors.shippingAddress}>
                  <Textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    rows={3}
                    maxLength={400}
                    className="text-base"
                  />
                </Field>
              )}
            </Section>

            <Section title="Osoba kontaktowa">
              <Field label="Imię i nazwisko" required error={errors.name}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  autoComplete="name"
                  className={inputCls}
                />
              </Field>
              <Field label="Telefon" required error={errors.phone}>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  inputMode="tel"
                  maxLength={20}
                  autoComplete="tel"
                  className={inputCls}
                />
              </Field>
              <Field label="E-mail" required error={errors.email}>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  inputMode="email"
                  maxLength={255}
                  autoComplete="email"
                  className={inputCls}
                />
              </Field>
            </Section>

            <Section title="Dodatkowe opcje — do wyceny">
              {[
                { label: 'Nowe koła', value: optWheels, set: setOptWheels },
                { label: 'Nowa bateria', value: optBattery, set: setOptBattery },
                {
                  label: 'Przygotowanie i wykonanie badań przez Urząd Dozoru Technicznego UDT',
                  value: optUdt,
                  set: setOptUdt,
                },
              ].map((opt) => (
                <label key={opt.label} className="flex items-start gap-3 py-1">
                  <Checkbox
                    checked={opt.value}
                    onCheckedChange={(v) => opt.set(v === true)}
                    className="mt-0.5 h-6 w-6 shrink-0"
                  />
                  <span className="text-sm leading-snug text-stakerpol-navy">{opt.label}</span>
                </label>
              ))}
            </Section>

            <Section title="Uwagi">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Np. dodatkowe informacje dotyczące zamówienia..."
                className="text-base"
              />
            </Section>

            <div className="border-t border-gray-200 bg-gray-50 px-4 py-5">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                Zamawiana maszyna
              </h3>
              <p className="text-base font-bold text-stakerpol-navy">{row.model}</p>
              <p className="mt-0.5 text-xs text-gray-600">{detailLine}</p>
              <p className="mt-2 text-sm font-bold text-stakerpol-navy">{shortPrice(row)}</p>
              {selectedOptions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-700">Dodatkowe opcje:</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-gray-700">
                    {selectedOptions.map((o) => (
                      <li key={o}>• {o}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              onClick={submit}
              disabled={sending}
              className={cn(
                'min-h-[52px] w-full bg-stakerpol-orange text-base font-bold text-white hover:bg-stakerpol-orange/90'
              )}
            >
              {sending ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Wysyłanie zamówienia...
                </>
              ) : (
                <>
                  <ShoppingCart aria-hidden="true" />
                  Zamawiam ten wózek
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default OfferOrderSheet;

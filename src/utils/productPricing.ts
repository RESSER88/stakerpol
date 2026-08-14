import { Product } from '@/types';

/**
 * Jedno źródło decyzji o prezentacji ceny egzemplarza.
 * Korzystają z niego: ProductPriceBlock (UI), ProductCTAButtons (etykieta CTA)
 * oraz generateProductSchema (offers.price / offers.priceCurrency).
 *
 * Źródło danych: net_price, price_currency, price_display_mode, leasing_monthly_from_pln
 * (zmapowane w src/types/supabase.ts na netPrice, priceCurrency, priceDisplayMode, leasingMonthlyFromPln).
 */
export interface PriceView {
  /** true tylko gdy tryb prezentacji ujawnia cenę i cena jest liczbą > 0 */
  hasPublicPrice: boolean;
  /** wartość netto (liczba) lub null, gdy cena nie jest publiczna */
  netPrice: number | null;
  currency: string;
  /** sformatowana cena netto lub null */
  formattedPrice: string | null;
  hasLeasing: boolean;
  leasingMonthly: number | null;
  formattedLeasing: string | null;
}

const toNumber = (v: unknown): number => {
  if (v == null || v === '') return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

export const resolvePriceView = (product: Product | Record<string, any>): PriceView => {
  const p = product as any;

  const mode = p?.priceDisplayMode as string | null | undefined;
  const netRaw = toNumber(p?.netPrice);
  const currency = (p?.priceCurrency as string | null | undefined) || 'PLN';

  const hasPublicPrice = mode === 'show_price' && Number.isFinite(netRaw) && netRaw > 0;

  const leasingRaw = toNumber(p?.leasingMonthlyFromPln);
  const hasLeasing = Number.isFinite(leasingRaw) && leasingRaw > 0;

  return {
    hasPublicPrice,
    netPrice: hasPublicPrice ? netRaw : null,
    currency,
    formattedPrice: hasPublicPrice
      ? `${new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(netRaw)} ${currency}`
      : null,
    hasLeasing,
    leasingMonthly: hasLeasing ? leasingRaw : null,
    formattedLeasing: hasLeasing
      ? `~ ${new Intl.NumberFormat('pl-PL').format(leasingRaw)} zł/mies.`
      : null,
  };
};

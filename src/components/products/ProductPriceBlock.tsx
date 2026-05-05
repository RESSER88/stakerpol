import { Product } from '@/types';

interface Props {
  product: Product;
}

const formatPL = (n: number) => new Intl.NumberFormat('pl-PL').format(n);

const formatPrice = (value: number | string, currency?: string | null) => {
  return (
    new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 }).format(Number(value)) +
    ' ' +
    (currency || 'PLN')
  );
};

const ProductPriceBlock = ({ product }: Props) => {
  const leasing = (product as any).leasingMonthlyFromPln;
  const hasLeasing = leasing != null && Number(leasing) > 0;

  const priceDisplayMode = (product as any).priceDisplayMode as string | undefined;
  const netPrice = (product as any).netPrice as number | string | null | undefined;
  const priceCurrency = (product as any).priceCurrency as string | null | undefined;

  const showPrice =
    priceDisplayMode === 'show_price' &&
    netPrice != null &&
    netPrice !== '' &&
    Number(netPrice) > 0;

  return (
    <div className="flex justify-between items-end bg-surface-soft border border-border-line rounded-md px-3.5 py-3">
      <div>
        <div className="uppercase font-semibold text-[10px] text-ink-soft tracking-wider">
          Cena netto
        </div>
        <div className="font-extrabold text-base text-navy-brand">
          {showPrice ? formatPrice(netPrice as number | string, priceCurrency) : 'Zapytaj o ofertę'}
        </div>
      </div>
      {hasLeasing && (
        <div className="text-right">
          <div className="uppercase font-semibold text-[10px] text-ink-soft tracking-wider">
            Leasing od
          </div>
          <div className="font-extrabold font-mono text-[13px] text-orange-cta">
            ~ {formatPL(Number(leasing))} zł/mies.
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPriceBlock;

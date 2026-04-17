import { Product } from '@/types';

interface Props {
  product: Product;
}

const formatPL = (n: number) => new Intl.NumberFormat('pl-PL').format(n);

const ProductPriceBlock = ({ product }: Props) => {
  const leasing = (product as any).leasingMonthlyFromPln;
  const hasLeasing = leasing != null && Number(leasing) > 0;

  return (
    <div className="flex justify-between items-end bg-surface-soft border border-border-line rounded-md px-3.5 py-3">
      <div>
        <div className="uppercase font-semibold text-[10px] text-ink-soft tracking-wider">
          Cena netto
        </div>
        <div className="font-extrabold text-base text-navy-brand">
          Zapytaj o ofertę
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

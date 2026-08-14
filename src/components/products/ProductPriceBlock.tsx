import { Product } from '@/types';
import { resolvePriceView } from '@/utils/productPricing';

interface Props {
  product: Product;
}

const ProductPriceBlock = ({ product }: Props) => {
  const price = resolvePriceView(product);

  return (
    <div className="flex justify-between items-end bg-surface-soft border border-border-line rounded-md px-3.5 py-3">
      <div>
        <div className="uppercase font-semibold text-[10px] text-ink-soft tracking-wider">
          {price.hasPublicPrice ? 'Cena netto' : 'Cena'}
        </div>
        <div className="font-extrabold text-base text-navy-brand">
          {price.hasPublicPrice ? price.formattedPrice : 'Na zapytanie'}
        </div>
      </div>

      {price.hasLeasing && (
        <div className="text-right">
          <div className="uppercase font-semibold text-[10px] text-ink-soft tracking-wider">
            Leasing od
          </div>
          <div className="font-extrabold font-mono text-[13px] text-orange-cta">
            {price.formattedLeasing}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPriceBlock;

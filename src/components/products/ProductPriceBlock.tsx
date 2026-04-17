import { Product } from '@/types';

interface Props {
  product: Product;
}

const formatPL = (n: number) => new Intl.NumberFormat('pl-PL').format(n);

const ProductPriceBlock = ({ product }: Props) => {
  const leasing = product.leasingMonthlyFromPln;
  const hasLeasing = leasing != null && Number(leasing) > 0;

  return (
    <div
      className="flex justify-between items-end"
      style={{
        background: '#FAF8F3',
        border: '1px solid #E5E1D8',
        borderRadius: 6,
        padding: '12px 14px',
      }}
    >
      <div>
        <div
          className="uppercase font-semibold"
          style={{ fontSize: 10, color: '#5B5B5B', letterSpacing: '0.05em' }}
        >
          Cena netto
        </div>
        <div className="font-extrabold" style={{ fontSize: 16, color: '#1E3A8A' }}>
          Zapytaj o ofertę
        </div>
      </div>
      {hasLeasing && (
        <div className="text-right">
          <div
            className="uppercase font-semibold"
            style={{ fontSize: 10, color: '#5B5B5B', letterSpacing: '0.05em' }}
          >
            Leasing od
          </div>
          <div className="font-extrabold font-mono" style={{ fontSize: 13, color: '#E85C1E' }}>
            ~ {formatPL(Number(leasing))} zł/mies.
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPriceBlock;

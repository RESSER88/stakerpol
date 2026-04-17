import { Product } from '@/types';

interface Props {
  product: Product;
}

const ProductStatusBadges = ({ product }: Props) => {
  const condition = product.conditionLabel?.trim();
  const featured = !!product.isFeatured;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {condition && (
        <span
          className="inline-flex items-center gap-1 rounded-[3px] font-bold uppercase"
          style={{
            background: '#E8F7EE',
            color: '#0B7A33',
            fontSize: 10,
            padding: '4px 9px',
            letterSpacing: '0.04em',
          }}
        >
          ● {condition}
        </span>
      )}
      <span
        className="inline-flex items-center gap-1 rounded-[3px] font-bold uppercase"
        style={{
          background: '#FFF4E0',
          color: '#8A5A00',
          fontSize: 10,
          padding: '4px 9px',
          letterSpacing: '0.04em',
        }}
      >
        ✓ Po przeglądzie
      </span>
      {featured && (
        <span
          className="inline-flex items-center gap-1 rounded-[3px] font-bold uppercase"
          style={{
            background: '#C8102E',
            color: '#fff',
            fontSize: 10,
            padding: '4px 9px',
            letterSpacing: '0.04em',
          }}
        >
          ★ Polecany
        </span>
      )}
    </div>
  );
};

export default ProductStatusBadges;

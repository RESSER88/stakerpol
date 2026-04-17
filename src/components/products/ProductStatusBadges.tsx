import { Product } from '@/types';

interface Props {
  product: Product;
}

const ProductStatusBadges = ({ product }: Props) => {
  const condition = (product as any).conditionLabel?.trim();
  const featured = !!(product as any).isFeatured;

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {condition && (
        <span className="inline-flex items-center gap-1 rounded-[3px] font-bold uppercase bg-green-soft text-green-soft-foreground text-[10px] px-2.5 py-1 tracking-wide">
          ● {condition}
        </span>
      )}
      <span className="inline-flex items-center gap-1 rounded-[3px] font-bold uppercase bg-amber-soft text-amber-soft-foreground text-[10px] px-2.5 py-1 tracking-wide">
        ✓ Po przeglądzie
      </span>
      {featured && (
        <span className="inline-flex items-center gap-1 rounded-[3px] font-bold uppercase bg-red-accent text-white text-[10px] px-2.5 py-1 tracking-wide">
          ★ Polecany
        </span>
      )}
    </div>
  );
};

export default ProductStatusBadges;

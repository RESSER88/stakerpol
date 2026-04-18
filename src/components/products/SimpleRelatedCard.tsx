import { Link } from 'react-router-dom';
import { Product } from '@/types';
import LazyImage from '@/components/ui/LazyImage';

interface Props {
  product: Product;
}

const SimpleRelatedCard = ({ product }: Props) => {
  const meta: string[] = [];
  if (product.specs?.productionYear) meta.push(`${product.specs.productionYear}`);
  if (product.specs?.workingHours) meta.push(`${product.specs.workingHours} mth`);
  if (product.specs?.liftHeight) meta.push(`${product.specs.liftHeight} mm`);
  if (product.specs?.mastLiftingCapacity) meta.push(`${product.specs.mastLiftingCapacity} kg`);

  const slugOrId = product.slug || product.id;
  const img = (product.images && product.images[0]) || product.image;

  return (
    <Link
      to={`/products/${slugOrId}`}
      className="group block bg-white border border-border-line rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.15)]"
    >
      <div className="relative bg-surface-soft">
        <div className="aspect-[3/4]">
          <LazyImage src={img} alt={product.model} aspectRatio="3:4" className="transition-transform duration-300 group-hover:scale-105" />
        </div>
        {product.specs?.productionYear && (
          <div className="absolute top-2 left-2 z-10 font-mono font-bold bg-ink text-white text-[10px] px-2 py-[3px] rounded-[3px] tracking-wider">
            ROK {product.specs.productionYear}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-sm text-ink mb-1 truncate">{product.model}</h3>
        {meta.length > 0 && (
          <div className="font-mono text-[11px] text-ink-soft truncate">
            {meta.map((m, i) => (
              <span key={i}>
                {m}
                {i < meta.length - 1 && (
                  <span className="opacity-70 mx-1">·</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default SimpleRelatedCard;

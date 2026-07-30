import { getAvailabilityBadge } from './availabilityBadge';

interface Props {
  productionYear?: string | number;
  availabilityStatus?: 'available' | 'reserved' | 'sold';
  isFeatured?: boolean;
}

const ProductImageBadges = ({ productionYear, availabilityStatus, isFeatured }: Props) => {
  const status = getAvailabilityBadge(availabilityStatus);

  return (
    <>
      {productionYear && (
        <div className="absolute top-3 left-3 z-20 font-mono font-bold bg-ink text-white text-[10.5px] px-2.5 py-[5px] rounded-[3px] tracking-wider">
          ROK {productionYear}
        </div>
      )}
      {status && (
        <div className={`absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 font-bold text-[10.5px] px-2.5 py-[5px] rounded-full shadow-sm ${status.cls}`}>
          <span className={`inline-block rounded-full w-1.5 h-1.5 ${status.dotCls}`} />
          {status.text}
        </div>
      )}
      {isFeatured && (
        <div className="absolute top-12 right-3 z-20 inline-flex items-center gap-1 font-bold text-[10.5px] px-2.5 py-[5px] rounded-[3px] bg-red-accent text-white">
          ★ Polecany
        </div>
      )}
    </>
  );
};

export default ProductImageBadges;

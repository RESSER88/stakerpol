import { MoveVertical, Calendar, Clock, Package } from 'lucide-react';
import { Product } from '@/types';

interface Props {
  product: Product;
}

const formatPL = (v: string | undefined) => {
  if (!v) return '—';
  const n = Number(String(v).replace(/[^0-9.-]/g, ''));
  if (Number.isFinite(n)) return new Intl.NumberFormat('pl-PL').format(n);
  return v;
};

const ProductKeySpecsBar = ({ product }: Props) => {
  const liftHeight = product.specs?.liftHeight;
  const year = product.specs?.productionYear;
  const hours = product.specs?.workingHours;
  const mast = Number(product.specs?.mastLiftingCapacity || 0);
  const initial = Number(product.specs?.preliminaryLiftingCapacity || 0);
  const capacity = Math.max(mast, initial);
  const capacityStr = capacity > 0 ? String(capacity) : '';

  const cells = [
    { Icon: MoveVertical, value: formatPL(liftHeight), label: 'mm' },
    { Icon: Calendar, value: year || '—', label: 'rok' },
    { Icon: Clock, value: formatPL(hours), label: 'mth' },
    { Icon: Package, value: formatPL(capacityStr), label: 'kg' },
  ];

  return (
    <div className="grid grid-cols-4 my-3 mx-1 py-3.5 border-y border-border-line">
      {cells.map((c, i) => (
        <div
          key={i}
          className={`flex flex-col items-center justify-center text-center ${i < cells.length - 1 ? 'border-r border-border-line' : ''}`}
        >
          <c.Icon size={18} className="text-red-accent" />
          <div className="font-mono font-bold mt-1 text-sm text-ink">{c.value}</div>
          <div className="uppercase font-semibold text-[9px] text-ink-soft tracking-wide">{c.label}</div>
        </div>
      ))}
    </div>
  );
};

export default ProductKeySpecsBar;

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
    <div
      className="grid grid-cols-4 my-3 mx-1"
      style={{
        borderTop: '1px solid #E5E1D8',
        borderBottom: '1px solid #E5E1D8',
        padding: '14px 0',
      }}
    >
      {cells.map((c, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center text-center"
          style={{
            borderRight: i < cells.length - 1 ? '1px solid #E5E1D8' : 'none',
          }}
        >
          <c.Icon size={18} style={{ color: '#C8102E' }} />
          <div
            className="font-mono font-bold mt-1"
            style={{ fontSize: 14, color: '#0E0E0E' }}
          >
            {c.value}
          </div>
          <div
            className="uppercase font-semibold"
            style={{ fontSize: 9, color: '#5B5B5B', letterSpacing: '0.05em' }}
          >
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductKeySpecsBar;

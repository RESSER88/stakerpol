import { Product } from '@/types';

interface Props {
  product: Product;
}

const labelMap: Record<string, { label: string; cls: string }> = {
  available: { label: 'Dostępny', cls: 'bg-admin-green/10 text-admin-green border-admin-green/30' },
  reserved: { label: 'Zarezerwowany', cls: 'bg-admin-orange/10 text-admin-orange border-admin-orange/30' },
  sold: { label: 'Sprzedany', cls: 'bg-admin-red/10 text-admin-red border-admin-red/30' },
};

const ProductStatusChip = ({ product }: Props) => {
  const status = product.availabilityStatus || 'available';
  const { label, cls } = labelMap[status] || labelMap.available;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
};

export default ProductStatusChip;

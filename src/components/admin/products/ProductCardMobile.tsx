import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Pencil, Copy, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductStatusChip from './ProductStatusChip';

interface Props {
  product: Product;
  onEdit: (p: Product) => void;
  onCopy: (p: Product) => void;
  onDelete: (p: Product) => void;
}

const Tile = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-admin-bg rounded-lg p-2 text-center">
    <div className="text-[10px] uppercase tracking-wide text-admin-muted">{label}</div>
    <div className="text-sm font-semibold text-admin-text mt-0.5 truncate">{value || '—'}</div>
  </div>
);

const ProductCardMobile = ({ product, onEdit, onCopy, onDelete }: Props) => {
  return (
    <div className="bg-white border border-admin-border rounded-xl p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            to={`/products/${product.slug || product.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 group"
          >
            <h3 className="font-extrabold text-admin-text text-base truncate group-hover:text-admin-orange">
              {product.model}
            </h3>
            <ExternalLink className="h-3 w-3 text-admin-muted shrink-0" />
          </Link>
          <p className="text-xs text-admin-muted mt-0.5">
            {product.specs.serialNumber || 'Brak nr seryjnego'} · {product.specs.productionYear || '—'}
          </p>
        </div>
        <ProductStatusChip product={product} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Tile label="Godziny" value={product.specs.workingHours ? `${product.specs.workingHours} mh` : ''} />
        <Tile label="Udźwig" value={product.specs.mastLiftingCapacity || ''} />
        <Tile label="Wys. podn." value={product.specs.liftHeight || ''} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          onClick={() => onEdit(product)}
          className="flex-1 bg-admin-orange hover:bg-admin-orange/90 text-white"
          size="sm"
        >
          <Pencil className="h-4 w-4 mr-1.5" />
          Edytuj
        </Button>
        <Button
          onClick={() => onCopy(product)}
          variant="outline"
          size="sm"
          className="px-3"
          aria-label="Duplikuj"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          onClick={() => onDelete(product)}
          variant="outline"
          size="sm"
          className="px-3 text-admin-red border-admin-red/30 hover:bg-admin-red/10 hover:text-admin-red"
          aria-label="Usuń"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProductCardMobile;

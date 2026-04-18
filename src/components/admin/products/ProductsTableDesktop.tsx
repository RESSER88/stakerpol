import { useMemo, useState } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Pencil, Copy, Trash2, ArrowUp, ArrowDown, ArrowUpDown, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ProductStatusChip from './ProductStatusChip';

interface Props {
  products: Product[];
  onEdit: (p: Product) => void;
  onCopy: (p: Product) => void;
  onDelete: (p: Product) => void;
}

type SortKey = 'model' | 'serialNumber' | 'productionYear' | 'workingHours' | 'liftHeight' | 'status';

const ProductsTableDesktop = ({ products, onEdit, onCopy, onDelete }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return products;
    const get = (p: Product): string | number => {
      switch (sortKey) {
        case 'model': return p.model.toLowerCase();
        case 'serialNumber': return (p.specs.serialNumber || '').toLowerCase();
        case 'productionYear': return parseInt(p.specs.productionYear || '0', 10);
        case 'workingHours': return parseFloat(p.specs.workingHours || '0');
        case 'liftHeight': return parseFloat((p.specs.liftHeight || '0').toString().replace(/\D/g, '')) || 0;
        case 'status': return p.availabilityStatus || 'available';
      }
    };
    return [...products].sort((a, b) => {
      const av = get(a); const bv = get(b);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, sortKey, sortDir]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const SortHead = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <TableHead>
      <button
        onClick={() => toggleSort(k)}
        className="inline-flex items-center gap-1 hover:text-admin-text"
      >
        {children} <SortIcon k={k} />
      </button>
    </TableHead>
  );

  return (
    <div className="rounded-lg border border-admin-border bg-white overflow-hidden">
      <Table>
        <TableHeader className="bg-admin-bg">
          <TableRow>
            <TableHead className="w-16">Miniatura</TableHead>
            <SortHead k="model">Model</SortHead>
            <SortHead k="serialNumber">Nr seryjny</SortHead>
            <SortHead k="productionYear">Rok</SortHead>
            <SortHead k="workingHours">Godziny</SortHead>
            <SortHead k="liftHeight">Wys. podnoszenia</SortHead>
            <SortHead k="status">Status</SortHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-10 text-admin-muted">
                Brak produktów do wyświetlenia
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((product) => (
              <TableRow key={product.id} className="hover:bg-admin-bg/50">
                <TableCell>
                  <div className="w-12 h-12 rounded-md bg-admin-bg overflow-hidden border border-admin-border">
                    {product.image ? (
                      <img src={product.image} alt={product.model} className="w-full h-full object-cover" loading="lazy" />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    to={`/products/${product.slug || product.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-admin-text hover:text-admin-orange group"
                  >
                    {product.model}
                    <ExternalLink className="h-3 w-3 text-admin-muted group-hover:text-admin-orange" />
                  </Link>
                </TableCell>
                <TableCell className="text-admin-muted text-sm">{product.specs.serialNumber || '—'}</TableCell>
                <TableCell className="text-admin-muted text-sm">{product.specs.productionYear || '—'}</TableCell>
                <TableCell className="text-admin-muted text-sm">
                  {product.specs.workingHours ? `${product.specs.workingHours} mh` : '—'}
                </TableCell>
                <TableCell className="text-admin-muted text-sm">{product.specs.liftHeight || '—'}</TableCell>
                <TableCell><ProductStatusChip product={product} /></TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => onEdit(product)}
                      className="h-8 w-8 p-0 text-admin-orange hover:bg-admin-orange/10"
                      title="Edytuj"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => onCopy(product)}
                      className="h-8 w-8 p-0 hover:bg-admin-bg"
                      title="Duplikuj"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => onDelete(product)}
                      className="h-8 w-8 p-0 text-admin-red hover:bg-admin-red/10"
                      title="Usuń"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsTableDesktop;

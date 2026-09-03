
import { useState } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Copy, Trash2, Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import PDFQuoteGenerator from './PDFQuoteGenerator';
import { productPath } from '@/config/routes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CompactProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onCopy: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const CompactProductTable = ({ products, onEdit, onCopy, onDelete }: CompactProductTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredProducts = products.filter(product =>
    product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.specs.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleRowExpansion = (productId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(productId)) {
      newExpandedRows.delete(productId);
    } else {
      newExpandedRows.add(productId);
    }
    setExpandedRows(newExpandedRows);
  };

  const isRowExpanded = (productId: string) => expandedRows.has(productId);

  return (
    <div className="space-y-4">
      {/* Pasek wyszukiwania */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-editorial-muted h-4 w-4" />
        <Input
          placeholder="Szukaj produktów..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Kompaktowa tabela produktów */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-editorial-muted">
                  {searchTerm ? 'Nie znaleziono produktów odpowiadających wyszukiwaniu' : 'Brak produktów do wyświetlenia'}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <>
                  {/* Główny wiersz produktu */}
                  <TableRow key={product.id} className="hover:bg-editorial-line/20">
                    <TableCell className="w-8">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(product.id)}
                        className="h-6 w-6 p-0 hover:bg-editorial-line/50"
                      >
                        {isRowExpanded(product.id) ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        {/* Link do produktu - poprawiony z /product/ na /products/ */}
                        <Link 
                          to={productPath(product)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center group"
                        >
                          <h3 className="font-semibold text-stakerpol-navy text-sm hover:underline group-hover:text-blue-600 transition-colors">
                            {product.model}
                          </h3>
                          <ExternalLink className="ml-1 h-3 w-3 text-editorial-muted group-hover:text-blue-600" />
                        </Link>
                        
                        {/* Numer seryjny pod modelem */}
                        <p className="text-xs text-editorial-muted">
                          Nr seryjny: {product.specs.serialNumber || 'Brak'}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <PDFQuoteGenerator product={product} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(product)}
                          className="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0"
                          title="Edytuj"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopy(product)}
                          className="text-green-600 hover:bg-green-50 h-8 w-8 p-0"
                          title="Kopiuj"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(product)}
                          className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                          title="Usuń"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Rozwinięte szczegóły - tabela w tabeli */}
                  {isRowExpanded(product.id) && (
                    <TableRow>
                      <TableCell colSpan={3} className="p-0">
                        <div className="px-4 py-3 bg-editorial-line/20 border-t">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-editorial-muted uppercase tracking-wide">
                                Rok produkcji
                              </span>
                              <p className="text-editorial-ink">
                                {product.specs.productionYear || 'Brak danych'}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-editorial-muted uppercase tracking-wide">
                                Udźwig maszt
                              </span>
                              <p className="text-editorial-ink">
                                {product.specs.mastLiftingCapacity || 'Brak danych'}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-editorial-muted uppercase tracking-wide">
                                Godziny pracy
                              </span>
                              <p className="text-editorial-ink">
                                {product.specs.workingHours ? `${product.specs.workingHours} mh` : 'Brak danych'}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-editorial-muted uppercase tracking-wide">
                                Wysokość podnoszenia
                              </span>
                              <p className="text-editorial-ink">
                                {product.specs.liftHeight || 'Brak danych'}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-editorial-muted uppercase tracking-wide">
                                Stan
                              </span>
                              <p className="text-editorial-ink">
                                {product.specs.condition || 'Brak danych'}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-editorial-muted uppercase tracking-wide">
                                Bateria
                              </span>
                              <p className="text-editorial-ink">
                                {product.specs.battery || 'Brak danych'}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-editorial-muted uppercase tracking-wide">
                                Maszt
                              </span>
                              <p className="text-editorial-ink">
                                {product.specs.mast || 'Brak danych'}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-xs font-medium text-editorial-muted uppercase tracking-wide">
                                Opis skrócony
                              </span>
                              <p className="text-editorial-ink text-xs leading-relaxed">
                                {product.shortDescription || 'Brak opisu'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Podsumowanie */}
      <div className="text-xs text-editorial-muted text-center py-2 bg-editorial-line/30 rounded-lg">
        Wyświetlono {filteredProducts.length} z {products.length} produktów
        {expandedRows.size > 0 && ` • Rozwinięto ${expandedRows.size} wierszy`}
      </div>
    </div>
  );
};

export default CompactProductTable;

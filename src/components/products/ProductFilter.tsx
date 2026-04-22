import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import FilterModal from './FilterModal';
import { Product } from '@/types';
import { useTranslation } from '@/utils/translations';
import { Language } from '@/contexts/LanguageContext';

interface ProductFilterProps {
  products: Product[];
  onFilterChange: (filteredProducts: Product[]) => void;
  language: Language;
  variant?: 'default' | 'floating';
}

const ProductFilter = ({ products, onFilterChange, language, variant = 'default' }: ProductFilterProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslation(language);

  return (
    <>
      {variant === 'floating' ? (
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-label={t('filterProducts')}
          className="w-14 h-14 rounded-full bg-stakerpol-orange text-white shadow-lg hover:brightness-110 active:scale-95 flex items-center justify-center transition-all"
        >
          <Filter className="h-6 w-6" />
        </button>
      ) : (
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="outline"
          className="flex items-center gap-2 border border-stakerpol-navy text-stakerpol-navy hover:bg-stakerpol-navy hover:text-white transition-colors px-5 py-2.5 font-semibold"
        >
          <Filter className="h-4 w-4" />
          {t('filterProducts')}
        </Button>
      )}

      <FilterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        products={products}
        onApplyFilters={onFilterChange}
        language={language}
      />
    </>
  );
};

export default ProductFilter;

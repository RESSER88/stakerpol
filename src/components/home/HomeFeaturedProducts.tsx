import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Product } from '@/types';
import SimpleRelatedCard from '@/components/products/SimpleRelatedCard';

interface Props {
  products: Product[];
  isLoading?: boolean;
}

const HomeFeaturedProducts = ({ products, isLoading }: Props) => {
  return (
    <section className="bg-white py-10 md:py-16">
      <div className="container-custom max-w-[1200px] px-4 md:px-6">
        <div className="font-mono text-xs md:text-sm text-red-accent tracking-widest mb-2">
          01
        </div>
        <h2 className="text-xl md:text-3xl font-extrabold text-navy-brand leading-tight">
          Nasze wózki
        </h2>
        <p className="text-sm md:text-base text-ink-soft mt-2 max-w-2xl">
          Sprawdź najnowsze egzemplarze. Wszystkie dostępne od ręki, po pełnym
          przygotowaniu.
        </p>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-cta" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
            {products.map((p) => (
              <SimpleRelatedCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:mt-10">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-orange-cta hover:opacity-90 text-white font-bold px-5 py-3 rounded-md transition-opacity"
          >
            Zobacz wszystkie produkty
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HomeFeaturedProducts;

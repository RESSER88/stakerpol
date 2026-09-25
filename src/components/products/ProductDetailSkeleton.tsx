import { Skeleton } from '@/components/ui/skeleton';
import ProductHeader from './ProductHeader';

/** Lightweight placeholder mirroring the product hero layout to avoid layout shift. */
const ProductDetailSkeleton = () => (
  <section className="bg-white pt-6 pb-8 md:pt-10 md:pb-10 px-4 md:px-6" aria-busy="true" aria-label="Ładowanie produktu...">
    <div className="container-custom max-w-[1200px]">
      <ProductHeader />
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-8">
        <div className="space-y-4">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded" />
            ))}
          </div>
        </div>
        <div className="space-y-4 lg:py-2">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-10 md:h-12 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-16 w-full" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  </section>
);

export default ProductDetailSkeleton;

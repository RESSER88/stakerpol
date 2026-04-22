import { Product } from '@/types';
import { useProductBenefits } from '@/hooks/useProductBenefits';
import * as Icons from 'lucide-react';
import { MapPin, ArrowRight } from 'lucide-react';
import InlineContextualCTA from './InlineContextualCTA';

const DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=ul.+Mi%C4%99dzyle%C5%9Bna+115,+32-095+Celiny,+Polska';

interface Props {
  product: Product;
}

const ICON_WHITELIST = ['check', 'battery', 'shield', 'zap', 'award', 'wrench', 'truck', 'clock'] as const;

const renderIcon = (name: string) => {
  const safe = (ICON_WHITELIST as readonly string[]).includes(name) ? name : 'check';
  const map: Record<string, any> = {
    check: Icons.Check,
    battery: Icons.Battery,
    shield: Icons.Shield,
    zap: Icons.Zap,
    award: Icons.Award,
    wrench: Icons.Wrench,
    truck: Icons.Truck,
    clock: Icons.Clock,
  };
  const C = map[safe] || Icons.Check;
  return <C size={16} className="shrink-0 mt-0.5 text-red-accent" />;
};

const ProductAboutSection = ({ product }: Props) => {
  const { benefits } = useProductBenefits(product.id);
  const hasDescription = !!product.shortMarketingDescription?.trim();
  const hasBenefits = benefits.length > 0;

  if (!hasDescription && !hasBenefits) return null;

  return (
    <section className="bg-surface-soft py-8 md:py-12 px-4 md:px-6">
      <div className="container-custom max-w-[1200px]">
        <div className="bg-white border border-border-line rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-5 md:p-8">
          <div className="grid md:grid-cols-2 md:gap-8">
            {/* Left: heading + description */}
            <div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-mono font-bold text-[13px] text-red-accent">02</span>
                <span className="text-ink-soft">·</span>
                <h2 className="font-extrabold text-lg md:text-xl text-navy-brand">O tym modelu</h2>
              </div>
              {hasDescription && (
                <p className="text-sm md:text-base text-foreground/90 leading-relaxed">
                  {product.shortMarketingDescription}
                </p>
              )}
            </div>

            {/* Right: benefits */}
            {hasBenefits && (
              <div className="mt-6 md:mt-0">
                <h3 className="text-[13px] font-bold uppercase tracking-wide text-ink-soft mb-3">
                  Kluczowe zalety
                </h3>
                <ul className="space-y-2">
                  {benefits.slice(0, 3).map((b) => (
                    <li
                      key={b.id}
                      className="flex items-start gap-3 bg-surface-soft border-l-[3px] border-red-accent rounded px-3 py-2.5"
                    >
                      {renderIcon(b.icon_name)}
                      <div>
                        <div className="font-bold text-sm">{b.title}</div>
                        {b.description && (
                          <div className="text-sm text-muted-foreground">{b.description}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <InlineContextualCTA
            variant="line"
            question="Chcesz zobaczyć ten model w naszym magazynie?"
            actionLabel="Umów wizytę"
            actionType="demo"
            modelName={product.model}
            productId={product.id}
            serialNumber={product.specs?.serialNumber}
          />
        </div>
      </div>
    </section>
  );
};

export default ProductAboutSection;

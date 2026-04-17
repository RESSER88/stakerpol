import { Product } from '@/types';
import { useProductBenefits } from '@/hooks/useProductBenefits';
import * as Icons from 'lucide-react';

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
  return <C size={16} style={{ color: '#C8102E' }} className="shrink-0 mt-0.5" />;
};

const ProductAboutSection = ({ product }: Props) => {
  const { benefits } = useProductBenefits(product.id);
  const hasDescription = !!product.shortMarketingDescription?.trim();
  const hasBenefits = benefits.length > 0;

  if (!hasDescription && !hasBenefits) return null;

  return (
    <section className="py-10 bg-white">
      <div className="container-custom max-w-3xl">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-mono font-bold" style={{ color: '#C8102E', fontSize: 13 }}>
            01
          </span>
          <span style={{ color: '#5B5B5B' }}>·</span>
          <h2 className="font-bold" style={{ fontSize: 18, color: '#0E0E0E' }}>
            O tym modelu
          </h2>
        </div>
        {hasDescription && (
          <p className="text-base text-foreground/90 leading-relaxed mb-5">
            {product.shortMarketingDescription}
          </p>
        )}
        {hasBenefits && (
          <ul className="space-y-2">
            {benefits.slice(0, 3).map((b) => (
              <li
                key={b.id}
                className="flex items-start gap-3"
                style={{
                  background: '#FAF8F3',
                  borderLeft: '3px solid #C8102E',
                  borderRadius: 4,
                  padding: '10px 12px',
                }}
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
        )}
      </div>
    </section>
  );
};

export default ProductAboutSection;

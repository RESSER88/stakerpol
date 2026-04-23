import { useState } from 'react';
import { Product } from '@/types';
import { useProductBenefits } from '@/hooks/useProductBenefits';
import * as Icons from 'lucide-react';
import { MapPin, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
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

const COLLAPSE_THRESHOLD = 200;

const CollapsibleParagraph = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const longEnough = text.length > COLLAPSE_THRESHOLD;
  const truncated = longEnough
    ? text.slice(0, Math.ceil(text.length / 2)).replace(/\s+\S*$/, '') + '…'
    : text;

  return (
    <div>
      {/* Desktop: zawsze pełny tekst */}
      <p className="hidden md:block text-sm md:text-base text-foreground/90 leading-relaxed">
        {text}
      </p>
      {/* Mobile: zwijane */}
      <div className="md:hidden">
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
          {expanded || !longEnough ? text : truncated}
        </p>
        {longEnough && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="w-full mt-3 px-4 py-2.5 bg-white border border-[#E5E1D8] rounded-[5px] text-[12.5px] font-bold text-[#0E0E0E] hover:bg-[#FAF8F3] transition-colors flex items-center justify-center gap-2"
            style={{ fontFamily: 'Archivo, sans-serif' }}
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                Zwiń
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Rozwiń
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const ProductAboutSection = ({ product }: Props) => {
  const { benefits } = useProductBenefits(product.id);
  const desc1 = (product.shortMarketingDescription || '').trim();
  const desc2 = ((product as any).aboutDescription || '').trim();
  const hasDesc1 = !!desc1;
  const hasDesc2 = !!desc2;
  const hasAnyDesc = hasDesc1 || hasDesc2;
  const hasBenefits = benefits.length > 0;

  if (!hasAnyDesc && !hasBenefits) return null;

  const bothDescs = hasDesc1 && hasDesc2;

  return (
    <section className="bg-surface-soft py-8 md:py-12 px-4 md:px-6">
      <div className="container-custom max-w-[1200px]">
        <div className="bg-white border border-border-line rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-5 md:p-8">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-mono font-bold text-[13px] text-red-accent">02</span>
            <span className="text-ink-soft">·</span>
            <h2 className="font-extrabold text-lg md:text-xl text-navy-brand">O tym modelu</h2>
          </div>

          {hasAnyDesc && (
            <div className={`grid gap-6 md:gap-8 ${bothDescs ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
              {hasDesc1 && <CollapsibleParagraph text={desc1} />}
              {hasDesc2 && <CollapsibleParagraph text={desc2} />}
            </div>
          )}

          {hasBenefits && (
            <div className={`${hasAnyDesc ? 'mt-8 pt-6 border-t border-border-line' : ''}`}>
              <h3 className="text-[13px] font-bold uppercase tracking-wide text-ink-soft mb-3">
                Kluczowe zalety
              </h3>
              <ul className="grid md:grid-cols-3 gap-2">
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

          <div className="flex flex-col md:flex-row md:items-center md:gap-4 mt-6">
            <div className="flex-1">
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
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 text-[13px] md:text-[14px] font-bold text-navy-brand hover:underline whitespace-nowrap mt-3 md:mt-4 px-3 md:px-0"
            >
              <MapPin size={14} className="shrink-0" />
              Jak dojechać
              <ArrowRight
                size={14}
                className="transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductAboutSection;

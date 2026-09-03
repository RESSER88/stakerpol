import { cn } from '@/lib/utils';

/**
 * Wspólne pulsowanie sygnalizujące „wymaga uwagi”.
 * Ten sam wzorzec co chip „Zadzwoń dziś” w SentOffersView
 * (animate-pulse + motion-reduce:animate-none).
 */
const PulseDot = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cn(
      'inline-block h-1.5 w-1.5 rounded-full bg-editorial-accent animate-pulse motion-reduce:animate-none',
      className
    )}
  />
);

export default PulseDot;

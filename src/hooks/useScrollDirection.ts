import { useEffect, useRef, useState } from 'react';

export type ScrollDirection = 'up' | 'down';

/**
 * Zwraca kierunek przewijania okna z progiem tolerancji.
 * Nasłuch bierny, sprzątany przy odmontowaniu.
 */
export const useScrollDirection = (threshold = 8): ScrollDirection => {
  const [direction, setDirection] = useState<ScrollDirection>('up');
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      const diff = y - lastY.current;
      if (Math.abs(diff) >= threshold) {
        setDirection(diff > 0 && y > threshold ? 'down' : 'up');
        lastY.current = y;
      }
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return direction;
};

export default useScrollDirection;

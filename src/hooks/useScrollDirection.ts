import { useEffect, useRef, useState } from 'react';

export type ScrollDirection = 'up' | 'down';

export interface ScrollState {
  direction: ScrollDirection;
  y: number;
}

/**
 * Zwraca kierunek przewijania okna z progiem tolerancji oraz aktualną pozycję.
 * Nasłuch bierny, sprzątany przy odmontowaniu.
 */
export const useScrollState = (threshold = 8): ScrollState => {
  const [state, setState] = useState<ScrollState>({ direction: 'up', y: 0 });
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;
    setState((s) => ({ ...s, y: window.scrollY }));

    const update = () => {
      const y = window.scrollY;
      const diff = y - lastY.current;
      if (Math.abs(diff) >= threshold) {
        const direction: ScrollDirection = diff > 0 && y > threshold ? 'down' : 'up';
        lastY.current = y;
        setState({ direction, y });
      } else {
        setState((s) => (s.y === y ? s : { ...s, y }));
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

  return state;
};

export const useScrollDirection = (threshold = 8): ScrollDirection =>
  useScrollState(threshold).direction;

export default useScrollDirection;

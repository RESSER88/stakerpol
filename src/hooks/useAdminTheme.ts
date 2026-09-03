import { useCallback, useEffect, useState } from 'react';

export type AdminTheme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'stakerpol-admin-theme';

const readStored = (): AdminTheme => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    /* localStorage niedostępny */
  }
  return 'system';
};

const prefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const applyClass = (isDark: boolean) => {
  document.documentElement.classList.toggle('dark', isDark);
};

/**
 * Ciemny motyw wyłącznie dla panelu administracyjnego.
 * Klasa `dark` jest zdejmowana przy odmontowaniu, żeby tryb nocny
 * nie przeciekał na strony publiczne.
 */
export const useAdminTheme = () => {
  const [theme, setTheme] = useState<AdminTheme>(readStored);

  const isDark = theme === 'dark' || (theme === 'system' && prefersDark());

  useEffect(() => {
    applyClass(isDark);
    return () => applyClass(false);
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignorujemy brak dostępu do localStorage */
    }
  }, [theme]);

  // Reaguj na zmianę ustawień systemowych, gdy wybrano tryb "system".
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyClass(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const currentlyDark = prev === 'dark' || (prev === 'system' && prefersDark());
      return currentlyDark ? 'light' : 'dark';
    });
  }, []);

  return { theme, isDark, setTheme, toggleTheme };
};

export default useAdminTheme;

import type { Product } from '@/types';
import { cleanProductName } from '@/utils/productImageAlt';

/*
 * ZMIEŃ W OBU MIEJSCACH: te same reguły tytułu i opisu karty są powielone
 * w PHP w scripts/postbuild.cjs (HTML z serwera dla /produkty/<slug>).
 * Zgodność sprawdza ręcznie: bun scripts/check-ssr-parity.ts (instrukcja w pliku).
 */

// Indywidualny tytuł: „Model rok — 2100 mm, 1200 kg | Stakerpol”
export const getProductMetaTitle = (product: Product): string => {
  const year = product.specs?.productionYear ? ` ${product.specs.productionYear}` : '';
  const parts: string[] = [];
  if (product.specs?.liftHeight) parts.push(`${product.specs.liftHeight} mm`);
  if (product.specs?.mastLiftingCapacity) parts.push(`${product.specs.mastLiftingCapacity} kg`);
  const specsText = parts.length > 0 ? ` — ${parts.join(', ')}` : '';
  return `${cleanProductName(product.model)}${year}${specsText} | Stakerpol`;
};

// Indywidualny opis: „Używany <model>, rok …, podnoszenie … mm, udźwig … kg, … mth.”
export const getProductMetaDescription = (product: Product): string => {
  const specs: string[] = [];
  if (product.specs?.productionYear) specs.push(`rok ${product.specs.productionYear}`);
  if (product.specs?.liftHeight) specs.push(`podnoszenie ${product.specs.liftHeight} mm`);
  if (product.specs?.mastLiftingCapacity) specs.push(`udźwig ${product.specs.mastLiftingCapacity} kg`);
  if (product.specs?.workingHours) specs.push(`${product.specs.workingHours} mth`);
  const specsText = specs.length > 0 ? `, ${specs.join(', ')}` : '';

  // Dostępność wyłącznie na podstawie realnego statusu egzemplarza.
  const status = (product as any).availabilityStatus as string | undefined;
  const availability =
    status === 'available'
      ? ' Dostępny od razu.'
      : status === 'reserved'
        ? ' Egzemplarz zarezerwowany.'
        : status === 'sold'
          ? ' Egzemplarz sprzedany.'
          : '';

  return `Używany ${cleanProductName(product.model)}${specsText}.${availability} Stakerpol — sprzedaż używanych wózków paletowych Toyota BT.`;
};

export const getProductOgImage = (product: Product): string => {
  if (product.images && product.images.length > 0) return product.images[0];
  return product.image || '';
};

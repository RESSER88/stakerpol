import { Product } from '@/types';

export interface ChapterStatus {
  id: number;
  number: string;
  title: string;
  description: string;
  complete: boolean;
  enabled: boolean;
}

export const useChapterCompletion = (
  product: Product | null,
  images: string[],
  mode: 'create' | 'edit'
): ChapterStatus[] => {
  const isCreate = mode === 'create';
  const hasId = !!product?.id;

  const ch01 = images.length > 0;
  const ch02 = !!product?.model?.trim() && !!product?.specs?.serialNumber?.trim();
  const ch03 =
    !!product?.specs?.mastLiftingCapacity && product.specs.mastLiftingCapacity !== '0' &&
    !!product?.specs?.liftHeight && product.specs.liftHeight !== '0';
  const ch04 =
    !!(product as any)?.priceDisplayMode &&
    ((product as any).priceDisplayMode === 'inquiry_only' ||
      ((product as any).netPrice != null && (product as any).netPrice !== ''));
  const ch05 = !!product?.slogan?.trim() || !!product?.shortMarketingDescription?.trim();
  const ch06 = hasId; // available once product saved

  return [
    {
      id: 1,
      number: '01',
      title: 'Zdjęcia',
      description: 'Galeria produktu',
      complete: ch01,
      enabled: !isCreate || hasId,
    },
    {
      id: 2,
      number: '02',
      title: 'Podstawowe',
      description: 'Model, numer seryjny, stan',
      complete: ch02,
      enabled: true,
    },
    {
      id: 3,
      number: '03',
      title: 'Techniczne',
      description: 'Udźwig, wysokości, napęd',
      complete: ch03,
      enabled: !isCreate || hasId,
    },
    {
      id: 4,
      number: '04',
      title: 'Cena & Leasing',
      description: 'Tryb ceny, leasing, gwarancja',
      complete: ch04,
      enabled: !isCreate || hasId,
    },
    {
      id: 5,
      number: '05',
      title: 'Marketing',
      description: 'Slogan, zalety, FAQ',
      complete: ch05,
      enabled: !isCreate || hasId,
    },
    {
      id: 6,
      number: '06',
      title: 'SEO',
      description: 'Schema.org, GTIN, MPN',
      complete: ch06,
      enabled: !isCreate || hasId,
    },
  ];
};

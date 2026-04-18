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
  // placeholders for future chapters
  const ch04 = false;
  const ch05 = false;
  const ch06 = false;

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
      description: 'Wkrótce',
      complete: ch04,
      enabled: false,
    },
    {
      id: 5,
      number: '05',
      title: 'Marketing',
      description: 'Wkrótce',
      complete: ch05,
      enabled: false,
    },
    {
      id: 6,
      number: '06',
      title: 'SEO',
      description: 'Wkrótce',
      complete: ch06,
      enabled: false,
    },
  ];
};

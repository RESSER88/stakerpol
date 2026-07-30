/**
 * Jedno źródło prawdy dla atrybutów ALT zdjęć produktu.
 * Zdjęcie główne: ręczny ALT → slogan → "{Model} {Rok}".
 * Miniatury galerii: automatycznie "{Model} {Rok} — zdjęcie {n}".
 */

export interface ProductAltSource {
  model?: string | null;
  mainImageAlt?: string | null;
  slogan?: string | null;
  specs?: { productionYear?: string | number | null } | null;
}

const clean = (v?: string | number | null) => (v == null ? '' : String(v).trim());

const modelWithYear = (product?: ProductAltSource | null) => {
  const model = clean(product?.model);
  const year = clean(product?.specs?.productionYear);
  return year ? `${model} ${year}`.trim() : model;
};

export const getMainImageAlt = (product?: ProductAltSource | null): string => {
  const manual = clean(product?.mainImageAlt);
  if (manual) return manual;

  const slogan = clean(product?.slogan);
  if (slogan) return slogan;

  return modelWithYear(product);
};

/** n — numer miniatury liczony z pominięciem zdjęcia głównego (druga miniatura = 1). */
export const getGalleryImageAlt = (product: ProductAltSource | null | undefined, n: number): string =>
  `${modelWithYear(product)} — zdjęcie ${n}`;

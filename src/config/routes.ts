import type { Product } from '@/types';

/** Bazowy adres serwisu (bez ukośnika na końcu). */
export const SITE_URL = 'https://stakerpol.pl';

/** Docelowe (polskie) ścieżki serwisu. Jedyne miejsce zapisu ścieżek. */
export const ROUTES = {
  home: '/',
  products: '/produkty',
  productDetail: '/produkty/:id',
  contact: '/kontakt',
  testimonials: '/opinie',
  privacy: '/prywatnosc',
  faq: '/faq',
  admin: '/admin',
  sharedOffer: '/oferta/:token',
} as const;

/** Stare (angielskie) adresy → nowe. Podstawa przekierowań 301. */
export const LEGACY_ROUTES = {
  '/products': ROUTES.products,
  '/products/:id': ROUTES.productDetail,
  '/contact': ROUTES.contact,
  '/testimonials': ROUTES.testimonials,
  '/privacy': ROUTES.privacy,
} as const;

type ProductLike = Pick<Product, 'id'> & { slug?: string | null };

/** Ścieżka względna do karty produktu. Wzorzec `${slug || id}`. */
export const productPath = (product: ProductLike): string =>
  `${ROUTES.products}/${product.slug || product.id}`;

/** Adres bezwzględny dla dowolnej ścieżki serwisu (canonical, OG). */
export const absoluteUrl = (path: string): string =>
  `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/** Adres bezwzględny karty produktu. */
export const productUrl = (product: ProductLike): string => absoluteUrl(productPath(product));

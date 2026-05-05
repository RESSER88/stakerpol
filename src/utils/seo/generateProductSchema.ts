import { Product } from '@/types';
import { ProductSEOSettings } from '@/hooks/useProductSEO';

export interface ProductSchemaData {
  "@context": string;
  "@type": string;
  name: string;
  brand: {
    "@type": string;
    name: string;
  };
  model: string;
  sku: string;
  description: string;
  url: string;
  image: string[];
  manufacturer: {
    "@type": string;
    name: string;
  };
  category: string;
  additionalProperty: Array<{
    "@type": string;
    name: string;
    value: string;
    unitCode?: string;
  }>;
  offers?: {
    "@type": string;
    availability: string;
    priceValidUntil?: string;
    price?: string;
    priceCurrency?: string;
    businessFunction: string;
    seller: {
      "@type": string;
      name: string;
      url: string;
      telephone: string;
    };
    hasMerchantReturnPolicy?: {
      "@type": string;
      applicableCountry: string;
      returnPolicyCategory: string;
    };
    shippingDetails?: {
      "@type": string;
      shippingRate: {
        "@type": string;
        currency: string;
      };
      shippingDestination: {
        "@type": string;
        addressCountry: string;
      };
      deliveryTime: {
        "@type": string;
        businessDays: {
          "@type": string;
          dayOfWeek: string[];
        };
        cutoffTime: string;
        handlingTime: {
          "@type": string;
          minValue: number;
          maxValue: number;
          unitCode: string;
        };
        transitTime: {
          "@type": string;
          minValue: number;
          maxValue: number;
          unitCode: string;
        };
      };
    };
  };
  productionDate?: string;
  gtin?: string;
  mpn?: string;
}

const getBrand = (product: Product) => {
  const model = product.model?.toLowerCase() || '';
  if (model.includes('toyota') || model.includes('bt')) return 'Toyota';
  return 'Toyota'; // Default to Toyota as most products are Toyota
};

const getModelName = (product: Product) => {
  const model = product.model || '';
  // Extract model number (like SWE200D) from full name
  const modelMatch = model.match(/SWE\d+\w*/i) || model.match(/BT\w+\d+/i);
  return modelMatch ? modelMatch[0] : model;
};

const getAllImages = (product: Product) => {
  const images = [];
  if (product.image) images.push(product.image);
  if (product.images) images.push(...product.images);
  return [...new Set(images)]; // Remove duplicates
};

const getAdditionalProperties = (product: Product) => {
  const properties: Array<{
    "@type": string;
    name: string;
    value: string;
    unitCode?: string;
  }> = [];
  
  if (product.specs?.liftHeight) {
    properties.push({
      "@type": "PropertyValue",
      "name": "Wysokość podnoszenia",
      "value": `${product.specs.liftHeight} mm`,
      "unitCode": "MMT" // Millimeter
    });
  }
  
  if (product.specs?.mastLiftingCapacity) {
    properties.push({
      "@type": "PropertyValue", 
      "name": "Udźwig na maszcie",
      "value": `${product.specs.mastLiftingCapacity} kg`,
      "unitCode": "KGM" // Kilogram
    });
  }
  
  if (product.specs?.preliminaryLiftingCapacity) {
    properties.push({
      "@type": "PropertyValue",
      "name": "Udźwig przy podnoszeniu wstępnym", 
      "value": `${product.specs.preliminaryLiftingCapacity} kg`,
      "unitCode": "KGM" // Kilogram
    });
  }
  
  if (product.specs?.workingHours) {
    properties.push({
      "@type": "PropertyValue",
      "name": "Motogodziny",
      "value": `${product.specs.workingHours} mth`,
      "unitCode": "HUR" // Hour
    });
  }
  
  if (product.specs?.productionYear) {
    properties.push({
      "@type": "PropertyValue",
      "name": "Rok produkcji",
      "value": product.specs.productionYear.toString()
    });
  }
  
  if (product.specs?.condition) {
    properties.push({
      "@type": "PropertyValue",
      "name": "Stan",
      "value": product.specs.condition
    });
  }

  if (product.specs?.driveType) {
    properties.push({
      "@type": "PropertyValue",
      "name": "Typ napędu",
      "value": product.specs.driveType
    });
  }

  // Applications / Zastosowania - Limited to 2 key applications (not 8!)
  const applications = [
    'Magazyny i centra dystrybucyjne',
    'Zakłady produkcyjne'
  ];

  applications.forEach((app) => {
    properties.push({
      "@type": "PropertyValue",
      "name": "Zastosowanie",
      "value": app
    });
  });

  return properties;
};

const getCurrentUrl = (product: Product) => {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return `https://stakerpol.pl/products/${product.slug || product.id}`;
};

const getPriceValidUntil = (customDate?: string) => {
  if (customDate) return customDate;
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  return nextYear.toISOString().split('T')[0]; // Format: YYYY-MM-DD
};

const mapAvailabilityToSchemaOrg = (availability: string) => {
  const mapping: Record<string, string> = {
    'InStock': 'https://schema.org/InStock',
    'OutOfStock': 'https://schema.org/OutOfStock',
    'PreOrder': 'https://schema.org/PreOrder',
    'Discontinued': 'https://schema.org/Discontinued',
  };
  return mapping[availability] || 'https://schema.org/InStock';
};

const mapConditionToSchemaOrg = (condition: string) => {
  const mapping: Record<string, string> = {
    'NewCondition': 'https://schema.org/NewCondition',
    'UsedCondition': 'https://schema.org/UsedCondition',
    'RefurbishedCondition': 'https://schema.org/RefurbishedCondition',
    'DamagedCondition': 'https://schema.org/DamagedCondition',
  };
  return mapping[condition] || 'https://schema.org/UsedCondition';
};

export const generateProductSchema = (
  product: Product, 
  seoSettings?: ProductSEOSettings | null
): ProductSchemaData => {
  const schema: ProductSchemaData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.model,
    "brand": {
      "@type": "Brand",
      "name": getBrand(product)
    },
    "model": getModelName(product),
    "sku": product.specs?.serialNumber || product.id,
    "description": product.shortDescription || product.specs?.additionalDescription || `Wózek widłowy ${product.model}`,
    "url": getCurrentUrl(product),
    "image": getAllImages(product),
    "manufacturer": {
      "@type": "Organization",
      "name": getBrand(product)
    },
    "category": "Wózki widłowe",
    "additionalProperty": getAdditionalProperties(product),
  };

  // Add GTIN/MPN if available from SEO settings
  if (seoSettings?.gtin) {
    schema.gtin = seoSettings.gtin;
  }
  if (seoSettings?.mpn) {
    schema.mpn = seoSettings.mpn;
  }

  // Add offers section only if enabled in SEO settings or if no settings exist
  if (!seoSettings || seoSettings.enable_schema) {
    const availability = seoSettings?.availability || 'InStock';
    
    schema.offers = {
      "@type": "Offer",
      "availability": mapAvailabilityToSchemaOrg(availability),
      "businessFunction": "https://schema.org/Sell",
      "seller": {
        "@type": "Organization",
        "name": "Stakerpol",
        "url": "https://stakerpol.pl",
        "telephone": "+48694133592"
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "PL",
        "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "currency": "PLN"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "PL"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "businessDays": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "https://schema.org/Monday",
              "https://schema.org/Tuesday",
              "https://schema.org/Wednesday",
              "https://schema.org/Thursday",
              "https://schema.org/Friday"
            ]
          },
          "cutoffTime": "16:00:00+01:00",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 3,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 5,
            "unitCode": "DAY"
          }
        }
      }
    };

    // Price source priority:
    // 1) Main product fields (priceDisplayMode === 'show_price' + netPrice > 0) — primary
    // 2) Legacy seoSettings.price — fallback ONLY when product has no priceDisplayMode set
    // 3) Otherwise omit price (inquiry_only or no price configured)
    const priceDisplayMode = (product as any).priceDisplayMode as string | undefined | null;
    const netPriceRaw = (product as any).netPrice as number | string | null | undefined;
    const productCurrency = (product as any).priceCurrency as string | null | undefined;
    const netPriceNum = netPriceRaw != null && netPriceRaw !== '' ? Number(netPriceRaw) : NaN;

    if (priceDisplayMode === 'show_price' && Number.isFinite(netPriceNum) && netPriceNum > 0) {
      schema.offers.price = netPriceNum.toFixed(2);
      schema.offers.priceCurrency = productCurrency || 'PLN';
      // Preserve legacy priceValidUntil from seoSettings if present
      if (seoSettings?.price_valid_until) {
        schema.offers.priceValidUntil = getPriceValidUntil(seoSettings.price_valid_until);
      }
    } else if (
      (priceDisplayMode == null) &&
      seoSettings?.price &&
      Number(seoSettings.price) > 0
    ) {
      schema.offers.price = Number(seoSettings.price).toString();
      schema.offers.priceCurrency = seoSettings.price_currency || 'PLN';
      schema.offers.priceValidUntil = getPriceValidUntil(seoSettings.price_valid_until);
    }
    // else: inquiry_only or no price → omit offers.price (no price leak)
  }

  // Add production year if available
  if (product.specs?.productionYear) {
    schema.productionDate = product.specs.productionYear.toString();
  }

  return schema;
};

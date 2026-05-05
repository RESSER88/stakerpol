import { ProductSchemaData } from './generateProductSchema';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export const validateProductSchema = (schema: ProductSchemaData): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required fields validation
  if (!schema.name || schema.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Product name is required',
      severity: 'error'
    });
  }

  if (!schema.image || schema.image.length === 0) {
    errors.push({
      field: 'image',
      message: 'At least one product image is required',
      severity: 'error'
    });
  }

  if (!schema.description || schema.description.trim() === '') {
    errors.push({
      field: 'description',
      message: 'Product description is required',
      severity: 'error'
    });
  }

  // SKU/GTIN/MPN validation
  if (!schema.sku && !schema.gtin && !schema.mpn) {
    warnings.push({
      field: 'identifiers',
      message: 'At least one identifier (SKU, GTIN, or MPN) is recommended',
      severity: 'warning'
    });
  }

  // Offers validation
  if (schema.offers) {
    if (schema.offers.price) {
      const price = parseFloat(schema.offers.price);
      if (isNaN(price) || price <= 0) {
        errors.push({
          field: 'offers.price',
          message: 'Price must be a positive number',
          severity: 'error'
        });
      }

      if (!schema.offers.priceCurrency) {
        errors.push({
          field: 'offers.priceCurrency',
          message: 'Currency is required when price is specified',
          severity: 'error'
        });
      }

      if (!schema.offers.priceValidUntil) {
        warnings.push({
          field: 'offers.priceValidUntil',
          message: 'priceValidUntil is recommended when price is specified',
          severity: 'warning'
        });
      } else {
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(schema.offers.priceValidUntil)) {
          errors.push({
            field: 'offers.priceValidUntil',
            message: 'priceValidUntil must be in YYYY-MM-DD format',
            severity: 'error'
          });
        }
      }
    }

    if (!schema.offers.availability) {
      errors.push({
        field: 'offers.availability',
        message: 'Availability is required',
        severity: 'error'
      });
    }
  }

  // Image URL validation
  if (schema.image && Array.isArray(schema.image)) {
    schema.image.forEach((url, index) => {
      try {
        new URL(url);
      } catch {
        errors.push({
          field: `image[${index}]`,
          message: `Invalid image URL: ${url}`,
          severity: 'error'
        });
      }
    });
  }

  // Brand validation
  if (!schema.brand || !schema.brand.name) {
    warnings.push({
      field: 'brand',
      message: 'Brand name is recommended',
      severity: 'warning'
    });
  }

  // Review/Rating validation
  const aggregateRating = (schema as any).aggregateRating;
  if (aggregateRating) {
    if (aggregateRating.ratingValue < 1 || aggregateRating.ratingValue > 5) {
      errors.push({
        field: 'aggregateRating.ratingValue',
        message: 'Rating value must be between 1 and 5',
        severity: 'error'
      });
    }

    if (aggregateRating.reviewCount <= 0) {
      errors.push({
        field: 'aggregateRating.reviewCount',
        message: 'Review count must be greater than 0',
        severity: 'error'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

export const checkGoogleCompliance = (schema: ProductSchemaData): ValidationError[] => {
  const issues: ValidationError[] = [];

  // Google requires name, image, and either offers or review/aggregateRating
  const hasOffers = schema.offers && (schema.offers.price || schema.offers.availability);
  const hasReviews = (schema as any).aggregateRating && (schema as any).aggregateRating.reviewCount > 0;

  if (!schema.name) {
    issues.push({
      field: 'name',
      message: 'Google requires product name',
      severity: 'error'
    });
  }

  if (!schema.image || schema.image.length === 0) {
    issues.push({
      field: 'image',
      message: 'Google requires at least one product image',
      severity: 'error'
    });
  }

  if (!hasOffers && !hasReviews) {
    issues.push({
      field: 'offers/reviews',
      message: 'Google requires either offers information or reviews/ratings',
      severity: 'error'
    });
  }

  // Check for spam patterns
  if (schema.additionalProperty && schema.additionalProperty.length > 10) {
    issues.push({
      field: 'additionalProperty',
      message: 'Too many additional properties may be flagged as spam',
      severity: 'warning'
    });
  }

  return issues;
};

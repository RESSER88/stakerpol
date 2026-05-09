import { Product } from '@/types';
import { testimonials } from '@/data/testimonials/testimonialsData';

interface ProductSchemaProps {
  product: Product;
}

const ProductSchema = ({ product }: ProductSchemaProps) => {
  const getCurrentUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return `https://stakerpol.pl/products/${product.slug || product.id}`;
  };

  const getMainImage = () => {
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    return product.image || '';
  };

  const getAllImages = () => {
    const images = [];
    if (product.image) images.push(product.image);
    if (product.images) images.push(...product.images);
    return [...new Set(images)]; // Remove duplicates
  };

  const getBrand = () => {
    const model = product.model?.toLowerCase() || '';
    if (model.includes('toyota') || model.includes('bt')) return 'Toyota';
    return 'Toyota'; // Default to Toyota as most products are Toyota
  };

  const getModelName = () => {
    const model = product.model || '';
    // Extract model number (like SWE200D) from full name
    const modelMatch = model.match(/SWE\d+\w*/i) || model.match(/BT\w+\d+/i);
    return modelMatch ? modelMatch[0] : model;
  };

  const getAdditionalProperties = () => {
    const properties = [];
    
    if (product.specs?.liftHeight) {
      properties.push({
        "@type": "PropertyValue",
        "name": "Wysokość podnoszenia",
        "value": `${product.specs.liftHeight} mm`
      });
    }
    
    if (product.specs?.mastLiftingCapacity) {
      properties.push({
        "@type": "PropertyValue", 
        "name": "Udźwig na maszcie",
        "value": `${product.specs.mastLiftingCapacity} kg`
      });
    }
    
    if (product.specs?.preliminaryLiftingCapacity) {
      properties.push({
        "@type": "PropertyValue",
        "name": "Udźwig przy podnoszeniu wstępnym", 
        "value": `${product.specs.preliminaryLiftingCapacity} kg`
      });
    }
    
    if (product.specs?.workingHours) {
      properties.push({
        "@type": "PropertyValue",
        "name": "Motogodziny",
        "value": `${product.specs.workingHours} mth`
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

    // Applications / Zastosowania
    const applications = [
      'Magazyny i centra dystrybucyjne',
      'Zakłady produkcyjne',
      'Handel detaliczny i supermarkety',
      'Gospodarstwa rolne',
      'Magazyny wysokiego składowania',
      'Logistyka magazynowa',
      'Zakłady przemysłowe',
      'Hurtownie i hipermarkety'
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

  const getReviewsData = () => {
    const reviews = testimonials.map((testimonial) => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": testimonial.name
      },
      "reviewBody": testimonial.content,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": testimonial.rating,
        "bestRating": 5
      },
      "publisher": {
        "@type": "Organization", 
        "name": testimonial.company || "Stakerpol"
      }
    }));

    const totalRating = testimonials.reduce((sum, t) => sum + t.rating, 0);
    const averageRating = Math.round((totalRating / testimonials.length) * 10) / 10;

    return {
      reviews,
      aggregateRating: {
        "@type": "AggregateRating",
        "ratingValue": averageRating,
        "reviewCount": testimonials.length,
        "bestRating": 5,
        "worstRating": 1
      }
    };
  };

  const reviewsData = getReviewsData();
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.model,
    "brand": {
      "@type": "Brand",
      "name": getBrand()
    },
    "model": getModelName(),
    "sku": product.specs?.serialNumber || product.id,
    "description": product.shortDescription || product.specs?.additionalDescription || `Wózek widłowy ${product.model}`,
    "url": getCurrentUrl(),
    "image": getAllImages(),
    "manufacturer": {
      "@type": "Organization",
      "name": getBrand()
    },
    "category": "Wózki paletowe BT Toyota",
    "additionalProperty": getAdditionalProperties(),
    "review": reviewsData.reviews,
    "aggregateRating": reviewsData.aggregateRating,
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "priceValidUntil": "2024-12-31",
      "businessFunction": "https://schema.org/Sell",
      "seller": {
        "@type": "Organization",
        "name": "Stakerpol",
        "url": "https://stakerpol.pl",
        "telephone": "+48694133592"
      }
    }
  };

  // Add production year if available
  if (product.specs?.productionYear) {
    schema["productionDate"] = product.specs.productionYear.toString();
  }

  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema, null, 2) }}
    />
  );
};

export default ProductSchema;
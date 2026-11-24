interface LocalBusinessSchemaProps {
  includeOfferCatalog?: boolean;
}

const LocalBusinessSchema = ({ includeOfferCatalog = true }: LocalBusinessSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness", 
    "@id": "https://stakerpol.pl#organization",
    "name": "Stakerpol",
    "legalName": "Stakerpol",
    "description": "Sprzedaż i serwis używanych elektrycznych paleciaków (wózków paletowych) Toyota BT.",
    "url": "https://stakerpol.pl",
    "telephone": "+48694133592",
    "email": "info@stakerpol.pl",
    "foundingDate": "2008",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "PL",
      "addressRegion": "Małopolskie",
      "streetAddress": "ul. Międzyleśna 115",
      "postalCode": "32-095",
      "addressLocality": "Celiny"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Polska"
    },
    "logo": {
      "@type": "ImageObject",
      "url": "https://stakerpol.pl/logo.png"
    },
    "sameAs": [
      "https://www.facebook.com/stakerpol",
      "https://www.instagram.com/stakerpol"
    ],
    "hasMap": "https://www.google.com/maps?q=ul.+Mi%C4%99dzyle%C5%9Bna+115,+32-095+Celiny",

    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 50.278735,
      "longitude": 19.995502
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "17:00"
      }
    ],

    "hasOfferCatalog": includeOfferCatalog ? {
      "@type": "OfferCatalog",
      "name": "Elektryczne paleciaki Toyota BT",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Używane elektryczne paleciaki Toyota BT",
          "description": "Sprzedaż używanych elektrycznych paleciaków / wózków paletowych Toyota BT"
        },
        {
          "@type": "OfferCatalog",
          "name": "Serwis elektrycznych paleciaków Toyota BT",
          "description": "Serwis używanych elektrycznych paleciaków / wózków paletowych Toyota BT"
        }
      ]
    } : undefined,
    "knowsAbout": [
      "Używane elektryczne paleciaki Toyota BT",
      "Elektryczne wózki paletowe Toyota BT",
      "Serwis elektrycznych paleciaków Toyota BT"
    ],
    "serviceType": [
      "Sprzedaż używanych elektrycznych paleciaków Toyota BT",
      "Serwis elektrycznych paleciaków Toyota BT"
    ]
  } as const;

  // Remove undefined properties
  const cleanSchema = JSON.parse(JSON.stringify(schema));

  return (
    <script 
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanSchema, null, 2) }}
    />
  );
};

export default LocalBusinessSchema;

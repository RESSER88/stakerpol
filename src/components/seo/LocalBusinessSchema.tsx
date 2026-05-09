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
    "description": "Profesjonalna sprzedaż i serwis wózków paletowych BT Toyota. Oferujemy wysokiej jakości używane wózki elektryczne i spalinowe wraz z kompleksowym serwisem.",
    "url": "https://stakerpol.pl",
    "telephone": "+48694133592",
    "email": "info@stakerpol.pl",
    "foundingDate": "2010",
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
      "name": "Wózki paletowe BT Toyota",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Wózki elektryczne",
          "description": "Elektryczne wózki paletowe BT Toyota - ekonomiczne, ciche i przyjazne środowisku"
        },
        {
          "@type": "OfferCatalog", 
          "name": "Wózki spalinowe",
          "description": "Spalinowe wózki paletowe Toyota - wydajne rozwiązania do intensywnej pracy"
        },
        {
          "@type": "OfferCatalog",
          "name": "Serwis i części",
          "description": "Kompleksowy serwis wózków paletowych i oryginalne części zamienne"
        }
      ]
    } : undefined,
    "knowsAbout": [
      "Wózki paletowe Toyota",
      "Wózki elektryczne BT",
      "Serwis wózków paletowych", 
      "Części zamienne Toyota",
      "Wynajem wózków paletowych",
      "Sprzedaż używanych wózków"
    ],
    "serviceType": [
      "Sprzedaż wózków paletowych",
      "Serwis i naprawa",
      "Części zamienne",
      "Wynajem krótkoterminowy",
      "Doradztwo techniczne"
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

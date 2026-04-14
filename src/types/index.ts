
export interface Product {
  id: string;
  slug?: string; // SEO-friendly unique slug (model-serial)
  faqIds?: string[]; // max 4 FAQ IDs from faqs table
  model: string;
  image: string; // Keep for backward compatibility - will be same as images[0]
  images: string[]; // Array of up to 5 images
  shortDescription: string;
  createdAt: string; // ISO date string for when product was created
  updatedAt: string; // ISO date string for when product was last updated
  specs: {
    // Main section (always visible)
    productionYear: string;
    serialNumber?: string; // Optional serial number
    mastLiftingCapacity: string; // Udźwig przy podnoszeniu masztu [kg]
    preliminaryLiftingCapacity: string; // Udźwig przy podnoszeniu wstępnym [kg]
    workingHours: string; // Godziny pracy [mh]
    liftHeight: string; // Wysokość podnoszenia [mm]
    minHeight: string; // Wysokość konstrukcyjna [mm]
    preliminaryLifting: string; // Wstępne podnoszenie
    battery: string; // Bateria
    condition: string; // Stan
    
    // Expandable section (hidden by default)
    driveType: string; // Rodzaj napędu
    mast: string; // Maszt
    freeStroke: string; // Wolny skok [mm]
    dimensions: string; // Wymiary (długość / szerokość) [mm]
    wheels: string; // Koła
    operatorPlatform: string; // Składany podest dla operatora
    additionalOptions: string; // Opcje dodatkowe
    additionalDescription: string; // Opis dodatkowy
    
    // Legacy fields for backward compatibility
    capacity?: string; // For migration purposes
    charger?: string;
  };
}

export interface Testimonial {
  id: string;
  name: string;
  company?: string;
  content: string;
  rating: number;
}

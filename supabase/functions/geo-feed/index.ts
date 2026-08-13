import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating GEO feed...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch all products with full details
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        slug,
        name,
        serial_number,
        short_description,
        detailed_description,
        condition,
        production_year,
        working_hours,
        lift_height,
        lift_capacity_mast,
        drive_type,
        image_url,
        updated_at,
        availability_status
      `)
      .neq('availability_status', 'sold')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    // Fetch product images
    const { data: productImages, error: imagesError } = await supabase
      .from('product_images')
      .select('product_id, image_url, alt_text, display_order')
      .order('display_order');

    if (imagesError) {
      console.error('Error fetching product images:', imagesError);
    }

    console.log(`✅ Found ${products?.length || 0} products for GEO feed`);

    const baseUrl = 'https://stakerpol.pl';
    
    // Generate Schema.org Product data for AI consumption
    const geoFeed = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Stakerpol - Wózki widłowe Toyota BT",
      "description": "Profesjonalna sprzedaż używanych wózków widłowych Toyota i BT. Elektryczne i spalinowe paleciaki magazynowe z serwisem.",
      "url": baseUrl,
      "publisher": {
        "@type": "Organization",
        "name": "Stakerpol",
        "url": baseUrl,
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/lovable-uploads/cba7623d-e272-43d2-9cb1-c4864cb74fde.png`
        }
      },
      "numberOfItems": products?.length || 0,
      "itemListElement": (products || []).map((product, index) => {
        const images = (productImages || [])
          .filter(img => img.product_id === product.id)
          .map(img => ({
            "@type": "ImageObject",
            "url": img.image_url,
            "description": img.alt_text || product.name
          }));

        return {
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "name": product.name,
            "description": product.short_description || product.detailed_description,
            "url": `${baseUrl}/produkty/${product.slug || product.id}`,
            "image": images.length > 0 ? images : (product.image_url ? [{
              "@type": "ImageObject",
              "url": product.image_url,
              "description": product.name
            }] : []),
            "brand": {
              "@type": "Brand",
              "name": product.name?.includes('Toyota') ? 'Toyota' : 'BT'
            },
            "model": product.name,
            "serialNumber": product.serial_number,
            "category": "Wózki widłowe",
            "condition": product.condition || "Używany",
            "additionalProperty": [
              ...(product.production_year ? [{
                "@type": "PropertyValue",
                "name": "Rok produkcji",
                "value": product.production_year.toString()
              }] : []),
              ...(product.working_hours ? [{
                "@type": "PropertyValue", 
                "name": "Motogodziny",
                "value": `${product.working_hours} mth`
              }] : []),
              ...(product.lift_height ? [{
                "@type": "PropertyValue",
                "name": "Wysokość podnoszenia", 
                "value": `${product.lift_height} mm`
              }] : []),
              ...(product.lift_capacity_mast ? [{
                "@type": "PropertyValue",
                "name": "Udźwig masztu",
                "value": `${product.lift_capacity_mast} kg`
              }] : []),
              ...(product.drive_type ? [{
                "@type": "PropertyValue",
                "name": "Napęd",
                "value": product.drive_type
              }] : [])
            ],
            "offers": {
              "@type": "Offer",
              "availability": product.availability_status === 'reserved' ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock",
              "priceCurrency": "PLN",
              "seller": {
                "@type": "Organization",
                "name": "Stakerpol"
              }
            }
          }
        };
      })
    };

    console.log(`✅ Generated GEO feed with ${geoFeed.numberOfItems} products`);

    return new Response(JSON.stringify(geoFeed, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/ld+json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('GEO feed generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate GEO feed' }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ===== Authentication & admin authorization =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { data: isAdmin, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: claimsData.claims.sub,
      _role: 'admin'
    });
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Starting image migration process...')

    // Fetch all product images with base64 data
    const { data: images, error: fetchError } = await supabaseClient
      .from('product_images')
      .select('*')
      .like('image_url', 'data:%')

    if (fetchError) {
      console.error('Error fetching images:', fetchError)
      throw fetchError
    }

    console.log(`Found ${images?.length || 0} base64 images to migrate`)

    const migrationResults = []

    for (const image of images || []) {
      try {
        console.log(`Processing image ${image.id}...`)

        // Extract base64 data and convert to blob
        const base64Data = image.image_url.split(',')[1]
        const mimeType = image.image_url.match(/data:([^;]+)/)?.[1] || 'image/webp'
        
        // Convert base64 to bytes
        const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
        
        // Generate filename
        const timestamp = new Date().getTime()
        const extension = mimeType.split('/')[1] || 'webp'
        const filename = `product-${image.product_id}-${timestamp}.${extension}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('product-images')
          .upload(filename, bytes, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.error(`Upload error for image ${image.id}:`, uploadError)
          migrationResults.push({
            imageId: image.id,
            status: 'error',
            error: uploadError.message
          })
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('product-images')
          .getPublicUrl(filename)

        // Update database with new URL
        const { error: updateError } = await supabaseClient
          .from('product_images')
          .update({ image_url: publicUrl })
          .eq('id', image.id)

        if (updateError) {
          console.error(`Update error for image ${image.id}:`, updateError)
          migrationResults.push({
            imageId: image.id,
            status: 'error',
            error: updateError.message
          })
          continue
        }

        console.log(`Successfully migrated image ${image.id} to ${publicUrl}`)
        migrationResults.push({
          imageId: image.id,
          status: 'success',
          newUrl: publicUrl
        })

      } catch (error) {
        console.error(`Error processing image ${image.id}:`, error)
        migrationResults.push({
          imageId: image.id,
          status: 'error',
          error: error.message
        })
      }
    }

    const successCount = migrationResults.filter(r => r.status === 'success').length
    const errorCount = migrationResults.filter(r => r.status === 'error').length

    console.log(`Migration completed: ${successCount} success, ${errorCount} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Migration completed: ${successCount} images migrated successfully, ${errorCount} errors`,
        results: migrationResults,
        stats: {
          total: migrationResults.length,
          success: successCount,
          errors: errorCount
        }
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Migration error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  }
})

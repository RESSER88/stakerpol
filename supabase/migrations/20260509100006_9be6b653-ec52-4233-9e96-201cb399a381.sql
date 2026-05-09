UPDATE public.products p
SET image_url = sub.image_url,
    updated_at = now()
FROM (
  SELECT DISTINCT ON (product_id) product_id, image_url
  FROM public.product_images
  ORDER BY product_id, display_order ASC
) sub
WHERE sub.product_id = p.id
  AND (p.image_url IS NULL OR p.image_url = '' OR p.image_url NOT LIKE 'http%');
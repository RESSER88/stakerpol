ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.product_images REPLICA IDENTITY FULL;
ALTER TABLE public.product_benefits REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_images;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_benefits;
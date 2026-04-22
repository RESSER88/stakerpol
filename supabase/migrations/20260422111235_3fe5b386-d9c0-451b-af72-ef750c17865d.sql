ALTER TABLE public.faqs
  ADD COLUMN IF NOT EXISTS display_locations TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.faqs.display_locations IS
  'Lista stron, na których ma być wyświetlane pytanie. Wartości: home, reviews';

CREATE INDEX IF NOT EXISTS idx_faqs_display_locations
  ON public.faqs USING GIN (display_locations);